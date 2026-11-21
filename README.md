# Gita Daily Wisdom Bot

A Telegram bot that sends a selected Bhagavad Gita verse and an original daily reflection to each subscriber at 7:00 AM Nepal time.

## Stack

- Telegram Bot API
- Cloudflare Workers
- Cloudflare D1 (SQLite)
- Cloudflare Cron Triggers
- AdiyogiArts Bhagavad Gita JSON dataset

The bot uses individual subscriptions. A user sends `/start` to subscribe and `/stop` to unsubscribe.

## Commands

- `/start` — subscribe
- `/stop` — unsubscribe
- `/today` — today's verse
- `/random` — random featured verse
- `/chapter 2` — up to three featured verses from a chapter
- `/language en` — English
- `/language hi` — Hindi
- `/help` — help

## Requirements

1. Node.js 20 or newer
2. A Telegram account and bot token from `@BotFather`
3. A Cloudflare account
4. Wrangler CLI (installed through this project's dependencies)

No OpenAI key, paid AI API, or separate scripture API key is required.

## 1. Install dependencies

```bash
npm install
```

## 2. Download the scripture dataset

```bash
npm run data:download
```

This downloads `base.json`, `en.json` and `hi.json` from the public AdiyogiArts repository into `data/`.

The source repository describes its dataset as MIT-licensed. Check the repository's current license and source notes before redistributing the downloaded translations. Translation rights can differ from the rights in the underlying Sanskrit scripture.

## 3. Create the Telegram bot

1. Open Telegram and message `@BotFather`.
2. Send `/newbot`.
3. Follow the prompts and copy the bot token.
4. Keep the token private. Do not commit it to GitHub.

## 4. Create the Cloudflare D1 database

Log in to Cloudflare through Wrangler:

```bash
npx wrangler login
```

Create the database:

```bash
npm run db:create
```

Wrangler prints a `database_id`. Open `wrangler.jsonc` and replace:

```json
"database_id": "REPLACE_WITH_DATABASE_ID"
```

with the actual ID.

Apply the database migration:

```bash
npm run db:migrate:remote
```

## 5. Add secrets

Set the Telegram token:

```bash
npx wrangler secret put BOT_TOKEN
```

Paste the token when prompted.

Create a long random webhook secret using a password manager or a secure random generator. Use only letters, numbers, underscores and hyphens.

Set it:

```bash
npx wrangler secret put WEBHOOK_SECRET
```

Paste the same secret when prompted. Do not put either secret in source code or `wrangler.jsonc`.

## 6. Deploy the Worker

```bash
npm run deploy
```

Wrangler will show the deployed Worker URL, similar to:

```text
https://gita-daily-bot.YOUR-SUBDOMAIN.workers.dev
```

Open that URL in a browser. You should see the bot-running message.

## 7. Connect Telegram's webhook

Set three environment variables in your terminal, then run the webhook script.

### Windows PowerShell

```powershell
$env:BOT_TOKEN="YOUR_TELEGRAM_BOT_TOKEN"
$env:WEBHOOK_SECRET="THE_SAME_SECRET_YOU_SAVED_IN_CLOUDFLARE"
$env:WORKER_URL="https://gita-daily-bot.YOUR-SUBDOMAIN.workers.dev"

npm run webhook:set
```

### macOS / Linux

```bash
export BOT_TOKEN="YOUR_TELEGRAM_BOT_TOKEN"
export WEBHOOK_SECRET="THE_SAME_SECRET_YOU_SAVED_IN_CLOUDFLARE"
export WORKER_URL="https://gita-daily-bot.YOUR-SUBDOMAIN.workers.dev"

npm run webhook:set
```

The script should return `"ok": true`.

## 8. Test the bot

1. Open your bot in Telegram.
2. Send `/start`.
3. Try `/today`.
4. Try `/random`.
5. Try `/chapter 2`.
6. Send `/language hi`, then `/today`.
7. Send `/stop` to test unsubscribing.

## 9. Daily schedule

The Cron Trigger in `wrangler.jsonc` is:

```json
"crons": ["15 1 * * *"]
```

Cloudflare Cron uses UTC. 01:15 UTC is 07:00 in Nepal (UTC+05:45).

After changing the schedule, deploy again:

```bash
npm run deploy
```

## Updating the bot

After editing code:

```bash
npm run typecheck
npm run deploy
```

If the scripture dataset changes, run `npm run data:download` and redeploy.

## Important notes

- The daily rotation uses a curated list of featured verse references in `src/verses.ts`, not all 700 verses in chapter order.
- Edit `FEATURED_KEYS` to change the rotation.
- Edit the `reflections` object in `src/verses.ts` to write or improve your own daily upadesh.
- This project includes English and Hindi translations from the selected dataset. It does not include a verified Nepali translation.
- The first daily scheduled delivery happens at the next 7:00 AM Nepal-time cron run after deployment.
- Cloudflare and Telegram have usage limits and can change their free-tier terms. This setup is intended for a small community; a large audience may need batching/queueing and a higher service tier.
- Never publish your Telegram bot token or webhook secret. If a token is exposed, regenerate it through BotFather.

## Dataset attribution

AdiyogiArts, `gita-json`:
https://github.com/AdiyogiArts/gita-json

The repository provides Sanskrit text, transliteration and translations in JSON format. Verify the current repository license and attribution requirements before public redistribution.
