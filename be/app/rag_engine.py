from langchain_google_genai import ChatGoogleGenerativeAI, GoogleGenerativeAIEmbeddings
from langchain_community.vectorstores import Chroma
from langchain_core.messages import SystemMessage, HumanMessage
import os

from app.prompts_api import SYSTEM_PROMPT, summary, expanded


DB_DIR = os.getenv("VECTOR_DB_DIR", "vector_db")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")
GEMINI_EMBED_MODEL = os.getenv("GEMINI_EMBED_MODEL", "gemini-embedding-2")
GEMINI_MAX_OUTPUT_TOKENS = int(os.getenv("GEMINI_MAX_OUTPUT_TOKENS", "900"))
GEMINI_MAX_OUTPUT_TOKENS_EXPANDED = int(os.getenv("GEMINI_MAX_OUTPUT_TOKENS_EXPANDED", "1600"))
RAG_RETRIEVAL_K = int(os.getenv("RAG_RETRIEVAL_K", "5"))

OUTPUT_MODE_PROMPTS = {
    "summary": summary,
    "expanded": expanded,
}

def normalize_output_mode(output_mode: str) -> str:
    mode = (output_mode or "summary").strip().lower()
    
    if mode not in OUTPUT_MODE_PROMPTS:
        return "summary"
    return mode


def retrieve_context(query: str, k: int = RAG_RETRIEVAL_K):
    embeddings = GoogleGenerativeAIEmbeddings(
        model=GEMINI_EMBED_MODEL,
        google_api_key=GEMINI_API_KEY,
        task_type="retrieval_query",
    )

    db = Chroma(
        persist_directory=DB_DIR,
        embedding_function=embeddings
    )

    docs = db.similarity_search(query, k=k)

    context_parts = []
    references = []

    for i, doc in enumerate(docs, start=1):
        source = doc.metadata.get("source", "Unknown source")
        title = doc.metadata.get("title", "Untitled")

        context_parts.append(
            f"[{i}]\n"
            f"Title: {title}\n"
            f"Source: {source}\n"
            f"Content:\n{doc.page_content}"
        )

        references.append(f"[{i}] {title} — {source}")

    return "\n\n".join(context_parts), "\n".join(references)


def generate_pharma_assessment(subjective: str, objective: str, output_mode: str = "summary"):
    selected_mode = normalize_output_mode(output_mode)
    max_tokens = GEMINI_MAX_OUTPUT_TOKENS_EXPANDED if selected_mode == "expanded" else GEMINI_MAX_OUTPUT_TOKENS

    query = f"""
    Subjective:
    {subjective}

    Objective:
    {objective}
    """

    context, references = retrieve_context(query)

    llm = ChatGoogleGenerativeAI(
        model=GEMINI_MODEL,
        google_api_key=GEMINI_API_KEY,
        temperature=0.1,
        max_output_tokens=max_tokens,
    )

    user_prompt = f"""
KONTEKS DARI DOKUMEN RAG:
{context}

DATA SUBJEKTIF:
{subjective}

DATA OBJEKTIF:
{objective}

OUTPUT MODE:
{selected_mode}

REFERENCE LIST:
{references}
"""

    response = llm.invoke([
        SystemMessage(content=SYSTEM_PROMPT),
        HumanMessage(content=user_prompt)
    ])

    return response.content
