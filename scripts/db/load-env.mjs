import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

/** Load .env locally; no-op when dotenv is absent (Vercel injects env at build time). */
export function loadEnv() {
  try {
    require("dotenv/config");
  } catch {
    // dotenv is optional when process.env is already populated (CI / Vercel).
  }
}
