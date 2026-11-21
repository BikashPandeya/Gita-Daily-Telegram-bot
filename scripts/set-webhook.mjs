const token = process.env.BOT_TOKEN;
const secret = process.env.WEBHOOK_SECRET;
const workerUrl = process.env.WORKER_URL;

if (!token || !secret || !workerUrl) {
  console.error("Set BOT_TOKEN, WEBHOOK_SECRET and WORKER_URL before running this script.");
  process.exit(1);
}

if (!/^[A-Za-z0-9_-]{1,256}$/.test(secret)) {
  console.error("WEBHOOK_SECRET must contain only letters, numbers, underscores or hyphens.");
  process.exit(1);
}

const webhookUrl = `${workerUrl.replace(/\/$/, "")}/webhook`;
const response = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({
    url: webhookUrl,
    secret_token: secret,
    allowed_updates: ["message"]
  })
});

const result = await response.json();
console.log(JSON.stringify(result, null, 2));

if (!result.ok) process.exit(1);
console.log(`Webhook connected to ${webhookUrl}`);
