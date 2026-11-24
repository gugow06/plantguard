# Roteiros dos vídeos — PlantGuard Fase 7 (entrega final AgroSmart)

> Projeto **PlantGuard** · desafio acadêmico **AgroSmart (FIAP)**.
> Dois vídeos: **A) vídeo final** (5 min, demo + fluxo + análise de processo) e **B) vídeo pitch** (até 5 min, produto).
> **Gravar por último**, com o pipeline verde, o event log gerado e as evidências prontas.
> Ritmo de fala: ~120 palavras por minuto. Os números entre colchetes `[ ]` saem da análise real; preencha antes de gravar.

---

## Preparação (antes de gravar)

```bash
cp .env.example .env            # NEXTAUTH_SECRET, GEMINI_API_KEY, RESEND_*
STREAM_MAX_MESSAGES=0 STREAM_INTERVAL_MS=5000 \
  docker compose -f infra/docker-compose.yml up -d --build --wait
npx tsx infra/process-sim/simulate.ts      # cenário de processo (seed fixa)
```

Janelas abertas, nesta ordem:
1. Terminal com `docker compose ps` e, numa segunda aba, `docker compose logs -f producer consumer`
2. App em `http://localhost:3000` logado como usuário demo (dashboard, `/monitor`, `/process`)
3. Kafka UI em `http://localhost:8080`
4. GitHub Actions do repo (último run verde, com o resumo de cobertura) e aba Security
5. PDF da documentação aberto no diagrama de arquitetura e no mapa do processo
6. Uma foto de folha doente para o upload ao vivo

---

## A) Vídeo final — 5 min (alvo 5:00 a 5:15, nunca abaixo de 5:00)

| Tempo | Bloco | Fala (sugestão) | Na tela |
| --- | --- | --- | --- |
| **0:00–0:15** | Abertura | "Somos a equipe do **PlantGuard**. Em sete fases saímos de um diagnóstico por foto para uma plataforma completa. Vamos mostrar tudo funcionando de ponta a ponta e o que a análise do processo nos ensinou." | Logo → dashboard |
| **0:15–0:55** | Arquitetura (15%) | "Na **entrada**, foto pelo app, arquivo em lote e câmeras de campo, simuladas pelo producer, publicando no **Kafka**. No **processamento**, o Gemini diagnostica, o consumer grava no Postgres e as regras R1 a R4 decidem. Na **saída**, dashboard, alertas, e-mail e monitoramento. Tudo sobe com um `docker compose`." | Diagrama final, destacando entrada → processamento → saída |
| **0:55–2:05** | Execução (20%) | "Todos os serviços saudáveis. O producer publica a cada 5 segundos, e no Kafka UI vemos a mensagem de entrada: planta, status e confiança. O consumer grava e, se a planta está doente, cria o alerta na hora. No app, o sino acende e o dashboard se atualiza sozinho. Pelo canal manual, envio esta foto e o Gemini devolve diagnóstico e tratamento, que entra no mesmo fluxo." | `compose ps` → Kafka UI → log `ALERTA criado` → sino/dashboard → upload ao vivo |
| **2:05–2:55** | DevSecOps (20%) | "Cada push dispara o pipeline: lint, tipos, testes com cobertura e análise de qualidade; em paralelo, Gitleaks, CodeQL e Trivy procuram segredos e vulnerabilidades. Depois vêm o build das imagens e um teste que sobe a stack e confirma o caminho do Kafka ao banco. Aqui o Trivy barrou [vulnerabilidade], corrigimos e voltou a ficar verde." | Run verde → qualidade → aba Security → antes/depois |
| **2:55–3:20** | Monitoramento (10%) | "O `/api/health` diz se banco e Kafka estão de pé, e o Monitor mostra lag, throughput e a saúde de cada serviço a cada 3 segundos. Derrubo o Kafka: fica vermelho. Subo de novo: o consumer retoma sem perder mensagem." | `/api/health` → `/monitor` → stop/start do Kafka |
| **3:20–4:45** | Análise de processo (25%) | "Cada etapa grava um evento: caso, atividade, horário e recurso. Este é o event log, com [N] casos. Com mineração de processos descobrimos este mapa. O caminho feliz cobre [X]% dos casos. A principal **variação** é a IA inconclusiva, que obriga a fotografar de novo em [Y]% dos casos. O **gargalo** não é a tecnologia: do Kafka ao banco são milissegundos, mas do alerta até o produtor vê-lo passam [T] horas, e [Z]% nunca são vistos. **Melhorias:** alerta crítico por push ou WhatsApp com lembrete, guia de captura quando a confiança fica baixa e retentativa automática da IA." | CSV → mapa (frequência) → mapa (tempo) com gargalo → variantes → página `/process` |
| **4:45–5:00** | Fechamento | "O PlantGuard recebe o dado do campo, decide, avisa quem precisa agir e mede o próprio processo para melhorar. Obrigado!" | Logo + links |

