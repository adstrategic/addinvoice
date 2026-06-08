"use client";

import { Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHaptic } from "@/hooks/use-haptic";

interface VoiceCreateFabProps {
  onClick: () => void;
  ariaLabel: string;
  tourId?: string;
}

export function VoiceCreateFab({
  onClick,
  ariaLabel,
  tourId,
}: VoiceCreateFabProps) {
  const { triggerHaptic } = useHaptic();

  const handleMobileClick = () => {
    triggerHaptic("light");
    onClick();
  };

  return (
    <>
      {/* Mobile — sits to the left of the + button in bottom nav */}
      <button
        type="button"
        onClick={handleMobileClick}
        aria-label={ariaLabel}
        data-tour-id={tourId}
        className="md:hidden fixed bottom-24 right-21 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-linear-to-br from-background to-secondary border-2 border-primary/30 shadow-[0_4px_12px_rgba(0,117,135,0.2)] text-primary overflow-hidden active:scale-90 transition-transform duration-150"
      >
        <Mic className="h-5 w-5" />
      </button>

      {/* Desktop — large floating action button */}
      <Button
        type="button"
        size="icon-lg"
        className="hidden md:flex fixed bottom-6 right-6 z-40 size-18 rounded-full shadow-lg hover:shadow-xl"
        onClick={onClick}
        aria-label={ariaLabel}
        data-tour-id={tourId}
      >
        <Mic className="size-8" />
      </Button>
    </>
  );
}
