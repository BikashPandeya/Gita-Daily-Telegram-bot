import type { Env } from "./types";
import { sendMessage } from "./telegram";
import { formatVerse, getDailyVerse, nepalDate } from "./verses";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function sendDailyMessages(env: Env): Promise<void> {
  const date = nepalDate();
  const subscribers = await env.DB.prepare(
    "SELECT chat_id, language FROM subscribers WHERE active = 1 ORDER BY created_at"
  ).all<{ chat_id: string; language: string }>();

  for (const subscriber of subscribers.results || []) {
    const alreadySent = await env.DB.prepare(
      "SELECT status FROM deliveries WHERE chat_id = ? AND local_date = ?"
    ).bind(subscriber.chat_id, date).first<{ status: string }>();

    if (alreadySent?.status === "sent") continue;

    const language = subscriber.language === "hi" ? "hi" : "en";
    const verse = getDailyVerse(date, language);
    const result = await sendMessage(
      env,
      subscriber.chat_id,
      formatVerse(verse, language)
    );

    if (result.ok) {
      await env.DB.prepare(`
        INSERT INTO deliveries (chat_id, local_date, verse_key, status, error, updated_at)
        VALUES (?, ?, ?, 'sent', NULL, CURRENT_TIMESTAMP)
        ON CONFLICT(chat_id, local_date) DO UPDATE SET
          verse_key = excluded.verse_key,
          status = 'sent',
          error = NULL,
          updated_at = CURRENT_TIMESTAMP
      `).bind(subscriber.chat_id, date, verse.key).run();
    } else {
      const errorText = result.description || "Unknown Telegram API error";
      await env.DB.prepare(`
        INSERT INTO deliveries (chat_id, local_date, verse_key, status, error, updated_at)
        VALUES (?, ?, ?, 'failed', ?, CURRENT_TIMESTAMP)
        ON CONFLICT(chat_id, local_date) DO UPDATE SET
          verse_key = excluded.verse_key,
          status = 'failed',
          error = excluded.error,
          updated_at = CURRENT_TIMESTAMP
      `).bind(subscriber.chat_id, date, verse.key, errorText.slice(0, 500)).run();

      // Telegram error 403 generally means the user blocked the bot.
      if (result.error_code === 403) {
        await env.DB.prepare(
          "UPDATE subscribers SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE chat_id = ?"
        ).bind(subscriber.chat_id).run();
      }
    }

    // Keep delivery comfortably below Telegram's usual per-chat limits.
    await sleep(40);
  }
}
