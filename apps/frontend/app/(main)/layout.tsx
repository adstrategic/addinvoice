import type React from "react";
import { AppLayout } from "@/components/app-layout";

export default function MainLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return <AppLayout>{children}</AppLayout>;
}
