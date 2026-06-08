"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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

import { dismissRootShortcuts } from "@/lib/root-shortcuts";
import { getFeatureColors, type FeatureKey } from "@/lib/feature-colors";
import { cn } from "@/lib/utils";

const NAV_DELAY_MS = 800;

type ShortcutItem =
  | {
      id: string;
      label: string;
      href: string;
      variant: "voice";
      feature: FeatureKey;
    }
  | {
      id: string;
      label: string;
      href: string;
      variant: "icon";
      feature: FeatureKey;
      Icon: typeof FileText;
    };

const shortcutItems: ShortcutItem[] = [
  {
    id: "voice",
    label: "Voice",
    href: "/voice",
    variant: "voice",
    feature: "voice",
  },
  {
    id: "invoices",
    label: "Invoices",
    href: "/invoices",
    variant: "icon",
    feature: "invoice",
    Icon: FileText,
  },
  {
    id: "estimates",
    label: "Estimates",
    href: "/estimates",
    variant: "icon",
    feature: "estimate",
    Icon: FileCheck,
  },
  {
    id: "expenses",
    label: "Expenses",
    href: "/expenses",
    variant: "icon",
    feature: "expense",
    Icon: ClipboardList,
  },
  {
    id: "clients",
    label: "Clients",
    href: "/clients",
    variant: "icon",
    feature: "client",
    Icon: Users,
  },
];

const shortcutButtonBase =
  "w-32 h-32 sm:w-36 sm:h-36 md:w-44 md:h-44 lg:w-48 lg:h-48 rounded-full flex flex-col items-center justify-center text-white transition-all duration-300 hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-900 z-10 mx-auto group backdrop-blur-md";

type ShortcutInterfaceProps = {
  /** Called when the user chooses the full dashboard (e.g. "More") so the parent can switch without a full reload. */
  onRequestDashboard?: () => void;
};

export function ShortcutInterface({
  onRequestDashboard,
}: ShortcutInterfaceProps) {
  const router = useRouter();
  const { user, isLoaded } = useUser();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

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
      }, NAV_DELAY_MS);
    },
    [router],
  );

  const handleNavigate = useCallback(
    (e: React.MouseEvent<HTMLElement>, path: string) => {
      e.preventDefault();
      dismissRootShortcuts();
      runAfterExpand(path);
    },
    [runAfterExpand],
  );

  const handleMore = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
      dismissRootShortcuts();
      window.setTimeout(() => {
        onRequestDashboard?.();
        router.replace("/", { scroll: false });
      }, NAV_DELAY_MS);
    },
    [onRequestDashboard, router],
  );

  const moreStyles = getFeatureColors("more");

  const overlay = (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcut-welcome-heading"
      className="fixed inset-0 z-[300] overflow-y-auto overflow-x-hidden overscroll-y-contain bg-slate-900 bg-cover bg-center bg-no-repeat bg-[url('/images/bg_shortcuts_mobile.png')] text-white md:bg-[url('/images/bg_shortcuts_desktop.png')]"
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
          {shortcutItems.map((item) => {
            const styles = getFeatureColors(item.feature).circle;

            return item.variant === "voice" ? (
              <button
                key={item.id}
                type="button"
                onClick={(e) => handleNavigate(e, item.href)}
                className={cn(
                  shortcutButtonBase,
                  styles.button,
                  styles.focusRing,
                  "z-20",
                )}
                aria-label={`Open ${item.label} assistant`}
              >
                <div className="relative mb-1 flex h-16 w-16 items-center justify-center sm:h-16 md:mb-2 md:h-20 md:w-20 group-hover:scale-110 transition-transform duration-300">
                  {styles.ping && (
                    <div
                      className={cn(
                        "absolute inset-0 rounded-full animate-ping opacity-75",
                        styles.ping,
                      )}
                    />
                  )}
                  <Image
                    src="/images/addstrategic-icon.png"
                    alt=""
                    width={80}
                    height={80}
                    className={cn(
                      "relative z-10 h-full w-full object-contain",
                      styles.voiceImageGlow,
                    )}
                  />
                </div>
                <span className="text-xs font-semibold uppercase tracking-wider text-white drop-shadow-sm sm:text-sm md:text-lg">
                  {item.label}
                </span>
              </button>
            ) : (
              <button
                key={item.id}
                type="button"
                onClick={(e) => handleNavigate(e, item.href)}
                className={cn(
                  shortcutButtonBase,
                  styles.button,
                  styles.focusRing,
                )}
                aria-label={`Go to ${item.label}`}
              >
                <item.Icon
                  className={cn(
                    "mb-2 h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 group-hover:scale-110 transition-transform duration-300",
                    styles.icon,
                    styles.iconGlow,
                  )}
                  strokeWidth={1.5}
                  aria-hidden
                />
                <span className="text-xs font-semibold uppercase tracking-wider text-white drop-shadow-sm sm:text-sm md:text-lg">
                  {item.label}
                </span>
              </button>
            );
          })}

          <button
            type="button"
            onClick={handleMore}
            className={cn(
              shortcutButtonBase,
              moreStyles.circle.button,
              moreStyles.circle.focusRing,
            )}
            aria-label="Open dashboard and navigation menu"
          >
            <LayoutGrid
              className={cn(
                "mb-2 h-10 w-10 sm:h-12 sm:w-12 md:h-16 md:w-16 group-hover:scale-110 transition-transform duration-300",
                moreStyles.circle.icon,
                moreStyles.circle.iconGlow,
              )}
              strokeWidth={1.5}
              aria-hidden
            />
            <span className="text-xs font-semibold uppercase tracking-wider text-white drop-shadow-sm sm:text-sm md:text-lg">
              More
            </span>
          </button>
        </nav>
      </div>
    </div>
  );

  if (!mounted) return null;

  return createPortal(overlay, document.body);
}
