-- CreateTable
CREATE TABLE "UniversalRecord" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "sourceRecordId" TEXT NOT NULL,
    "title" TEXT,
    "status" TEXT,
    "amount" DOUBLE PRECISION,
    "currency" TEXT,
    "timestamp" TIMESTAMP(3),
    "metadata" JSONB NOT NULL,
    "rawPayload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UniversalRecord_pkey" PRIMARY KEY ("id")
);
