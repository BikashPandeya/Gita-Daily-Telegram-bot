import type { Env, TelegramUpdate } from "./types";
import { sendMessage, sendPhoto } from "./telegram";
import {
  formatVerse,
  getChapterHighlights,
  getDailyVerse,
  getRandomVerse,
  nepalDate,
} from "./verses";

type SubscriberSettings = {
  timezone: string;
  morning_time: string;
  evening_time: string;
  pending_setting: string | null;
};

const HELP_TEXT = [
  "🙏 <b>Gita Daily Wisdom</b>",
  "",
  "<b>Daily wisdom</b>",
  "/today — Receive today's verse",
  "/random — Receive a random featured verse",
  "/chapter 2 — Explore selected verses from a chapter",
  "",
  "<b>Personalized schedule</b>",
  "/settings — View your settings",
  "/timezone — Set your timezone",
  "/times — View your delivery times",
  "/setmorning — Set your morning delivery time",
  "/setevening — Set your evening delivery time",
  "/resettime — Reset delivery times to 8:00 AM and 7:00 PM",
  "",
  "<b>Other commands</b>",
  "/language en — English messages",
  "/language hi — Hindi messages",
  "/stop — Unsubscribe from daily messages",
  "/start — Subscribe again",
  "/help — Show this help message",
  "",
  "You can choose your own timezone and delivery times.",
  "Use /settings to view or change your delivery times and timezone.",
].join("\n");

async function getLanguage(
  env: Env,
  chatId: string,
): Promise<"en" | "hi"> {
  const row = await env.DB.prepare(
    "SELECT language FROM subscribers WHERE chat_id = ?",
  )
    .bind(chatId)
    .first<{ language: string }>();

  return row?.language === "hi" ? "hi" : "en";
}

async function getSettings(
  env: Env,
  chatId: string,
): Promise<SubscriberSettings | null> {
  return env.DB.prepare(
    `SELECT timezone, morning_time, evening_time, pending_setting
     FROM subscribers
     WHERE chat_id = ?`,
  )
    .bind(chatId)
    .first<SubscriberSettings>();
}

function getDailyKrishnaImage(date: string): number {
  const [year, month, day] = date.split("-").map(Number);
  const dayNumber = Math.floor(
    Date.UTC(year, month - 1, day) / 86_400_000,
  );

  return (dayNumber % 10) + 1;
}

function getRandomKrishnaImage(): number {
  return Math.floor(Math.random() * 10) + 1;
}

function isValidTime(value: string): boolean {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) {
    return false;
  }

  return true;
}

function isValidTimezone(timezone: string): boolean {
  try {
    new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
    }).format(new Date());

    return true;
  } catch {
    return false;
  }
}

async function showSettings(
  env: Env,
  chatId: string,
): Promise<void> {
  const settings = await getSettings(env, chatId);

  if (!settings) {
    await sendMessage(
      env,
      chatId,
      "Send /start first to subscribe to daily Gita wisdom.",
    );
    return;
  }

  await sendMessage(
    env,
    chatId,
    [
      "⚙️ <b>Your delivery settings</b>",
      "",
      `🌍 Timezone: <code>${settings.timezone}</code>`,
      `🌅 Morning: <b>${settings.morning_time}</b>`,
      `🌙 Evening: <b>${settings.evening_time}</b>`,
      "",
      "Use /timezone to change your timezone.",
      "Use /setmorning to change your morning time.",
      "Use /setevening to change your evening time.",
      "Use /resettime to restore the default times.",
    ].join("\n"),
  );
}

async function setTimezone(
  env: Env,
  chatId: string,
  timezone: string,
): Promise<void> {
  if (!isValidTimezone(timezone)) {
    await sendMessage(
      env,
      chatId,
      [
        "That doesn't look like a valid IANA timezone.",
        "",
        "Examples:",
        "<code>Asia/Kathmandu</code>",
        "<code>Asia/Kolkata</code>",
        "<code>Europe/London</code>",
        "<code>America/New_York</code>",
        "",
        "Try /timezone again with a valid timezone.",
      ].join("\n"),
    );
    return;
  }

  const result = await env.DB.prepare(
    `UPDATE subscribers
     SET timezone = ?,
         pending_setting = NULL,
         updated_at = CURRENT_TIMESTAMP
     WHERE chat_id = ?`,
  )
    .bind(timezone, chatId)
    .run();

  if (!result.success || result.meta.changes === 0) {
    await sendMessage(
      env,
      chatId,
      "Send /start first to subscribe, then set your timezone.",
    );
    return;
  }

  await sendMessage(
    env,
    chatId,
    `✅ Your timezone is now <code>${timezone}</code>.`,
  );
}

