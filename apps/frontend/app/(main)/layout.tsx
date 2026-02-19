import type React from "react";
import { AppLayout } from "@/components/app-layout";
import { SubscriptionGuard } from "@/components/guards/subscription-guard";

export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <SubscriptionGuard>
      <AppLayout>{children}</AppLayout>
    </SubscriptionGuard>
  );
}
