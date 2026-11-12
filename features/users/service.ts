import "server-only";
import { AppwriteException, Query, type Models } from "node-appwrite";
import { getDatabaseId, getTables, isNotFound } from "@/lib/appwrite/tables";

const tableId = "users";

export type UserRow = Models.Row & {
  email: string;
  name: string;
};

export type UserPreview = Models.Row & {
  name: string;
};

export async function getUserRow(userId: string): Promise<UserRow | null> {
  try {
    return await getTables().getRow<UserRow>({
      databaseId: getDatabaseId(),
      tableId,
      rowId: userId,
    });
  } catch (error) {
    if (isNotFound(error)) {
      return null;
    }
    throw error;
  }
}

/**
 * Guarantees a users row exists for the account. Safe to call on every
 * sign-in; email drift (changed in Appwrite, stale in the row) is repaired.
 */
export async function ensureUserForAccount(
  userId: string,
  email: string,
): Promise<UserRow> {
  const existing = await getUserRow(userId);

  if (existing) {
    if (existing.email !== email) {
      return getTables().updateRow<UserRow>({
        databaseId: getDatabaseId(),
        tableId,
        rowId: userId,
        data: { email },
      });
    }
    return existing;
  }

  try {
    return await getTables().createRow<UserRow>({
      databaseId: getDatabaseId(),
      tableId,
      rowId: userId,
      permissions: [],
      data: { email, name: "" },
    });
  } catch (error) {
    if (error instanceof AppwriteException && error.code === 409) {
      const createdByAnotherRequest = await getUserRow(userId);
      if (createdByAnotherRequest) {
        return createdByAnotherRequest;
      }
    }
    throw error;
  }
}

export async function updateUserName(
  userId: string,
  name: string,
): Promise<UserRow> {
  const existing = await getUserRow(userId);
  if (!existing) {
    throw new Error("Users row is missing for this account.");
  }

  return getTables().updateRow<UserRow>({
    databaseId: getDatabaseId(),
    tableId,
    rowId: userId,
    data: { name },
  });
}

/** Lightweight lookup used by other features (e.g. notification actors). */
export async function getUsersByIds(
  ids: string[],
): Promise<Map<string, UserPreview>> {
  if (ids.length === 0) {
    return new Map();
  }
  const result = await getTables().listRows<UserPreview>({
    databaseId: getDatabaseId(),
    tableId,
    queries: [
      Query.equal("$id", ids),
      Query.limit(100),
      Query.select(["$id", "name"]),
    ],
    total: false,
  });
  return new Map(result.rows.map((row) => [row.$id, row]));
}
