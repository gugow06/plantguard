import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AnalyticsResponse } from '@/types/analytics';
import type { AlertRecord } from '@/lib/decision-rules';

export type RiskLevel = 'baixo' | 'moderado' | 'alto' | 'critico';
export type Urgency = 'alta' | 'media' | 'baixa';

export interface InsightPriority {
  titulo: string;
  acao: string;
  urgencia: Urgency;
}

export interface FieldInsightsReport {
  resumoExecutivo: string;
  nivelRisco: RiskLevel;
  principaisAchados: string[];
  prioridades: InsightPriority[];
  recomendacoes: string[];
  previsao: string;
}

/** Contexto agregado do campo enviado ao modelo. */
export interface FieldContext {
  analytics: AnalyticsResponse;
  alerts: AlertRecord[];
  windowDays: number;
  /** Rótulo da fonte dos dados (perfil do usuário, arquivo importado, etc.) */
  sourceLabel?: string;
}

const SYSTEM_PROMPT = `Você é o Dr. PlantGuard, consultor agronômico sênior especializado em
fitopatologia e manejo integrado de culturas. Diferente de uma análise por imagem,
aqui você recebe DADOS AGREGADOS do campo (resumo de várias análises já feitas,
distribuição de status, patologias mais frequentes, evolução temporal e alertas
automáticos por cultura) e deve produzir um RELATÓRIO GERENCIAL DE APOIO À DECISÃO.

REGRAS OBRIGATÓRIAS:
1. Baseie-se EXCLUSIVAMENTE nos dados fornecidos. Não invente números.
2. Responda ESTRITAMENTE no formato JSON especificado. Sem markdown, sem texto fora do JSON.
3. Seja objetivo, prático e priorize por impacto agronômico e urgência.
4. Escreva em português do Brasil, em tom de consultor para o produtor rural.
5. Se os dados forem insuficientes (poucas análises), diga isso com franqueza no resumo
   e recomende ampliar a base de monitoramento.

FORMATO DE RESPOSTA (JSON):
{
  "resumoExecutivo": "2 a 4 frases com o panorama geral da saúde do campo no período.",
  "nivelRisco": "baixo" | "moderado" | "alto" | "critico",
  "principaisAchados": ["achado objetivo 1", "achado objetivo 2", "..."],
  "prioridades": [
    { "titulo": "título curto", "acao": "ação concreta recomendada", "urgencia": "alta" | "media" | "baixa" }
  ],
  "recomendacoes": ["recomendação prática 1", "recomendação prática 2", "..."],
  "previsao": "1 a 2 frases sobre a tendência esperada se as recomendações forem (ou não) seguidas."
}

CRITÉRIOS DE NÍVEL DE RISCO:
- critico: alta taxa de doença (>= 50%) em uma ou mais culturas, ou patologia dominante em surto.
- alto: taxa de doença relevante (>= 25%) ou tendência de piora na evolução temporal.
- moderado: focos pontuais de doença ou incerteza (muitas análises inconclusivas / baixa confiança).
- baixo: predomínio de plantas saudáveis, sem patologia dominante.`;

function buildUserPrompt(ctx: FieldContext): string {
  const { analytics, alerts, windowDays, sourceLabel } = ctx;
  const s = analytics.summary;

  const statusLines = analytics.statusDistribution
    .map((d) => `- ${d.status}: ${d.count}`)
    .join('\n');

  const pathologyLines = analytics.pathologyFrequency.length
    ? analytics.pathologyFrequency.map((p) => `- ${p.pathology}: ${p.count} análise(s)`).join('\n')
    : '- Nenhuma patologia registrada';

  const plantHealthLines = analytics.plantHealthBreakdown.length
    ? analytics.plantHealthBreakdown
        .map(
          (p) =>
            `- ${p.plantType}: ${p.saudavel} saudável / ${p.doente} doente / ${p.inconclusivo} inconclusivo`,
        )
        .join('\n')
    : '- Sem detalhamento por cultura';

  const activeAlerts = alerts.filter((a) => a.alert.severity !== 'safe');
  const alertLines = activeAlerts.length
    ? activeAlerts
        .map(
          (a) =>
            `- ${a.plantType} [${a.alert.severity}] — taxa de doença ${Math.round(
              a.alert.diseaseRate * 100,
            )}%, patologia principal: ${a.topPathology ?? 'n/d'} (${a.topPathologyCount}x); regras: ${a.alert.rules
              .map((r) => r.id)
              .join(', ') || 'nenhuma'}`,
        )
        .join('\n')
    : '- Nenhum alerta ativo no período';

  const timelineLines = analytics.timeline.length
    ? analytics.timeline
        .slice(-14)
        .map((t) => `- ${t.date}: ${t.saudavel} saudável, ${t.doente} doente, ${t.inconclusivo} inconclusivo`)
        .join('\n')
    : '- Sem histórico temporal';

  return `CONTEXTO DO CAMPO (fonte: ${sourceLabel ?? 'dados do produtor'}; janela: últimos ${windowDays} dias)

RESUMO GERAL
- Total de análises: ${s.totalAnalyses}
- Taxa de saúde: ${s.healthRate}%
- Confiança média: ${s.averageConfidence}%
- Patologias distintas: ${s.distinctPathologies}
- Culturas distintas: ${s.distinctPlantTypes}

DISTRIBUIÇÃO POR STATUS
${statusLines}

PATOLOGIAS MAIS FREQUENTES
${pathologyLines}

SAÚDE POR CULTURA
${plantHealthLines}

ALERTAS AUTOMÁTICOS ATIVOS
${alertLines}

EVOLUÇÃO TEMPORAL (últimos registros)
${timelineLines}

Gere o relatório gerencial de apoio à decisão no formato JSON especificado.`;
}

