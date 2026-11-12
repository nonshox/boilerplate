import { NextResponse } from "next/server";
import {
  getAuthAccount,
  isSameOrigin,
  jsonError,
  logFailure,
} from "@/lib/http";
import {
  listNotifications,
  readNotifications,
} from "@/features/notifications/service";
import {
  notificationCursorSchema,
  readNotificationsSchema,
} from "@/features/notifications/schemas";

export async function GET(request: Request) {
  const auth = await getAuthAccount("Notification list");
  if ("response" in auth) {
    return auth.response;
  }
  if (!auth.account) {
    return jsonError(401, "UNAUTHENTICATED", "Sign in to view notifications.");
  }

  const rawCursor = new URL(request.url).searchParams.get("cursor");
  const parsedCursor = rawCursor
    ? notificationCursorSchema.safeParse(rawCursor)
    : { success: true as const, data: null };
  if (!parsedCursor.success) {
    return jsonError(400, "INVALID_CURSOR", "Notification cursor is invalid.");
  }

  try {
    const result = await listNotifications(
      auth.account.$id,
      parsedCursor.data,
    );
    return NextResponse.json(result, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    logFailure("Notification list", error);
    return jsonError(
      502,
      "NOTIFICATIONS_UNAVAILABLE",
      "Notifications are unavailable.",
    );
  }
}

export async function PATCH(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError(403, "ORIGIN_REJECTED", "Request origin was rejected.");
  }

  const auth = await getAuthAccount("Notification update");
  if ("response" in auth) {
    return auth.response;
  }
  if (!auth.account) {
    return jsonError(401, "UNAUTHENTICATED", "Sign in to update notifications.");
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError(400, "INVALID_JSON", "Request body must be valid JSON.");
  }

  const parsed = readNotificationsSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError(400, "INVALID_INPUT", "Check the notification ids.");
  }

  try {
    await readNotifications(auth.account.$id, parsed.data.ids);
    return NextResponse.json({ updated: true });
  } catch (error) {
    logFailure("Notification update", error);
    return jsonError(
      502,
      "NOTIFICATIONS_UNAVAILABLE",
      "Notifications are unavailable.",
    );
  }
}
