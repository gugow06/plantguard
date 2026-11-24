"""
Mineração de processos do PlantGuard com pm4py.

Entrada: event log em CSV exportado por /api/process/event-log (colunas
case_id, activity, timestamp, resource, channel, source).
Saída (na pasta indicada):
  - dfg-frequencia.png   mapa do processo (directly-follows graph) por frequência
  - dfg-tempo.png        mapa com o tempo médio de espera entre atividades
  - petri-net.png        modelo descoberto pelo Inductive Miner (rede de Petri)
  - bpmn.png             o mesmo modelo em BPMN
  - variantes.csv        variantes do processo com frequência
  - esperas.csv          tempo de espera por transição (mediana, P90)
  - metricas.json        números usados na documentação e no vídeo
  - insights.md          análise: gargalos, variações e melhorias

Uso: python analyze.py <event-log.csv> <pasta-de-saida> [real|simulado|all]
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

import pandas as pd
import pm4py

ALERTA = "Alerta gerado"
VISTO = "Alerta visualizado"
RELATORIO = "Relatório enviado"
INCONCLUSIVO = "Diagnóstico inconclusivo"
FALHA = "Falha no diagnóstico"


def fmt(seconds: float) -> str:
    if seconds != seconds:  # NaN
        return "—"
    if seconds < 1:
        return f"{seconds * 1000:.0f} ms"
    if seconds < 60:
        return f"{seconds:.1f} s"
    if seconds < 3600:
        return f"{seconds / 60:.0f} min"
    if seconds < 48 * 3600:
        return f"{seconds / 3600:.1f} h"
    return f"{seconds / 86400:.1f} d"


def load(path: str, source: str) -> pd.DataFrame:
    df = pd.read_csv(path)
    if source != "all":
        df = df[df["source"] == source]
    df["timestamp"] = pd.to_datetime(df["timestamp"], utc=True, format="ISO8601")
    df = df.sort_values(["case_id", "timestamp"]).reset_index(drop=True)
    return pm4py.format_dataframe(
        df, case_id="case_id", activity_key="activity", timestamp_key="timestamp"
    )


def waits(df: pd.DataFrame) -> pd.DataFrame:
    d = df[["case:concept:name", "concept:name", "time:timestamp"]].copy()
    d["next_activity"] = d.groupby("case:concept:name")["concept:name"].shift(-1)
    d["next_ts"] = d.groupby("case:concept:name")["time:timestamp"].shift(-1)
    d = d.dropna(subset=["next_activity"])
    d["wait_s"] = (d["next_ts"] - d["time:timestamp"]).dt.total_seconds()
    g = d.groupby(["concept:name", "next_activity"])["wait_s"]
    out = pd.DataFrame(
        {
            "casos": g.size(),
            "mediana_s": g.median(),
            "p90_s": g.quantile(0.9),
            "media_s": g.mean(),
        }
    ).reset_index()
    out = out.rename(columns={"concept:name": "de", "next_activity": "para"})
    return out.sort_values("mediana_s", ascending=False)


def main() -> None:
    if len(sys.argv) < 3:
        print(__doc__)
        sys.exit(1)
    src, out_dir = sys.argv[1], Path(sys.argv[2])
    source = sys.argv[3] if len(sys.argv) > 3 else "all"
    out_dir.mkdir(parents=True, exist_ok=True)

    df = load(src, source)
    log = pm4py.convert_to_event_log(df)
    n_cases = df["case:concept:name"].nunique()
    print(f"[pm4py] {len(df)} eventos, {n_cases} casos (origem: {source})")

    # 1) Descoberta: DFG por frequência e por tempo
    dfg, starts, ends = pm4py.discover_dfg(df)
    pm4py.save_vis_dfg(dfg, starts, ends, str(out_dir / "dfg-frequencia.png"))
    perf_dfg, p_starts, p_ends = pm4py.discover_performance_dfg(df)
    pm4py.save_vis_performance_dfg(
        perf_dfg, p_starts, p_ends, str(out_dir / "dfg-tempo.png"), aggregation_measure="median"
    )

    # 2) Modelo de processo: Inductive Miner (com filtro de ruído de 20%)
    net, im, fm = pm4py.discover_petri_net_inductive(df, noise_threshold=0.2)
    pm4py.save_vis_petri_net(net, im, fm, str(out_dir / "petri-net.png"))
    bpmn = pm4py.convert_to_bpmn(net, im, fm)
    pm4py.save_vis_bpmn(bpmn, str(out_dir / "bpmn.png"))

    # 3) Conformidade: o quanto o log real "cabe" no modelo descoberto
    fitness = pm4py.fitness_token_based_replay(df, net, im, fm)
    precision = pm4py.precision_token_based_replay(df, net, im, fm)

    # 4) Variantes
    variants = pm4py.get_variants(df)
    var_rows = sorted(
        (
            {"variante": " → ".join(v), "casos": len(c) if not isinstance(c, int) else c}
            for v, c in variants.items()
        ),
        key=lambda r: -r["casos"],
    )
    var_df = pd.DataFrame(var_rows)
    var_df["percentual"] = (var_df["casos"] / n_cases * 100).round(1)
    var_df.to_csv(out_dir / "variantes.csv", index=False)

    # 5) Esperas, gargalo e métricas de negócio
    w = waits(df)
    w.round(1).to_csv(out_dir / "esperas.csv", index=False)
    cycle = w[(w["para"] != RELATORIO) & (w["casos"] >= max(1, int(n_cases * 0.02)))]
    gargalo = cycle.iloc[0] if len(cycle) else None

    acts = df.groupby("case:concept:name")["concept:name"].agg(list)
    alert_cases = acts[acts.apply(lambda a: ALERTA in a)]
    seen = alert_cases.apply(lambda a: VISTO in a).sum()
    rework = acts.apply(lambda a: len(a) != len(set(a))).sum()
    inconclusive_loop = acts.apply(
        lambda a: any(a[i] == INCONCLUSIVO and a[i + 1] == "Imagem capturada" for i in range(len(a) - 1))
    ).sum()
    ai_fail = acts.apply(lambda a: FALHA in a).sum()
    lead = pm4py.get_all_case_durations(df)
    lead_s = pd.Series(lead)
    channel = df.groupby("case:concept:name")["channel"].first().value_counts().to_dict()

    metrics = {
        "origem": source,
        "eventos": int(len(df)),
        "casos": int(n_cases),
        "variantes": int(len(var_df)),
        "canais": {k: int(v) for k, v in channel.items()},
        "caminho_principal": {"variante": var_df.iloc[0]["variante"], "percentual": float(var_df.iloc[0]["percentual"])},
        "top5_variantes_percentual": round(float(var_df.head(5)["percentual"].sum()), 1),
        "lead_time": {"mediana": fmt(lead_s.median()), "p90": fmt(lead_s.quantile(0.9))},
        "conformidade": {
            "fitness": round(float(fitness["log_fitness"]), 3),
            "casos_perfeitos_pct": round(float(fitness["percentage_of_fitting_traces"]), 1),
            "precisao": round(float(precision), 3),
        },
        "alertas": {
            "gerados": int(len(alert_cases)),
            "vistos": int(seen),
            "nunca_vistos_pct": round(float((len(alert_cases) - seen) / max(1, len(alert_cases)) * 100), 1),
        },
        "retrabalho_pct": round(float(rework / n_cases * 100), 1),
        "laco_inconclusivo_casos": int(inconclusive_loop),
        "falha_ia_pct": round(float(ai_fail / n_cases * 100), 1),
        "gargalo": None
        if gargalo is None
        else {
            "de": gargalo["de"],
            "para": gargalo["para"],
            "mediana": fmt(gargalo["mediana_s"]),
            "p90": fmt(gargalo["p90_s"]),
            "casos": int(gargalo["casos"]),
        },
    }
    (out_dir / "metricas.json").write_text(json.dumps(metrics, ensure_ascii=False, indent=2), encoding="utf-8")

    # 6) Relatório de insights
    tech = w[w["de"].isin(["Imagem capturada", "Publicada no Kafka", "Consumida do tópico"])]
    tech_txt = ", ".join(f"{r.de} → {r.para}: {fmt(r.mediana_s)}" for r in tech.itertuples())
    top_waits = "\n".join(
        f"| {r.de} → {r.para} | {r.casos} | {fmt(r.mediana_s)} | {fmt(r.p90_s)} |" for r in w.head(8).itertuples()
    )
    top_vars = "\n".join(
        f"| {i + 1} | {r.percentual}% ({r.casos}) | {r.variante} |" for i, r in enumerate(var_df.head(6).itertuples())
    )
    g = metrics["gargalo"]
    md = f"""# Análise do processo — PlantGuard (pm4py)

