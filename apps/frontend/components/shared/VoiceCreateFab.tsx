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
        className="md:hidden fixed bottom-24 right-21 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-white border-2 border-[#007587]/35 shadow-[0_4px_14px_rgba(0,117,135,0.25)] text-[#007587] overflow-hidden active:scale-90 transition-transform duration-150"
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
