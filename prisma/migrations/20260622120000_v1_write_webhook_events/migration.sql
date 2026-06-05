-- Outbound webhooks for v1 write API (customer + inspection scheduled).
ALTER TYPE "IntegrationWebhookEvent" ADD VALUE IF NOT EXISTS 'customer_created';
ALTER TYPE "IntegrationWebhookEvent" ADD VALUE IF NOT EXISTS 'inspection_scheduled';
