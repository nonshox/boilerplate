/**
 * Registers (or inspects) the Telegram webhook for this app.
 *
 *   npm run telegram:webhook https://mono.example.com   # point bot at this app
 *   npm run telegram:webhook info                        # show current webhook
 *
 * The webhook URL is <base>/api/telegram/webhook; the secret comes from
 * TELEGRAM_WEBHOOK_SECRET and must match the one verified in that route.
 */
import { setTimeout as delay } from "node:timers/promises";

try {
  process.loadEnvFile(".env");
} catch {
  console.error("Missing .env — copy .env.example and fill it in first.");
  process.exit(1);
}
try {
  process.loadEnvFile(".env.secret");
} catch {
  // Optional overlay; .env alone is fine.
}

const token = process.env.TELEGRAM_BOT_TOKEN?.trim();
const secret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
const arg = process.argv[2]?.trim();

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is not set.");
  process.exit(1);
}

if (!secret || !/^[A-Za-z0-9_-]{1,256}$/.test(secret)) {
  console.error(
    "TELEGRAM_WEBHOOK_SECRET is missing or invalid.\n" +
      "Generate one (64 hex chars works): openssl rand -hex 32",
  );
  process.exit(1);
}

const api = (method, body) =>
  fetch(`https://api.telegram.org/bot${token}/${method}`, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  }).then(async (response) => {
    const result = await response.json();
    if (!response.ok || result.ok !== true) {
      throw new Error(
        `Telegram API ${method} failed (${response.status}): ` +
          (result.description ?? "unknown error"),
      );
    }
    return result;
  });

const mode = arg || process.env.TELEGRAM_WEBHOOK_URL || "";

if (mode === "info") {
  const info = await api("getWebhookInfo");
  console.log(JSON.stringify(info.result, null, 2));
  process.exit(0);
}

const base = mode;
if (!base || !/^https:\/\/[^\s/]+[^\s]*$/.test(base)) {
  console.error(
    "Pass your app origin, e.g.: npm run telegram:webhook https://mono.example.com",
  );
  process.exit(1);
}

const url = `${base.replace(/\/$/, "")}/api/telegram/webhook`;

await retry(() =>
  api("setWebhook", {
    url,
    secret_token: secret,
    allowed_updates: ["message"],
    drop_pending_updates: true,
  }),
);

const info = await retry(() => api("getWebhookInfo"));
console.log(`Webhook registered: ${info.result.url}`);
console.log(`Pending updates: ${info.result.pending_update_count}`);

async function retry(fn, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      if (attempt < attempts) {
        console.log(`retry ${attempt}/${attempts - 1}…`);
        await delay(1500 * attempt);
      }
    }
  }
  throw lastError;
}
