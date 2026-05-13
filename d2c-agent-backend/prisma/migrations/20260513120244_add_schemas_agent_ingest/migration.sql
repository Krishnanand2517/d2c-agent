-- CreateTable
CREATE TABLE "AgentRun" (
    "id" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "triggeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'running',
    "rowsExamined" INTEGER NOT NULL DEFAULT 0,
    "proposedActions" JSONB,
    "reasoning" TEXT,
    "steps" JSONB,
    "error" TEXT,

    CONSTRAINT "AgentRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestRun" (
    "id" SERIAL NOT NULL,
    "merchantId" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "rowsUpserted" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,

    CONSTRAINT "IngestRun_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AgentRun_merchantId_idx" ON "AgentRun"("merchantId");