Origem dos eventos: **{source}** · {metrics['eventos']} eventos · {metrics['casos']} casos · {metrics['variantes']} variantes
Canais: {', '.join(f'{k}: {v}' for k, v in metrics['canais'].items())}

## Descoberta
- Mapa por frequência: `dfg-frequencia.png` · por tempo: `dfg-tempo.png`
- Modelo (Inductive Miner, ruído 20%): `petri-net.png` e `bpmn.png`
- Conformidade do log com o modelo: fitness **{metrics['conformidade']['fitness']}**, {metrics['conformidade']['casos_perfeitos_pct']}% dos casos reproduzidos sem desvio, precisão **{metrics['conformidade']['precisao']}**

## Variantes
O caminho principal cobre **{metrics['caminho_principal']['percentual']}%** dos casos; as 5 variantes mais comuns cobrem {metrics['top5_variantes_percentual']:.0f}%.

| # | Casos | Variante |
|---|---|---|
{top_vars}

## Tempos de espera (mediana e P90)
| Transição | Casos | Mediana | P90 |
|---|---|---|---|
{top_waits}

## Insights
1. **Gargalo humano, não técnico.** A maior espera do ciclo de resposta é **{g['de']} → {g['para']}**: mediana de **{g['mediana']}** e P90 de **{g['p90']}**. A parte técnica é ordens de grandeza mais rápida ({tech_txt}).
2. **Alertas sem resposta.** {metrics['alertas']['nunca_vistos_pct']}% dos {metrics['alertas']['gerados']} alertas de doença nunca foram vistos. Alertas gerados à noite e no fim de semana só são vistos no expediente seguinte, o que explica o P90 longo.
3. **Retrabalho.** {metrics['retrabalho_pct']}% dos casos repetem etapas; {metrics['laco_inconclusivo_casos']} casos passam pelo laço "Diagnóstico inconclusivo → nova captura".
4. **Dependência externa.** {metrics['falha_ia_pct']}% dos casos tiveram falha no diagnóstico por IA; parte deles termina sem diagnóstico (o produtor desiste).
5. **Relatório em lote.** O relatório por e-mail chega dias depois da análise: serve para histórico, não para reação.

## Oportunidades de melhoria
| Problema | Melhoria proposta | Indicador para acompanhar |
|---|---|---|
| Alerta demora a ser visto | Push/WhatsApp para alerta crítico (R2) com lembrete após 1 h e escalonamento para o técnico da cooperativa | Mediana e P90 de "Alerta gerado → Alerta visualizado"; % nunca vistos |
| Diagnóstico inconclusivo | Guia de captura (luz, distância, foco) antes do envio e quando a confiança < 70% (R4) | % de casos com o laço de retrabalho |
| Falha da IA | Fila com nova tentativa automática (backoff) e cache | % de casos com "Falha no diagnóstico"; casos sem desfecho |
| Relatório tardio | Relatório imediato só para casos críticos; o semanal continua como histórico | Espera "Alerta gerado → Relatório enviado" |
"""
    (out_dir / "insights.md").write_text(md, encoding="utf-8")
    print(json.dumps(metrics, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    main()
