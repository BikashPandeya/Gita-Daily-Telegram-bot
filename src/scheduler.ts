
import type { Env } from "./types";
import { sendMessage, sendPhoto } from "./telegram";
import { formatVerse, getDailyVerse, nepalDate } from "./verses";

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function getDailyKrishnaImage(date: string): number {
  const [year, month, day] = date.split("-").map(Number);

  const dayNumber = Math.floor(
    Date.UTC(year, month - 1, day) / 86_400_000
  );

  return (dayNumber % 10) + 1;
}

export async function sendDailyMessages(env: Env): Promise<void> {
  const date = nepalDate();
  const imageNumber = getDailyKrishnaImage(date);
  const imageUrl =
    `${env.WORKER_URL.replace(/\/$/, "")}/krishna/krishna-${imageNumber}.jpg`;

  const subscribers = await env.DB.prepare(
    "SELECT chat_id, language FROM subscribers WHERE active = 1 ORDER BY created_at"
  ).all<{ chat_id: string; language: string }>();

  for (const subscriber of subscribers.results || []) {
    const alreadySent = await env.DB.prepare(
      "SELECT status FROM deliveries WHERE chat_id = ? AND local_date = ?"
    )
      .bind(subscriber.chat_id, date)
      .first<{ status: string }>();

    if (alreadySent?.status === "sent") continue;

    const language = subscriber.language === "hi" ? "hi" : "en";
    const verse = getDailyVerse(date, language);

    // Try sending Krishna's image first.
    const photoResult = await sendPhoto(
      env,
      subscriber.chat_id,
      imageUrl
    );

    // Send the verse even if the photo could not be delivered.
    const messageResult = await sendMessage(
      env,
      subscriber.chat_id,
      formatVerse(verse, language)
    );

    if (messageResult.ok) {
      const deliveryNote = photoResult.ok
        ? null
        : `Verse delivered, but photo failed: ${
            photoResult.description || "Unknown photo error"
          }`;

      await env.DB.prepare(`
        INSERT INTO deliveries
          (chat_id, local_date, verse_key, status, error, updated_at)
        VALUES (?, ?, ?, 'sent', ?, CURRENT_TIMESTAMP)
        ON CONFLICT(chat_id, local_date) DO UPDATE SET
          verse_key = excluded.verse_key,
          status = 'sent',
          error = excluded.error,
          updated_at = CURRENT_TIMESTAMP
      `)
        .bind(
          subscriber.chat_id,
          date,
          verse.key,
          deliveryNote
        )
        .run();
    } else {
      const errorText =
        messageResult.description || "Unknown Telegram message error";

      await env.DB.prepare(`
        INSERT INTO deliveries
          (chat_id, local_date, verse_key, status, error, updated_at)
        VALUES (?, ?, ?, 'failed', ?, CURRENT_TIMESTAMP)
        ON CONFLICT(chat_id, local_date) DO UPDATE SET
          verse_key = excluded.verse_key,
          status = 'failed',
          error = excluded.error,
          updated_at = CURRENT_TIMESTAMP
      `)
        .bind(
          subscriber.chat_id,
          date,
          verse.key,
          errorText.slice(0, 500)
        )
        .run();

      if (messageResult.error_code === 403) {
        await env.DB.prepare(
          "UPDATE subscribers SET active = 0, updated_at = CURRENT_TIMESTAMP WHERE chat_id = ?"
        )
          .bind(subscriber.chat_id)
          .run();
      }
    }

    await sleep(40);
  }
}
