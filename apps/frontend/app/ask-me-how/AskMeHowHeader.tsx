"use client";

import { Button } from "@/components/ui/button";
import { PlayCircle } from "lucide-react";

type AskMeHowHeaderProps = { onStartTour: () => void };

export function AskMeHowHeader({ onStartTour }: AskMeHowHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Ask Me How</h1>
        <p className="text-muted-foreground mt-1">
          Learn how to make the most of AddInvoices
        </p>
      </div>
      <Button
        onClick={onStartTour}
        className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg hover:shadow-primary/20 transition-all"
      >
        <PlayCircle className="mr-2 h-4 w-4" /> Start Guided Tour
      </Button>
    </div>
  );
}
