'use client';

import { useState } from 'react';
import { useRoomContext, useLocalParticipant } from '@livekit/components-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Mic, MicOff, Volume2, VolumeX, PhoneOff, Settings } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface VoiceControlsProps {
  className?: string;
  onDisconnect?: () => void;
}

export function VoiceControls({ className, onDisconnect }: VoiceControlsProps) {
  const room = useRoomContext();
  const localParticipant = useLocalParticipant();
  const [micEnabled, setMicEnabled] = useState(true);
  const [volumeEnabled, setVolumeEnabled] = useState(true);

  const toggleMicrophone = async () => {
    if (!localParticipant.localParticipant) return;

    try {
      const audioTrack = localParticipant.localParticipant.audioTrackPublications.values().next()
        .value?.track;

      if (audioTrack) {
        if (micEnabled) {
          await audioTrack.stop();
        } else {
          await audioTrack.start();
        }
        setMicEnabled(!micEnabled);
      } else {
        // Try to enable/disable microphone via room
        const tracks = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        if (micEnabled) {
          tracks.getTracks().forEach((track) => track.stop());
        }
        setMicEnabled(!micEnabled);
      }
    } catch (error) {
      console.error('Error toggling microphone:', error);
    }
  };

  const toggleVolume = () => {
    setVolumeEnabled(!volumeEnabled);
    // Note: Volume control would typically be handled by audio element
    // This is a UI state toggle
  };

  const handleDisconnect = async () => {
    if (room) {
      await room.disconnect();
      onDisconnect?.();
    }
  };

  return (
    <div className={cn('flex items-center justify-center gap-2 flex-wrap', className)}>
      {/* Microphone Toggle */}
      <Button
        variant={micEnabled ? 'default' : 'outline'}
        size="icon"
        onClick={toggleMicrophone}
        className={cn(
          'h-10 w-10 md:h-12 md:w-12 rounded-full transition-all',
          micEnabled && 'bg-primary hover:bg-primary/90'
        )}
        aria-label={micEnabled ? 'Mute microphone' : 'Unmute microphone'}
      >
        {micEnabled ? (
          <Mic className="h-4 w-4 md:h-5 md:w-5" />
        ) : (
          <MicOff className="h-4 w-4 md:h-5 md:w-5" />
        )}
      </Button>

      {/* Volume Toggle */}
      <Button
        variant={volumeEnabled ? 'default' : 'outline'}
        size="icon"
        onClick={toggleVolume}
        className={cn(
          'h-10 w-10 md:h-12 md:w-12 rounded-full transition-all',
          volumeEnabled && 'bg-primary hover:bg-primary/90'
        )}
        aria-label={volumeEnabled ? 'Mute volume' : 'Unmute volume'}
      >
        {volumeEnabled ? (
          <Volume2 className="h-4 w-4 md:h-5 md:w-5" />
        ) : (
          <VolumeX className="h-4 w-4 md:h-5 md:w-5" />
        )}
      </Button>

      {/* Settings Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="h-10 w-10 md:h-12 md:w-12 rounded-full">
            <Settings className="h-4 w-4 md:h-5 md:w-5" />
            <span className="sr-only">Settings</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem disabled>Audio Device Settings</DropdownMenuItem>
          <DropdownMenuItem disabled>Connection Quality</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Disconnect Button */}
      <Button
        variant="destructive"
        size="icon"
        onClick={handleDisconnect}
        className="h-10 w-10 md:h-12 md:w-12 rounded-full transition-all"
        aria-label="Disconnect"
      >
        <PhoneOff className="h-4 w-4 md:h-5 md:w-5" />
      </Button>
    </div>
  );
}
