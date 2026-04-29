"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
import {
  SidebarContent as ShadcnSidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  Sidebar as SidebarRoot,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  FileCheck,
  CreditCard,
  Receipt,
  Package,
  Mic,
  HelpCircle,
  Moon,
  Sun,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Voice Assistant", href: "/voice", icon: Mic },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Advances", href: "/advances", icon: FileCheck },
  { name: "Payments", href: "/payments", icon: CreditCard },
  // { name: "Reminders", href: "/reminders", icon: Bell },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Catalog", href: "/catalog", icon: Package },
  { name: "Estimates", href: "/estimates", icon: FileCheck },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Ask Me How", href: "/ask-me-how", icon: HelpCircle },
  { name: "Configuration", href: "/configuration", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { isMobile, setOpenMobile } = useSidebar();

  const handleNavigate = React.useCallback(() => {
    if (isMobile) {
      setOpenMobile(false);
    }
  }, [isMobile, setOpenMobile]);

  return (
    <SidebarRoot side="left" variant="sidebar" collapsible="offcanvas">
      <SidebarHeader className="flex h-16 shrink-0 flex-row items-center gap-3 border-b border-sidebar-border px-6 py-0">
        <Image
          src="/images/addinvoices-icon.png"
          alt="ADDINVOICES"
          width={32}
          height={32}
          className="h-16 w-16 -rotate-45"
        />
        <span className="text-sm font-semibold text-sidebar-foreground sm:text-lg">
          ADDINVOICES
        </span>
      </SidebarHeader>

      <ShadcnSidebarContent className="px-3 py-4">
        <SidebarMenu className="gap-0.5">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            const tourId =
              item.href === "/"
                ? "dashboard"
                : item.href.slice(1).replace(/\//g, "-");
            return (
              <SidebarMenuItem key={item.name}>
                <SidebarMenuButton
                  asChild
                  isActive={isActive}
                  className={cn(
                    "h-auto min-h-0 gap-3 rounded-md border-l-2 border-transparent px-3 py-2.5 text-sm font-medium transition-colors",
                    "data-[active=true]:border-sidebar-primary data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-foreground",
                    !isActive &&
                      "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                  )}
                >
                  <Link
                    href={item.href}
                    onClick={handleNavigate}
                    data-tour-id={`sidebar-nav-${tourId}`}
                  >
                    <item.icon className="h-4 w-4 shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </ShadcnSidebarContent>

      <SidebarFooter className="space-y-4 border-t border-sidebar-border p-4">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full justify-start gap-3 border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
        >
          {theme === "dark" ? (
            <>
              <Sun className="h-4 w-4 shrink-0" />
              Light mode
            </>
          ) : (
            <>
              <Moon className="h-4 w-4 shrink-0" />
              Dark mode
            </>
          )}
        </Button>
        <div className="text-center">
          <p className="text-xs text-sidebar-foreground/50">Powered by</p>
          <Image
            src="/images/addstrategic-blanco.png"
            alt="ADSTRATEGIC"
            width={120}
            height={24}
            className="mx-auto mt-1 h-7 w-auto opacity-70"
          />
        </div>
      </SidebarFooter>
    </SidebarRoot>
  );
}
