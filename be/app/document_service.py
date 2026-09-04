import os
import re
import shutil
from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException, UploadFile, status
from langchain_community.document_loaders import PyMuPDFLoader
from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter


DATA_DIR = Path(os.getenv("DATA_DIR", "data"))
DB_DIR = Path(os.getenv("VECTOR_DB_DIR", "vector_db"))
EMBED_API_KEY = os.getenv("EMBED_API_KEY")
EMBED_BASE_URL = os.getenv("EMBED_BASE_URL", "https://ai.sumopod.com/v1")
EMBED_MODEL = os.getenv("EMBED_MODEL", "gemini/gemini-embedding-001")
MAX_PDF_BYTES = int(os.getenv("MAX_PDF_BYTES", str(100 * 1024 * 1024)))
EMBED_BATCH_SIZE = int(os.getenv("EMBED_BATCH_SIZE", "50"))


def safe_pdf_filename(filename: str) -> str:
    stem = Path(filename).stem
    cleaned = re.sub(r"[^a-zA-Z0-9._-]+", "-", stem).strip("-")[:80] or "dokumen"
    return f"{cleaned}-{uuid4().hex[:10]}.pdf"


async def save_pdf_upload(upload: UploadFile) -> tuple[str, Path, int]:
    if not upload.filename or not upload.filename.lower().endswith(".pdf"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File harus berformat PDF",
        )

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    filename = safe_pdf_filename(upload.filename)
    target = DATA_DIR / filename
    size = 0

    with target.open("wb") as buffer:
        while chunk := await upload.read(1024 * 1024):
            size += len(chunk)
            if size > MAX_PDF_BYTES:
                target.unlink(missing_ok=True)
                raise HTTPException(
                    status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
                    detail="Ukuran PDF melebihi batas maksimal 100 MB",
                )
            buffer.write(chunk)

    return filename, target, size


def delete_file(path: str) -> None:
    target = Path(path)
    if target.exists() and target.is_file():
        target.unlink()


def clean_documents(documents):
    for doc in documents:
        text = doc.page_content
        text = text.replace("\n", " ")
        text = text.replace("  ", " ")
        doc.page_content = text
    return documents


def rebuild_vector_index() -> int:
    documents = []
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    for file in DATA_DIR.glob("*.pdf"):
        loader = PyMuPDFLoader(str(file))
        docs = loader.load()
        for doc in docs:
            doc.metadata["source"] = file.name
            doc.metadata["title"] = file.stem
            page_num = doc.metadata.get("page", doc.metadata.get("page_number", "N/A"))
            doc.metadata["page"] = str(page_num)
        documents.extend(docs)

    if DB_DIR.exists():
        for entry in DB_DIR.iterdir():
            if entry.is_dir():
                shutil.rmtree(entry)
            else:
                entry.unlink()

    if not documents:
        return 0

    documents = clean_documents(documents)

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=900,
        chunk_overlap=180,
        separators=["\n\n", "\n", ".", " ", ""],
    )
    chunks = splitter.split_documents(documents)
    embeddings = OpenAIEmbeddings(model=EMBED_MODEL, api_key=EMBED_API_KEY, base_url=EMBED_BASE_URL)

    db = None
    for i in range(0, len(chunks), EMBED_BATCH_SIZE):
        batch = chunks[i:i + EMBED_BATCH_SIZE]
        if db is None:
            db = Chroma.from_documents(
                documents=batch,
                embedding=embeddings,
                persist_directory=str(DB_DIR),
            )
        else:
            db.add_documents(batch)

    return len(chunks)
