import {
  type JobContext,
  type JobProcess,
  ServerOptions,
  cli,
  defineAgent,
  voice,
} from "@livekit/agents";
import * as silero from "@livekit/agents-plugin-silero";
import * as livekit from "@livekit/agents-plugin-livekit";
import { BackgroundVoiceCancellation } from "@livekit/noise-cancellation-node";
import { fileURLToPath } from "node:url";
import dotenv from "dotenv";
import { InvoiceAgent } from "./agents/invoice.agent.js";
import type { InvoiceSessionData } from "./types/session-data.js";

dotenv.config({ path: ".env.local" });

export default defineAgent({
  // Prewarm: Load models once per process
  prewarm: async (proc: JobProcess) => {
    proc.userData.vad = await silero.VAD.load();
  },

  entry: async (ctx: JobContext) => {
    // Extract workspace from participant metadata (set by backend token)
    const participantMetadata = JSON.parse(
      ctx.room.localParticipant?.metadata || "{}",
    );
    const workspaceId =
      participantMetadata.workspaceId ||
      parseInt(process.env.DEFAULT_WORKSPACE_ID || "1");

    console.log(`Starting invoice agent for workspace ${workspaceId}`);

    // Initialize session data
    const sessionData: InvoiceSessionData = {
      workspaceId,
      currentInvoice: null,
      ctx,
    };

    // Load prewarmed VAD
    const vad = ctx.proc.userData.vad as silero.VAD;

    // Create agent session with Groq models (via LiveKit Inference)
    // const session = new voice.AgentSession<InvoiceSessionData>({
    //   userData: sessionData,
    //   vad,
    //   stt: "groq/whisper-large-v3",              // Fast transcription
    //   llm: "groq/llama-3.3-70b-versatile",      // Smart LLM
    //   tts: "groq/playai-tts",                    // Natural speech
    //   turnDetection: new livekit.turnDetector.MultilingualModel(),
    // });
    const session = new voice.AgentSession<InvoiceSessionData>({
      userData: sessionData,
      vad,
      stt: "assemblyai/universal-streaming", // Fast transcription
      llm: "openai/gpt-4o", // Smart LLM
      tts: "cartesia/sonic-2", // Natural speech
      turnDetection: new livekit.turnDetector.MultilingualModel(),
    });

    // Start session with invoice agent
    await session.start({
      agent: new InvoiceAgent(),
      room: ctx.room,
      inputOptions: {
        noiseCancellation: BackgroundVoiceCancellation(),
      },
    });

    await ctx.connect();

    // Initial greeting
    await session.generateReply({
      instructions:
        "Greet the user and ask how you can help them create an invoice today.",
    });
  },
});

// Run the agent worker
cli.runApp(new ServerOptions({ agent: fileURLToPath(import.meta.url) }));
