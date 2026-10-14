import * as ts from "typescript";
import { CodeChunk } from "../types";

/**
 * Step 2: turn one file into structured chunks using its AST
 * (Abstract Syntax Tree = the code's grammar tree).
 * We keep top-level functions, arrow functions, classes and class methods.
 */
export function parseFile(filePath: string, source: string): CodeChunk[] {
  const sf = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true);
  const chunks: CodeChunk[] = [];

  // Find the names of every function called inside a node.
  const collectCalls = (node: ts.Node): string[] => {
    const calls = new Set<string>();
    const walk = (n: ts.Node) => {
      if (ts.isCallExpression(n)) {
        const e = n.expression;
        if (ts.isIdentifier(e)) calls.add(e.text);                         // foo()
        else if (ts.isPropertyAccessExpression(e)) calls.add(e.name.text); // obj.foo()
      }
      ts.forEachChild(n, walk);
    };
    walk(node);
    return [...calls];
  };

  const addChunk = (node: ts.Node, name: string, kind: CodeChunk["kind"], withCalls = true) => {
    const start = sf.getLineAndCharacterOfPosition(node.getStart(sf)).line + 1;
    const end = sf.getLineAndCharacterOfPosition(node.getEnd()).line + 1;
    chunks.push({
      id: `${filePath}::${name}`,
      filePath,
      name,
      kind,
      startLine: start,
      endLine: end,
      code: node.getText(sf),
      calls: withCalls ? collectCalls(node) : [],
    });
  };

  const visit = (node: ts.Node) => {
    if (ts.isFunctionDeclaration(node) && node.name) {
      addChunk(node, node.name.text, "function");
    } else if (ts.isClassDeclaration(node) && node.name) {
      const cls = node.name.text;
      addChunk(node, cls, "class", false); // methods carry the calls
      for (const m of node.members) {
        if (ts.isMethodDeclaration(m) && ts.isIdentifier(m.name)) {
          addChunk(m, `${cls}.${m.name.text}`, "method");
        }
      }
      return;
    } else if (ts.isVariableStatement(node)) {
      for (const d of node.declarationList.declarations) {
        if (
          ts.isIdentifier(d.name) &&
          d.initializer &&
          (ts.isArrowFunction(d.initializer) || ts.isFunctionExpression(d.initializer))
        ) {
          addChunk(node, d.name.text, "function");
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sf);
  return chunks;
}
