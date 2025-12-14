import OpenAI from "openai";

export const runtime = "nodejs";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { text, voice = "alloy" } = await req.json();

    if (!process.env.OPENAI_API_KEY) {
      return new Response("Missing OPENAI_API_KEY", { status: 500 });
    }

    if (!text || typeof text !== "string") {
      return new Response("Missing text", { status: 400 });
    }

    const safeText = text.trim().slice(0, 1500);
    if (!safeText) return new Response("Empty text", { status: 400 });

    const speech = await client.audio.speech.create({
      model: "gpt-4o-mini-tts",
      voice,
      input: safeText,
      format: "mp3",
    });

    const arrayBuffer = await speech.arrayBuffer();
    return new Response(Buffer.from(arrayBuffer), {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err: any) {
    // 🔥 important : renvoyer un message lisible au lieu d’un 502 opaque
    const msg =
      err?.response?.data?.error?.message ||
      err?.message ||
      "TTS error";
    console.error("TTS error:", msg);
    return new Response(`TTS error: ${msg}`, { status: 500 });
  }
}
