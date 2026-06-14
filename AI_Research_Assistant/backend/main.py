from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from fastapi.responses import FileResponse
import glob
import os
import shutil

from rag import ask_pdf
from vector_utils import add_pdf_to_vectorstore, rebuild_vectorstore

app = FastAPI()
from vector_utils import (
    add_pdf_to_vectorstore,
    rebuild_vectorstore
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

uploaded_docs = []


class Query(BaseModel):
    question: str


@app.get("/")
def root():
    return {
        "message": "Research AI Running"
    }
@app.get("/preview/{filename}")
def preview_file(filename: str):

    path = os.path.join(
        "uploads",
        filename
    )

    if not os.path.exists(path):

        return {
            "error": "File not found"
        }

    return FileResponse(
        path,
        media_type="application/pdf"
    )
@app.delete("/delete/{filename}")
def delete_file(filename: str):

    filepath = os.path.join(
        "uploads",
        filename
    )

    if os.path.exists(filepath):

        os.remove(filepath)

    rebuild_vectorstore()

    global uploaded_docs

    uploaded_docs = [

        doc

        for doc in uploaded_docs

        if doc["name"] != filename

    ]

    return {

        "message":
        "deleted"

    }


@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):

    os.makedirs("uploads", exist_ok=True)

    filepath = os.path.join(
        "uploads",
        file.filename
    )

    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(
            file.file,
            buffer
        )

    add_pdf_to_vectorstore(filepath)

    size_mb = round(
        os.path.getsize(filepath) /
        (1024 * 1024),
        2
    )

    uploaded_docs.append({
        "name": file.filename,
        "size": size_mb
    })

    return {
        "message": "success"
    }


@app.get("/documents")
def documents():

    return {
        "documents": uploaded_docs
    }


@app.post("/ask")
def ask(query: Query):

    answer = ask_pdf(
        query.question
    )

    return {
        "answer": answer
    }