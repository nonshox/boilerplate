import { apiClient } from "@/lib/api-client";

export type NotificationItem = {
  id: string;
  type: string;
  actorId: string;
  actorName: string;
  ref: string | null;
  createdAt: string;
  read: boolean;
  count: number;
  ids: string[];
};

export type NotificationPage = {
  items: NotificationItem[];
  nextCursor: string | null;
  unreadCount: number;
};

export async function fetchNotifications(
  cursor: string | null,
): Promise<NotificationPage> {
  const { data } = await apiClient.get<NotificationPage>("/notifications", {
    params: cursor ? { cursor } : undefined,
  });
  return data;
}

export async function markNotificationsRead(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  await apiClient.patch("/notifications", { ids });
}
