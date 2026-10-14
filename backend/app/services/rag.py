from app.config import settings
from app.models import QueryRequest, QueryResponse, SourceRef
from app.services import graph_store, llm, vector_store

SYSTEM_PROMPT = (
    "You are CodeDNA, an assistant that explains a codebase. "
    "Answer ONLY using the code snippets provided. "
    "Mention file names and function names. "
    "If the snippets are not enough, say so instead of guessing."
)


def _build_prompt(question: str, chunks: list[dict]) -> str:
    parts = []
    for c in chunks:
        parts.append(
            f"### {c['file_path']} : {c['name']} (lines {c['start_line']}-{c['end_line']})\n"
            f"```\n{c['code']}\n```"
        )
    context = "\n\n".join(parts)
    return f"Code snippets:\n\n{context}\n\nQuestion: {question}"


def answer_question(req: QueryRequest) -> QueryResponse:
    # Retrieve: similar chunks (vector search)
    hits = vector_store.search(req.workspace_id, req.question, settings.top_k)
    if not hits:
        return QueryResponse(
            answer="Nothing is indexed yet. Run 'CodeDNA: Index Workspace' first.", sources=[]
        )

    # Expand: add chunks connected in the call graph
    hit_ids = [h["id"] for h in hits]
    extra_ids = list(graph_store.neighbors(req.workspace_id, hit_ids))[: settings.max_graph_chunks]
    extra = vector_store.get_by_ids(req.workspace_id, extra_ids)
    chunks = hits + extra

    # Generate: LLM answers using the real code
    answer = llm.generate(SYSTEM_PROMPT, _build_prompt(req.question, chunks))

    sources = [
        SourceRef(id=c["id"], file_path=c["file_path"], name=c["name"],
                  start_line=c["start_line"], end_line=c["end_line"])
        for c in chunks
    ]
    return QueryResponse(answer=answer, sources=sources)
