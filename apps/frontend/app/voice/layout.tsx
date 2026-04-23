import type React from "react";
import { SubscriptionGuard } from "@/components/guards/subscription-guard";
import { VoicePlanGate } from "./voice-plan-gate";

export default function VoiceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SubscriptionGuard>
      <VoicePlanGate>{children}</VoicePlanGate>
    </SubscriptionGuard>
  );
}
