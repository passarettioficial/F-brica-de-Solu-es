import { defineConfig } from "vitest/config";
import path from "path";

// Config de testes separada do vite.config.ts do app: este último exige PORT/BASE_PATH
// (variáveis de ambiente do dev server) e lança se ausentes — vitest não deve depender disso.
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
