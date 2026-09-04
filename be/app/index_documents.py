from pathlib import Path
import os
import shutil

from langchain_community.document_loaders import PyMuPDFLoader, Docx2txtLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_openai import OpenAIEmbeddings
from langchain_community.vectorstores import Chroma


DATA_DIR = Path(os.getenv("DATA_DIR", "data"))
DB_DIR = os.getenv("VECTOR_DB_DIR", "vector_db")
EMBED_API_KEY = os.getenv("EMBED_API_KEY")
EMBED_BASE_URL = os.getenv("EMBED_BASE_URL", "https://ai.sumopod.com/v1")
EMBED_MODEL = os.getenv("EMBED_MODEL", "gemini/gemini-embedding-001")
EMBED_BATCH_SIZE = int(os.getenv("EMBED_BATCH_SIZE", "50"))


def load_documents():
    documents = []

    if not DATA_DIR.exists():
        print("❌ Folder data tidak ditemukan.")
        return documents

    for file in DATA_DIR.glob("*"):
        suffix = file.suffix.lower()

        print(f"\nLoading: {file.name}")

        try:
            if suffix == ".pdf":
                loader = PyMuPDFLoader(str(file))
                docs = loader.load()

            elif suffix == ".docx":
                loader = Docx2txtLoader(str(file))
                docs = loader.load()

            elif suffix == ".txt":
                loader = TextLoader(str(file), encoding="utf-8")
                docs = loader.load()

            else:
                print(f"⚠️ Skip file tidak didukung: {file.name}")
                continue

            for doc in docs:
                doc.metadata["source"] = file.name
                doc.metadata["title"] = file.stem
                page_num = doc.metadata.get("page", doc.metadata.get("page_number", "N/A"))
                doc.metadata["page"] = str(page_num)

            documents.extend(docs)

            print(f"✅ Berhasil dibaca: {file.name} | halaman/chunk awal: {len(docs)}")

        except Exception as e:
            print(f"❌ Gagal membaca file: {file.name}")
            print(f"Alasan: {e}")
            continue

    return documents


def clean_documents(documents):
    for doc in documents:
        text = doc.page_content
        text = text.replace("\n", " ")
        text = text.replace("  ", " ")
        doc.page_content = text
    return documents


def main():
    print("=== MULAI INDEXING DOKUMEN ===")

    documents = load_documents()
    documents = clean_documents(documents)

    if len(documents) == 0:
        print("❌ Tidak ada dokumen yang berhasil dibaca.")
        return

    print(f"\nTotal dokumen halaman yang terbaca: {len(documents)}")

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=900,
        chunk_overlap=180,
        separators=["\n\n", "\n", ".", " ", ""]
    )

    chunks = splitter.split_documents(documents)

    print(f"Total chunks setelah splitting: {len(chunks)}")

    embeddings = OpenAIEmbeddings(model=EMBED_MODEL, api_key=EMBED_API_KEY, base_url=EMBED_BASE_URL)

    if os.path.exists(DB_DIR):
        for entry in os.listdir(DB_DIR):
            entry_path = os.path.join(DB_DIR, entry)
            if os.path.isdir(entry_path):
                shutil.rmtree(entry_path)
            else:
                os.remove(entry_path)

    print(f"\nMembuat vector database (batched, {EMBED_BATCH_SIZE} chunks/batch)...")

    db = None
    total_batches = (len(chunks) + EMBED_BATCH_SIZE - 1) // EMBED_BATCH_SIZE
    for i in range(0, len(chunks), EMBED_BATCH_SIZE):
        batch = chunks[i:i + EMBED_BATCH_SIZE]
        batch_no = i // EMBED_BATCH_SIZE + 1
        print(f"  Batch {batch_no}/{total_batches} ({len(batch)} chunks)...", end=" ", flush=True)

        if db is None:
            db = Chroma.from_documents(
                documents=batch,
                embedding=embeddings,
                persist_directory=DB_DIR
            )
        else:
            db.add_documents(batch)

        print("OK")

    print("✅ Vector database selesai dibuat.")
    print(f"Lokasi database: {DB_DIR}")


if __name__ == "__main__":
    main()
