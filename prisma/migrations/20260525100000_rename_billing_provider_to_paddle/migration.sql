-- Rename provider-specific billing columns now that subscriptions are handled by Paddle.
ALTER TABLE "companies"
RENAME COLUMN "lemonSqueezyCustomerId" TO "paddleCustomerId";

ALTER TABLE "companies"
RENAME COLUMN "lemonSqueezySubscriptionId" TO "paddleSubscriptionId";

ALTER INDEX "companies_lemonSqueezySubscriptionId_key"
RENAME TO "companies_paddleSubscriptionId_key";
