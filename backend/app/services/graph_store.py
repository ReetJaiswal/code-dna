import hashlib
import json
from pathlib import Path

from app.config import settings
from app.models import Edge

# workspace_id -> {chunk_id: set of connected chunk_ids}  (both directions)
_cache: dict[str, dict[str, set[str]]] = {}


def _path(workspace_id: str) -> Path:
    key = hashlib.sha1(workspace_id.encode()).hexdigest()[:16]
    p = Path(settings.data_dir)
    p.mkdir(parents=True, exist_ok=True)
    return p / f"graph_{key}.json"


def save_graph(workspace_id: str, edges: list[Edge]) -> None:
    pairs = [[e.source, e.target] for e in edges]
    _path(workspace_id).write_text(json.dumps(pairs))
    _cache.pop(workspace_id, None)


def _load(workspace_id: str) -> dict[str, set[str]]:
    if workspace_id in _cache:
        return _cache[workspace_id]
    adj: dict[str, set[str]] = {}
    p = _path(workspace_id)
    if p.exists():
        for a, b in json.loads(p.read_text()):
            adj.setdefault(a, set()).add(b)   # a calls b
            adj.setdefault(b, set()).add(a)   # b is called by a
    _cache[workspace_id] = adj
    return adj


def neighbors(workspace_id: str, ids: list[str]) -> set[str]:
    """Step 8: chunks directly connected (calls / called-by) to the given chunks."""
    adj = _load(workspace_id)
    out: set[str] = set()
    for i in ids:
        out |= adj.get(i, set())
    return out - set(ids)
