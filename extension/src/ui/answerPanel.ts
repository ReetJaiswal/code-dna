import * as vscode from "vscode";
import { QueryResult } from "../types";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** Step 11: show the answer in a VS Code webview panel (a mini web page inside VS Code). */
export function showAnswer(question: string, result: QueryResult) {
  const panel = vscode.window.createWebviewPanel(
    "codednaAnswer",
    "CodeDNA Answer",
    vscode.ViewColumn.Beside,
    {}
  );

  const sources = result.sources
    .map((s) => `<li><code>${esc(s.filePath)}</code> : ${esc(s.name)} (lines ${s.startLine}-${s.endLine})</li>`)
    .join("");

  panel.webview.html = `<!DOCTYPE html>
<html><body style="font-family: var(--vscode-font-family); padding: 12px;">
  <h3>Question</h3><p>${esc(question)}</p>
  <h3>Answer</h3><div style="white-space: pre-wrap;">${esc(result.answer)}</div>
  <h3>Code used</h3><ul>${sources}</ul>
</body></html>`;
}
