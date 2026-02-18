"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PlayCircle, GraduationCap } from "lucide-react";

type TutorialsSectionProps = { onStartTour: () => void };

export function TutorialsSection({ onStartTour }: TutorialsSectionProps) {
  return (
    <div className="lg:col-span-2 space-y-8">
      <Card className="bg-gradient-to-r from-primary/10 via-transparent to-transparent border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            New to AddInvoices?
          </CardTitle>
          <CardDescription>
            Take a quick interactive tour to see where everything is.
          </CardDescription>
        </CardHeader>
        <CardFooter>
          <Button
            variant="outline"
            onClick={onStartTour}
            className="w-full sm:w-auto border-primary/50 text-foreground hover:bg-primary/10"
          >
            Restart Onboarding Tour
          </Button>
        </CardFooter>
      </Card>
      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
          <PlayCircle className="h-5 w-5 text-primary" />
          Video Tutorials
        </h2>
        <Card className="border-dashed border-border flex flex-col items-center justify-center p-8 text-center min-h-[180px]">
          <p className="text-muted-foreground text-sm">
            Video tutorials are coming soon. Use the guided tour or the help
            assistant in the meantime.
          </p>
        </Card>
      </div>
    </div>
  );
}
