import { NextResponse } from "next/server";
import Groq from "groq-sdk";

const CATEGORY_DATA = [
  { name: "Streaming",       retail: 22.99, avgShare: 4.99,  fill: 85 },
  { name: "Productivity",    retail: 29.99, avgShare: 5.99,  fill: 78 },
  { name: "Fitness",         retail: 24.00, avgShare: 4.50,  fill: 70 },
  { name: "Local Services",  retail: 80.00, avgShare: 18.00, fill: 62 },
  { name: "Professional",    retail: 59.99, avgShare: 14.99, fill: 72 },
  { name: "Other",           retail: 20.00, avgShare: 4.00,  fill: 68 },
];

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { category, title, maxSlots, cycleDays } = body as {
      category: number;
      title: string;
      maxSlots: number;
      cycleDays: number;
    };

    const cat = CATEGORY_DATA[category] ?? CATEGORY_DATA[5];

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `You are a pricing analyst for a subscription pool-sharing marketplace in Singapore.

A host wants to list a "${title}" pool in the "${cat.name}" category.
- Pool slots available: ${maxSlots}
- Billing cycle: ${cycleDays} days
- Category retail price: $${cat.retail}/month
- Category market average share price: $${cat.avgShare}/slot/month
- Category typical fill rate: ${cat.fill}%

Suggest an optimal per-slot price for this pool that maximises fill rate while being fair to the host.

Return ONLY valid JSON — no markdown fences, no extra text:
{
  "suggestedPrice": <number>,
  "priceRange": [<min>, <max>],
  "fillEstimate": <integer 0-100>,
  "competitorAvg": <number>,
  "reasoning": "<1 sentence>"
}`;

    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.3,
    });

    const raw = completion.choices[0]?.message?.content ?? "";
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```\s*$/i, "").trim();
    const result = JSON.parse(cleaned);

    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    const status = message.toLowerCase().includes("groq") ? 503 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
