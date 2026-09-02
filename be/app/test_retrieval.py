import os

from langchain_ollama import OllamaEmbeddings
from langchain_community.vectorstores import Chroma


DB_DIR = os.getenv("VECTOR_DB_DIR", "vector_db")

# load embedding model
embeddings = OllamaEmbeddings(
    model="nomic-embed-text"
)

# load vector database
db = Chroma(
    persist_directory=DB_DIR,
    embedding_function=embeddings
)

# query test
query = """
metformin adherence problem
"""

print("\n====================")
print("QUERY:")
print(query)
print("====================")

# retrieve top 3 docs
docs = db.similarity_search(query, k=3)

# tampilkan hasil
for i, doc in enumerate(docs):

    print("\n====================")
    print(f"DOC {i+1}")
    print("====================")

    print("METADATA:")
    print(doc.metadata)

    print("\nCONTENT:")
    print(doc.page_content[:1500])
