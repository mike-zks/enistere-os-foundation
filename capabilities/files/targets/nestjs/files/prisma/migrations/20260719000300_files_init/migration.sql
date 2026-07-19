-- Files capability (ADR-007): metadata and lifecycle only. Object content stays in S3/MinIO.
CREATE TYPE "FileStatus" AS ENUM ('PENDING', 'UPLOADED', 'VALIDATED', 'REJECTED', 'QUARANTINED', 'DELETED');
CREATE TYPE "FileVisibility" AS ENUM ('PRIVATE', 'PUBLIC', 'SIGNED', 'INTERNAL');
CREATE TYPE "FileCategory" AS ENUM ('IMAGE', 'DOCUMENT', 'AVATAR', 'MEDIA', 'VIDEO', 'AUDIO', 'IDENTITY_DOCUMENT', 'ATTACHMENT', 'OTHER');

CREATE TABLE "stored_files" (
    "id" UUID NOT NULL,
    "ownerId" UUID,
    "subjectId" TEXT,
    "originalName" TEXT NOT NULL,
    "storageKey" TEXT NOT NULL,
    "bucket" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "extension" TEXT NOT NULL,
    "size" BIGINT NOT NULL,
    "checksum" TEXT,
    "visibility" "FileVisibility" NOT NULL DEFAULT 'PRIVATE',
    "status" "FileStatus" NOT NULL DEFAULT 'PENDING',
    "category" "FileCategory" NOT NULL DEFAULT 'OTHER',
    "metadata" JSONB,
    "uploadedAt" TIMESTAMP(3),
    "validatedAt" TIMESTAMP(3),
    "rejectedAt" TIMESTAMP(3),
    "quarantinedAt" TIMESTAMP(3),
    "quarantineReason" TEXT,
    "deletionRequestedAt" TIMESTAMP(3),
    "storageDeletedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    CONSTRAINT "stored_files_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "stored_files_storageKey_key" ON "stored_files"("storageKey");
CREATE INDEX "stored_files_ownerId_idx" ON "stored_files"("ownerId");
CREATE INDEX "stored_files_status_idx" ON "stored_files"("status");
CREATE INDEX "stored_files_category_idx" ON "stored_files"("category");
CREATE INDEX "stored_files_createdAt_idx" ON "stored_files"("createdAt");
CREATE INDEX "stored_files_deletedAt_idx" ON "stored_files"("deletedAt");
ALTER TABLE "stored_files" ADD CONSTRAINT "stored_files_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
