from fastapi import FastAPI

from app.models import IndexRequest, IndexResponse, QueryRequest, QueryResponse
from app.services import graph_store, rag, vector_store

app = FastAPI(title="CodeDNA Backend")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.post("/index", response_model=IndexResponse, response_model_by_alias=True)
def index(req: IndexRequest) -> IndexResponse:
    """Indexing: store embeddings in the vector DB and the call graph on disk."""
    vector_store.reset_workspace(req.workspace_id)   # fresh start each time
    count = vector_store.upsert_chunks(req.workspace_id, req.chunks)
    graph_store.save_graph(req.workspace_id, req.edges)
    return IndexResponse(indexed=count)


@app.post("/query", response_model=QueryResponse, response_model_by_alias=True)
def query(req: QueryRequest) -> QueryResponse:
    """Retrieve relevant code, then let the LLM explain it (RAG)."""
    return rag.answer_question(req)
