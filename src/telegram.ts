import type { Env, TelegramApiResult } from "./types";

export async function telegramRequest(
  env: Env,
  method: string,
  payload: Record<string, unknown>
): Promise<TelegramApiResult> {
  const response = await fetch(
    `https://api.telegram.org/bot${env.BOT_TOKEN}/${method}`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload)
    }
  );

  const data = (await response.json()) as TelegramApiResult;
  if (!response.ok && data.ok !== false) {
    return {
      ok: false,
      description: `Telegram HTTP error ${response.status}`,
      error_code: response.status
    };
  }
  return data;
}

export async function sendMessage(
  env: Env,
  chatId: string | number,
  text: string
): Promise<TelegramApiResult> {
  return telegramRequest(env, "sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: "HTML",
    disable_web_page_preview: true
  });
}
