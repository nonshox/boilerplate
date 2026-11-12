import "server-only";
import { ID } from "node-appwrite";
import { after } from "next/server";
import { logFailure } from "@/lib/http";
import { getDatabaseId, getTables } from "@/lib/appwrite/tables";
import { getUsersByIds } from "@/features/users/service";
import { sendTelegramNotification } from "@/features/telegram/service";
import { getNotificationRows, markNotificationsRead } from "./data";
import type { NotificationItem, NotificationRow } from "./types";

const tableId = "notifications";

/**
 * Creates a notification for `recipient` and — when they connected Telegram —
 * forwards a one-line summary there. Self-notifications are skipped.
 *
 * `type` is a past-tense verb phrase written with the recipient as implied
 * subject ("followed you", "liked your post") so clients can render it as
 * `${actorName} ${type}` without special-casing.
 */
export async function notify(
  recipient: string,
  actor: string,
  type: string,
  ref?: string,
): Promise<void> {
  if (recipient === actor) {
    return;
  }

  await getTables().createRow<NotificationRow>({
    databaseId: getDatabaseId(),
    tableId,
    rowId: ID.unique(),
    permissions: [],
    data: {
      recipient,
      actor,
      type,
      ...(ref ? { ref } : {}),
      read: false,
    },
  });

  after(async () => {
    try {
      await sendTelegramNotification(
        recipient,
        `You have a new notification: ${type}`,
      );
    } catch (error) {
      logFailure("Telegram delivery", error);
    }
  });
}

export async function listNotifications(
  userId: string,
  cursor: string | null,
): Promise<{
  items: NotificationItem[];
  nextCursor: string | null;
  unreadCount: number;
}> {
  const rows = await getNotificationRows(userId, cursor);
  const actors = await getUsersByIds([
    ...new Set(rows.map((row) => row.actor)),
  ]);

  const items = rows.flatMap((row) => {
    const actor = actors.get(row.actor);
    if (!actor) {
      return [];
    }
    return [
      {
        id: row.$id,
        type: row.type,
        actorId: row.actor,
        actorName: actor.name || "Someone",
        ref: row.ref ?? null,
        createdAt: row.$createdAt,
        read: row.read,
        count: 1,
        ids: [row.$id],
      },
    ];
  });

  const grouped = collapseNotificationGroups(items);
  const unreadCount = grouped
    .filter((item) => !item.read)
    .reduce((sum, item) => sum + item.count, 0);

  return {
    items: grouped,
    nextCursor: rows.length === 50 ? rows[rows.length - 1].$id : null,
    unreadCount,
  };
}

export async function readNotifications(
  userId: string,
  notificationIds: string[],
): Promise<void> {
  await markNotificationsRead(userId, notificationIds);
}

const GROUP_WINDOW_MS = 24 * 60 * 60 * 1000;

/**
 * Collapses consecutive same-actor, same-type rows within a 24h window into
 * a single grouped item. The latest row is the representative time; summed
 * ids let the client mark the whole group read.
 */
function collapseNotificationGroups(
  items: NotificationItem[],
): NotificationItem[] {
  const output: NotificationItem[] = [];

  for (const item of items) {
    const last = output[output.length - 1];
    const withinWindow =
      last &&
      last.actorId === item.actorId &&
      last.type === item.type &&
      Math.abs(
        new Date(item.createdAt).getTime() - new Date(last.createdAt).getTime(),
      ) <= GROUP_WINDOW_MS;

    if (withinWindow) {
      output[output.length - 1] = {
        ...last,
        count: last.count + item.count,
        ids: [...last.ids, ...item.ids],
        read: last.read && item.read,
        ref: last.ref ?? item.ref,
      };
      continue;
    }

    output.push(item);
  }

  return output;
}
