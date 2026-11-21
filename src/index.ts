import type { Env, TelegramUpdate } from "./types";
import { handleUpdate } from "./bot";
import { sendDailyMessages } from "./scheduler";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "GET" && url.pathname === "/") {
      return new Response("Gita Daily Wisdom bot is running. 🙏", {
        headers: { "content-type": "text/plain; charset=utf-8" }
      });
    }

    if (request.method === "GET" && url.pathname === "/health") {
      return Response.json({ ok: true, service: "gita-daily-bot" });
    }

    if (request.method === "POST" && url.pathname === "/webhook") {
      const suppliedSecret = request.headers.get("X-Telegram-Bot-Api-Secret-Token");
      if (!suppliedSecret || suppliedSecret !== env.WEBHOOK_SECRET) {
        return new Response("Unauthorized", { status: 401 });
      }

      let update: TelegramUpdate;
      try {
        update = await request.json() as TelegramUpdate;
      } catch {
        return new Response("Invalid JSON", { status: 400 });
      }

      await handleUpdate(env, update);
      return new Response("OK");
    }

    return new Response("Not found", { status: 404 });
  },

  async scheduled(
    _controller: ScheduledController,
    env: Env,
    context: ExecutionContext
  ): Promise<void> {
    context.waitUntil(sendDailyMessages(env));
  }
} satisfies ExportedHandler<Env>;
