import * as vscode from "vscode";
import { CodeChunk, GraphEdge, QueryResult } from "../types";

function baseUrl(): string {
  return vscode.workspace.getConfiguration("codedna").get<string>("backendUrl")!;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`Backend error ${res.status}: ${await res.text()}`);
  return (await res.json()) as T;
}

/** Send chunks + graph edges to the backend to be embedded and stored. */
export function indexWorkspace(workspaceId: string, chunks: CodeChunk[], edges: GraphEdge[]) {
  return post<{ indexed: number }>("/index", { workspaceId, chunks, edges });
}

/** Send the user's question; get back the LLM answer + the code it used. */
export function askQuestion(workspaceId: string, question: string) {
  return post<QueryResult>("/query", { workspaceId, question });
}
