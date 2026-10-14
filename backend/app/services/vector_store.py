import hashlib

import chromadb

from app.config import settings
from app.models import Chunk
from app.services.embedder import embed

_client = chromadb.PersistentClient(path=f"{settings.data_dir}/chroma")


def _name(workspace_id: str) -> str:
    # One collection per workspace so projects don't mix.
    return "ws_" + hashlib.sha1(workspace_id.encode()).hexdigest()[:16]


def _collection(workspace_id: str):
    return _client.get_or_create_collection(_name(workspace_id), metadata={"hnsw:space": "cosine"})


def reset_workspace(workspace_id: str) -> None:
    try:
        _client.delete_collection(_name(workspace_id))
    except Exception:
        pass  # didn't exist yet


def _to_text(c: Chunk) -> str:
    return f"{c.kind} {c.name} in {c.file_path}\n{c.code[:4000]}"


def upsert_chunks(workspace_id: str, chunks: list[Chunk]) -> int:
    if not chunks:
        return 0
    col = _collection(workspace_id)
    col.upsert(
        ids=[c.id for c in chunks],
        documents=[c.code for c in chunks],
        embeddings=embed([_to_text(c) for c in chunks]),
        metadatas=[
            {"file_path": c.file_path, "name": c.name, "kind": c.kind,
             "start_line": c.start_line, "end_line": c.end_line}
            for c in chunks
        ],
    )
    return len(chunks)


def _rows(ids, docs, metas) -> list[dict]:
    return [{"id": i, "code": d, **m} for i, d, m in zip(ids, docs, metas)]


def search(workspace_id: str, question: str, top_k: int) -> list[dict]:
    """Step 7: embed the question and find the most similar code chunks."""
    col = _collection(workspace_id)
    n = min(top_k, col.count())
    if n == 0:
        return []
    res = col.query(query_embeddings=embed([question]), n_results=n)
    return _rows(res["ids"][0], res["documents"][0], res["metadatas"][0])


def get_by_ids(workspace_id: str, ids: list[str]) -> list[dict]:
    if not ids:
        return []
    res = _collection(workspace_id).get(ids=ids)
    return _rows(res["ids"], res["documents"], res["metadatas"])
