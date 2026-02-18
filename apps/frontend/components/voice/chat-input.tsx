'use client';

import { useState, FormEvent } from 'react';
import { useRoomContext } from '@livekit/components-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Send, Mic } from 'lucide-react';

interface ChatInputProps {
  className?: string;
  onMessageSent?: (message: string) => void;
}

export function ChatInput({ className, onMessageSent }: ChatInputProps) {
  const room = useRoomContext();
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || !room || isSending) return;

    setIsSending(true);
    
    try {
      // Send message via LiveKit text stream (lk.chat topic)
      // This is the standard way to send text to agents
      await room.localParticipant.sendText(message.trim(), {
        topic: 'lk.chat',
      });

      // Callback to notify parent
      onMessageSent?.(message.trim());
      
      // Clear input
      setMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cn('flex gap-2', className)}>
      <div className="flex-1 relative">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message or use voice..."
          className="w-full rounded-lg border border-input bg-background px-4 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          disabled={isSending || !room}
        />
        <Mic className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      </div>
      <Button
        type="submit"
        disabled={!message.trim() || isSending || !room}
        size="icon"
        className="shrink-0"
      >
        <Send className="h-4 w-4" />
        <span className="sr-only">Send message</span>
      </Button>
    </form>
  );
}
