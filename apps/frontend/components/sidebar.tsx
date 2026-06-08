"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useTheme } from "@/components/theme-provider";
import { Button } from "@/components/ui/button";
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
  FilePen,
  Bell,
  ClipboardList,
} from "lucide-react";
import {
  Sidebar as SidebarRoot,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useSubscription } from "@/hooks/use-subscription";
import { planAllowsAdvances } from "@/features/subscriptions/lib/subscription-access";

interface NavItem {
  name: string;
  href: string;
  icon: typeof LayoutDashboard;
  requiresAdvances?: boolean;
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Voice Assistant", href: "/voice", icon: Mic },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Estimates", href: "/estimates", icon: FileCheck },
  { name: "Proposals", href: "/proposals", icon: FilePen },
  {
    name: "Advances",
    href: "/advances",
    icon: ClipboardList,
    requiresAdvances: true,
  },
  { name: "Payments", href: "/payments", icon: CreditCard },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Catalog", href: "/catalog", icon: Package },
  { name: "Ask Me How", href: "/ask-me-how", icon: HelpCircle },
  { name: "Configuration", href: "/configuration", icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const { data: subscription } = useSubscription();

  const visibleNavigation = React.useMemo(
    () =>
      navigation.filter((item) =>
        item.requiresAdvances ? planAllowsAdvances(subscription?.plan) : true,
      ),
    [subscription?.plan],
  );

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
        <span className="text-lg font-semibold text-sidebar-foreground">
          ADDINVOICES
        </span>
      </SidebarHeader>

      <SidebarContent className="px-3 py-4">
        <SidebarMenu className="gap-0.5">
          {visibleNavigation.map((item) => {
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
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
                    "h-auto min-h-0 gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-300 group",
                    isActive
                      ? "bg-linear-to-r from-primary/20 to-primary/5 text-primary shadow-[inset_4px_0_0_0_hsl(var(--primary))]"
                      : "text-sidebar-foreground/60 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground hover:translate-x-1",
                  )}
                >
                  <Link href={item.href} data-tour-id={`sidebar-nav-${tourId}`}>
                    <item.icon
                      className={cn(
                        "h-5 w-5 shrink-0 transition-transform duration-300",
                        isActive
                          ? "scale-110 drop-shadow-[0_0_8px_rgba(0,117,135,0.5)]"
                          : "group-hover:scale-110",
                      )}
                    />
                    <span>{item.name}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="space-y-3 border-t border-sidebar-border p-4">
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
            alt="ADDSTRATEGIC"
            width={120}
            height={24}
            className="mx-auto mt-1 h-7 w-auto opacity-70"
          />
        </div>
      </SidebarFooter>
    </SidebarRoot>
  );
}
