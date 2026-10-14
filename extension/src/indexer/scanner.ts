import * as vscode from "vscode";

const INCLUDE = "**/*.{ts,tsx,js,jsx}";
const EXCLUDE = "**/{node_modules,.git,dist,out,build,.venv,__pycache__}/**";

/** Step 1: ask VS Code for every source file in the open workspace. */
export async function findSourceFiles(): Promise<vscode.Uri[]> {
  return vscode.workspace.findFiles(INCLUDE, EXCLUDE);
}

export async function readFileText(uri: vscode.Uri): Promise<string> {
  const bytes = await vscode.workspace.fs.readFile(uri);
  return new TextDecoder("utf-8").decode(bytes);
}
