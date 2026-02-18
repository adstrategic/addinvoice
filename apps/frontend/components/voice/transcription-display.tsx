"use client";

import { useEffect, useRef, useState } from "react";
import { useRoomContext } from "@livekit/components-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { User, Bot } from "lucide-react";
import { format } from "date-fns";

interface TranscriptionMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  isFinal: boolean;
  segmentId?: string;
}

interface TranscriptionDisplayProps {
  className?: string;
}

export function TranscriptionDisplay({ className }: TranscriptionDisplayProps) {
  const room = useRoomContext();
  const [messages, setMessages] = useState<TranscriptionMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  const handlersRegisteredRef = useRef(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Register text stream handler for transcriptions
  useEffect(() => {
    if (!room || handlersRegisteredRef.current) return;

    // Handle transcription streams (lk.transcription topic)
    const handleTranscriptionStream = async (
      reader: any,
      participantInfo: any,
    ) => {
      try {
        const isAgent =
          participantInfo.kind === "agent" ||
          participantInfo.identity?.includes("agent") ||
          participantInfo.identity?.startsWith("agent");
        const isUser = !isAgent;

        // Check if this is a transcription
        const transcribedTrackId =
          reader.info.attributes?.["lk.transcribed_track_id"];
        const isFinal =
          reader.info.attributes?.["lk.transcription_final"] === "true";
        const segmentId =
          reader.info.attributes?.["lk.segment_id"] ||
          `${Date.now()}-${Math.random()}`;

        // Read the text stream
        const text = await reader.readAll();

        if (!text || text.trim().length === 0) return;

        // Update or create message based on segment ID
        setMessages((prev) => {
          const newMessages = [...prev];

          // Find existing message with same segment ID (for interim updates)
          const existingIndex = newMessages.findIndex(
            (msg) => msg.segmentId === segmentId,
          );

          const newMessage: TranscriptionMessage = {
            id: segmentId,
            text: text.trim(),
            isUser,
            timestamp: new Date(),
            isFinal,
            segmentId,
          };

          if (existingIndex >= 0) {
            // Update existing interim message
            newMessages[existingIndex] = newMessage;
          } else {
            // Add new message
            newMessages.push(newMessage);
          }

          // Remove interim messages when final arrives
          if (isFinal) {
            return newMessages.filter(
              (msg) => msg.segmentId !== segmentId || msg.isFinal,
            );
          }

          return newMessages;
        });
      } catch (error) {
        console.error("Error processing transcription stream:", error);
      }
    };

    // Also handle chat messages (lk.chat topic)
    const handleChatStream = async (reader: any, participantInfo: any) => {
      try {
        const isAgent =
          participantInfo.kind === "agent" ||
          participantInfo.identity?.includes("agent");
        const isUser = !isAgent;

        const text = await reader.readAll();

        if (!text || text.trim().length === 0) return;

        setMessages((prev) => [
          ...prev,
          {
            id: `${Date.now()}-${Math.random()}`,
            text: text.trim(),
            isUser,
            timestamp: new Date(),
            isFinal: true,
          },
        ]);
      } catch (error) {
        console.error("Error processing chat stream:", error);
      }
    };

    // Register handlers only once per room instance
    try {
      room.registerTextStreamHandler(
        "lk.transcription",
        handleTranscriptionStream,
      );
      room.registerTextStreamHandler("lk.chat", handleChatStream);
      handlersRegisteredRef.current = true;
    } catch (error) {
      console.error("Error registering text stream handlers:", error);
    }

    return () => {
      // Reset flag when room changes or component unmounts
      // This allows re-registration if a new room is provided
      handlersRegisteredRef.current = false;
    };
  }, [room]);

  return (
    <ScrollArea className={cn("h-full", className)}>
      <div ref={scrollRef} className="flex flex-col space-y-4 p-4">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            <p className="text-sm">Conversation will appear here...</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={cn(
                "flex gap-3 max-w-[85%]",
                message.isUser ? "ml-auto flex-row-reverse" : "mr-auto",
              )}
            >
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full shrink-0",
                  message.isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-secondary-foreground",
                )}
              >
                {message.isUser ? (
                  <User className="h-4 w-4" />
                ) : (
                  <Bot className="h-4 w-4" />
                )}
              </div>
              <div
                className={cn(
                  "flex flex-col gap-1 rounded-lg px-4 py-2",
                  message.isUser
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground",
                  !message.isFinal && "opacity-70",
                )}
              >
                <p className="text-sm whitespace-pre-wrap break-words">
                  {message.text}
                  {!message.isFinal && (
                    <span className="inline-block w-2 h-4 ml-1 bg-current animate-pulse" />
                  )}
                </p>
                <span className="text-xs opacity-70">
                  {format(message.timestamp, "HH:mm:ss")}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
}
