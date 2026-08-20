-- AlterTable
ALTER TABLE "Assessment" ADD COLUMN     "allowedMaterials" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "prohibitedMaterials" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "Company" ADD COLUMN     "logoUrl" TEXT;

-- CreateTable
CREATE TABLE "RoomVerification" (
    "id" TEXT NOT NULL,
    "attemptId" TEXT NOT NULL,
    "status" "VerificationStatus" NOT NULL DEFAULT 'PENDING',
    "fullRoomScanPassed" BOOLEAN,
    "deskScanPassed" BOOLEAN,
    "prohibitedItemsDetected" BOOLEAN,
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RoomVerification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "RoomVerification_attemptId_key" ON "RoomVerification"("attemptId");

-- CreateIndex
CREATE INDEX "RoomVerification_status_idx" ON "RoomVerification"("status");

-- AddForeignKey
ALTER TABLE "RoomVerification" ADD CONSTRAINT "RoomVerification_attemptId_fkey" FOREIGN KEY ("attemptId") REFERENCES "ExamAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;
