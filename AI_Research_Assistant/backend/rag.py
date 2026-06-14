from dotenv import load_dotenv
import os

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


def ask_pdf(question):

    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    vectorstore = FAISS.load_local(
        "vectorstore",
        embeddings,
        allow_dangerous_deserialization=True
    )

    retriever = vectorstore.as_retriever(
        search_type="mmr",
        search_kwargs={
            "k": 5,
            "fetch_k": 20
        }
    )

    docs = retriever.invoke(question)

    context = ""

    sources = []

    for doc in docs:

        context += (
            doc.page_content + "\n\n"
        )

        sources.append({
            "file":
            doc.metadata.get(
                "filename",
                "Unknown"
            ),

            "page":
            doc.metadata.get(
                "page",
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

    response = llm.invoke(prompt)

    return {
        "answer":
        response.content,

        "sources":
        sources
    }