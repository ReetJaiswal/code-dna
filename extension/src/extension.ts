import * as vscode from "vscode";
import { findSourceFiles, readFileText } from "./indexer/scanner";
import { parseFile } from "./indexer/astParser";
import { buildEdges } from "./indexer/graphBuilder";
import * as backend from "./api/backendClient";
import { showAnswer } from "./ui/answerPanel";
import { CodeChunk } from "./types";

function getWorkspaceId(): string | undefined {
  return vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
}

async function indexWorkspaceCommand() {
  const workspaceId = getWorkspaceId();
  if (!workspaceId) {
    vscode.window.showWarningMessage("CodeDNA: open a folder first.");
    return;
  }

  await vscode.window.withProgress(
    { location: vscode.ProgressLocation.Notification, title: "CodeDNA: indexing..." },
    async () => {
      try {
        const files = await findSourceFiles();                                  // step 1
        const chunks: CodeChunk[] = [];
        for (const uri of files) {
          const text = await readFileText(uri);
          chunks.push(...parseFile(vscode.workspace.asRelativePath(uri), text)); // step 2
        }
        const edges = buildEdges(chunks);                                       // step 3
        const res = await backend.indexWorkspace(workspaceId, chunks, edges);   // step 4 (backend)
        vscode.window.showInformationMessage(
          `CodeDNA: indexed ${res.indexed} code pieces from ${files.length} files.`
        );
      } catch (err) {
        vscode.window.showErrorMessage(`CodeDNA indexing failed: ${(err as Error).message}`);
      }
    }
  );
}

async function askQuestionCommand() {
  const workspaceId = getWorkspaceId();
  if (!workspaceId) {
    vscode.window.showWarningMessage("CodeDNA: open a folder first.");
    return;
  }

  const question = await vscode.window.showInputBox({
    prompt: "Ask about your code",
    placeHolder: "How does the login flow work?",
  });
  if (!question) return;

  try {
    const result = await vscode.window.withProgress(
      { location: vscode.ProgressLocation.Notification, title: "CodeDNA: thinking..." },
      () => backend.askQuestion(workspaceId, question)                          // steps 6-10
    );
    showAnswer(question, result);                                               // step 11
  } catch (err) {
    vscode.window.showErrorMessage(`CodeDNA query failed: ${(err as Error).message}`);
  }
}

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("codedna.indexWorkspace", indexWorkspaceCommand),
    vscode.commands.registerCommand("codedna.askQuestion", askQuestionCommand)
  );
}

export function deactivate() {}
