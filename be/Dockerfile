# ─── Backend FastAPI + SumoPod ────────────────────────────────────────────────
FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

RUN pip install --no-cache-dir torch --index-url https://download.pytorch.org/whl/cpu
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

ENV HF_HOME=/app/.cache/huggingface
RUN mkdir -p /app/.cache/huggingface \
 && python -c "from sentence_transformers import CrossEncoder; CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2')"

COPY .env.development .env
COPY app/ ./app/

RUN useradd --system --uid 1001 --create-home fastapi \
 && chown -R fastapi:fastapi /app
USER fastapi

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
