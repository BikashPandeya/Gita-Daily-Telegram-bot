import type { Env, TelegramUpdate } from "./types";
import { sendMessage } from "./telegram";
import {
  formatVerse,
  getChapterHighlights,
  getDailyVerse,
  getRandomVerse,
  nepalDate
} from "./verses";

const HELP_TEXT = [
  "🙏 <b>Gita Daily Wisdom</b>",
  "",
  "/today — Receive today's verse",
  "/random — Receive a random featured verse",
  "/chapter 2 — Explore selected verses from a chapter",
  "/language en — English messages",
  "/language hi — Hindi messages",
  "/stop — Unsubscribe from daily messages",
  "/start — Subscribe again",
  "/help — Show this help message",
  "",
  "Daily messages are scheduled for 7:00 AM Nepal time."
].join("\n");

async function getLanguage(env: Env, chatId: string): Promise<"en" | "hi"> {
  const row = await env.DB.prepare(
    "SELECT language FROM subscribers WHERE chat_id = ?"
  ).bind(chatId).first<{ language: string }>();

  return row?.language === "hi" ? "hi" : "en";
}

export async function handleUpdate(env: Env, update: TelegramUpdate): Promise<void> {
  const message = update.message;
  if (!message?.text || !message.chat) return;

  const chatId = String(message.chat.id);
  const text = message.text.trim();
  const [rawCommand, ...args] = text.split(/\s+/);
  const command = (rawCommand || "").split("@")[0].toLowerCase();

  if (command === "/start" || command === "/subscribe") {
    await env.DB.prepare(`
      INSERT INTO subscribers (chat_id, username, first_name, language, active)
      VALUES (?, ?, ?, 'en', 1)
      ON CONFLICT(chat_id) DO UPDATE SET
        username = excluded.username,
        first_name = excluded.first_name,
        active = 1,
        updated_at = CURRENT_TIMESTAMP
    `).bind(
      chatId,
      message.from?.username || null,
      message.from?.first_name || null
    ).run();

    await sendMessage(env, chatId, [
      "🙏 <b>Welcome to Gita Daily Wisdom!</b>",
      "",
      "You are subscribed to one Bhagavad Gita verse and a practical reflection every day at 7:00 AM Nepal time.",
      "",
      "Use /today to read today's verse now.",
      "Use /language hi to switch to Hindi.",
      "Use /help to see all commands.",
      "",
      "May each day's wisdom bring clarity and peace. 🪷"
    ].join("\n"));
    return;
  }

  if (command === "/stop" || command === "/unsubscribe") {
    await env.DB.prepare(`
      UPDATE subscribers
      SET active = 0, updated_at = CURRENT_TIMESTAMP
      WHERE chat_id = ?
    `).bind(chatId).run();

    await sendMessage(env, chatId, "You have been unsubscribed. Send /start whenever you want to receive daily Gita wisdom again.");
    return;
  }

  if (command === "/help") {
    await sendMessage(env, chatId, HELP_TEXT);
    return;
  }

  if (command === "/language") {
    const requested = (args[0] || "").toLowerCase();
    if (requested !== "en" && requested !== "hi") {
      await sendMessage(env, chatId, "Choose a language with /language en or /language hi.");
      return;
    }

    const result = await env.DB.prepare(
      "UPDATE subscribers SET language = ?, updated_at = CURRENT_TIMESTAMP WHERE chat_id = ?"
    ).bind(requested, chatId).run();

    if (!result.success || result.meta.changes === 0) {
      await sendMessage(env, chatId, "Send /start first to subscribe, then choose your language.");
      return;
    }

    await sendMessage(env, chatId, requested === "hi"
      ? "भाषा हिंदी में बदल दी गई है।"
      : "Language changed to English.");
    return;
  }

  if (command === "/today") {
    const language = await getLanguage(env, chatId);
    await sendMessage(env, chatId, formatVerse(getDailyVerse(nepalDate(), language), language));
    return;
  }

  if (command === "/random") {
    const language = await getLanguage(env, chatId);
    await sendMessage(env, chatId, formatVerse(getRandomVerse(language), language));
    return;
  }

  if (command === "/chapter") {
    const chapterNumber = Number(args[0]);
    if (!Number.isInteger(chapterNumber) || chapterNumber < 1 || chapterNumber > 18) {
      await sendMessage(env, chatId, "Please provide a chapter number from 1 to 18. Example: /chapter 2");
      return;
    }

    const language = await getLanguage(env, chatId);
    const verses = getChapterHighlights(chapterNumber, language);

    if (verses.length === 0) {
      await sendMessage(env, chatId, `Chapter ${chapterNumber} is not in the current featured-verse list. Try /random or another chapter.`);
      return;
    }

    for (const verse of verses) {
      await sendMessage(env, chatId, formatVerse(verse, language));
    }
    return;
  }

  await sendMessage(env, chatId, "I didn't recognize that command. Send /help to see what I can do.");
}
