# Análise do processo — PlantGuard (pm4py)

Origem dos eventos: **simulado** · 1861 eventos · 400 casos · 25 variantes
Canais: camera: 267, upload: 133

## Descoberta
- Mapa por frequência: `dfg-frequencia.png` · por tempo: `dfg-tempo.png`
- Modelo (Inductive Miner, ruído 20%): `petri-net.png` e `bpmn.png`
- Conformidade do log com o modelo: fitness **0.996**, 95.8% dos casos reproduzidos sem desvio, precisão **0.683**

## Variantes
O caminho principal cobre **34.8%** dos casos; as 5 variantes mais comuns cobrem 77%.

| # | Casos | Variante |
|---|---|---|
| 1 | 34.8% (139) | Imagem capturada → Publicada no Kafka → Consumida do tópico → Análise registrada |
| 2 | 13.2% (53) | Imagem capturada → Publicada no Kafka → Consumida do tópico → Análise registrada → Alerta gerado → Alerta visualizado |
| 3 | 11.2% (45) | Imagem capturada → Publicada no Kafka → Consumida do tópico → Análise registrada → Relatório enviado |
| 4 | 11.2% (45) | Imagem capturada → Diagnóstico por IA → Análise registrada |
| 5 | 6.2% (25) | Imagem capturada → Diagnóstico por IA → Análise registrada → Alerta gerado → Alerta visualizado |
| 6 | 4.0% (16) | Imagem capturada → Diagnóstico por IA → Análise registrada → Relatório enviado |

## Tempos de espera (mediana e P90)
| Transição | Casos | Mediana | P90 |
|---|---|---|---|
| Análise registrada → Relatório enviado | 63 | 2.5 d | 3.5 d |
| Alerta visualizado → Relatório enviado | 21 | 2.5 d | 3.5 d |
| Alerta gerado → Relatório enviado | 10 | 46.1 h | 3.2 d |
| Alerta gerado → Alerta visualizado | 104 | 1.1 h | 28.0 h |
| Diagnóstico inconclusivo → Imagem capturada | 13 | 12 min | 25 min |
| Falha no diagnóstico → Imagem capturada | 12 | 1 min | 3 min |
| Imagem capturada → Falha no diagnóstico | 16 | 21.8 s | 28.8 s |
| Imagem capturada → Diagnóstico por IA | 142 | 4.4 s | 7.2 s |

## Insights
1. **Gargalo humano, não técnico.** A maior espera do ciclo de resposta é **Alerta gerado → Alerta visualizado**: mediana de **1.1 h** e P90 de **28.0 h**. A parte técnica é ordens de grandeza mais rápida (Imagem capturada → Falha no diagnóstico: 21.8 s, Imagem capturada → Diagnóstico por IA: 4.4 s, Imagem capturada → Publicada no Kafka: 136 ms, Publicada no Kafka → Consumida do tópico: 106 ms, Consumida do tópico → Análise registrada: 21 ms).
2. **Alertas sem resposta.** 21.8% dos 133 alertas de doença nunca foram vistos. Alertas gerados à noite e no fim de semana só são vistos no expediente seguinte, o que explica o P90 longo.
3. **Retrabalho.** 6.0% dos casos repetem etapas; 13 casos passam pelo laço "Diagnóstico inconclusivo → nova captura".
4. **Dependência externa.** 3.5% dos casos tiveram falha no diagnóstico por IA; parte deles termina sem diagnóstico (o produtor desiste).
5. **Relatório em lote.** O relatório por e-mail chega dias depois da análise: serve para histórico, não para reação.

## Oportunidades de melhoria
| Problema | Melhoria proposta | Indicador para acompanhar |
|---|---|---|
| Alerta demora a ser visto | Push/WhatsApp para alerta crítico (R2) com lembrete após 1 h e escalonamento para o técnico da cooperativa | Mediana e P90 de "Alerta gerado → Alerta visualizado"; % nunca vistos |
| Diagnóstico inconclusivo | Guia de captura (luz, distância, foco) antes do envio e quando a confiança < 70% (R4) | % de casos com o laço de retrabalho |
| Falha da IA | Fila com nova tentativa automática (backoff) e cache | % de casos com "Falha no diagnóstico"; casos sem desfecho |
| Relatório tardio | Relatório imediato só para casos críticos; o semanal continua como histórico | Espera "Alerta gerado → Relatório enviado" |
