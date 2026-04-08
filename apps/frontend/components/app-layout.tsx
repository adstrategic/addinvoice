"use client";

import type React from "react";

import { Sidebar } from "@/components/sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:pl-64">
        <main className="min-h-screen  w-full bg-cover bg-center bg-no-repeat bg-fixed bg-[url('/images/bg_phone_dos.png')] dark:bg-[url('/images/bg_phone_dos_darkmode.png')] md:bg-[url('/images/background_app_dos.png')] dark:md:bg-[url('/images/background_app_dos_darkmode.png')]">
          {children}
        </main>
      </div>
    </div>
  );
}
