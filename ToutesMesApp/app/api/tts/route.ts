import OpenAI from "openai";

export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return new Response("Missing OPENAI_API_KEY", { status: 500 });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const { text, voice = "alloy" } = await req.json();

    if (!text || typeof text !== "string") {
      return new Response("Missing text", { status: 400 });
    }

    const safeText = text.trim().slice(0, 1500);
    if (!safeText) return new Response("Empty text", { status: 400 });

    const speech = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice,
      input: safeText,
      response_format: "mp3", // ✅ au lieu de "format"
    });

    const arrayBuffer = await speech.arrayBuffer();

    return new Response(Buffer.from(arrayBuffer), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    const msg = err?.message || "TTS error";
    console.error("TTS error:", msg);
    return new Response(`TTS error: ${msg}`, { status: 500 });
  }
}
