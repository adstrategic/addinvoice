import type React from "react";
import { AppLayout } from "@/components/app-layout";
import { FunnelGuard } from "@/components/guards/funnel-guard";

export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <FunnelGuard requiredStep="dashboard">
      <AppLayout>{children}</AppLayout>
    </FunnelGuard>
  );
}
