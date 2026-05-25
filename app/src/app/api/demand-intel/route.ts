import { NextResponse } from "next/server";
import Groq from "groq-sdk";

let cached: { data: unknown; ts: number } | null = null;
const TTL_MS = 5 * 60 * 1000; // 5 minutes

export async function GET() {
  try {
    const now = Date.now();
    if (cached && now - cached.ts < TTL_MS) {
      return NextResponse.json(cached.data);
    }

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `You are a market analyst for a subscription pool-sharing platform in Singapore (May 2026).

Generate exactly 5 pool opportunity suggestions that would be attractive for hosts to create right now, based on current trends in Singapore.

Return ONLY valid JSON — no markdown fences, no extra text:
{
  "opportunities": [
    {
      "service": "Adobe Creative CC",
      "svcId": "<one of: netflix|spotify|disney|icloud|notion|ms365|adobe|peloton|chatgpt>",
      "category": <integer 0-5 where 0=Streaming,1=Productivity,2=Fitness,3=Local Services,4=Professional,5=Other>,
      "demand": "<HIGH or MEDIUM>",
      "weeklySearches": <integer>,
      "suggestedPrice": <number>,
      "maxSlots": <integer between 2 and 8>,
      "insight": "<short insight about why this is a good opportunity>"
    }
  ]
}

The array must contain exactly 5 items. Use realistic Singapore market data.`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.5,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const result = JSON.parse(cleaned);

    cached = { data: result, ts: now };

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.toLowerCase().includes("groq") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
