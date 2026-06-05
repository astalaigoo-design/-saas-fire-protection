export function isCronSecretConfigured(): boolean {
  return Boolean(process.env.CRON_SECRET?.trim());
}

export type CronSecretStatus = {
  configured: boolean;
};

export function getCronSecretStatus(): CronSecretStatus {
  return { configured: isCronSecretConfigured() };
}
