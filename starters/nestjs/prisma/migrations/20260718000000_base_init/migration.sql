-- Baseline `base` : journal d'audit générique uniquement (CORE_SPEC §19).
-- Les tables des capabilities composées (Auth, ...) sont créées par les
-- migrations déclarées par leur overlay, ordonnées après cette migration.

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
