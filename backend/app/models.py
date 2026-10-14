from pydantic import BaseModel, ConfigDict
from pydantic.alias_generators import to_camel


class CamelModel(BaseModel):
    """The extension sends camelCase JSON (filePath); Python uses snake_case (file_path)."""
    model_config = ConfigDict(alias_generator=to_camel, populate_by_name=True)


class Chunk(CamelModel):
    id: str
    file_path: str
    name: str
    kind: str
    start_line: int
    end_line: int
    code: str
    calls: list[str] = []


class Edge(CamelModel):
    source: str
    target: str
    type: str = "calls"


class IndexRequest(CamelModel):
    workspace_id: str
    chunks: list[Chunk]
    edges: list[Edge]


class IndexResponse(CamelModel):
    indexed: int


class QueryRequest(CamelModel):
    workspace_id: str
    question: str


class SourceRef(CamelModel):
    id: str
    file_path: str
    name: str
    start_line: int
    end_line: int


class QueryResponse(CamelModel):
    answer: str
    sources: list[SourceRef]
