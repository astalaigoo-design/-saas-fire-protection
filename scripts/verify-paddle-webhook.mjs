import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const envPath = path.join(process.cwd(), ".env");
if (!fs.existsSync(envPath)) {
  console.log("LOCAL_SECRET: .env not found");
  process.exit(1);
}

const env = fs.readFileSync(envPath, "utf8");
const line = env.split(/\r?\n/).find((l) => l.startsWith("PADDLE_WEBHOOK_SECRET="));
if (!line) {
  console.log("LOCAL_SECRET: missing PADDLE_WEBHOOK_SECRET in .env");
  process.exit(1);
}

const secret = line.slice("PADDLE_WEBHOOK_SECRET=".length).trim().replace(/^["']|["']$/g, "");
const body = JSON.stringify({
  event_type: "subscription.created",
  data: {
    id: "sub_verify_test",
    status: "active",
    customer_id: "ctm_verify",
    custom_data: { company_id: "cmp_verify_nonexistent" },
  },
});

const ts = Math.floor(Date.now() / 1000).toString();
const h1 = crypto.createHmac("sha256", secret).update(`${ts}:${body}`).digest("hex");

const url = process.argv[2] ?? "https://getflareflow.com/api/webhooks/paddle";
const response = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Paddle-Signature": `ts=${ts};h1=${h1}`,
  },
  body,
});

const text = await response.text();
console.log("LOCAL_SECRET: set");
console.log("TARGET:", url);
console.log("PRODUCTION_RESPONSE:", response.status, text.slice(0, 240));

if (response.status === 400) {
  console.log("SIGNATURE: failed — local secret may not match Vercel PADDLE_WEBHOOK_SECRET");
  process.exit(1);
}

if (response.status === 500 && text.includes("not configured")) {
  console.log("SIGNATURE: server missing PADDLE_WEBHOOK_SECRET");
  process.exit(1);
}

if (response.status === 422) {
  console.log("SIGNATURE: ok — handler reached (company not found is expected for test id)");
  process.exit(0);
}

if (response.status === 200) {
  console.log("SIGNATURE: ok — webhook processed");
  process.exit(0);
}

console.log("SIGNATURE: unexpected status");
process.exit(1);
