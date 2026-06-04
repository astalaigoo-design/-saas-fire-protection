import { NextResponse } from "next/server";
import { extractBearerOrApiKey, hashApiKey } from "@/lib/integrations/api-key";
import { API_KEY_PREFIX } from "@/lib/integrations/constants";
import { prisma } from "@/lib/prisma";

export type ApiAuthContext = {
  companyId: string;
  apiKeyId: string;
};

export async function authenticateApiRequest(
  request: Request,
): Promise<ApiAuthContext | NextResponse> {
  const raw = extractBearerOrApiKey(request);
  if (!raw?.startsWith(API_KEY_PREFIX)) {
    return NextResponse.json({ error: "Missing or invalid API key." }, { status: 401 });
  }

  const keyHash = hashApiKey(raw);
  const row = await prisma.companyApiKey.findFirst({
    where: { keyHash, active: true },
    select: { id: true, companyId: true },
  });
  if (!row) {
    return NextResponse.json({ error: "Invalid API key." }, { status: 401 });
  }

  void prisma.companyApiKey
    .update({
      where: { id: row.id },
      data: { lastUsedAt: new Date() },
    })
    .catch(() => {});

  return { companyId: row.companyId, apiKeyId: row.id };
}

export function isApiAuthContext(value: ApiAuthContext | NextResponse): value is ApiAuthContext {
  return "companyId" in value && typeof value.companyId === "string";
}
