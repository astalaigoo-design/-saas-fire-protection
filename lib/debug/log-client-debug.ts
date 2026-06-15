"use server";

import { agentLog } from "@/lib/debug/agent-log";

type ClientDebugPayload = {
  runId?: string;
  hypothesisId: string;
  location: string;
  message: string;
  data?: Record<string, unknown>;
};

export async function logClientDebug(payload: ClientDebugPayload): Promise<void> {
  agentLog(payload);
}
