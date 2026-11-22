import type { Env } from "./types";
import { sendMessage, sendPhoto } from "./telegram";
import { formatVerse, getDailyVerse } from "./verses";

type Subscriber = {
  chat_id: string;
  language: string;
  timezone: string;
  morning_time: string;
  evening_time: string;
};

type LocalDateTime = {
  date: string;
  time: string;
  minutes: number;
};

const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

function getLocalDateTime(timezone: string): LocalDateTime {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date());

  const values: Record<string, string> = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = part.value;
    }
  }

  const year = values.year;
  const month = values.month;
  const day = values.day;
  const hour = values.hour;
  const minute = values.minute;

  return {
    date: `${year}-${month}-${day}`,
    time: `${hour}:${minute}`,
    minutes: Number(hour) * 60 + Number(minute),
  };
}

function getDailyKrishnaImage(date: string): number {
  const [year, month, day] = date.split("-").map(Number);

  const dayNumber = Math.floor(
    Date.UTC(year, month - 1, day) / 86_400_000,
  );

  return (dayNumber % 10) + 1;
}

function isDeliveryDue(
  currentMinutes: number,
  targetTime: string,
): boolean {
  const [hour, minute] = targetTime.split(":").map(Number);
  const targetMinutes = hour * 60 + minute;

  // Allow a five-minute window in case a scheduled invocation is delayed.
  const difference = currentMinutes - targetMinutes;

  return difference >= 0 && difference <= 4;
}

async function claimDelivery(
  env: Env,
  chatId: string,
  date: string,
  slot: "morning" | "evening",
  verseKey: string,
): Promise<boolean> {
  const result = await env.DB.prepare(
    `
    INSERT INTO deliveries (
      chat_id,
      local_date,
      slot,
      verse_key,
      status,
      error,
      updated_at
    )
    VALUES (?, ?, ?, ?, 'processing', NULL, CURRENT_TIMESTAMP)

    ON CONFLICT(chat_id, local_date, slot)
    DO UPDATE SET
      status = 'processing',
      error = NULL,
      updated_at = CURRENT_TIMESTAMP
    WHERE deliveries.status = 'failed'
    `,
  )
    .bind(chatId, date, slot, verseKey)
    .run();

  return result.meta.changes > 0;
}

async function updateDelivery(
  env: Env,
  chatId: string,
  date: string,
  slot: "morning" | "evening",
  status: "sent" | "failed",
  error: string | null,
): Promise<void> {
  await env.DB.prepare(
    `
    UPDATE deliveries
    SET status = ?,
        error = ?,
        updated_at = CURRENT_TIMESTAMP
    WHERE chat_id = ?
      AND local_date = ?
      AND slot = ?
    `,
  )
    .bind(status, error, chatId, date, slot)
    .run();
}

async function deliverToSubscriber(
  env: Env,
  subscriber: Subscriber,
  date: string,
  slot: "morning" | "evening",
): Promise<void> {
  const language = subscriber.language === "hi" ? "hi" : "en";
  const verse = getDailyVerse(date, language);

  const claimed = await claimDelivery(
    env,
    subscriber.chat_id,
    date,
    slot,
    verse.key,
  );

  if (!claimed) return;

  const imageNumber = getDailyKrishnaImage(date);
  const imageUrl = `${env.WORKER_URL.replace(/\/$/, "")}/krishna/krishna-${imageNumber}.jpg`;

  try {
    const photoResult = await sendPhoto(
      env,
      subscriber.chat_id,
      imageUrl,
    );

    const messageResult = await sendMessage(
      env,
      subscriber.chat_id,
      formatVerse(verse, language),
    );

    if (messageResult.ok) {
      const deliveryNote = photoResult.ok
        ? null
        : `Verse delivered, but photo failed: ${
            photoResult.description || "Unknown photo error"
          }`;

      await updateDelivery(
        env,
        subscriber.chat_id,
        date,
        slot,
        "sent",
        deliveryNote,
      );
    } else {
      const errorText =
        messageResult.description || "Unknown Telegram message error";

      await updateDelivery(
        env,
        subscriber.chat_id,
        date,
        slot,
        "failed",
        errorText.slice(0, 500),
      );

      if (messageResult.error_code === 403) {
        await env.DB.prepare(
          `UPDATE subscribers
           SET active = 0, updated_at = CURRENT_TIMESTAMP
           WHERE chat_id = ?`,
        )
          .bind(subscriber.chat_id)
          .run();
      }
    }
  } catch (error) {
    const errorText =
      error instanceof Error ? error.message : "Unknown delivery error";

    await updateDelivery(
      env,
      subscriber.chat_id,
      date,
      slot,
      "failed",
      errorText.slice(0, 500),
    );
  }
}

export async function sendDailyMessages(env: Env): Promise<void> {
  const subscribers = await env.DB.prepare(
    `
    SELECT
      chat_id,
      language,
      timezone,
      morning_time,
      evening_time
    FROM subscribers
    WHERE active = 1
    ORDER BY created_at
    `,
  ).all<Subscriber>();

  for (const subscriber of subscribers.results || []) {
    try {
      const local = getLocalDateTime(subscriber.timezone);

      if (isDeliveryDue(local.minutes, subscriber.morning_time)) {
        await deliverToSubscriber(
          env,
          subscriber,
          local.date,
          "morning",
        );
      }

      if (isDeliveryDue(local.minutes, subscriber.evening_time)) {
        await deliverToSubscriber(
          env,
          subscriber,
          local.date,
          "evening",
        );
      }
    } catch (error) {
      // A problem with one subscriber should not stop delivery to everyone else.
      console.error(
        `Scheduling error for ${subscriber.chat_id}:`,
        error,
      );
    }

    await sleep(40);
  }
}