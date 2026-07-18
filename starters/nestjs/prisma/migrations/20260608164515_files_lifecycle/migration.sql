-- AlterTable
ALTER TABLE "stored_files" ADD COLUMN     "deletionRequestedAt" TIMESTAMP(3),
ADD COLUMN     "quarantineReason" TEXT,
ADD COLUMN     "quarantinedAt" TIMESTAMP(3),
ADD COLUMN     "storageDeletedAt" TIMESTAMP(3);
