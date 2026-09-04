from langchain_openai import ChatOpenAI, OpenAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_community.retrievers import BM25Retriever
from sentence_transformers import CrossEncoder
from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.documents import Document
import os
import time

from app.prompts_api import SYSTEM_PROMPT, combined


DB_DIR = os.getenv("VECTOR_DB_DIR", "vector_db")
LLM_API_KEY = os.getenv("LLM_API_KEY")
LLM_BASE_URL = os.getenv("LLM_BASE_URL", "https://ai.sumopod.com/v1")
LLM_MODEL = os.getenv("LLM_MODEL", "gemini/gemini-3.5-flash")
LLM_MAX_OUTPUT_TOKENS = int(os.getenv("LLM_MAX_OUTPUT_TOKENS", "3000"))
EMBED_API_KEY = os.getenv("EMBED_API_KEY")
EMBED_BASE_URL = os.getenv("EMBED_BASE_URL", "https://ai.sumopod.com/v1")
EMBED_MODEL = os.getenv("EMBED_MODEL", "gemini/gemini-embedding-001")
RAG_RETRIEVAL_K = int(os.getenv("RAG_RETRIEVAL_K", "8"))
RAG_TOP_K_RERANK = int(os.getenv("RAG_TOP_K_RERANK", "5"))
RAG_RERANK_MODEL = os.getenv("RAG_RERANK_MODEL", "cross-encoder/ms-marco-MiniLM-L-6-v2")

_embeddings = None
_reranker = None
_bm25_retriever = None


def _get_embeddings():
    global _embeddings
    if _embeddings is None:
        _embeddings = OpenAIEmbeddings(
            model=EMBED_MODEL,
            api_key=EMBED_API_KEY,
            base_url=EMBED_BASE_URL,
        )
    return _embeddings


def _get_reranker():
    global _reranker
    if _reranker is None:
        _reranker = CrossEncoder(RAG_RERANK_MODEL)
    return _reranker


def _rerank(query: str, docs: list, reranker):
    if not docs:
        return docs

    pairs = [(query, d.page_content) for d in docs]
    scores = reranker.predict(pairs)

    ranked = list(zip(docs, scores))
    ranked.sort(key=lambda x: x[1], reverse=True)

    return [doc for doc, _ in ranked[:RAG_TOP_K_RERANK]]


def _get_bm25_docs(query: str, vectorstore):
    global _bm25_retriever
    t0 = time.perf_counter()

    if _bm25_retriever is None:
        docs_dict = vectorstore.get()
        texts = docs_dict.get("documents", [])
        metadatas = docs_dict.get("metadatas", [])

        langchain_docs = []
        for text, meta in zip(texts, metadatas):
            langchain_docs.append(Document(page_content=text, metadata=meta or {}))

        if not langchain_docs:
            return []

        _bm25_retriever = BM25Retriever.from_documents(langchain_docs)
        _bm25_retriever.k = RAG_RETRIEVAL_K

    print(f"[RAG] bm25 (cached): {time.perf_counter() - t0:.2f}s", flush=True)
    return _bm25_retriever.invoke(query)


def retrieve_context(query: str, k: int = RAG_RETRIEVAL_K):
    t0 = time.perf_counter()
    vectorstore = Chroma(
        persist_directory=DB_DIR,
        embedding_function=_get_embeddings(),
    )
    print(f"[RAG] open vectorstore: {time.perf_counter() - t0:.2f}s", flush=True)

    t0 = time.perf_counter()
    reranker = _get_reranker()
    print(f"[RAG] load reranker: {time.perf_counter() - t0:.2f}s", flush=True)

    vector_retriever = vectorstore.as_retriever(
        search_kwargs={"k": RAG_RETRIEVAL_K}
    )

    t0 = time.perf_counter()
    v_docs = vector_retriever.invoke(query)
    print(f"[RAG] vector search: {time.perf_counter() - t0:.2f}s", flush=True)

    bm25_docs = _get_bm25_docs(query, vectorstore)

    all_docs = v_docs + bm25_docs
    unique_docs = {doc.page_content: doc for doc in all_docs}.values()
    unique_docs = list(unique_docs)

    t0 = time.perf_counter()
    if len(unique_docs) > 1:
        unique_docs = _rerank(query, unique_docs, reranker)
    print(f"[RAG] rerank: {time.perf_counter() - t0:.2f}s", flush=True)

    final_docs = unique_docs[:RAG_TOP_K_RERANK]

    context_parts = []
    references = []

    for i, doc in enumerate(final_docs, start=1):
        source = doc.metadata.get("source", "Unknown source")
        title = doc.metadata.get("title", "Untitled")
        page = doc.metadata.get("page", "N/A")

        context_parts.append(
            f"[{i}]\n"
            f"Title: {title}\n"
            f"Source: {source}\n"
            f"Page: {page}\n"
            f"Content:\n{doc.page_content}"
        )

        references.append(f"[{i}] {title} — {source} (hal. {page})")

    return "\n\n".join(context_parts), "\n".join(references)


def generate_pharma_assessment(subjective: str, objective: str) -> str:
    query = f"""
    Subjective:
    {subjective}

    Objective:
    {objective}
    """

    t0 = time.perf_counter()
    context, references = retrieve_context(query)
    print(f"[RAG] retrieve_context total: {time.perf_counter() - t0:.2f}s", flush=True)

    llm = ChatOpenAI(
        model=LLM_MODEL,
        api_key=LLM_API_KEY,
        base_url=LLM_BASE_URL,
        temperature=0.2,
    )

    user_prompt = f"""
KONTEKS DARI DOKUMEN RAG:
{context}

DATA SUBJEKTIF:
{subjective}

DATA OBJEKTIF:
{objective}

{combined.format(references=references)}
"""

    t0 = time.perf_counter()
    response = llm.invoke([
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=user_prompt)
    ])
    print(f"[RAG] LLM generation: {time.perf_counter() - t0:.2f}s", flush=True)

    return response.content
