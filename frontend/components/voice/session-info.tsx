"use client";

import { useEffect, useState } from "react";
import {
  useRoomContext,
  useConnectionState,
  useParticipants,
} from "@livekit/components-react";
import { ConnectionState, Participant } from "livekit-client";
import { cn } from "@/lib/utils";
import { Wifi, WifiOff, Users, Clock, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface SessionInfoProps {
  className?: string;
}

export function SessionInfo({ className }: SessionInfoProps) {
  const room = useRoomContext();
  const connectionState = useConnectionState();
  const participants = useParticipants();
  const [sessionStartTime] = useState(new Date());
  const [sessionDuration, setSessionDuration] = useState("0s");
  const [error, setError] = useState<string | null>(null);

  // Update session duration
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionDuration(
        formatDistanceToNow(sessionStartTime, { includeSeconds: true }),
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [sessionStartTime]);

  // Monitor connection state
  useEffect(() => {
    if (!room) return;

    const handleDisconnected = () => {
      setError("Connection lost. Attempting to reconnect...");
    };

    const handleReconnected = () => {
      setError(null);
    };

    const handleError = (error: Error) => {
      setError(error.message);
    };

    room.on("disconnected", handleDisconnected);
    room.on("reconnected", handleReconnected);
    room.on("connectionQualityChanged", () => {
      // Connection quality changed
    });

    // Check for errors
    if (connectionState === "disconnected") {
      setError("Disconnected from server");
    } else {
      setError(null);
    }

    return () => {
      room.off("disconnected", handleDisconnected);
      room.off("reconnected", handleReconnected);
    };
  }, [room, connectionState]);

  // Find agent participant
  const agentParticipant = participants.find(
    (p: Participant) => p.kind === "agent",
  );

  const getConnectionStatus = () => {
    switch (connectionState) {
      case ConnectionState.Connected:
        return {
          icon: Wifi,
          label: "Connected",
          color: "text-green-500",
        };
      case ConnectionState.Connecting:
        return {
          icon: Wifi,
          label: "Connecting...",
          color: "text-yellow-500",
        };
      case ConnectionState.Disconnected:
        return {
          icon: WifiOff,
          label: "Disconnected",
          color: "text-red-500",
        };
      case ConnectionState.Reconnecting:
        return {
          icon: Wifi,
          label: "Reconnecting...",
          color: "text-yellow-500",
        };
      default:
        return {
          icon: WifiOff,
          label: "Unknown",
          color: "text-muted-foreground",
        };
    }
  };

  const status = getConnectionStatus();
  const StatusIcon = status.icon;

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {/* Connection Status */}
      <div className="flex items-center gap-2 text-sm">
        <StatusIcon className={cn("h-4 w-4", status.color)} />
        <span className={cn("font-medium", status.color)}>{status.label}</span>
      </div>

      {/* Session Details */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <Users className="h-3 w-3" />
          <span>
            {participants.length} participant
            {participants.length !== 1 ? "s" : ""}
          </span>
        </div>
        {agentParticipant && (
          <div className="flex items-center gap-1">
            <span className="h-2 w-2 rounded-full bg-green-500" />
            <span>Agent online</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          <span>{sessionDuration}</span>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Room Info */}
      {room && (
        <div className="text-xs text-muted-foreground">
          Room: {room.name || "Unknown"}
        </div>
      )}
    </div>
  );
}
