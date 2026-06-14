import os
import shutil

from langchain_community.document_loaders import PyPDFLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_huggingface import HuggingFaceEmbeddings

embeddings = HuggingFaceEmbeddings(
    model_name="sentence-transformers/all-MiniLM-L6-v2"
)


def add_pdf_to_vectorstore(pdf_path):

    loader = PyPDFLoader(pdf_path)

    documents = loader.load()

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )

    chunks = splitter.split_documents(documents)

    # Add source metadata
    for chunk in chunks:
        chunk.metadata["filename"] = os.path.basename(pdf_path)

    # Existing FAISS?
    if os.path.exists("vectorstore/index.faiss"):

        vectorstore = FAISS.load_local(
            "vectorstore",
            embeddings,
            allow_dangerous_deserialization=True
        )

        vectorstore.add_documents(chunks)

    else:

        vectorstore = FAISS.from_documents(
            chunks,
            embeddings
        )

    vectorstore.save_local("vectorstore")

    print(
        f"Indexed {os.path.basename(pdf_path)}"
    )

def rebuild_vectorstore():

    if os.path.exists("vectorstore"):

        shutil.rmtree(
            "vectorstore"
        )

    pdfs = [

        os.path.join(
            "uploads",
            file
        )

        for file in os.listdir(
            "uploads"
        )

        if file.endswith(".pdf")

    ]

    if not pdfs:

        return

    docs = []

    for pdf in pdfs:
        loader = PyPDFLoader(pdf)
        docs.extend(loader.load())

    splitter = RecursiveCharacterTextSplitter(
        chunk_size=1000,
        chunk_overlap=200
    )

    chunks = splitter.split_documents(docs)

    embeddings = HuggingFaceEmbeddings(
        model_name="sentence-transformers/all-MiniLM-L6-v2"
    )

    db = FAISS.from_documents(
        chunks,
        embeddings
    )

    db.save_local("vectorstore")

    print("Vectorstore rebuilt")

