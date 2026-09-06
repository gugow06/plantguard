# Roteiro do Vídeo — PlantGuard Fase 5: Dados e Inteligência (2 a 3 min)

> Projeto **PlantGuard** · desafio acadêmico **AgroSmart (FIAP)**.
> Sugestão: gravar com a tela mostrando o app (dashboard + Relatório de IA) e os diagramas.
> Fala objetiva, ~120 palavras/min. As 4 entregas da fase aparecem em ordem.

---

## 0:00–0:20 — Abertura e problema (≈20s)
> "Olá! Somos a equipe do **PlantGuard**. Nas fases anteriores, o produtor já tira uma foto
> da planta e recebe o diagnóstico por IA em segundos. Mas uma foto é um ponto no tempo —
> e o campo inteiro, com dezenas de análises? **Um diagnóstico não decide uma safra; dados
> decidem.** Nesta fase, demos ao PlantGuard uma arquitetura de dados e inteligência."

## 0:20–0:45 — Entrega 1: Arquitetura de Data Lake (≈25s)
> "A primeira entrega é a **arquitetura de Data Lake**. Organizamos todo o dado em três
> camadas: a **bruta**, com o dado como chega — imagens, respostas da IA, arquivos e clima;
> a **confiável**, com o dado validado e padronizado no banco; e a **refinada**, já pronta
> para decisão — indicadores, alertas e insights. Estruturado ou não estruturado, **tudo
> numa base única e confiável.**"
>
> *(mostrar o diagrama do Data Lake — as três camadas)*

## 0:45–1:10 — Entrega 2: Ingestão e Manutenção (≈25s)
> "A segunda entrega é o **processo de ingestão e manutenção**. O dado entra por quatro
> canais reais: imagens dos produtores, arquivos em lote, streaming contínuo com Apache
> Kafka e uma API de clima que antecipa o risco de doença. Tudo passa por validação, com
> quarentena para o que vem errado, além de retenção e backup. **Dado ruim não entra, e
> dado bom não se perde.**"
>
> *(mostrar o diagrama de ingestão e os arquivos de amostra: CSV, JSON, streaming)*

## 1:10–1:55 — Entrega 3: IA Generativa de Decisão (≈45s) — destaque
> "A terceira entrega é o destaque: **IA generativa de apoio à decisão, funcionando de
> verdade no app**. Antes, a IA lia uma foto; agora ela lê o campo inteiro. Com um clique
> em 'Gerar Relatório com IA', ela vira um consultor agronômico: aponta o nível de risco,
> os principais achados e — o mais importante — **o que fazer primeiro**. Não é só 'esta
> folha está doente'; é 'seu tomatal está em surto de míldio, resolva estas três ações
> ainda esta semana'. **Decisão baseada nos dados reais do campo.**"
>
> *(mostrar o app: clicar em "Gerar Relatório com IA" e abrir o relatório real)*

## 1:55–2:20 — Entrega 4: Modelo de Negócio orientado a Dados (≈25s)
> "E a quarta entrega atualiza o **modelo de negócio**: o dado deixa de ser subproduto e
> vira **ativo estratégico**. Além da assinatura, monetizamos inteligência — benchmarks por
> região, alertas preditivos e dados anonimizados para a indústria, sempre com consentimento.
> Cooperativas, revendas, provedores de clima e centros de pesquisa fecham esse ciclo."
>
> *(mostrar, se houver, o Canvas / resumo do modelo de negócio)*

## 2:20–2:35 — Fechamento (≈15s)
> "Data Lake, ingestão, IA de decisão e negócio de dados: quatro entregas que transformam a
> foto de uma planta em decisão agronômica. **PlantGuard — do dado à decisão, no campo, em
> tempo real.** Obrigado!"

---

### Checklist de gravação
- [ ] Mostrar os diagramas de **Data Lake** e **Ingestão** (abrir os `.html` e usar "Baixar PNG").
- [ ] Demonstrar o app real: clicar em **"Gerar Relatório com IA"** e mostrar o relatório
      (risco, achados, prioridades, recomendações, previsão).
- [ ] Opcional: exibir as amostras em `data/lake/` (clima, imagem+rawResponse, streaming).
- [ ] Deixar claras as **4 entregas** ao longo do vídeo (uma por bloco).
- [ ] Duração final entre 2 e 3 minutos.
