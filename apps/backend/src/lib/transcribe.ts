import OpenAI, { toFile } from "openai";

// Lazy singleton — OPENAI_API_KEY may not be set in every environment.
let _openai: null | OpenAI = null;

function getClient(): OpenAI {
  _openai ??= new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  return _openai;
}

/**
 * Transcribe an audio buffer via OpenAI Whisper (whisper-1).
 * Auto-detects language; accepts audio/webm or audio/mp4 produced by MediaRecorder.
 */
export async function transcribeAudio(
  buffer: Buffer,
  mimeType: string,
): Promise<string> {
  const ext = mimeType.includes("mp4") ? "mp4" : "webm";
  const file = await toFile(buffer, `recording.${ext}`, { type: mimeType });
  const response = await getClient().audio.transcriptions.create({
    model: "whisper-1",
    file,
  });
  return response.text;
}
