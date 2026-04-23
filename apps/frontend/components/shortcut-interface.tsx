"use client";

import { useCallback, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import {
  FileText,
  ClipboardList,
  Users,
  FileCheck,
  LayoutGrid,
} from "lucide-react";

import { useSidebar } from "@/components/ui/sidebar";
import { dismissRootShortcuts } from "@/lib/root-shortcuts";
import { cn } from "@/lib/utils";

const NAV_DELAY_MS = 800;

type ShortcutItem =
  | {
      id: string;
      label: string;
      href: string;
      variant: "voice";
    }
  | {
      id: string;
      label: string;
      href: string;
      variant: "icon";
      Icon: typeof FileText;
    };

const shortcutItems: ShortcutItem[] = [
  { id: "voice", label: "Voice", href: "/voice", variant: "voice" },
  {
    id: "invoices",
    label: "Invoices",
    href: "/invoices",
    variant: "icon",
    Icon: FileText,
  },
  {
    id: "estimates",
    label: "Estimates",
    href: "/estimates",
    variant: "icon",
    Icon: FileCheck,
  },
  {
    id: "expenses",
    label: "Expenses",
    href: "/expenses",
    variant: "icon",
    Icon: ClipboardList,
  },
  {
    id: "clients",
    label: "Clients",
    href: "/clients",
    variant: "icon",
    Icon: Users,
  },
];

const shortcutButtonClass =
  "w-32 h-32 sm:w-36 sm:h-36 md:w-44 md:h-44 lg:w-48 lg:h-48 rounded-full flex flex-col items-center justify-center text-slate-800 shadow-xl transition-transform hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 z-10 mx-auto bg-white";

type ShortcutInterfaceProps = {
  /** Called when the user chooses the full dashboard (e.g. "More") so the parent can switch without a full reload. */
  onRequestDashboard?: () => void;
};

export function ShortcutInterface({
  onRequestDashboard,
}: ShortcutInterfaceProps) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const { isMobile, setOpenMobile } = useSidebar();
  const [expanding, setExpanding] = useState(false);
  const [clickedPos, setClickedPos] = useState({ x: 0, y: 0 });

  const displayName = useMemo(() => {
    if (!isLoaded || !user) return null;
    const first = user.firstName?.trim();
    if (first) return first;
    const full = user.fullName?.trim();
    if (full) return full.split(/\s+/)[0];
    const email = user.primaryEmailAddress?.emailAddress;
    if (email) return email.split("@")[0];
    return null;
  }, [isLoaded, user]);

  const runAfterExpand = useCallback(
    (path: string) => {
      window.setTimeout(() => {
        router.push(path);
        setExpanding(false);
      }, NAV_DELAY_MS);
    },
    [router],
  );

  const handleNavigate = useCallback(
    (e: React.MouseEvent<HTMLElement>, path: string) => {
      e.preventDefault();
      dismissRootShortcuts();
      const rect = e.currentTarget.getBoundingClientRect();
      setClickedPos({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      setExpanding(true);
      runAfterExpand(path);
    },
    [runAfterExpand],
  );

  const handleMore = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      dismissRootShortcuts();
      const rect = e.currentTarget.getBoundingClientRect();
      setClickedPos({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      });
      setExpanding(true);
      window.setTimeout(() => {
        onRequestDashboard?.();
        router.replace("/", { scroll: false });
        if (isMobile) {
          setOpenMobile(true);
        }
        setExpanding(false);
      }, NAV_DELAY_MS);
    },
    [isMobile, onRequestDashboard, router, setOpenMobile],
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcut-welcome-heading"
      className="fixed inset-0 z-[200] overflow-y-auto overflow-x-hidden overscroll-y-contain bg-slate-900 bg-cover bg-center bg-no-repeat bg-[url('/images/bg_shortcuts_mobile.png')] text-white md:bg-[url('/images/bg_shortcuts_desktop.png')]"
    >
      <div className="relative z-10 mx-auto flex min-h-[100dvh] w-full max-w-4xl flex-col items-center justify-center px-4 py-8 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2.5rem,env(safe-area-inset-top))] sm:py-10 sm:pt-16 md:py-12">
        <div className="flex w-full flex-col items-center">
          <Image
            src="/images/addinvoices-logo-text.png"
            alt="AddInvoices"
            width={500}
            height={100}
            priority
            className="mb-6 h-10 w-auto sm:mb-8 sm:h-16"
          />
          <h1
            id="shortcut-welcome-heading"
            className="text-center text-3xl font-bold tracking-tight drop-shadow-md sm:text-4xl md:text-5xl"
          >
            {!isLoaded ? (
              <>Welcome back</>
            ) : displayName ? (
              <>
                Welcome back,{" "}
                <span className="text-primary">{displayName}</span>
              </>
            ) : (
              <>
                Ready when you are — start with{" "}
                <span className="text-primary">voice</span>, invoices, or
                estimates
              </>
            )}
          </h1>
        </div>

        <nav
          className="relative z-10 mx-auto mt-6 grid w-full max-w-4xl grid-cols-2 justify-items-center gap-x-8 gap-y-10 sm:mt-10 sm:gap-10 md:grid-cols-3 md:gap-16"
          aria-label="App shortcuts"
        >
          {shortcutItems.map((item) =>
            item.variant === "voice" ? (
              <button
                key={item.id}
                type="button"
                onClick={(e) => handleNavigate(e, item.href)}
                className={cn(
                  shortcutButtonClass,
                  "shadow-lg ring-2 ring-primary/50",
                )}
                aria-label={`Open ${item.label} assistant`}
              >
                <div className="relative mb-1 flex h-16 w-16 items-center justify-center sm:h-16 md:mb-2 md:h-20 md:w-20">
                  <Image
                    src="/images/addstrategic-icon.png"
                    alt=""
                    width={80}
                    height={80}
                    className="relative z-10 h-full w-full object-contain"
                  />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider sm:text-sm md:text-lg">
                  {item.label}
                </span>
              </button>
            ) : (
              <button
                key={item.id}
                type="button"
                onClick={(e) => handleNavigate(e, item.href)}
                className={shortcutButtonClass}
                aria-label={`Go to ${item.label}`}
              >
                <item.Icon
                  className="mb-2 h-10 w-10 text-primary sm:h-12 sm:w-12 md:h-16 md:w-16"
                  strokeWidth={1.5}
                  aria-hidden
                />
                <span className="text-xs font-semibold uppercase tracking-wider sm:text-sm md:text-lg">
                  {item.label}
                </span>
              </button>
            ),
          )}

          <button
            type="button"
            onClick={handleMore}
            className={shortcutButtonClass}
            aria-label="Open dashboard and navigation menu"
          >
            <LayoutGrid
              className="mb-2 h-10 w-10 text-primary sm:h-12 sm:w-12 md:h-16 md:w-16"
              strokeWidth={1.5}
              aria-hidden
            />
            <span className="text-xs font-semibold uppercase tracking-wider sm:text-sm md:text-lg">
              More
            </span>
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {expanding ? (
          <motion.div
            initial={{
              opacity: 0,
              scale: 0,
              x: clickedPos.x - window.innerWidth / 2,
              y: clickedPos.y - window.innerHeight / 2,
            }}
            animate={{
              opacity: 1,
              scale: 50,
              x: 0,
              y: 0,
            }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="pointer-events-none fixed left-1/2 top-1/2 z-[250] -ml-10 -mt-10 flex h-20 w-20 items-center justify-center"
          >
            <div className="h-full w-full rounded-full border-2 border-primary/50 bg-primary shadow-2xl ring-4 ring-primary/20" />
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
