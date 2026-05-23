"use client";

import type React from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  useSidebar,
} from "@/components/ui/sidebar";

function MobileTopBar() {
  const { toggleSidebar } = useSidebar();

  return (
    <div className="fixed top-0 left-0 z-40 flex h-16 w-full items-center border-b border-border bg-background/95 px-4 backdrop-blur supports-backdrop-filter:bg-background/60 md:hidden">
      <Button
        variant="ghost"
        size="icon"
        type="button"
        data-tour-id="sidebar-mobile-trigger"
        onClick={() => {
          toggleSidebar();
          window.dispatchEvent(new CustomEvent("tour:sidebar-opened"));
        }}
      >
        <Menu className="h-5 w-5" />
        <span className="sr-only">Toggle menu</span>
      </Button>
      <span className="ml-2 text-lg font-semibold md:hidden">ADDINVOICES</span>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <Sidebar />
      <SidebarInset
        className="min-h-screen w-full bg-cover bg-center bg-fixed bg-no-repeat bg-[url('/images/bg_phone_dos.png')] dark:bg-[url('/images/bg_phone_dos_darkmode.png')] md:bg-[url('/images/background_app_dos.png')] dark:md:bg-[url('/images/background_app_dos_darkmode.png')]"
      >
        <MobileTopBar />
        <main className="mt-16 sm:mt-0 container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
