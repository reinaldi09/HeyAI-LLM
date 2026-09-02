from pathlib import Path
import os

from langchain_community.document_loaders import PyMuPDFLoader, Docx2txtLoader, TextLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma


DATA_DIR = Path(os.getenv("DATA_DIR", "data"))
DB_DIR = os.getenv("VECTOR_DB_DIR", "vector_db")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_EMBED_MODEL = os.getenv("GEMINI_EMBED_MODEL", "gemini-embedding-2")


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

            documents.extend(docs)

            print(f"✅ Berhasil dibaca: {file.name} | halaman/chunk awal: {len(docs)}")

        except Exception as e:
            print(f"❌ Gagal membaca file: {file.name}")
            print(f"Alasan: {e}")
            continue

    return documents


def main():
    print("=== MULAI INDEXING DOKUMEN ===")

    documents = load_documents()

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

    embeddings = GoogleGenerativeAIEmbeddings(
        model=GEMINI_EMBED_MODEL,
        google_api_key=GEMINI_API_KEY,
        task_type="retrieval_document",
    )

    print("\nMembuat vector database...")

    db = Chroma.from_documents(
        documents=chunks,
        embedding=embeddings,
        persist_directory=DB_DIR
    )

    print("✅ Vector database selesai dibuat.")
    print(f"Lokasi database: {DB_DIR}")


if __name__ == "__main__":
    main()