/** Erro sinalizando que a IA está temporariamente sobrecarregada (503/429). */
export class AiOverloadedError extends Error {
  constructor(message = 'IA temporariamente sobrecarregada.') {
    super(message);
    this.name = 'AiOverloadedError';
  }
}

function isRetryable(err: unknown): boolean {
  const msg = (err instanceof Error ? err.message : String(err)).toLowerCase();
  return (
    msg.includes('503') ||
    msg.includes('service unavailable') ||
    msg.includes('overloaded') ||
    msg.includes('high demand') ||
    msg.includes('429') ||
    msg.includes('rate limit') ||
    msg.includes('unavailable')
  );
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const ALLOWED_RISK: RiskLevel[] = ['baixo', 'moderado', 'alto', 'critico'];
const ALLOWED_URGENCY: Urgency[] = ['alta', 'media', 'baixa'];

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => String(v).trim()).filter(Boolean);
}

function sanitizeReport(raw: unknown): FieldInsightsReport {
  const obj = (raw ?? {}) as Record<string, unknown>;

  const nivelRisco = ALLOWED_RISK.includes(obj.nivelRisco as RiskLevel)
    ? (obj.nivelRisco as RiskLevel)
    : 'moderado';

  const prioridades: InsightPriority[] = Array.isArray(obj.prioridades)
    ? (obj.prioridades as unknown[])
        .map((p) => {
          const item = (p ?? {}) as Record<string, unknown>;
          return {
            titulo: String(item.titulo ?? '').trim(),
            acao: String(item.acao ?? '').trim(),
            urgencia: ALLOWED_URGENCY.includes(item.urgencia as Urgency)
              ? (item.urgencia as Urgency)
              : 'media',
          };
        })
        .filter((p) => p.titulo || p.acao)
    : [];

  return {
    resumoExecutivo:
      String(obj.resumoExecutivo ?? '').trim() ||
      'Não foi possível gerar um resumo com os dados fornecidos.',
    nivelRisco,
    principaisAchados: toStringArray(obj.principaisAchados),
    prioridades,
    recomendacoes: toStringArray(obj.recomendacoes),
    previsao: String(obj.previsao ?? '').trim(),
  };
}

/**
 * Gera um relatório gerencial de apoio à decisão a partir dos dados agregados do campo,
 * usando o Gemini como consultor agronômico. Lança erro se a chave não estiver configurada
 * ou se a chamada falhar (tratado pela rota).
 */
export async function generateFieldInsights(ctx: FieldContext): Promise<FieldInsightsReport> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY não configurada.');
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    generationConfig: {
      temperature: 0.4,
      responseMimeType: 'application/json',
      maxOutputTokens: 2048,
    },
    systemInstruction: SYSTEM_PROMPT,
  });

  const prompt = buildUserPrompt(ctx);

  // Retry com backoff exponencial para picos de sobrecarga do modelo (503/429)
  const MAX_ATTEMPTS = 3;
  let text = '';
  let lastErr: unknown;
  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      text = result.response.text();
      lastErr = undefined;
      break;
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_ATTEMPTS && isRetryable(err)) {
        await sleep(1000 * 2 ** (attempt - 1)); // 1s, 2s
        continue;
      }
      break;
    }
  }
  if (lastErr) {
    if (isRetryable(lastErr)) throw new AiOverloadedError();
    throw lastErr;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    // Resposta possivelmente truncada — extrai o maior bloco JSON disponível
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end > start) {
      try {
        parsed = JSON.parse(text.slice(start, end + 1));
      } catch {
        parsed = {};
      }
    } else {
      parsed = {};
    }
  }

  return sanitizeReport(parsed);
}
