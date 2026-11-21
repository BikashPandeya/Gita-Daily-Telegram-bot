export interface Env {
  DB: D1Database;
  BOT_TOKEN: string;
  WEBHOOK_SECRET: string;
}

export interface TelegramUser {
  id: number;
  is_bot?: boolean;
  first_name?: string;
  username?: string;
}

export interface TelegramChat {
  id: number;
  type: string;
}

export interface TelegramMessage {
  message_id: number;
  chat: TelegramChat;
  from?: TelegramUser;
  text?: string;
}

export interface TelegramUpdate {
  update_id: number;
  message?: TelegramMessage;
}

export interface TelegramApiResult {
  ok: boolean;
  description?: string;
  error_code?: number;
  result?: unknown;
}

export interface BaseVerse {
  chapter: number;
  verse: number;
  sanskrit: string;
  transliteration?: string;
  chapterName?: string;
  chapterNameTranslation?: string;
}

export interface TranslationVerse {
  translation?: string;
  explanation?: string;
}

export interface VerseRecord {
  key: string;
  chapter: number;
  verse: number;
  chapterName: string;
  sanskrit: string;
  transliteration: string;
  translation: string;
  reflection: string;
}
