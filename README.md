# 🙏 Gita Daily Wisdom Bot

A Telegram bot that shares daily wisdom from the **Bhagavad Gita**, with Sanskrit verses, translations, and reflections in English and Hindi — accompanied by beautiful images of Lord Krishna.

**[Start Bhagavat Gita Daily Wisdom](https://t.me/GitaDailyWisdomBot)**
**Try the bot:** [@GitaDailyWisdomBot](https://t.me/GitaDailyWisdomBot)

---

## ✨ Features

- 📖 **Daily Bhagavad Gita Upadesh** — Receive a verse and reflection every morning at 7:00 AM Nepal Time.
- 🦚 **Daily Krishna Images** — Every daily upadesh comes with a Krishna image, rotating through a collection of 10 images.
- 🎲 **Random Wisdom** — Get a random Bhagavad Gita verse with a randomly selected Krishna image.
- 🌐 **Bilingual Support** — Read wisdom in English or Hindi.
- 📚 **Chapter Highlights** — Explore selected verses from individual chapters.
- 🔔 **Subscription Management** — Subscribe or unsubscribe whenever you want.
- ☁️ **Serverless Architecture** — Runs on Cloudflare Workers with Cloudflare D1 for data storage.
- ⏰ **Automated Delivery** — Scheduled daily messages without requiring a continuously running server.

## 🤖 Bot Commands

| Command | Description |
|---|---|
| `/start` | Start the bot and subscribe to daily wisdom |
| `/today` | Get today's Bhagavad Gita verse with Krishna's image |
| `/random` | Receive a random verse with a random Krishna image |
| `/chapter 1` | Explore selected verses from a chapter |
| `/language en` | Switch to English |
| `/language hi` | Switch to Hindi |
| `/stop` | Stop receiving daily messages |
| `/help` | View available commands |

## 🖼️ Krishna Image Collection

The bot uses a collection of 10 locally hosted Krishna images.

```text
images/
└── krishna/
    ├── krishna-1.jpg
    ├── krishna-2.jpg
    ├── krishna-3.jpg
    ├── krishna-4.jpg
    ├── krishna-5.jpg
    ├── krishna-6.jpg
    ├── krishna-7.jpg
    ├── krishna-8.jpg
    ├── krishna-9.jpg
    └── krishna-10.jpg
```

### Image selection

- **Daily upadesh:** One image is selected for each Nepal calendar date. All subscribers receive the same image for that date.
- **`/today`:** Uses the same image as that day's scheduled upadesh.
- **`/random`:** Selects a random Krishna image each time the command is used.

Images are served through Cloudflare Workers static assets and sent through the Telegram Bot API.

## 🛠️ Tech Stack

- **Language:** TypeScript
- **Runtime:** Cloudflare Workers
- **Database:** Cloudflare D1
- **Bot Platform:** Telegram Bot API
- **Deployment:** Wrangler CLI
- **Data:** Bhagavad Gita verse and translation JSON datasets

## 📁 Project Structure

```text
gita-daily-bot/
│
├── data/
│   ├── base.json
│   ├── en.json
│   └── hi.json
│
├── images/
│   └── krishna/
│       ├── krishna-1.jpg
│       ├── krishna-2.jpg
│       └── ... krishna-10.jpg
│
├── migrations/
│   └── 0001_initial.sql
│
├── scripts/
│   ├── download-data.mjs
│   └── set-webhook.mjs
│
├── src/
│   ├── index.ts
│   ├── bot.ts
│   ├── telegram.ts
│   ├── scheduler.ts
│   ├── verses.ts
│   └── types.ts
│
├── package.json
├── tsconfig.json
├── wrangler.jsonc
└── README.md
```

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/gita-daily-bot.git
cd gita-daily-bot
```

### 2. Install dependencies

```bash
npm install
```

### 3. Download Bhagavad Gita data

```bash
npm run data:download
```

### 4. Configure Cloudflare

Make sure you have a Cloudflare account and Wrangler installed through the project dependencies.

Log in:

```bash
npx wrangler login
```

Create your D1 database:

```bash
npx wrangler d1 create gita-daily-db
```

Update `wrangler.jsonc` with the database ID returned by Cloudflare.

Apply migrations:

```bash
npm run db:migrate:remote
```

### 5. Configure environment variables

Add your Telegram bot token and webhook secret as Cloudflare secrets:

```bash
npx wrangler secret put BOT_TOKEN
npx wrangler secret put WEBHOOK_SECRET
```

Set the public Worker URL in `wrangler.jsonc`:

```json
"vars": {
  "WORKER_URL": "https://YOUR-WORKER-NAME.YOUR-SUBDOMAIN.workers.dev"
}
```

Configure static assets so Cloudflare can serve the Krishna images:

```json
"assets": {
  "directory": "./images"
}
```

Keep the existing D1 database and cron configuration in the same file.

### 6. Configure the Telegram webhook

Set the following environment variables in your local terminal before running the webhook setup script:

- `BOT_TOKEN`
- `WEBHOOK_SECRET`
- `WORKER_URL`

Then run:

```bash
npm run webhook:set
```

The script registers the Telegram webhook with your Cloudflare Worker.

### 7. Deploy

```bash
npm run typecheck
npm run deploy
```

Your bot is now deployed!

## ⏰ Daily Scheduling

The bot uses Cloudflare Cron Triggers to automatically send daily upadesh messages.

Configured schedule:

```json
"triggers": {
  "crons": ["15 1 * * *"]
}
```

This corresponds to:

- **UTC:** 01:15 AM
- **Nepal Time:** 07:00 AM

The scheduler checks active subscribers, selects the daily verse and Krishna image, and records delivery status in D1 to avoid duplicate daily deliveries.

## 🧪 Local Development

Start the local development server:

```bash
npm run dev
```

Run TypeScript checks:

```bash
npm run typecheck
```

Deploy to Cloudflare:

```bash
npm run deploy
```

## 🔐 Security

- Telegram bot tokens and webhook secrets are stored as Cloudflare secrets.
- Webhook requests are validated using Telegram's secret token header.
- Subscriber preferences and delivery records are stored in Cloudflare D1.
- Never commit bot tokens, webhook secrets, or other private credentials to GitHub.

## 🙌 Acknowledgements

- [Bhagavad Gita JSON Dataset](https://github.com/AdiyogiArts/gita-json)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare D1](https://developers.cloudflare.com/d1/)

---

Made with devotion and code. 🙏

**Explore the Bhagavad Gita, one verse at a time.**

[Start using Gita Daily Wisdom Bot](https://t.me/GitaDailyWisdomBot)