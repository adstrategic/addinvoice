import type React from "react";
import { FunnelGuard } from "@/components/guards/funnel-guard";
import { VoicePlanGate } from "./voice-plan-gate";

export default function VoiceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <FunnelGuard requiredStep="dashboard">
      <VoicePlanGate>{children}</VoicePlanGate>
    </FunnelGuard>
  );
}
