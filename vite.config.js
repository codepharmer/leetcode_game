import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    setupFiles: "./src/test/setup.js",
    css: true,
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["src/**/*.{js,jsx}"],
      exclude: [
        "src/main.jsx",
        "src/styles.js",
        "src/**/__tests__/**",
        "src/**/*.test.{js,jsx}",
      ],
      thresholds: {
        lines: 90,
        functions: 85,
        statements: 85,
        branches: 70,
      },
    },
  },
});
