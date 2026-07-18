-- CreateEnum
CREATE TYPE "SessionRevocationReason" AS ENUM ('ROTATED', 'LOGOUT', 'REUSE_DETECTED', 'SECURITY_ACTION', 'USER_DISABLED');

-- AlterTable
ALTER TABLE "refresh_sessions" ADD COLUMN     "replacedBySessionId" UUID,
ADD COLUMN     "revocationReason" "SessionRevocationReason";

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" UUID NOT NULL,
    "eventType" TEXT NOT NULL,
    "actorId" UUID,
    "subjectId" UUID,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_eventType_idx" ON "audit_logs"("eventType");

-- CreateIndex
CREATE INDEX "audit_logs_actorId_idx" ON "audit_logs"("actorId");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");
