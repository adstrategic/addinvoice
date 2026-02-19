import type React from "react";
import { SubscriptionGuard } from "@/components/guards/subscription-guard";

export default function VoiceLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <SubscriptionGuard>{children}</SubscriptionGuard>;
}
