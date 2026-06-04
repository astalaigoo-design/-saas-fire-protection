import { prisma } from "@/lib/prisma";

export type IntegrationsSettingsData = {
  apiKeys: {
    id: string;
    label: string;
    keyPrefix: string;
    active: boolean;
    lastUsedAt: string | null;
    createdAt: string;
  }[];
  webhooks: {
    id: string;
    label: string;
    url: string;
    events: string[];
    active: boolean;
    createdAt: string;
  }[];
};

export async function getIntegrationsSettingsData(
  companyId: string,
): Promise<IntegrationsSettingsData> {
  const [apiKeys, webhooks] = await Promise.all([
    prisma.companyApiKey.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        label: true,
        keyPrefix: true,
        active: true,
        lastUsedAt: true,
        createdAt: true,
      },
    }),
    prisma.companyWebhookEndpoint.findMany({
      where: { companyId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        label: true,
        url: true,
        events: true,
        active: true,
        createdAt: true,
      },
    }),
  ]);

  return {
    apiKeys: apiKeys.map((row) => ({
      ...row,
      lastUsedAt: row.lastUsedAt?.toISOString() ?? null,
      createdAt: row.createdAt.toISOString(),
    })),
    webhooks: webhooks.map((row) => ({
      ...row,
      events: row.events,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}
