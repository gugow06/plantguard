# Roteiro do vídeo — PlantGuard Fase 7 (entrega final AgroSmart)

> Projeto **PlantGuard** · desafio acadêmico **AgroSmart (FIAP)**.
> **Um vídeo de 5 minutos** (alvo 5:00 a 5:15, nunca abaixo de 5:00), cobrindo a demonstração da plataforma, o fluxo, a análise de processo e o pitch do produto.
> Os slides seguem a mesma ordem: [deck no Claude](https://claude.ai/artifact/FrBxcN9a9xdJu7LFHwBKVr).
> Ritmo de fala: ~120 palavras por minuto (~600 palavras no total).

---

## Preparação (antes de gravar)

```bash
# infra/.env: STREAM_MAX_MESSAGES=0 e STREAM_INTERVAL_MS=5000 (producer contínuo)
docker compose -f infra/docker-compose.yml up -d --build
scripts/smoke-test.sh                       # confirma o fluxo ponta a ponta
npm run process:simulate                    # cenário de processo (seed fixa)
```

Janelas abertas, nesta ordem:
1. Slides em modo apresentação
2. App em `http://localhost:3000`, logado como `agrosmart-stream@demo.local` / `stream123`
3. Kafka UI em `http://localhost:8080` (tópico `plant-classifications`, aba Messages)
4. Terminal com `docker compose -f infra/docker-compose.yml logs -f consumer`
5. GitHub Actions do repositório (último run verde na `main`)
6. Uma foto de folha doente para o upload ao vivo

---

## Roteiro (5:00)

| Tempo | Slide / tela | Fala (sugestão) |
|---|---|---|
| **0:00–0:20** | Slide 1 (capa) | "Olá, somos a equipe do **PlantGuard**. Nas sete fases do AgroSmart, saímos de um diagnóstico por foto para uma plataforma completa, que identifica doenças em plantas, decide quando é preciso agir e avisa o produtor em segundos." |
| **0:20–0:45** | Slide 2 (problema) | "Até 40% da produção agrícola mundial se perde todo ano para pragas e doenças. No campo, o diagnóstico depende de um agrônomo que nem sempre está por perto, e a olho nu a doença só aparece quando já tomou o talhão. Quem mais perde é o pequeno e o médio produtor." |
| **0:45–1:10** | Slides 3 e 4 (solução e arquitetura) | "O PlantGuard é um agrônomo digital que não dorme. Na entrada, a foto do produtor, arquivos em lote ou câmeras de campo publicando no Kafka. No processamento, o Gemini diagnostica, o consumer grava no Postgres e quatro regras decidem a ação. Na saída, alertas, dashboard e relatórios. Tudo sobe com um docker compose." |
| **1:10–2:15** | **Demo ao vivo** (Kafka UI → terminal → app) | "Vamos ver funcionando. No Kafka UI, as leituras do campo chegam ao tópico: planta, status e confiança. *(abrir uma mensagem)* O consumer grava cada uma e, quando a planta está doente, cria o alerta na hora. *(log `ALERTA criado`)* No app, o sino acende e o analytics se atualiza sozinho. E pelo celular: envio esta foto *(upload)*, e em segundos o Gemini devolve a doença, a confiança e o tratamento." |
| **2:15–2:35** | Slide 6 (decisão) | "O diferencial é não parar no diagnóstico. As regras R1 a R4 olham todas as análises da espécie: com metade das plantas doentes, o alerta vira intervenção urgente; com confiança baixa, pedimos uma nova foto." |
| **2:35–3:35** | Slides 7 e 8 (processo e melhorias) + página `/process` | "Cada etapa grava um evento, e com mineração de processos descobrimos este mapa. A parte técnica leva milissegundos: 26, do Kafka até o banco. **O gargalo é humano**: entre o alerta ser gerado e o produtor vê-lo passa 1,1 hora na mediana e 28 horas no pior caso, e 21,8% dos alertas nunca são vistos, porque o que chega à noite só é visto no dia seguinte. As variações são o retrabalho, quando a IA fica inconclusiva e o produtor precisa fotografar de novo, e as falhas da IA. Daí as melhorias: alerta crítico por WhatsApp com lembrete, guia de captura de foto e nova tentativa automática da IA, cada uma com o indicador que a página Processo já mede." |
| **3:35–4:05** | Slide 9 (confiabilidade) + GitHub Actions | "Cada mudança passa pelo nosso pipeline: lint, testes, busca de segredos, análise de vulnerabilidades e um teste que sobe a plataforma inteira e derruba o Kafka para ver se ela se recupera. Ele barrou uma falha crítica no Next.js: saímos de 44 vulnerabilidades para zero. Cada merge publica imagens versionadas, e o monitor mostra a saúde de cada serviço ao vivo." |
| **4:05–4:45** | Slides 10, 11 e 12 (diferencial, público, valor) | "Nosso público é o pequeno e o médio produtor, as cooperativas e os agrônomos de consultoria. A proposta de valor: **menos perda, menos defensivo e decisão na hora certa**. O modelo é freemium para o produtor, com plano por propriedade ou cooperativa e API por análise para agtechs." |
| **4:45–5:05** | Slides 13 e 14 (roadmap e encerramento) | "Hoje o PlantGuard funciona de ponta a ponta. Os próximos passos são atacar o gargalo do alerta, prever o risco com sensores de clima e fazer um piloto com uma cooperativa. **PlantGuard: proteção inteligente, safra garantida.** Obrigado!" |

---

## Dicas

- Grave em blocos e edite. A demo ao vivo é o bloco mais arriscado: grave o upload duas vezes e use a melhor.
- Nos trechos de espera (upload, alerta chegando), acelere o vídeo em vez de cortar a fala.
- Mostre o **mesmo caso** no Kafka UI, no log do consumer e no sino: isso prova o ponta a ponta.
- Se passar de 5:15, encurte a fala da arquitetura (o slide fala sozinho) antes de cortar a análise de processo, que tem o maior peso da nota (25%).
- Confirme a fonte do dado de 40% (FAO) antes de gravar.
- Teste o link do vídeo (YouTube não listado) numa aba anônima e coloque-o no README.