async function setDeliveryTime(
  env: Env,
  chatId: string,
  slot: "morning" | "evening",
  time: string,
): Promise<void> {
  if (!isValidTime(time)) {
    await sendMessage(
      env,
      chatId,
      "Please use 24-hour HH:MM format. For example: <code>08:00</code> or <code>19:30</code>.",
    );
    return;
  }

  const settings = await getSettings(env, chatId);

  if (!settings) {
    await sendMessage(
      env,
      chatId,
      "Send /start first to subscribe to daily Gita wisdom.",
    );
    return;
  }

  const otherTime =
    slot === "morning"
      ? settings.evening_time
      : settings.morning_time;

  if (time === otherTime) {
    await sendMessage(
      env,
      chatId,
      "Your morning and evening times must be different. Please choose another time.",
    );
    return;
  }

  const column =
    slot === "morning" ? "morning_time" : "evening_time";

  await env.DB.prepare(
    `UPDATE subscribers
     SET ${column} = ?,
         pending_setting = NULL,
         updated_at = CURRENT_TIMESTAMP
     WHERE chat_id = ?`,
  )
    .bind(time, chatId)
    .run();

  const label = slot === "morning" ? "morning" : "evening";

  await sendMessage(
    env,
    chatId,
    `✅ Your ${label} delivery time is now <b>${time}</b> (${settings.timezone}).`,
  );
}

async function handlePendingSetting(
  env: Env,
  chatId: string,
  value: string,
): Promise<boolean> {
  const settings = await getSettings(env, chatId);

  if (!settings?.pending_setting) {
    return false;
  }

  const pending = settings.pending_setting;

  if (pending === "timezone") {
    await setTimezone(env, chatId, value);
    return true;
  }

  if (pending === "morning_time") {
    await setDeliveryTime(env, chatId, "morning", value);
    return true;
  }

  if (pending === "evening_time") {
    await setDeliveryTime(env, chatId, "evening", value);
    return true;
  }

  return false;
}