**Dicas do vídeo final**
- São ~600 palavras de fala para 5 minutos: ensaie com cronômetro e termine entre 5:00 e 5:15, para não ficar abaixo do mínimo.
- Grave em blocos e edite. No bloco de execução, acelere o vídeo (2x) nos trechos de espera em vez de cortar a fala.
- Mostre o *mesmo caso* (um `caseId`) no Kafka UI, no log, no dashboard e no event log: isso prova o ponta a ponta.

---

## B) Vídeo pitch — 4 min 30 s (limite: 5 min)

| Tempo | Bloco | Fala (sugestão) | Na tela |
| --- | --- | --- | --- |
| **0:00–0:40** | Problema | "Doenças de plantas destroem [dado real: ex. até 40% da produção agrícola mundial por ano, segundo a FAO]. No campo, o diagnóstico depende de um agrônomo que nem sempre está por perto, e quando a doença é percebida a olho nu, muitas vezes ela já se espalhou pelo talhão. O pequeno e o médio produtor são os que mais perdem." | Slide do problema (número em destaque) |
| **0:40–1:30** | Solução | "O **PlantGuard** é um agrônomo digital que nunca dorme. O produtor tira uma foto, ou as câmeras do campo enviam leituras sozinhas, e em segundos a IA diz se a planta está saudável, qual doença tem e o que fazer. Mas a gente vai além do diagnóstico: o sistema cruza todas as análises, aplica regras de decisão e **avisa antes que a doença vire prejuízo**." | Slide da solução → 20 s de demo (upload + alerta) |
| **1:30–2:20** | Diferencial | "O que nos diferencia: **um**, decisão e não só diagnóstico, com regras que apontam quando intervir; **dois**, dados em tempo real, porque a plataforma recebe um fluxo contínuo do campo, não fotos soltas; **três**, um processo que se mede, já que a gente sabe onde o produtor demora a agir e melhora isso; **quatro**, segurança e qualidade de produto desde o primeiro commit." | Slide de diferencial (4 ícones) |
| **2:20–3:00** | Público-alvo | "Nosso público é o pequeno e o médio produtor de hortaliças e frutas, as cooperativas que dão assistência técnica a centenas de associados, e os agrônomos de consultoria que precisam acompanhar muitas propriedades ao mesmo tempo." | Slide de público-alvo (3 personas) |
| **3:00–3:50** | Proposta de valor e modelo | "A proposta de valor: **menos perda, menos defensivo aplicado sem necessidade e decisão no tempo certo**. O modelo é freemium para o produtor, com algumas análises grátis por mês, e um plano por propriedade ou por cooperativa, com alertas em tempo real, relatórios e integração com sensores." | Slide da proposta de valor + Business Model Canvas |
| **3:50–4:30** | Fechamento | "Hoje o PlantGuard já funciona de ponta a ponta. Os próximos passos são sensores de clima para prever o risco, alertas por WhatsApp e um piloto com uma cooperativa. **PlantGuard: proteção inteligente, safra garantida.** Obrigado!" | Slide de roadmap → logo + QR code do repo |

**Dicas do pitch**
- É um vídeo de produto, não técnico: nada de Kafka nem Docker na fala; a demo entra só como prova (20 s).
- Use um dado real de fonte citável (FAO, Embrapa) no problema e coloque a fonte no slide.
- Ensaie com cronômetro: o roteiro tem ~4 min 30 s de fala, o que deixa uma folga de 30 s.

---

## Checklist final
- [ ] Números `[ ]` preenchidos com a saída real do pm4py
- [ ] Vídeos com link público (YouTube não listado) testados numa aba anônima
- [ ] Links dos vídeos, da documentação e dos slides no README
