import { prisma } from "./client.ts";
import type { NormalizedRecord } from "../connectors/base.ts";
import { Prisma } from "../generated/prisma/client.ts";

export async function upsertRecords(
  records: NormalizedRecord[],
): Promise<number> {
  let count = 0;

  for (const r of records) {
    await prisma.universalRecord.upsert({
      where: {
        source_sourceRecordId_merchantId: {
          source: r.source,
          sourceRecordId: r.sourceRecordId,
          merchantId: r.merchantId,
        },
      },
      update: {
        title: r.title,
        status: r.status,
        amount: r.amount,
        currency: r.currency,
        timestamp: r.timestamp,
        metadata: r.metadata as Prisma.InputJsonValue,
        rawPayload: r.rawPayload as Prisma.InputJsonValue,
      },
      create: {
        merchantId: r.merchantId,
        entityType: r.entityType,
        source: r.source,
        sourceRecordId: r.sourceRecordId,
        title: r.title,
        status: r.status,
        amount: r.amount,
        currency: r.currency ?? "INR",
        timestamp: r.timestamp,
        metadata: r.metadata as Prisma.InputJsonValue,
        rawPayload: r.rawPayload as Prisma.InputJsonValue,
      },
    });

    count++;
  }

  return count;
}

export interface QueryFilter {
  merchantId: string;
  source?: string;
  entityType?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  limit?: number;
}

export async function queryRecords(filter: QueryFilter) {
  return prisma.universalRecord.findMany({
    where: {
      merchantId: filter.merchantId,
      ...(filter.source && { source: filter.source }),
      ...(filter.entityType && { entityType: filter.entityType }),
      ...(filter.status && { status: filter.status }),
      ...(filter.dateFrom || filter.dateTo
        ? {
            timestamp: {
              ...(filter.dateFrom && { gte: new Date(filter.dateFrom) }),
              ...(filter.dateTo && { lte: new Date(filter.dateTo) }),
            },
          }
        : {}),
    },
    orderBy: { timestamp: "desc" },
    take: filter.limit ?? 100,
  });
}

export async function getStats(merchantId: string) {
  const totals = await prisma.universalRecord.groupBy({
    by: ["source", "entityType"],
    where: { merchantId },
    _count: { id: true },
    _sum: { amount: true },
  });

  const lastIngest = await prisma.ingestRun.findMany({
    where: { merchantId },
    orderBy: { startedAt: "desc" },
    distinct: ["source"],
    select: { source: true, startedAt: true, rowsUpserted: true },
  });

  return { totals, lastIngest };
}

export async function saveAgentRun(data: {
  merchantId: string;
  agentName: string;
  status: string;
  rowsExamined: number;
  proposedActions?: unknown;
  reasoning?: string;
  steps?: unknown;
  error?: string;
}) {
  return prisma.agentRun.create({
    data: {
      merchantId: data.merchantId,
      agentName: data.agentName,
      status: data.status,
      rowsExamined: data.rowsExamined,
      completedAt: new Date(),
      reasoning: data.reasoning,
      error: data.error,
      proposedActions:
        data.proposedActions != null
          ? (data.proposedActions as Prisma.InputJsonValue)
          : Prisma.JsonNull,
      steps:
        data.steps != null
          ? (data.steps as Prisma.InputJsonValue)
          : Prisma.JsonNull,
    },
  });
}

export async function getAgentRuns(merchantId: string, limit = 10) {
  return prisma.agentRun.findMany({
    where: { merchantId },
    orderBy: { triggeredAt: "desc" },
    take: limit,
  });
}
