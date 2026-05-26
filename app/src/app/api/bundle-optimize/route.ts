import { NextRequest, NextResponse } from "next/server";
import Groq from "groq-sdk";
import { aiLimiter, getIp } from "@/lib/ratelimit";

const SERVICE_REFERENCE = `
Netflix Premium    $22.99 retail → Poolly ~$4.99/slot
Spotify Family     $17.99 retail → Poolly ~$3.49/slot
Microsoft 365      $29.99 retail → Poolly ~$1.69/slot
Adobe CC           $59.99 retail → Poolly ~$14.99/slot
iCloud+ 2TB        $9.99  retail → Poolly ~$1.99/slot
NordVPN            $11.99 retail → Poolly ~$2.49/slot
Notion Plus        $16.00 retail → Poolly ~$3.99/slot
Peloton App        $24.00 retail → Poolly ~$4.00/slot
ChatGPT Plus       $20.00 retail → Poolly ~$4.99/slot
`.trim();

export async function POST(req: NextRequest) {
  const { success } = await aiLimiter.limit(getIp(req));
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { budget, services } = body as {
      budget: number;
      services?: string[];
    };

    const serviceHint = services && services.length > 0
      ? `The user is particularly interested in: ${services.join(", ")}.`
      : "Suggest the best combination across all available services.";

    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

    const prompt = `You are a savings advisor for a subscription pool-sharing marketplace in Singapore.

A user has a monthly budget of $${budget.toFixed(2)} for subscription services via Poolly.
${serviceHint}

Poolly pricing reference (per-slot pool prices):
${SERVICE_REFERENCE}

Recommend the best bundle of services this user can get within their budget, maximising value and savings.

Return ONLY valid JSON — no markdown fences, no extra text:
{
  "recommendation": "<1-2 sentence strategy explaining the bundle choice>",
  "bundles": [
    {
      "service": "<service name>",
      "svcId": "<one of: netflix|spotify|ms365|adobe|icloud|notion|peloton|chatgpt>",
      "retailPrice": <monthly retail price as number>,
      "poollyPrice": <monthly poolly price as number>,
      "annualSaving": <annual saving as number>
    }
  ],
  "totalMonthly": <total poolly monthly cost as number>,
  "totalRetail": <total retail monthly cost as number>,
  "totalAnnualSaving": <total annual saving as number>
}

Ensure totalMonthly does not exceed the budget of $${budget.toFixed(2)}.`;

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
