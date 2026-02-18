'use client';

import { useVoiceAssistant, BarVisualizer } from '@livekit/components-react';
import { cn } from '@/lib/utils';
import { Mic, Loader2, Brain, Volume2 } from 'lucide-react';

type AgentState = 'initializing' | 'listening' | 'thinking' | 'speaking';

interface VoiceVisualizerProps {
  className?: string;
}

export function VoiceVisualizer({ className }: VoiceVisualizerProps) {
  const { state, audioTrack } = useVoiceAssistant();

  const getStateColor = (state: AgentState): string => {
    switch (state) {
      case 'listening':
        return 'text-blue-500';
      case 'thinking':
        return 'text-yellow-500';
      case 'speaking':
        return 'text-green-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStateIcon = (state: AgentState) => {
    switch (state) {
      case 'initializing':
        return <Loader2 className="h-6 w-6 animate-spin" />;
      case 'listening':
        return <Mic className="h-6 w-6" />;
      case 'thinking':
        return <Brain className="h-6 w-6" />;
      case 'speaking':
        return <Volume2 className="h-6 w-6" />;
      default:
        return <Mic className="h-6 w-6" />;
    }
  };

  const getStateLabel = (state: AgentState): string => {
    switch (state) {
      case 'initializing':
        return 'Initializing...';
      case 'listening':
        return 'Listening';
      case 'thinking':
        return 'Thinking';
      case 'speaking':
        return 'Speaking';
      default:
        return 'Ready';
    }
  };

  return (
    <div className={cn('flex flex-col items-center justify-center space-y-6', className)}>
      {/* Audio Visualizer */}
      <div className="flex items-center justify-center h-32 w-full max-w-md">
        <BarVisualizer
          state={state as AgentState}
          barCount={7}
          trackRef={audioTrack}
          options={{
            minHeight: 8,
            maxHeight: 64,
          }}
          className="w-full"
        />
      </div>

      {/* State Display */}
      <div className="flex flex-col items-center space-y-2">
        <div className={cn('flex items-center gap-2', getStateColor(state as AgentState))}>
          {getStateIcon(state as AgentState)}
          <span className="text-lg font-semibold capitalize">
            {getStateLabel(state as AgentState)}
          </span>
        </div>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {state === 'initializing' && 'Setting up the voice assistant...'}
          {state === 'listening' && 'I\'m ready to help you create an invoice. Speak naturally.'}
          {state === 'thinking' && 'Processing your request...'}
          {state === 'speaking' && 'I\'m responding to you...'}
        </p>
      </div>
    </div>
  );
}
