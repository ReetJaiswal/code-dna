# CodeDNA

AI-powered code intelligence extension for VS Code.
Ask questions about your codebase in plain English and get answers grounded in your real code (RAG).

## Structure

```
code-dna/
├── extension/          # VS Code extension (TypeScript + Node.js + Vite)
│   └── src/
│       ├── extension.ts            # entry point, registers commands
│       ├── types.ts                # shared data shapes
│       ├── indexer/
│       │   ├── scanner.ts          # step 1: find & read files (VS Code API)
│       │   ├── astParser.ts        # step 2: AST -> function/class chunks
│       │   └── graphBuilder.ts     # step 3: who-calls-whom edges
│       ├── api/backendClient.ts    # talks to FastAPI
│       └── ui/answerPanel.ts       # step 11: shows the answer in VS Code
└── backend/            # FastAPI server (Python)
    └── app/
        ├── main.py                 # /health, /index, /query
        ├── config.py               # settings from .env
        ├── models.py               # request/response shapes
        └── services/
            ├── embedder.py         # text -> embedding (number list)
            ├── vector_store.py     # ChromaDB: store + similarity search
            ├── graph_store.py      # saves/loads call graph, finds neighbours
            ├── rag.py              # retrieve -> add graph neighbours -> prompt
            └── llm.py              # calls the LLM
```

## Flow -> file map

| Step | What happens | Where |
|------|--------------|-------|
| 1 | Scan workspace files | `extension/src/indexer/scanner.ts` |
| 2 | AST parsing into chunks | `extension/src/indexer/astParser.ts` |
| 3 | Build call/dependency graph | `extension/src/indexer/graphBuilder.ts` |
| 4 | Embeddings + vector DB | `backend/app/services/embedder.py`, `vector_store.py` |
| 6 | User asks a question | `extension/src/extension.ts` (`askQuestion`) |
| 7 | Embed question, similarity search | `vector_store.search` |
| 8 | Pull in graph neighbours | `graph_store.neighbors` |
| 9 | Package context, send to LLM (RAG) | `backend/app/services/rag.py` |
| 10 | LLM writes the explanation | `backend/app/services/llm.py` |
| 11 | Show answer in VS Code | `extension/src/ui/answerPanel.ts` |

## Run it

**Backend**
```bash
cd backend
python -m venv .venv && source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env        # then put your API key inside
uvicorn app.main:app --reload --port 8000
```

**Extension**
```bash
cd extension
npm install
npm run build
```
Open the `extension` folder in VS Code and press **F5**. In the new window open any
TypeScript/JavaScript project, then use the Command Palette (Ctrl+Shift+P):

1. `CodeDNA: Index Workspace`
2. `CodeDNA: Ask About Your Code`

## Known limits (good "future work" for interviews)

- AST parsing covers TS/JS only (uses the TypeScript compiler API). Add Tree-sitter for Python, Java, etc.
- Call graph matches calls by function *name*, so two functions with the same name can be mixed up. A real symbol resolver would fix it.
- Re-indexing rebuilds everything. Incremental indexing (only changed files) is a next step.

## License

MIT
