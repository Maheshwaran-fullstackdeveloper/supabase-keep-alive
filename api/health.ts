import { VercelRequest, VercelResponse } from "@vercel/node";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_KEY!
);

async function sendSlackMessage(message: string) {
  const timestamp = new Date()
    .toLocaleString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "2-digit",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    })
    .replace(" am", " AM")
    .replace(" pm", " PM");

  await fetch(process.env.SLACK_WEBHOOK_URL!, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text: `🚀 *Supabase Keep-Alive Triggered!* ${message} 📅 ${timestamp}`,
    }),
  });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const token = req.query.token;

  if (token !== process.env.HEALTH_CHECK_SECRET) {
    await sendSlackMessage("❌ Authorization failed");
    return res.status(401).json({ status: "unauthorized" });
  }

  const { data, error } = await supabase.from('cabins').select().limit(1);

  if (error) {
    await sendSlackMessage("❌ Call to database failed");
    return res.status(500).json({ status: "error", error });
  }

  if (!data || data.length === 0) {
    await sendSlackMessage("❌ No data found");
    return res.status(404).json({ status: "no data" });
  }

  await sendSlackMessage("✅ Keep-alive check successful");
  return res.status(200).json({ status: "ok" });
}
