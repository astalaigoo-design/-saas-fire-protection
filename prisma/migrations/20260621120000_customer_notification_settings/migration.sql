-- Optional customer notification toggles (email + SMS per event).
ALTER TABLE "companies" ADD COLUMN "notifyCustomerReportReadyEmail" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "companies" ADD COLUMN "notifyCustomerReportReadySms" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "companies" ADD COLUMN "notifyCustomerQuoteSentEmail" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "companies" ADD COLUMN "notifyCustomerQuoteSentSms" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "companies" ADD COLUMN "notifyCustomerVisitScheduledEmail" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "companies" ADD COLUMN "notifyCustomerVisitScheduledSms" BOOLEAN NOT NULL DEFAULT false;
