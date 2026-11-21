# 🙏 Gita Daily Wisdom Bot

A Telegram bot that brings the timeless wisdom of the **Bhagavad Gita** to your daily life.

Receive a Bhagavad Gita verse every morning, explore random verses, switch between English and Hindi, and discover meaningful reflections — all directly through Telegram.

## 🤖 Try the Bot

Experience the wisdom of the Bhagavad Gita directly on Telegram.

**[Start Bhagavat Gita Daily Wisdom](https://t.me/GitaDailyWisdomBot)**

Telegram: [@GitaDailyWisdomBot](https://t.me/GitaDailyWisdomBot)

Built with **TypeScript, Cloudflare Workers, Cloudflare D1, and the Telegram Bot API**.

## ✨ Features

- 📖 **Daily Bhagavad Gita Verse** – Receive a selected verse every morning at 7:00 AM Nepal time.
- 🌍 **Bilingual Support** – Read verses in English or Hindi.
- 🎲 **Random Verse** – Discover a randomly selected featured verse.
- 📚 **Chapter Highlights** – Explore selected verses from a specific chapter.
- 💭 **Daily Reflections** – Read reflections accompanying selected verses.
- 🔔 **Subscription Management** – Subscribe or unsubscribe whenever you want.
- ⚡ **Automated Delivery** – Cloudflare Cron Triggers handle scheduled messages.
- 💾 **Delivery Tracking** – Cloudflare D1 tracks daily message delivery and errors.

## 🤖 Bot Commands

| Command | Description |
|---|---|
| `/start` | Start the bot and subscribe to daily verses |
| `/subscribe` | Subscribe to daily messages |
| `/stop` | Stop receiving daily messages |
| `/unsubscribe` | Unsubscribe from daily messages |
| `/today` | Get today's Bhagavad Gita verse |
| `/random` | Receive a random featured verse |
| `/chapter <number>` | Explore selected verses from a chapter |
| `/language en` | Switch to English |
| `/language hi` | Switch to Hindi |
| `/help` | Display available commands |

## 🛠️ Tech Stack

- **Language:** TypeScript
- **Runtime:** Cloudflare Workers
- **Database:** Cloudflare D1 (SQLite)
- **Bot Platform:** Telegram Bot API
- **Scheduling:** Cloudflare Cron Triggers
- **Package Manager:** npm

## 📁 Project Structure

```text
gita-daily-bot/
│
├── data/
│   ├── base.json
│   ├── en.json
│   └── hi.json
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

### Prerequisites

Before starting, make sure you have:

- Node.js installed
- npm installed
- A Cloudflare account
- A Telegram account
- A Telegram bot token from [@BotFather](https://t.me/BotFather)

### 1. Clone the repository

```bash
git clone <YOUR_REPOSITORY_URL>
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

This downloads the verse data and translations into the `data/` directory.

### 4. Configure Cloudflare

Log in to Cloudflare:

```bash
npx wrangler login
```

Create the D1 database:

```bash
npm run db:create
```

Update the database ID in `wrangler.jsonc` using the ID returned by Cloudflare.

Apply the database migrations:

```bash
npm run db:migrate:remote
```

### 5. Configure secrets

Add your Telegram bot token:

```bash
npx wrangler secret put BOT_TOKEN
```

Add a secure webhook secret:

```bash
npx wrangler secret put WEBHOOK_SECRET
```

Generate a webhook secret with:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Keep both values private. Never commit secrets to GitHub.

### 6. Deploy to Cloudflare Workers

```bash
npm run deploy
```

After deployment, Cloudflare provides a Worker URL:

```text
https://gita-daily-bot.<your-subdomain>.workers.dev
```

### 7. Configure the Telegram webhook

Set the required environment variables in PowerShell:

```powershell
$env:BOT_TOKEN = "YOUR_TELEGRAM_BOT_TOKEN"
$env:WEBHOOK_SECRET = "YOUR_WEBHOOK_SECRET"
$env:WORKER_URL = "https://gita-daily-bot.<your-subdomain>.workers.dev"
```

Register the webhook:

```bash
npm run webhook:set
```

After successful registration, Telegram will forward incoming bot updates to your Cloudflare Worker.

Remove the temporary PowerShell environment variables afterward:

```powershell
Remove-Item Env:BOT_TOKEN
Remove-Item Env:WEBHOOK_SECRET
Remove-Item Env:WORKER_URL
```

## 💻 Local Development

Apply migrations to your local D1 database:

```bash
npm run db:migrate:local
```

Start the local development server:

```bash
npm run dev
```

Your local Worker will be available at:

```text
http://127.0.0.1:8787
```

Check the health endpoint:

```text
http://127.0.0.1:8787/health
```

To manually trigger the scheduled event during local development:

```bash
curl "http://127.0.0.1:8787/cdn-cgi/local/scheduled"
```

**Note:** Local scheduled events use your local D1 database. Telegram webhook testing requires a publicly reachable endpoint.

## ⏰ Daily Schedule

The bot uses a Cloudflare Cron Trigger:

```text
15 1 * * *
```

This runs daily at:

**7:00 AM Nepal Standard Time (NPT, UTC+5:45).**

The scheduler retrieves active subscribers, selects the daily verse, sends the message, and records the delivery status in D1.

## 🔐 Environment Variables

| Variable | Description |
|---|---|
| `BOT_TOKEN` | Telegram bot API token |
| `WEBHOOK_SECRET` | Secret used to verify Telegram webhook requests |
| `WORKER_URL` | Public Cloudflare Worker URL used by the webhook registration script |
| `DB` | Cloudflare D1 database binding |

`BOT_TOKEN` and `WEBHOOK_SECRET` are configured as Cloudflare Worker secrets. `WORKER_URL` is used by the local webhook setup script.

## 🧪 Available Scripts

| Command | Purpose |
|---|---|
| `npm run dev` | Start local development server |
| `npm run deploy` | Deploy the Cloudflare Worker |
| `npm run typecheck` | Run TypeScript checks |
| `npm run data:download` | Download verse data |
| `npm run db:create` | Create the D1 database |
| `npm run db:migrate:local` | Apply local database migrations |
| `npm run db:migrate:remote` | Apply remote database migrations |
| `npm run webhook:set` | Register the Telegram webhook |

## 📚 Data

The project uses JSON-based Bhagavad Gita verse data, including Sanskrit verses and English and Hindi translations.

Data download source:

[AdiyogiArts – Gita JSON](https://github.com/AdiyogiArts/gita-json)

Please review the upstream repository's licensing and attribution requirements before redistributing the downloaded data.

## 🔮 Future Improvements

Potential additions to the project:

- User-selected daily delivery times
- More translations and languages
- Verse search by keyword or topic
- Bookmarks and saved verses
- Daily streaks and reading progress
- Interactive chapter exploration
- More detailed verse explanations

## 🤝 Contributing

Contributions, suggestions, and improvements are welcome.

1. Fork the repository.
2. Create a new branch.
3. Make your changes.
4. Submit a pull request.

## 📜 License

Add a project license after confirming the licensing terms of the source verse data and translations. Do not assume the upstream data is covered by the same license as your code.

---

**Built to make the timeless wisdom of the Bhagavad Gita accessible, one verse at a time.** 🙏