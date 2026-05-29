import { readFileSync } from "fs";

const env = readFileSync(".env", "utf8");
const key = env.match(/OPENROUTER_API_KEY="([^"]+)"/)?.[1];
const model = env.match(/OPENROUTER_MODEL="([^"]+)"/)?.[1];

if (!key || !model) {
  console.error("Missing OPENROUTER_API_KEY or OPENROUTER_MODEL in .env");
  process.exit(1);
}

async function test(withJsonMode: boolean) {
  const body: Record<string, unknown> = {
    model,
    messages: [
      { role: "system", content: 'Return JSON only: {"ok":true}' },
      { role: "user", content: "test" },
    ],
  };
  if (withJsonMode) body.response_format = { type: "json_object" };

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
      "X-Title": "CarDekho",
    },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  console.log(`\n--- json_mode=${withJsonMode} status=${res.status} ---`);
  console.log(text.slice(0, 800));
}

async function main() {
  await test(true);
  await test(false);
}
main().catch(console.error);
