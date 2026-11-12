/**
 * Sets or inspects the bot's default menu button — the persistent button
 * next to the message input that opens mono as a Telegram Mini App.
 *
 *   npm run telegram:menu https://mono.example.com   # set it
 *   npm run telegram:menu info                        # show current
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
const arg = process.argv[2]?.trim();

if (!token) {
  console.error("TELEGRAM_BOT_TOKEN is not set.");
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

const mode = arg || "";

if (mode === "info") {
  const info = await api("getChatMenuButton", {});
  console.log(JSON.stringify(info.result, null, 2));
  process.exit(0);
}

if (!mode || !/^https:\/\/[^\s/]+[^\s]*$/.test(mode)) {
  console.error(
    "Pass your app origin, e.g.: npm run telegram:menu https://mono.example.com",
  );
  process.exit(1);
}

const origin = mode.replace(/\/$/, "");

for (let attempt = 1; attempt <= 3; attempt += 1) {
  try {
    await api("setChatMenuButton", {
      menu_button: {
        type: "web_app",
        text: "Mono",
        web_app: { url: `${origin}/` },
      },
    });
    console.log(`Menu button set: "Mono" → ${origin}/`);
    process.exit(0);
  } catch (error) {
    if (attempt === 3) {
      console.error(`setChatMenuButton failed: ${error.message}`);
      process.exit(1);
    }
    console.log(`retry ${attempt}/2…`);
    await delay(1500 * attempt);
  }
}
