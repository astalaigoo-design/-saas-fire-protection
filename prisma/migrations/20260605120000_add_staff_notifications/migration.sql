-- CreateTable
CREATE TABLE "staff_notifications" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "href" TEXT,
    "entityType" TEXT,
    "entityId" TEXT,
    "targetUserId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff_notification_reads" (
    "id" TEXT NOT NULL,
    "notificationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "readAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "staff_notification_reads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "staff_notifications_companyId_createdAt_idx" ON "staff_notifications"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "staff_notifications_companyId_targetUserId_createdAt_idx" ON "staff_notifications"("companyId", "targetUserId", "createdAt");

-- CreateIndex
CREATE INDEX "staff_notification_reads_userId_readAt_idx" ON "staff_notification_reads"("userId", "readAt");

-- CreateIndex
CREATE UNIQUE INDEX "staff_notification_reads_notificationId_userId_key" ON "staff_notification_reads"("notificationId", "userId");

-- AddForeignKey
ALTER TABLE "staff_notifications" ADD CONSTRAINT "staff_notifications_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_notification_reads" ADD CONSTRAINT "staff_notification_reads_notificationId_fkey" FOREIGN KEY ("notificationId") REFERENCES "staff_notifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_notification_reads" ADD CONSTRAINT "staff_notification_reads_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
