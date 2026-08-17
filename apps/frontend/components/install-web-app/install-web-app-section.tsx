"use client";

import type { LucideIcon } from "lucide-react";
import { Share, Smartphone, Sparkles } from "lucide-react";

import { cn } from "@/lib/utils";
import { InstallTutorialVideo } from "./install-tutorial-video";
import { StoreLaunchBadges } from "./store-launch-badges";

const APP_HOST = "app.addinvoicesai.com";

interface PlatformGuide {
  name: string;
  icon: LucideIcon;
  summary: string;
  steps: string[];
}

const PLATFORM_GUIDES: PlatformGuide[] = [
  {
    name: "Android",
    icon: Smartphone,
    summary:
      "Chrome lets you install this site as a web app that feels like a native app, so you can open ADDINVOICES from your home screen without waiting for the Play Store.",
    steps: [
      `Open Chrome and go to ${APP_HOST}`,
      "Tap the three-dot menu in the upper right corner",
      'Choose "Install app" or "Add to Home screen"',
      "Confirm and open ADDINVOICES from your home screen",
    ],
  },
  {
    name: "iPhone & iPad",
    icon: Share,
    summary:
      "Safari can pin the app to your home screen so it opens in its own window, without the browser bar, just like an App Store app.",
    steps: [
      `Open Safari and go to ${APP_HOST}`,
      "Tap the Share button at the bottom of the screen",
      'Scroll and tap "Add to Home Screen"',
      "Tap Add and open ADDINVOICES from your home screen",
    ],
  },
];

function PlatformInstallCard({ guide }: { guide: PlatformGuide }) {
  const Icon = guide.icon;

  return (
    <article className="rounded-3xl border border-border bg-card p-6 shadow-sm transition-colors duration-200 hover:border-primary/30">
      <div className="mb-4 flex size-11 items-center justify-center rounded-full bg-primary/15 text-primary">
        <Icon className="size-5" aria-hidden />
      </div>
      <h3 className="text-xl font-semibold text-foreground">{guide.name}</h3>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {guide.summary}
      </p>
      <ol className="mt-6 space-y-4">
        {guide.steps.map((step, index) => (
          <li
            key={step}
            className="flex items-start gap-3 text-sm text-foreground"
          >
            <span className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
              {index + 1}
            </span>
            <span className="leading-relaxed">{step}</span>
          </li>
        ))}
      </ol>
    </article>
  );
}

interface InstallWebAppSectionProps {
  className?: string;
}

export function InstallWebAppSection({ className }: InstallWebAppSectionProps) {
  return (
    <section
      className={cn("space-y-12 py-2", className)}
      aria-labelledby="install-web-app-heading"
    >
      <div className="flex flex-col items-center text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-1 text-sm text-muted-foreground">
          <Sparkles className="size-3.5 text-primary" aria-hidden />
          Install it on your phone
        </span>
        <h2
          id="install-web-app-heading"
          className="mt-5 max-w-3xl text-3xl font-bold tracking-tight text-foreground sm:text-4xl md:text-5xl"
        >
          Take ADDINVOICES to Android and iOS
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-muted-foreground sm:text-lg">
          Add the web app to your home screen in seconds. Watch the quick
          tutorial and follow the steps on your phone.
        </p>
        <div className="mt-10 w-full">
          <InstallTutorialVideo />
        </div>
        <StoreLaunchBadges className="mt-10" />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {PLATFORM_GUIDES.map((guide) => (
          <PlatformInstallCard key={guide.name} guide={guide} />
        ))}
      </div>

      <StoreLaunchBadges />
    </section>
  );
}
