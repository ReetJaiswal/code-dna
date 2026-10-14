from functools import lru_cache

from sentence_transformers import SentenceTransformer

from app.config import settings


@lru_cache
def _model() -> SentenceTransformer:
    # Loaded once, then reused (loading is slow).
    return SentenceTransformer(settings.embedding_model)


def embed(texts: list[str]) -> list[list[float]]:
    """Turn text into embeddings (lists of numbers that capture meaning)."""
    return _model().encode(texts, normalize_embeddings=True).tolist()
