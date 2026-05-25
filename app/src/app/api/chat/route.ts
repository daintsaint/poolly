import Groq from "groq-sdk";
import { NextRequest } from "next/server";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const SYSTEM = `You are "Ask Poolly", a helpful AI assistant embedded in Poolly — a Solana-powered platform where people share subscription costs using trustless on-chain escrow.

Your expertise:
- Subscription cost optimization (Netflix, Spotify, Microsoft 365, Adobe CC, Notion, iCloud, NordVPN, etc.)
- How Poolly works: hosts create plans, members pay into Solana escrow, funds release only after host submits verified proof of delivery
- Identifying good vs suspicious plans (verified on-chain = trustworthy)
- Calculating savings: typical retail prices vs Poolly split prices
- Local services (condo cleaning, tuition, food delivery) and how to split them

Tone: friendly, concise, smart. Use numbers and examples. Keep answers under 150 words unless a detailed breakdown is needed.

When asked "is this plan legit?", explain that all plans use Solana smart contract escrow — funds can't be stolen. The risk is that a host doesn't deliver, but that's why AI proof verification exists.

Common retail prices (monthly):
- Netflix Premium: $22.99, Standard: $15.49
- Spotify Individual: $11.99, Family: $17.99
- Microsoft 365 Personal: $9.99/mo or $69.99/yr
- Adobe CC: $59.99/mo
- iCloud+ 2TB: $9.99/mo
- NordVPN: $3.99-11.99/mo depending on plan
- Notion Plus: $16/mo
- Figma Professional: $15/editor/mo`;

export async function POST(req: NextRequest) {
  if (!process.env.GROQ_API_KEY) {
    return new Response(
      JSON.stringify({ error: "AI not configured" }),
      { status: 503, headers: { "Content-Type": "application/json" } }
    );
  }

  const { messages } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await groq.chat.completions.create({
          model: "llama-3.3-70b-versatile",
          max_tokens: 512,
          messages: [{ role: "system", content: SYSTEM }, ...messages],
          stream: true,
        });

        for await (const chunk of response) {
          const text = chunk.choices[0]?.delta?.content ?? "";
          if (text) {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify({ text })}\n\n`)
            );
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]\n\n"));
      } catch (err) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: String(err) })}\n\n`)
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
