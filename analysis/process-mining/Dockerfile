# Ambiente reproduzível da análise de processos (pm4py + Graphviz).
# Uso (a partir da raiz do repo):
#   docker build -t plantguard-process-mining analysis/process-mining
#   docker run --rm --user "$(id -u)" -v "$PWD":/work plantguard-process-mining \
#     docs/fase7/processo/event-log.csv docs/fase7/processo
FROM python:3.13-slim
RUN apt-get update \
 && apt-get install -y --no-install-recommends graphviz \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY analyze.py .
# Roda sem privilégio de root (achado DS002 do Trivy no pipeline).
RUN useradd --create-home --uid 1000 analyst
USER analyst
WORKDIR /work
ENTRYPOINT ["python", "/app/analyze.py"]
