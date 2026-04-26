import { ID, Models, Query } from "appwrite";
import { APPWRITE_PREMIUM_TEAM_ID } from "@/src/lib/auth/admin";
import { getAppwriteDatabases, getAppwriteTeams } from "./client";

type FinanceSnapshotDocumentData = {
  period: string;
  basePlanUsd: number;
  variableCostUsd: number;
  creditsUsd: number;
  totalCostUsd: number;
  fxRateCopUsd: number;
  notes?: string;
  createdBy?: string;
};

type FinanceSnapshotDocument = Models.Document & FinanceSnapshotDocumentData;

export type FinanceSnapshot = {
  id: string;
  period: string;
  basePlanUsd: number;
  variableCostUsd: number;
  creditsUsd: number;
  totalCostUsd: number;
  fxRateCopUsd: number;
  notes: string;
  createdBy: string;
  createdAt: string;
};

export type FinanceSnapshotInput = {
  period: string;
  basePlanUsd: number;
  variableCostUsd: number;
  creditsUsd: number;
  fxRateCopUsd: number;
  notes?: string;
  createdBy?: string;
};

export const PRO_PRICE_USD = 9.99;

function getFinanceCollectionConfig() {
  const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID;
  const collectionId = process.env.NEXT_PUBLIC_APPWRITE_FINANCE_COLLECTION_ID;

  if (!databaseId || !collectionId) {
    return null;
  }

  return { databaseId, collectionId };
}

function normalizeMoneyValue(value: number) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value * 100) / 100;
}

function mapSnapshot(document: FinanceSnapshotDocument) {
  return {
    id: document.$id,
    period: document.period ?? "",
    basePlanUsd: normalizeMoneyValue(document.basePlanUsd ?? 0),
    variableCostUsd: normalizeMoneyValue(document.variableCostUsd ?? 0),
    creditsUsd: normalizeMoneyValue(document.creditsUsd ?? 0),
    totalCostUsd: normalizeMoneyValue(document.totalCostUsd ?? 0),
    fxRateCopUsd: normalizeMoneyValue(document.fxRateCopUsd ?? 0),
    notes: document.notes ?? "",
    createdBy: document.createdBy ?? "",
    createdAt: document.$createdAt,
  } satisfies FinanceSnapshot;
}

export async function listFinanceSnapshots(limit = 12) {
  const config = getFinanceCollectionConfig();
  if (!config) {
    return { success: false as const, code: "MISSING_CONFIG" as const };
  }

  try {
    const databases = getAppwriteDatabases();
    const response = await databases.listDocuments({
      databaseId: config.databaseId,
      collectionId: config.collectionId,
      queries: [Query.orderDesc("period"), Query.limit(limit)],
    });

    const snapshots = response.documents.map((document) =>
      mapSnapshot(document as unknown as FinanceSnapshotDocument),
    );

    return { success: true as const, snapshots };
  } catch {
    return { success: false as const, code: "REQUEST_ERROR" as const };
  }
}

export async function createFinanceSnapshot(input: FinanceSnapshotInput) {
  const config = getFinanceCollectionConfig();
  if (!config) {
    return { success: false as const, code: "MISSING_CONFIG" as const };
  }

  const basePlanUsd = normalizeMoneyValue(input.basePlanUsd);
  const variableCostUsd = normalizeMoneyValue(input.variableCostUsd);
  const creditsUsd = normalizeMoneyValue(input.creditsUsd);
  const totalCostUsd = normalizeMoneyValue(
    Math.max(0, basePlanUsd + variableCostUsd - creditsUsd),
  );
  const fxRateCopUsd = normalizeMoneyValue(input.fxRateCopUsd);

  try {
    const databases = getAppwriteDatabases();
    const document = await databases.createDocument({
      databaseId: config.databaseId,
      collectionId: config.collectionId,
      documentId: ID.unique(),
      data: {
        period: input.period,
        basePlanUsd,
        variableCostUsd,
        creditsUsd,
        totalCostUsd,
        fxRateCopUsd,
        notes: input.notes?.trim() ?? "",
        createdBy: input.createdBy?.trim() ?? "",
      } as FinanceSnapshotDocumentData,
    });

    return {
      success: true as const,
      snapshot: mapSnapshot(document as unknown as FinanceSnapshotDocument),
    };
  } catch {
    return { success: false as const, code: "REQUEST_ERROR" as const };
  }
}

export async function getPremiumUsersCount() {
  try {
    const teams = getAppwriteTeams();
    const premiumTeam = await teams.get({ teamId: APPWRITE_PREMIUM_TEAM_ID });
    return premiumTeam.total;
  } catch {
    return null;
  }
}
