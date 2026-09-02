import os
import time

from langchain_ollama import ChatOllama, OllamaEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.messages import SystemMessage, HumanMessage


DB_DIR = os.getenv("VECTOR_DB_DIR", "vector_db")

SYSTEM_PROMPT = """
You are an AI Pharmaceutical Care Reasoning Copilot for licensed pharmacists.

LANGUAGE RULE
- Always respond in Bahasa Indonesia.
- Use professional clinical pharmacy language that is clear and concise.

ROLE AND SCOPE
- Analyze only Subjective and Objective data.
- Generate Pharmaceutical Assessment and Plan only.
- Do not establish medical diagnosis.
- Do not issue medical orders.
- Use only the retrieved context.
- If evidence is insufficient, state the evidence limitation.
- Do not include urgency indicators, risk scores, or automated prioritization.

REFERENCE RULES
- Every recommendation must include numeric citation such as [1].
- Use only references from the retrieved context.
- Do not invent references.
- If the retrieved context is not relevant, explicitly state that evidence is limited.

PCNE RULES
- If PCNE classification is available in the retrieved context, use it.
- If unavailable, state that PCNE classification cannot be fully determined from the retrieved evidence.
"""


def main():
    total_start = time.perf_counter()

    print("\n=== LOAD EMBEDDING MODEL ===")
    t0 = time.perf_counter()

    embeddings = OllamaEmbeddings(
        model="nomic-embed-text"
    )

    print(f"Embedding model load time: {time.perf_counter() - t0:.2f} detik")

    print("\n=== LOAD VECTOR DATABASE ===")
    t0 = time.perf_counter()

    db = Chroma(
        persist_directory=DB_DIR,
        embedding_function=embeddings
    )

    print(f"Vector DB load time: {time.perf_counter() - t0:.2f} detik")

    subjective = """
    Sesak napas memberat sejak 3 hari sebelum masuk rumah sakit, disertai bengkak pada tungkai,
    batuk ringan, lemah, mual, nafsu makan menurun, dan kadar gula darah rumah yang sering >300 mg/dL
    selama 2 minggu terakhir.

    Riwayat diabetes mellitus tipe 2 sejak 14 tahun, hipertensi sejak 12 tahun, penyakit ginjal kronik terkait
    diabetes, gagal jantung dengan fraksi ejeksi terjaga, dislipidemia, neuropati perifer diabetik,
    dan ulkus kaki diabetik berulang.
    """

    objective = """
    Tekanan darah: 168/94 mmHg
    Nadi: 104 kali/menit
    Laju pernapasan: 24 kali/menit
    Suhu: 37.6 °C
    Saturasi oksigen: 93% udara kamar

    Paru: Ronki basah halus basal bilateral
    Jantung: Bunyi reguler, tanpa murmur kasar
    Ekstremitas: +/+ pitting edema tungkai bawah
    Kaki kanan: lesi plantar superfisial 1.5 cm dengan eritem ringan

    Glukosa sewaktu: 386 mg/dL
    HbA1c: 10.8 %
    Ureum: 74 mg/dL
    Kreatinin serum: 2.04 mg/dL
    eGFR: 27 mL/min/1.73m²

    Obat & dosis:
    - Insulin glargine 22 unit qHS
    - Metformin
    """

    query = f"""
    Subjective:
    {subjective}

    Objective:
    {objective}
    """

    print("\n=== RETRIEVAL PROCESS ===")
    t0 = time.perf_counter()

    docs = db.similarity_search(query, k=5)

    retrieval_time = time.perf_counter() - t0
    print(f"Retrieval time: {retrieval_time:.2f} detik")

    context = "\n\n".join([
        f"[{i+1}] Source: {doc.metadata.get('source', 'Unknown')}\n"
        f"{doc.page_content}"
        for i, doc in enumerate(docs)
    ])

    references = "\n".join([
        f"[{i+1}] {doc.metadata.get('title', doc.metadata.get('source', 'Unknown'))} — {doc.metadata.get('source', 'Unknown')}"
        for i, doc in enumerate(docs)
    ])

    user_prompt = f"""
KONTEKS DARI DOKUMEN RAG:
{context}

DATA SUBJEKTIF:
{subjective}

DATA OBJEKTIF:
{objective}

Tulis jawaban dalam Bahasa Indonesia.

Gunakan format persis berikut:

📊 ASSESSMENT (Summary View)

Potential Drug Related Problem (DRP) identified:
[uraian singkat DRP potensial dalam Bahasa Indonesia]

PCNE DRP Classification:
Problem: [kode dan deskripsi jika tersedia dari konteks]
Cause: [kode dan deskripsi jika tersedia dari konteks]

Evidence limitation:
[keterbatasan bukti berdasarkan konteks yang tersedia]

📋 PLAN (Summary View)
- [rencana farmasi dengan sitasi angka]
- [rencana farmasi dengan sitasi angka]
- [rencana farmasi dengan sitasi angka]

📚 CLINICAL REFERENCES
{references}
"""

    print("\n=== LOAD LLM ===")
    t0 = time.perf_counter()

    llm = ChatOllama(
        model="llama3.1:8b",
        temperature=0.1,
        num_gpu=-1
    )

    print(f"LLM object init time: {time.perf_counter() - t0:.2f} detik")

    print("\n=== GENERATING RESPONSE ===")
    t0 = time.perf_counter()

    response = llm.invoke([
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=user_prompt)
    ])

    generation_time = time.perf_counter() - t0
    total_time = time.perf_counter() - total_start

    print("\n==================== FINAL RESULT ====================")
    print(response.content)
    print("=======================================================")

    print("\n==================== TIME REPORT ====================")
    print(f"Retrieval time       : {retrieval_time:.2f} detik")
    print(f"Generation time      : {generation_time:.2f} detik")
    print(f"Total response time  : {total_time:.2f} detik")
    print("======================================================")


if __name__ == "__main__":
    main()
