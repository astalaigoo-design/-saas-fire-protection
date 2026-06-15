import { appendFileSync } from "node:fs";
import { join } from "node:path";

const LOG_PATH = join(process.cwd(), "debug-3283a7.log");
const ENDPOINT = "http://127.0.0.1:7703/ingest/5689de24-7191-4ca4-92d5-2784a0c42a09";

type AgentLogPayload = {
  runId?: string;
  hypothesisId: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
};

export function agentLog(payload: AgentLogPayload): void {
  const line = JSON.stringify({
    sessionId: "3283a7",
    timestamp: Date.now(),
    runId: payload.runId ?? "verify-fix",
    ...payload,
  });

  try {
    appendFileSync(LOG_PATH, `${line}\n`);
  } catch {
    /* ignore */
  }

  fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Debug-Session-Id": "3283a7" },
    body: line,
  }).catch(() => {});
}
