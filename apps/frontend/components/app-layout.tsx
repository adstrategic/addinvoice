"use client";

import type React from "react";
import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { BottomNav } from "@/components/bottom-nav";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SidebarProvider>
        <Sidebar />
        <SidebarInset className='min-h-screen bg-cover bg-center bg-fixed bg-no-repeat bg-[url("/images/bg_phone_dos.png")] dark:bg-[url("/images/bg_phone_dos_darkmode.png")] md:bg-[url("/images/background_app_dos.png")] dark:md:bg-[url("/images/background_app_dos_darkmode.png")]'>
          {/* Mobile top bar — no hamburger, bottom nav handles mobile navigation */}
          <div className="fixed top-0 left-0 z-40 flex h-16 w-full items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60 md:hidden">
            <span className="text-lg font-semibold">ADDINVOICES</span>
            <Link
              href="/ask-me-how"
              className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
            >
              <HelpCircle className="h-5 w-5" />
            </Link>
          </div>

          {/* Desktop help button */}
          <Link
            href="/ask-me-how"
            className="hidden md:flex fixed top-1 right-6 z-50 h-10 w-10 items-center justify-center rounded-full bg-background/80 border border-primary/20 text-primary hover:bg-primary/10 hover:scale-105 transition-all shadow-md backdrop-blur-md"
            title="Ask Me How"
          >
            <HelpCircle className="h-5 w-5" />
          </Link>

          <div className="absolute inset-0 bg-linear-to-br from-background/40 via-background/10 to-primary/5 pointer-events-none" />
          <main className="relative z-10 mt-16 pb-24 md:mt-0 md:pb-12 container mx-auto px-3 sm:px-6 py-6 sm:py-8">
            {children}
          </main>
        </SidebarInset>
      </SidebarProvider>
      <BottomNav />
    </>
  );
}
