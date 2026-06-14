import os

from dotenv import load_dotenv

load_dotenv()

from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS


llm = ChatGroq(
    model_name="llama-3.3-70b-versatile",
    groq_api_key=os.getenv(
        "GROQ_API_KEY"
    )
)

embeddings = None


def get_embeddings():

    global embeddings

    if embeddings is None:

        embeddings = HuggingFaceEmbeddings(
            model_name="sentence-transformers/paraphrase-MiniLM-L3-v2"
        )

    return embeddings


def ask_pdf(question):

    if not os.path.exists(
        "vectorstore/index.faiss"
    ):

        return {
            "answer":
            "No documents uploaded yet.",
            "sources":[]
        }

    vectorstore = FAISS.load_local(
        "vectorstore",
        get_embeddings(),
        allow_dangerous_deserialization=True
    )

    retriever = vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={
            "k": 5,
            "fetch_k": 20
        }
    )

    docs = retriever.invoke(
        question
    )

    context = ""

    sources = []

    for doc in docs:

        context += (
            doc.page_content
            + "\n\n"
        )

        sources.append({

            "file":
            doc.metadata.get(
                "filename",
                "Unknown"
            )

        })

    prompt = f"""
Answer ONLY from the provided context.

Context:
{context}

Question:
{question}
"""

    response = llm.invoke(
        prompt
    )

    return {

        "answer":
        response.content,

        "sources":
        sources

    }
