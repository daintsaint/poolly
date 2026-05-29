import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { aiLimiter, getIp } from "@/lib/ratelimit";

const CATEGORY_HINTS: Record<number, string> = {
  0: "streaming service (Netflix, Spotify, Disney+, Apple TV+, etc.) — must show: active subscription status, plan name/tier, billing date within last 30 days or renewal date, account email or profile name",
  1: "productivity/office tool (Notion, Microsoft 365, Google Workspace, etc.) — must show: active license, plan type, number of seats/users, billing status",
  2: "fitness service (Peloton, gym membership, etc.) — must show: active membership, member name or account, recent activity or membership status",
  3: "local/delivery service — must show: completed delivery receipt, booking confirmation, or before/after photo with date",
  4: "professional tool (Adobe CC, Figma, GitHub, Claude, ChatGPT, etc.) — must show: active subscription plan, billing cycle, seat count if applicable, account email",
  5: "subscription service — must show: active subscription status, plan name, billing date",
};

export interface VerifyResult {
  verified: boolean;
  confidence: number;
  explanation: string;
  issues: string[];
  suggestions: string[];
}

export async function POST(req: NextRequest) {
  const { success } = await aiLimiter.limit(getIp(req));
  if (!success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  try {
    const { proofUrl, poolTitle, category } = await req.json();

    if (!proofUrl || typeof proofUrl !== "string") {
      return NextResponse.json({ error: "proofUrl required" }, { status: 400 });
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "AI verification not configured" }, { status: 503 });
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const categoryHint = CATEGORY_HINTS[category as number] ?? CATEGORY_HINTS[5];

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 512,
      messages: [
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: proofUrl, detail: "low" } },
            {
              type: "text",
              text: `You are verifying proof of service delivery for a shared subscription platform called Poolly.

Subscription plan: "${poolTitle}"
Category: ${categoryHint}

Analyze the image and determine if it is valid proof that the host has actually delivered the service this billing cycle.

REQUIREMENTS — all must be met for verified=true:
- Active subscription/account status must be clearly visible
- Correct plan/tier matching the pool description
- The screenshot must show a CURRENT billing date (within the last 35 days) or upcoming renewal date. Screenshots without any date are insufficient.
- The service name visible in the screenshot must match or be consistent with the pool title: "${poolTitle}"
- Clear evidence of service delivery (not a generic or promotional screenshot)
- No obvious signs of editing or fabrication

If confidence is below 60, set verified=false regardless of other signals.

Respond ONLY with a JSON object (no markdown, no explanation outside the JSON):
{
  "verified": <true if this is valid proof, false otherwise>,
  "confidence": <integer 0-100>,
  "explanation": "<1-2 clear sentences explaining your verdict>",
  "issues": [<list any problems, empty array if none>],
  "suggestions": [<list what better proof would look like if rejected, empty if verified>]
}`,
            },
          ],
        },
      ],
    });

    const text = response.choices[0]?.message?.content?.trim() ?? "";
    const cleaned = text.replace(/^```json\s*/i, "").replace(/\s*```$/, "");
    const result: VerifyResult = JSON.parse(cleaned);

    // Enforce confidence threshold — reject if below 60 regardless of AI verdict
    if (result.confidence < 60) {
      result.verified = false;
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("verify-proof error:", err);
    return NextResponse.json(
      { error: "Verification failed", detail: String(err) },
      { status: 500 }
    );
  }
}
