import {
  type JobContext,
  type JobProcess,
  ServerOptions,
  cli,
  defineAgent,
  inference,
  voice,
} from '@livekit/agents';
import * as livekit from '@livekit/agents-plugin-livekit';
import * as silero from '@livekit/agents-plugin-silero';
import { BackgroundVoiceCancellation } from '@livekit/noise-cancellation-node';
import 'dotenv/config';
import { fileURLToPath } from 'node:url';
import { AddInvoicesRootAgent } from './agent';
import {
  type SupportedLanguage,
  getCartesiaLanguageCode,
  getCartesiaVoiceId,
  getDeepgramLanguageCode,
  normalizeAgentLanguage,
} from './i18n/language';
import type { InvoiceSessionData } from './types/session-data';

export default defineAgent({
  prewarm: async (proc: JobProcess) => {
    proc.userData.vad = await silero.VAD.load();
  },
  entry: async (ctx: JobContext) => {
    // Extract workspace from participant metadata (set by backend token)
    const jobMetadata = JSON.parse(ctx.job.metadata || '{}');
    console.log('jobMetadata', jobMetadata);
    const workspaceId = Number(jobMetadata.workspaceId);
    const language: SupportedLanguage = normalizeAgentLanguage(jobMetadata.language);

    if (!workspaceId) {
      throw new Error('Workspace ID is required');
    }

    // Initialize session data
    const sessionData: InvoiceSessionData = {
      workspaceId,
      currentInvoice: null,
      currentEstimate: null,
      currentCatalog: null,
      currentClientDraft: null,
      currentPayment: null,
      currentExpense: null,
      ctx,
      language,
    };

    const cartesiaVoiceId = getCartesiaVoiceId(language);

    // Set up a voice AI pipeline using OpenAI, Cartesia, Deepgram, and the LiveKit turn detector
    const session = new voice.AgentSession({
      userData: sessionData,
      // Speech-to-text (STT) is your agent's ears, turning the user's speech into text that the LLM can understand
      // See all available models at https://docs.livekit.io/agents/models/stt/
      stt: new inference.STT({
        model: 'deepgram/nova-3',
        language: getDeepgramLanguageCode(language),
      }),

      // A Large Language Model (LLM) is your agent's brain, processing user input and generating a response
      // See all providers at https://docs.livekit.io/agents/models/llm/
      llm: new inference.LLM({
        model: 'openai/gpt-4.1-mini',
      }),

      // Text-to-speech (TTS) is your agent's voice, turning the LLM's text into speech that the user can hear
      // See all available models as well as voice selections at https://docs.livekit.io/agents/models/tts/
      tts: new inference.TTS({
        model: 'cartesia/sonic-3',
        // voice: '9626c31c-bec5-4cca-baa8-f8ba9e84c8bc',
        language: getCartesiaLanguageCode(language),
        ...(cartesiaVoiceId ? { voice: cartesiaVoiceId } : {}),
      }),

      // VAD and turn detection are used to determine when the user is speaking and when the agent should respond
      // See more at https://docs.livekit.io/agents/build/turns
      turnDetection: new livekit.turnDetector.MultilingualModel(),
      vad: ctx.proc.userData.vad! as silero.VAD,
      voiceOptions: {
        // Allow the LLM to generate a response while waiting for the end of turn
        preemptiveGeneration: true,
        // Maximum consecutive tool calls per LLM turn (default 3). See https://docs.livekit.io/agents/logic/sessions/
        maxToolSteps: 5,
      },
    });

    // To use a realtime model instead of a voice pipeline, use the following session setup instead.
    // (Note: This is for the OpenAI Realtime API. For other providers, see https://docs.livekit.io/agents/models/realtime/))
    // 1. Install '@livekit/agents-plugin-openai'
    // 2. Set OPENAI_API_KEY in .env.local
    // 3. Add import `import * as openai from '@livekit/agents-plugin-openai'` to the top of this file
    // 4. Use the following session setup instead of the version above
    // const session = new voice.AgentSession({
    //   llm: new openai.realtime.RealtimeModel({ voice: 'marin' }),
    // });

    // Start the session, which initializes the voice pipeline and warms up the models
    await session.start({
      agent: new AddInvoicesRootAgent({ language }),
      room: ctx.room,
      inputOptions: {
        // LiveKit Cloud enhanced noise cancellation
        // - If self-hosting, omit this parameter
        // - For telephony applications, use `BackgroundVoiceCancellationTelephony` for best results
        noiseCancellation: BackgroundVoiceCancellation(),
      },
    });

    // Join the room and connect to the user
    await ctx.connect();
  },
});

// Run the agent server
cli.runApp(
  new ServerOptions({
    agent: fileURLToPath(import.meta.url),
  }),
);
