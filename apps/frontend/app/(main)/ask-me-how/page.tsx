"use client";

import { useState } from "react";
import { useTour } from "@/components/tour/TourContext";
import { TourSelectionModal } from "@/components/tour/TourSelectionModal";
import { AskMeHowHeader } from "./AskMeHowHeader";
import { TutorialsSection } from "./TutorialsSection";

export default function AskMeHowPage() {
  const { startTour } = useTour();
  const [tourModalOpen, setTourModalOpen] = useState(false);

  const handleStartTour = () => {
    setTourModalOpen(true);
  };

  return (
    <>
      <div className="max-w-6xl mx-auto space-y-8">
        <AskMeHowHeader onStartTour={handleStartTour} />
        <div className="grid gap-8">
          <TutorialsSection onStartTour={handleStartTour} />
        </div>
      </div>
      <TourSelectionModal
        open={tourModalOpen}
        onOpenChange={setTourModalOpen}
        onSelectTour={startTour}
      />
    </>
  );
}