export async function handleUpdate(
  env: Env,
  update: TelegramUpdate,
): Promise<void> {
  const message = update.message;

  if (!message?.text || !message.chat) return;

  const chatId = String(message.chat.id);
  const text = message.text.trim();

  // If the user is answering a settings prompt, process their response.
  // Slash commands are handled normally instead.
  if (!text.startsWith("/")) {
    const handled = await handlePendingSetting(env, chatId, text);
    if (handled) return;
  }

  const [rawCommand, ...args] = text.split(/\s+/);
  const command = (rawCommand || "").split("@")[0].toLowerCase();
  const argument = args.join(" ").trim();

  if (command === "/start" || command === "/subscribe") {
    await env.DB.prepare(
      `
      INSERT INTO subscribers (chat_id, username, first_name, language, active)
      VALUES (?, ?, ?, 'en', 1)
      ON CONFLICT(chat_id) DO UPDATE SET
        username = excluded.username,
        first_name = excluded.first_name,
        active = 1,
        updated_at = CURRENT_TIMESTAMP
      `,
    )
      .bind(
        chatId,
        message.from?.username || null,
        message.from?.first_name || null,
      )
      .run();

    await sendMessage(
      env,
      chatId,
      [
        "🙏 <b>Welcome to Gita Daily Wisdom!</b>",
        "",
        "You are subscribed to receive two Bhagavad Gita wisdom messages every day.",
        "",
        "🌅 Morning: 8:00 AM",
        "🌙 Evening: 7:00 PM",
        "🌍 Timezone: Asia/Kathmandu",
        "",
        "These are the default settings. You can personalize them anytime using /settings.",
        "",
        "Use /today to read today's verse now.",
        "Use /help to see all commands.",
        "",
        "May each day's wisdom bring clarity and peace. 🪷",
      ].join("\n"),
    );
    return;
  }

  if (command === "/stop" || command === "/unsubscribe") {
    await env.DB.prepare(
      `UPDATE subscribers
       SET active = 0, updated_at = CURRENT_TIMESTAMP
       WHERE chat_id = ?`,
    )
      .bind(chatId)
      .run();

    await sendMessage(
      env,
      chatId,
      "You have been unsubscribed. Send /start whenever you want to receive daily Gita wisdom again.",
    );
    return;
  }

  if (command === "/help") {
    await sendMessage(env, chatId, HELP_TEXT);
    return;
  }

  if (command === "/settings") {
    await showSettings(env, chatId);
    return;
  }

  if (command === "/times") {
    const settings = await getSettings(env, chatId);

    if (!settings) {
      await sendMessage(env, chatId, "Send /start first to subscribe.");
      return;
    }

    await sendMessage(
      env,
      chatId,
      [
        `🌅 Morning: <b>${settings.morning_time}</b>`,
        `🌙 Evening: <b>${settings.evening_time}</b>`,
        `🌍 Timezone: <code>${settings.timezone}</code>`,
        "",
        "Use /setmorning or /setevening to change your times.",
      ].join("\n"),
    );
    return;
  }

  if (command === "/timezone") {
    if (argument) {
      await setTimezone(env, chatId, argument);
    } else {
      await env.DB.prepare(
        `UPDATE subscribers
         SET pending_setting = 'timezone',
             updated_at = CURRENT_TIMESTAMP
         WHERE chat_id = ?`,
      )
        .bind(chatId)
        .run();

      await sendMessage(
        env,
        chatId,
        [
          "🌍 Send your timezone using an IANA timezone name.",
          "",
          "For example:",
          "<code>Asia/Kathmandu</code>",
          "<code>Asia/Kolkata</code>",
          "<code>Europe/London</code>",
          "<code>America/New_York</code>",
        ].join("\n"),
      );
    }
    return;
  }

  if (command === "/setmorning" || command === "/setevening") {
    const slot = command === "/setmorning" ? "morning" : "evening";

    if (argument) {
      await setDeliveryTime(env, chatId, slot, argument);
    } else {
      await env.DB.prepare(
        `UPDATE subscribers
         SET pending_setting = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE chat_id = ?`,
      )
        .bind(
          slot === "morning" ? "morning_time" : "evening_time",
          chatId,
        )
        .run();

      await sendMessage(
        env,
        chatId,
        `🕒 Send your ${slot} delivery time in 24-hour format (HH:MM). For example: <code>${slot === "morning" ? "08:00" : "19:00"}</code>.`,
      );
    }
    return;
  }

  if (command === "/resettime") {
    const result = await env.DB.prepare(
      `UPDATE subscribers
       SET morning_time = '08:00',
           evening_time = '19:00',
           pending_setting = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE chat_id = ?`,
    )
      .bind(chatId)
      .run();

    if (!result.success || result.meta.changes === 0) {
      await sendMessage(env, chatId, "Send /start first to subscribe.");
      return;
    }

    await sendMessage(
      env,
      chatId,
      "✅ Your delivery times have been reset to 8:00 AM and 7:00 PM. Your timezone has not changed.",
    );
    return;
  }

  if (command === "/language") {
    const requested = (args[0] || "").toLowerCase();

    if (requested !== "en" && requested !== "hi") {
      await sendMessage(
        env,
        chatId,
        "Choose a language with /language en or /language hi.",
      );
      return;
    }

    const result = await env.DB.prepare(
      `UPDATE subscribers
       SET language = ?, updated_at = CURRENT_TIMESTAMP
       WHERE chat_id = ?`,
    )
      .bind(requested, chatId)
      .run();

    if (!result.success || result.meta.changes === 0) {
      await sendMessage(
        env,
        chatId,
        "Send /start first to subscribe, then choose your language.",
      );
      return;
    }

    await sendMessage(
      env,
      chatId,
      requested === "hi"
        ? "भाषा हिंदी में बदल दी गई है।"
        : "Language changed to English.",
    );
    return;
  }

  if (command === "/today") {
    const language = await getLanguage(env, chatId);
    const date = nepalDate();
    const imageNumber = getDailyKrishnaImage(date);
    const imageUrl = `${env.WORKER_URL.replace(/\/$/, "")}/krishna/krishna-${imageNumber}.jpg`;

    await sendPhoto(env, chatId, imageUrl);
    await sendMessage(
      env,
      chatId,
      formatVerse(getDailyVerse(date, language), language),
    );
    return;
  }

  if (command === "/random") {
    const language = await getLanguage(env, chatId);
    const verse = getRandomVerse(language);
    const imageNumber = getRandomKrishnaImage();
    const imageUrl = `${env.WORKER_URL.replace(/\/$/, "")}/krishna/krishna-${imageNumber}.jpg`;

    await sendPhoto(env, chatId, imageUrl);
    await sendMessage(env, chatId, formatVerse(verse, language));
    return;
  }

  if (command === "/chapter") {
    const chapterNumber = Number(args[0]);

    if (
      !Number.isInteger(chapterNumber) ||
      chapterNumber < 1 ||
      chapterNumber > 18
    ) {
      await sendMessage(
        env,
        chatId,
        "Please provide a chapter number from 1 to 18. Example: /chapter 2",
      );
      return;
    }

    const language = await getLanguage(env, chatId);
    const verses = getChapterHighlights(chapterNumber, language);

    if (verses.length === 0) {
      await sendMessage(
        env,
        chatId,
        `Chapter ${chapterNumber} is not in the current featured-verse list. Try /random or another chapter.`,
      );
      return;
    }

    for (const verse of verses) {
      await sendMessage(env, chatId, formatVerse(verse, language));
    }
    return;
  }

  await sendMessage(
    env,
    chatId,
    "I didn't recognize that command. Send /help to see what I can do.",
  );
}