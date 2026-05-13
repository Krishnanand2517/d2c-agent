/*
  Warnings:

  - A unique constraint covering the columns `[source,sourceRecordId,merchantId]` on the table `UniversalRecord` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE INDEX "UniversalRecord_merchantId_idx" ON "UniversalRecord"("merchantId");

-- CreateIndex
CREATE INDEX "UniversalRecord_merchantId_source_idx" ON "UniversalRecord"("merchantId", "source");

-- CreateIndex
CREATE INDEX "UniversalRecord_merchantId_entityType_idx" ON "UniversalRecord"("merchantId", "entityType");

-- CreateIndex
CREATE INDEX "UniversalRecord_merchantId_timestamp_idx" ON "UniversalRecord"("merchantId", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "UniversalRecord_source_sourceRecordId_merchantId_key" ON "UniversalRecord"("source", "sourceRecordId", "merchantId");
