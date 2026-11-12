import { AppwriteException } from "node-appwrite";
import { NextResponse } from "next/server";
import { getCurrentAccount } from "@/features/auth/session";

export function jsonError(
  status: number,
  code: string,
  message: string,
): NextResponse {
  return NextResponse.json({ error: { code, message } }, { status });
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");

  if (!origin) {
    return false;
  }

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export function logFailure(operation: string, error: unknown): void {
  const detail =
    error instanceof AppwriteException
      ? `Appwrite ${error.code}`
      : error instanceof Error
        ? error.name
        : "UnknownError";

  console.error(`${operation} failed: ${detail}`);
}

export function appwriteStatus(error: unknown): number | undefined {
  if (!(error instanceof AppwriteException)) {
    return undefined;
  }

  if (error.code === 401) {
    return 401;
  }

  if (error.code === 429) {
    return 429;
  }

  return undefined;
}

/**
 * Shared auth guard for route handlers: resolves the session account or a
 * ready-to-return response. Keeps the try/catch + 502 mapping consistent.
 */
export async function getAuthAccount(
  label = "Authentication",
): Promise<
  | { account: Awaited<ReturnType<typeof getCurrentAccount>> }
  | { response: NextResponse }
> {
  try {
    const account = await getCurrentAccount();
    return { account };
  } catch (error) {
    logFailure(label, error);
    return {
      response: jsonError(
        502,
        "AUTH_UNAVAILABLE",
        "Authentication is temporarily unavailable.",
      ),
    };
  }
}
