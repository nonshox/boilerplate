import { NextResponse } from "next/server";
import {
  getAuthAccount,
  isSameOrigin,
  jsonError,
  logFailure,
} from "@/lib/http";
import {
  createTelegramLink,
  getTelegramConnectionStatus,
  removeTelegramConnection,
  TelegramLinkRateLimitError,
} from "@/features/telegram/service";

export async function POST(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError(403, "ORIGIN_REJECTED", "Request origin was rejected.");
  }

  const auth = await getAuthAccount("Telegram link");
  if ("response" in auth) {
    return auth.response;
  }
  if (!auth.account) {
    return jsonError(401, "UNAUTHENTICATED", "Sign in to connect Telegram.");
  }

  try {
    const link = await createTelegramLink(auth.account.$id);
    return NextResponse.json({ link });
  } catch (error) {
    if (error instanceof TelegramLinkRateLimitError) {
      return jsonError(429, "RATE_LIMITED", "Wait briefly before requesting another link.");
    }
    logFailure("Telegram link", error);
    return jsonError(
      502,
      "TELEGRAM_UNAVAILABLE",
      "A Telegram connection link could not be created.",
    );
  }
}

export async function GET() {
  const auth = await getAuthAccount("Telegram connection status");
  if ("response" in auth) {
    return auth.response;
  }
  if (!auth.account) {
    return jsonError(401, "UNAUTHENTICATED", "Sign in to view Telegram status.");
  }
  try {
    const connected = await getTelegramConnectionStatus(auth.account.$id);
    return NextResponse.json(
      { connected },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    logFailure("Telegram connection status", error);
    return jsonError(502, "TELEGRAM_UNAVAILABLE", "Telegram status is unavailable.");
  }
}

export async function DELETE(request: Request) {
  if (!isSameOrigin(request)) {
    return jsonError(403, "ORIGIN_REJECTED", "Request origin was rejected.");
  }

  const auth = await getAuthAccount("Telegram disconnect");
  if ("response" in auth) {
    return auth.response;
  }
  if (!auth.account) {
    return jsonError(401, "UNAUTHENTICATED", "Sign in to disconnect Telegram.");
  }

  try {
    await removeTelegramConnection(auth.account.$id);
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    logFailure("Telegram disconnect", error);
    return jsonError(
      502,
      "TELEGRAM_UNAVAILABLE",
      "The Telegram connection could not be removed.",
    );
  }
}
