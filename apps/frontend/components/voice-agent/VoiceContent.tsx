import {
  useAgent,
  useSession,
  useSessionContext,
  useSessionMessages,
} from "@livekit/components-react";
import { AlertCircle, History, Loader2, XIcon } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Alert, AlertDescription, AlertTitle } from "../ui/alert";
import { Button } from "../ui/button";
import Image from "next/image";
import { AgentAudioVisualizerWave } from "../agents-ui/agent-audio-visualizer-wave";
import { AgentChatTranscript } from "../agents-ui/agent-chat-transcript";
import { AgentControlBar } from "../agents-ui/agent-control-bar";
import { TokenSource } from "livekit-client";
import { AgentSessionProvider } from "../agents-ui/agent-session-provider";

const token_endpoint_url = `${process.env.NEXT_PUBLIC_API_URL ?? ""}/api/v1/livekit/token`;

export interface VoiceContentProps {
  token: string;
  refreshToken: () => Promise<void>;
  participant_name: string;
}

export function VoiceContent({
  token,
  refreshToken,
  participant_name,
}: VoiceContentProps) {
  const [connectionError, setConnectionError] = useState<Error | null>(null);
  const retry_after_token_ref = useRef(false);

  // useSession expects camelCase; we use snake_case internally and map at the SDK boundary
  const sessionOptions = useMemo(() => {
    const agent_name = process.env.NEXT_PUBLIC_LIVEKIT_AGENT_NAME;
    return {
      participantName: participant_name,
      ...(agent_name && { agentName: agent_name }),
    };
  }, [participant_name]);

  const tokenSource = useMemo(
    () =>
      TokenSource.endpoint(token_endpoint_url, {
        headers: { Authorization: `Bearer ${token}` },
      }),
    [token],
  );

  const session = useSession(tokenSource, sessionOptions);

  // Start session on mount (token is guaranteed by parent); cleanup on unmount
  useEffect(() => {
    const startSession = async () => {
      try {
        setConnectionError(null);
        await session.start();
      } catch (err) {
        setConnectionError(
          err instanceof Error
            ? err
            : new Error("Failed to connect to voice assistant"),
        );
      }
    };

    startSession();

    return () => {
      session.end();
    };
  }, []);

  // After retry: parent updated token -> new tokenSource -> start session
  useEffect(() => {
    if (!retry_after_token_ref.current) return;
    retry_after_token_ref.current = false;
    session.start().catch((err) => {
      console.error("Failed to start session on retry:", err);
      setConnectionError(
        err instanceof Error
          ? err
          : new Error("Failed to connect to voice assistant"),
      );
    });
  }, [token, session]);

  const handleRetry = async () => {
    setConnectionError(null);
    retry_after_token_ref.current = true;
    await refreshToken();
  };

  // Show error state
  if (connectionError) {
    return (
      <div className="flex items-center justify-center min-h-screen p-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>Connection Error</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Failed to Connect</AlertTitle>
              <AlertDescription>
                {connectionError.message ||
                  "Failed to connect to voice assistant. Please try again."}
              </AlertDescription>
            </Alert>
            <Button onClick={handleRetry} className="w-full">
              Retry Connection
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <AgentSessionProvider session={session}>
      <VoiceAssistantContent />
    </AgentSessionProvider>
  );
}

interface VoiceAssistantUIProps {}

export function VoiceAssistantContent(_props: VoiceAssistantUIProps) {
  const session = useSessionContext();
  const agent = useAgent();
  const { messages } = useSessionMessages(session);
  const [isChatOpen, setIsChatOpen] = useState(false);

  if (!agent.isConnected) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[#162135]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-sm text-white">
          Connecting to voice assistant...
        </p>
      </div>
    );
  }

  return (
    <div className="py-12 flex flex-col items-center justify-center bg-[#162135] min-h-screen px-2">
      <Image
        src="/images/adstrategic-icon.png"
        alt="AddStrategic"
        width={100}
        height={100}
        className="mx-auto"
      />

      <AgentAudioVisualizerWave
        size="lg"
        state={agent.state}
        blur={0.1}
        lineWidth={2}
        audioTrack={agent.microphoneTrack}
      />

      {isChatOpen && (
        <AgentChatTranscript
          agentState={agent.state}
          messages={messages}
          className="max-w-3xl max-h-[200px] overflow-y-auto w-full mx-auto bg-background rounded-lg p-4 mb-12"
        />
      )}

      <div className="flex flex-wrap gap-6 items-end justify-center">
        <Button
          onClick={() => setIsChatOpen(!isChatOpen)}
          className="rounded-full h-14"
          size="lg"
        >
          {isChatOpen ? (
            <>
              <XIcon className="w-4 h-4" />
              Close chat
            </>
          ) : (
            <>
              <History className="w-4 h-4" />
              Open chat
            </>
          )}
        </Button>

        <AgentControlBar
          variant="livekit"
          isChatOpen={false}
          isConnected={true}
          className="w-full max-w-xl"
          controls={{
            camera: false,
            screenShare: false,
            leave: true,
            microphone: true,
            chat: true,
          }}
          onDisconnect={() => {
            session.end();
            window.location.href = "/";
          }}
        />
      </div>
    </div>
  );
}
