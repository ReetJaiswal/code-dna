import { CodeChunk, GraphEdge } from "../types";

/**
 * Step 3: build the call graph. If function A's body calls "B",
 * and a chunk named B exists, draw an arrow A -> B.
 * (Matches by name only; see README "Known limits".)
 */
export function buildEdges(chunks: CodeChunk[]): GraphEdge[] {
  const byShortName = new Map<string, string[]>();
  for (const c of chunks) {
    if (c.kind === "class") continue;
    const short = c.name.split(".").pop()!;
    const list = byShortName.get(short) ?? [];
    list.push(c.id);
    byShortName.set(short, list);
  }

  const edges: GraphEdge[] = [];
  for (const c of chunks) {
    for (const callee of c.calls) {
      for (const targetId of byShortName.get(callee) ?? []) {
        if (targetId !== c.id) edges.push({ source: c.id, target: targetId, type: "calls" });
      }
    }
  }
  return edges;
}
