import { defineConfig } from "vite";
import { builtinModules } from "node:module";

// Vite bundles our TypeScript into one file: dist/extension.js
// "vscode" and Node built-ins are provided by VS Code at runtime, so we don't bundle them.
export default defineConfig({
  build: {
    lib: {
      entry: "src/extension.ts",
      formats: ["cjs"],
      fileName: () => "extension.js",
    },
    outDir: "dist",
    target: "node18",
    sourcemap: true,
    minify: false,
    rollupOptions: {
      external: [
        "vscode",
        "typescript",
        ...builtinModules,
        ...builtinModules.map((m) => `node:${m}`),
      ],
    },
  },
});
