"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import {
  useSession,
  useSessionContext,
  useSessionMessages,
  useVoiceAssistant,
} from "@livekit/components-react";
import { TokenSource } from "livekit-client";
import "@livekit/components-styles";
import { apiClient } from "@/lib/api/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  ArrowLeftIcon,
  History,
  Loader2,
  MessageSquareTextIcon,
  XIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { AgentAudioVisualizerAura } from "@/components/agents-ui/agent-audio-visualizer-aura";
import { AgentSessionProvider } from "@/components/agents-ui/agent-session-provider";
import { AgentControlBar } from "@/components/agents-ui/agent-control-bar";
import { AgentChatTranscript } from "@/components/agents-ui/agent-chat-transcript";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AgentAudioVisualizerWave } from "@/components/agents-ui/agent-audio-visualizer-wave";
import Image from "next/image";
import { AgentChatIndicator } from "@/components/agents-ui/agent-chat-indicator";
import { Button } from "@/components/ui/button";

export default function VoiceInvoicePage() {
  const { user, isLoaded: userLoaded } = useUser();
  const router = useRouter();
  const roomName = useMemo(() => `invoice-${Date.now()}`, []);
  const [connectionError, setConnectionError] = useState<Error | null>(null);

  // Create TokenSource that knows how to fetch tokens from your backend
  const tokenSource = useMemo(
    () =>
      TokenSource.custom(async (options) => {
        if (!user) {
          throw new Error("User not authenticated");
        }

        try {
          const response = await apiClient.post("/livekit/token", {
            room_name: options.roomName || roomName,
            participant_name:
              options.participantName ||
              user.fullName ||
              user.emailAddresses[0]?.emailAddress ||
              "User",
          });

          return {
            serverUrl: response.data.serverURL,
            participantToken: response.data.participantToken,
          };
        } catch (err: any) {
          console.error("Failed to get token:", err);
          throw new Error(
            err.response?.data?.error ||
              err.message ||
              "Failed to connect to voice assistant. Please try again.",
          );
        }
      }),
    [user, roomName],
  );

  // Create session with TokenSource
  const session = useSession(tokenSource, {
    roomName,
    participantName:
      user?.fullName || user?.emailAddresses[0]?.emailAddress || "User",
  });

  // Handle authentication redirect
  useEffect(() => {
    if (userLoaded && !user) {
      router.push("/sign-in");
    }
  }, [user, userLoaded, router]);

  // Start session when user is loaded and authenticated
  useEffect(() => {
    if (!userLoaded || !user) return;

    const startSession = async () => {
      try {
        setConnectionError(null);
        await session.start();
      } catch (err) {
        console.error("Failed to start session:", err);
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userLoaded, user]);

  const handleDisconnect = () => {
    session.end();
    // Optionally redirect or show a message
  };

  const handleMessageSent = (message: string) => {
    // Message sent successfully
    console.log("Message sent:", message);
  };

  const handleRetry = async () => {
    setConnectionError(null);
    try {
      await session.start();
    } catch (err) {
      setConnectionError(
        err instanceof Error
          ? err
          : new Error("Failed to connect to voice assistant"),
      );
    }
  };

  // Show loading state
  if (!userLoaded || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

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
            <button
              onClick={handleRetry}
              className="w-full rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              Retry Connection
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading while connecting
  if (!session.isConnected) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Connecting to voice assistant...
          </p>
        </div>
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

function VoiceAssistantContent({}: VoiceAssistantUIProps) {
  const session = useSessionContext();
  const { audioTrack, state } = useVoiceAssistant();
  const { messages } = useSessionMessages(session);
  const [isChatOpen, setisChatOpen] = useState(false);

  return (
    <div className="py-12 flex flex-col items-center justify-center bg-[#162135] h-screen">
      <Image
        src="/images/adstrategic-icon.png"
        alt="AddStrategic"
        width={100}
        height={100}
        className="mx-auto"
      />

      <AgentAudioVisualizerWave
        size="lg"
        state={state}
        blur={0.1}
        lineWidth={2}
        audioTrack={audioTrack}
      />

      {/* <div className=""> */}

      {/* <ScrollArea className="h-[150px] max-w-3xl  w-full mx-auto bg-background rounded-lg p-4 mb-12"> */}
      {isChatOpen && (
        <AgentChatTranscript
          agentState={state}
          messages={messages}
          className="max-w-3xl w-full mx-auto bg-background rounded-lg p-4 mb-12"
        />
      )}

      {/* </div> */}
      {/* </ScrollArea> */}

      <div className="flex gap-6 items-end justify-center">
        <Button
          onClick={() => setisChatOpen(!isChatOpen)}
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
          className="w-xl"
          controls={{
            camera: false,
            screenShare: false,
            leave: true,
            microphone: true,
            chat: true,
          }}
        />
      </div>
    </div>
  );
}

// interface VoiceAssistantUIProps {
//   onDisconnect?: () => void;
//   onMessageSent?: (message: string) => void;
// }

// function VoiceAssistantUI({
//   onDisconnect,
//   onMessageSent,
// }: VoiceAssistantUIProps) {
//   return (
//     <div className="flex flex-col h-full max-w-7xl mx-auto w-full p-4 md:p-6 gap-4">
//       {/* Header */}
//       <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b">
//         <div>
//           <h1 className="text-xl md:text-2xl lg:text-3xl font-bold">
//             Voice Invoice Assistant
//           </h1>
//           <p className="text-xs md:text-sm text-muted-foreground mt-1">
//             Create invoices using natural conversation
//           </p>
//         </div>
//         <div className="w-full md:w-auto">
//           <SessionInfo />
//         </div>
//       </div>

//       {/* Main Content Area */}
//       <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 min-h-0">
//         {/* Left Column - Visualizer */}
//         <div className="lg:col-span-1 flex flex-col">
//           <Card className="flex-1 flex items-center justify-center p-4 md:p-6">
//             <CardContent className="w-full">
//               <VoiceVisualizer />
//             </CardContent>
//           </Card>
//         </div>

//         {/* Right Column - Transcription */}
//         <div className="lg:col-span-2 flex flex-col min-h-0">
//           <Card className="flex-1 flex flex-col min-h-0">
//             <CardHeader className="pb-3">
//               <CardTitle className="text-base md:text-lg">
//                 Conversation
//               </CardTitle>
//             </CardHeader>
//             <CardContent className="flex-1 min-h-0 p-0">
//               <TranscriptionDisplay className="h-full" />
//             </CardContent>
//           </Card>
//         </div>
//       </div>

//       {/* Chat Input */}
//       <div className="pt-4 border-t">
//         <ChatInput onMessageSent={onMessageSent} />
//       </div>

//       {/* Controls */}
//       <div className="pt-4 border-t">
//         <div className="flex flex-col items-center gap-3 md:gap-4">
//           <VoiceControls onDisconnect={onDisconnect} />
//           <div className="hidden md:block w-full max-w-md">
//             <VoiceAssistantControlBar />
//           </div>
//           <p className="text-xs text-muted-foreground text-center px-4">
//             Use the microphone button to speak, or type a message above
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }
