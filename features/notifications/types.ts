import type { Models } from "node-appwrite";

export type NotificationRow = Models.Row & {
  recipient: string;
  actor: string;
  /**
   * Past-tense verb phrase describing what the actor did, e.g.
   * "followed you" or "liked your post". Apps choose their own verbs;
   * the base renders `${actorName} ${type}`.
   */
  type: string;
  /** Optional id of the thing the notification is about. */
  ref?: string;
  read: boolean;
};

export type NotificationItem = {
  id: string;
  type: string;
  actorId: string;
  actorName: string;
  ref: string | null;
  createdAt: string;
  read: boolean;
  count: number;
  /** All row ids in this collapsed group (for mark-as-read). */
  ids: string[];
};
