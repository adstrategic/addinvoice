"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  LayoutDashboard,
  FileText,
  Users,
  Settings,
  Menu,
  FileCheck,
  CreditCard,
  Receipt,
  Package,
  Mic,
  HelpCircle,
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Voice Assistant", href: "/voice", icon: Mic },
  { name: "Invoices", href: "/invoices", icon: FileText },
  { name: "Payments", href: "/payments", icon: CreditCard },
  // { name: "Reminders", href: "/reminders", icon: Bell },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Catalog", href: "/catalog", icon: Package },
  { name: "Quotes", href: "/quotes", icon: FileCheck },
  { name: "Expenses", href: "/expenses", icon: Receipt },
  { name: "Ask Me How", href: "/ask-me-how", icon: HelpCircle },
  { name: "Configuration", href: "/configuration", icon: Settings },
];

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  // const { logout } = useAuth();

  return (
    <div className="flex h-full flex-col bg-card border-r border-border">
      {/* Logo Section */}
      <div className="flex h-16 items-center gap-3 border-b border-border px-6">
        <Image
          src="/images/addinvoices-icon.png"
          alt="ADDINVOICES"
          width={32}
          height={32}
          className="h-16 w-16 -rotate-45"
        />
        <span className="text-sm sm:text-lg font-semibold text-foreground">
          ADDINVOICES
        </span>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 px-3 py-4">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          const tourId =
            item.href === "/"
              ? "dashboard"
              : item.href.slice(1).replace(/\//g, "-");
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={onNavigate}
              data-tour-id={`sidebar-nav-${tourId}`}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground",
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Bottom Section */}
      <div className="border-t border-border p-4 space-y-4">
        {/* Theme Toggle */}
        {/* <Button
          variant="outline"
          size="sm"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="w-full justify-start gap-3"
        >
          {theme === "dark" ? (
            <>
              <Sun className="h-4 w-4" />
              Light Mode
            </>
          ) : (
            <>
              <Moon className="h-4 w-4" />
              Dark Mode
            </>
          )}
        </Button> */}

        {/* Logout Button */}
        {/* <Button
          variant="outline"
          size="sm"
          // onClick={logout}
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10 bg-transparent"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </Button> */}

        {/* Branding */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">Powered by</p>
          <Image
            src="/images/addstrategic-banner.png"
            alt="ADSTRATEGIC"
            width={120}
            height={24}
            className="mx-auto mt-1 h-5 w-auto opacity-70"
          />
        </div>
      </div>
    </div>
  );
}

export function Sidebar() {
  const [open, setOpen] = React.useState(false);

  return (
    <>
      {/* Mobile Sidebar */}
      <div className="h-16 md:hidden w-full bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 fixed top-0 left-0 z-40 border-b border-border flex items-center px-4">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              // className="md:hidden fixed top-4 left-4 z-50"
            >
              <Menu className="h-5 w-5" />
              <span className="sr-only">Toggle menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-64 p-0">
            <SidebarContent onNavigate={() => setOpen(false)} />
          </SheetContent>
        </Sheet>

        {/* The sidebar trigger will be positioned here by the Sidebar component */}
        <span className="ml-2 font-semibold text-lg md:hidden">
          AddInvoices
        </span>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <SidebarContent />
      </aside>
    </>
  );
}
