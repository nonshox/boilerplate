import "server-only";
import { AppwriteException, Query } from "node-appwrite";
import { getDatabaseId, getTables } from "@/lib/appwrite/tables";
import type { NotificationRow } from "./types";

export async function getNotificationRows(
  userId: string,
  cursor: string | null,
): Promise<NotificationRow[]> {
  const result = await getTables().listRows<NotificationRow>({
    databaseId: getDatabaseId(),
    tableId: "notifications",
    queries: [
      Query.equal("recipient", userId),
      Query.orderDesc("$createdAt"),
      Query.limit(50),
      ...(cursor ? [Query.cursorAfter(cursor)] : []),
    ],
    total: false,
  });
  return result.rows;
}

export async function markNotificationsRead(
  userId: string,
  notificationIds: string[],
): Promise<void> {
  for (const notificationId of notificationIds) {
    try {
      const row = await getTables().getRow<NotificationRow>({
        databaseId: getDatabaseId(),
        tableId: "notifications",
        rowId: notificationId,
      });
      if (row.recipient !== userId || row.read) {
        continue;
      }
      await getTables().updateRow({
        databaseId: getDatabaseId(),
        tableId: "notifications",
        rowId: row.$id,
        data: { read: true },
      });
    } catch (error) {
      if (error instanceof AppwriteException && error.code === 404) {
        continue;
      }
      throw error;
    }
  }
}
