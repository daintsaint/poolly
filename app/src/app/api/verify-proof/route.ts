import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const CATEGORY_HINTS: Record<number, string> = {
  0: "streaming service (Netflix, Spotify, Disney+, etc.) — look for account page, subscription plan, active status, and member slots",
  1: "productivity tool (Notion, Microsoft 365, Google Workspace, etc.) — check plan type, license count, billing status",
  2: "fitness service — check membership status, active subscription screen, or booking confirmation",
  3: "local service (cleaning, delivery, etc.) — look for receipt, completion photo, booking confirmation, or before/after photos",
  4: "professional tool (Adobe, Figma, GitHub, etc.) — check subscription/plan page, seats, billing",
  5: "subscription service — verify active status and plan details",
};

export interface VerifyResult {
  verified: boolean;
  confidence: number;
  explanation: string;
  issues: string[];
  suggestions: string[];
}

export async function POST(req: NextRequest) {
  try {
    const { proofUrl, poolTitle, category } = await req.json();

    if (!proofUrl || typeof proofUrl !== "string") {
      return NextResponse.json({ error: "proofUrl required" }, { status: 400 });
    }
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "AI verification not configured" }, { status: 503 });
    }

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

Look for:
- Active subscription/account status
- Correct plan/tier matching the pool description
- Recent date or timestamp if visible
- Clear evidence of service delivery (not a generic screenshot)
- No obvious signs of editing or fabrication

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

    return NextResponse.json(result);
  } catch (err) {
    console.error("verify-proof error:", err);
    return NextResponse.json(
      { error: "Verification failed", detail: String(err) },
      { status: 500 }
    );
  }
}
