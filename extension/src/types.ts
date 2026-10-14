/** One piece of code (a function, method or class) cut out by the AST parser. */
export interface CodeChunk {
  id: string;            // unique, e.g. "src/auth/login.ts::AuthService.login"
  filePath: string;      // path relative to the workspace root
  name: string;          // e.g. "login" or "AuthService.login"
  kind: "function" | "method" | "class";
  startLine: number;
  endLine: number;
  code: string;          // the actual source text
  calls: string[];       // names of functions this chunk calls
}

/** One arrow in the call graph: source -> target. */
export interface GraphEdge {
  source: string;        // chunk id of the caller
  target: string;        // chunk id of the callee
  type: "calls";
}

export interface SourceRef {
  id: string;
  filePath: string;
  name: string;
  startLine: number;
  endLine: number;
}

export interface QueryResult {
  answer: string;
  sources: SourceRef[];
}
