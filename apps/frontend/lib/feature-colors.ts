import type { ListCardVariant } from "@/components/shared/list-card-theme";

/** Feature keys used across shortcuts, bottom nav, and create flows. */
export type FeatureKey =
  | "voice"
  | ListCardVariant
  | "reminders"
  | "ask-me-how"
  | "settings"
  | "more";

export interface FeatureColorStyles {
  /** Circular shortcut buttons on the dark welcome screen. */
  circle: {
    button: string;
    icon: string;
    iconGlow: string;
    focusRing: string;
    ping?: string;
    voiceImageGlow?: string;
  };
  /** Rounded tiles in the More options drawer. */
  tile: {
    gradient: string;
    textHover: string;
  };
  /** Icon box in the Create (+) drawer rows. */
  createIcon: string;
}

const primaryCircle: FeatureColorStyles["circle"] = {
  button:
    "bg-primary/20 border border-primary/30 shadow-[0_0_40px_color-mix(in_oklch,var(--primary)_35%,transparent)] hover:shadow-[0_0_60px_color-mix(in_oklch,var(--primary)_55%,transparent)]",
  icon: "text-primary",
  iconGlow: "drop-shadow-[0_0_12px_color-mix(in_oklch,var(--primary)_70%,transparent)]",
  focusRing: "focus-visible:ring-primary",
  ping: "bg-primary/20",
  voiceImageGlow:
    "drop-shadow-[0_0_15px_color-mix(in_oklch,var(--primary)_80%,transparent)]",
};
export const FEATURE_COLORS: Record<FeatureKey, FeatureColorStyles> = {
  voice: {
    circle: primaryCircle,
    tile: {
      gradient:
        "from-primary/10 to-primary/5 border-primary/20 text-primary group-hover:from-primary/20 group-hover:to-primary/10 group-hover:shadow-primary/25",
      textHover: "group-hover:text-primary",
    },
    createIcon: "bg-primary/10 text-primary",
  },
  invoice: {
    circle: primaryCircle,
    tile: {
      gradient:
        "from-primary/10 to-primary/5 border-primary/20 text-primary group-hover:from-primary/20 group-hover:to-primary/10 group-hover:shadow-primary/25",
      textHover: "group-hover:text-primary",
    },
    createIcon: "bg-primary/10 text-primary",
  },
  estimate: {
    circle: {
      button:
        "bg-orange-500/20 border border-orange-500/30 shadow-[0_0_40px_rgba(249,115,22,0.35)] hover:shadow-[0_0_60px_rgba(249,115,22,0.55)]",
      icon: "text-orange-400",
      iconGlow: "drop-shadow-[0_0_12px_rgba(249,115,22,0.6)]",
      focusRing: "focus-visible:ring-orange-500",
    },
    tile: {
      gradient:
        "from-orange-500/10 to-orange-500/5 border-orange-500/20 text-orange-500 group-hover:from-orange-500/20 group-hover:to-orange-500/10 group-hover:shadow-orange-500/25",
      textHover: "group-hover:text-orange-500",
    },
    createIcon: "bg-orange-500/10 text-orange-500",
  },
  proposal: {
    circle: {
      button:
        "bg-violet-500/20 border border-violet-500/30 shadow-[0_0_40px_rgba(139,92,246,0.35)] hover:shadow-[0_0_60px_rgba(139,92,246,0.55)]",
      icon: "text-violet-400",
      iconGlow: "drop-shadow-[0_0_12px_rgba(139,92,246,0.6)]",
      focusRing: "focus-visible:ring-violet-500",
    },
    tile: {
      gradient:
        "from-violet-500/10 to-violet-500/5 border-violet-500/20 text-violet-500 group-hover:from-violet-500/20 group-hover:to-violet-500/10 group-hover:shadow-violet-500/25",
      textHover: "group-hover:text-violet-500",
    },
    createIcon: "bg-violet-500/10 text-violet-500",
  },
  advance: {
    circle: {
      button:
        "bg-blue-500/20 border border-blue-500/30 shadow-[0_0_40px_rgba(59,130,246,0.35)] hover:shadow-[0_0_60px_rgba(59,130,246,0.55)]",
      icon: "text-blue-400",
      iconGlow: "drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]",
      focusRing: "focus-visible:ring-blue-500",
    },
    tile: {
      gradient:
        "from-blue-500/10 to-blue-500/5 border-blue-500/20 text-blue-500 group-hover:from-blue-500/20 group-hover:to-blue-500/10 group-hover:shadow-blue-500/25",
      textHover: "group-hover:text-blue-500",
    },
    createIcon: "bg-blue-500/10 text-blue-500",
  },
  payment: {
    circle: {
      button:
        "bg-emerald-500/20 border border-emerald-500/30 shadow-[0_0_40px_rgba(16,185,129,0.35)] hover:shadow-[0_0_60px_rgba(16,185,129,0.55)]",
      icon: "text-emerald-400",
      iconGlow: "drop-shadow-[0_0_12px_rgba(16,185,129,0.6)]",
      focusRing: "focus-visible:ring-emerald-500",
    },
    tile: {
      gradient:
        "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20 text-emerald-500 group-hover:from-emerald-500/20 group-hover:to-emerald-500/10 group-hover:shadow-emerald-500/25",
      textHover: "group-hover:text-emerald-500",
    },
    createIcon: "bg-emerald-500/10 text-emerald-500",
  },
  expense: {
    circle: {
      button:
        "bg-amber-500/20 border border-amber-500/30 shadow-[0_0_40px_rgba(245,158,11,0.35)] hover:shadow-[0_0_60px_rgba(245,158,11,0.55)]",
      icon: "text-amber-400",
      iconGlow: "drop-shadow-[0_0_12px_rgba(245,158,11,0.6)]",
      focusRing: "focus-visible:ring-amber-500",
    },
    tile: {
      gradient:
        "from-amber-500/10 to-amber-500/5 border-amber-500/20 text-amber-500 group-hover:from-amber-500/20 group-hover:to-amber-500/10 group-hover:shadow-amber-500/25",
      textHover: "group-hover:text-amber-500",
    },
    createIcon: "bg-amber-500/10 text-amber-500",
  },
  client: {
    circle: {
      button:
        "bg-indigo-500/20 border border-indigo-500/30 shadow-[0_0_40px_rgba(99,102,241,0.35)] hover:shadow-[0_0_60px_rgba(99,102,241,0.55)]",
      icon: "text-indigo-400",
      iconGlow: "drop-shadow-[0_0_12px_rgba(99,102,241,0.6)]",
      focusRing: "focus-visible:ring-indigo-500",
    },
    tile: {
      gradient:
        "from-indigo-500/10 to-indigo-500/5 border-indigo-500/20 text-indigo-500 group-hover:from-indigo-500/20 group-hover:to-indigo-500/10 group-hover:shadow-indigo-500/25",
      textHover: "group-hover:text-indigo-500",
    },
    createIcon: "bg-indigo-500/10 text-indigo-500",
  },
  catalog: {
    circle: {
      button:
        "bg-sky-500/20 border border-sky-500/30 shadow-[0_0_40px_rgba(14,165,233,0.35)] hover:shadow-[0_0_60px_rgba(14,165,233,0.55)]",
      icon: "text-sky-400",
      iconGlow: "drop-shadow-[0_0_12px_rgba(14,165,233,0.6)]",
      focusRing: "focus-visible:ring-sky-500",
    },
    tile: {
      gradient:
        "from-sky-500/10 to-sky-500/5 border-sky-500/20 text-sky-500 group-hover:from-sky-500/20 group-hover:to-sky-500/10 group-hover:shadow-sky-500/25",
      textHover: "group-hover:text-sky-500",
    },
    createIcon: "bg-sky-500/10 text-sky-500",
  },
  reminders: {
    circle: {
      button:
        "bg-orange-500/20 border border-orange-500/30 shadow-[0_0_40px_rgba(249,115,22,0.35)] hover:shadow-[0_0_60px_rgba(249,115,22,0.55)]",
      icon: "text-orange-400",
      iconGlow: "drop-shadow-[0_0_12px_rgba(249,115,22,0.6)]",
      focusRing: "focus-visible:ring-orange-500",
    },
    tile: {
      gradient:
        "from-orange-500/10 to-orange-500/5 border-orange-500/20 text-orange-500 group-hover:from-orange-500/20 group-hover:to-orange-500/10 group-hover:shadow-orange-500/25",
      textHover: "group-hover:text-orange-500",
    },
    createIcon: "bg-orange-500/10 text-orange-500",
  },
  "ask-me-how": {
    circle: {
      button:
        "bg-green-500/20 border border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.35)] hover:shadow-[0_0_60px_rgba(34,197,94,0.55)]",
      icon: "text-green-400",
      iconGlow: "drop-shadow-[0_0_12px_rgba(34,197,94,0.6)]",
      focusRing: "focus-visible:ring-green-500",
    },
    tile: {
      gradient:
        "from-green-500/10 to-green-500/5 border-green-500/20 text-green-500 group-hover:from-green-500/20 group-hover:to-green-500/10 group-hover:shadow-green-500/25",
      textHover: "group-hover:text-green-500",
    },
    createIcon: "bg-green-500/10 text-green-500",
  },
  settings: {
    circle: {
      button:
        "bg-slate-500/20 border border-slate-500/30 shadow-[0_0_40px_rgba(100,116,139,0.35)] hover:shadow-[0_0_60px_rgba(100,116,139,0.55)]",
      icon: "text-slate-300",
      iconGlow: "drop-shadow-[0_0_12px_rgba(148,163,184,0.6)]",
      focusRing: "focus-visible:ring-slate-400",
    },
    tile: {
      gradient:
        "from-slate-500/10 to-slate-500/5 border-slate-500/20 text-slate-500 group-hover:from-slate-500/20 group-hover:to-slate-500/10 group-hover:shadow-slate-500/25",
      textHover: "group-hover:text-slate-500",
    },
    createIcon: "bg-slate-500/10 text-slate-500",
  },
  more: {
    circle: {
      button:
        "bg-slate-500/20 border border-slate-400/30 shadow-[0_0_40px_rgba(100,116,139,0.35)] hover:shadow-[0_0_60px_rgba(100,116,139,0.55)]",
      icon: "text-slate-300",
      iconGlow: "drop-shadow-[0_0_12px_rgba(148,163,184,0.6)]",
      focusRing: "focus-visible:ring-slate-400",
    },
    tile: {
      gradient:
        "from-slate-500/10 to-slate-500/5 border-slate-500/20 text-slate-400 group-hover:from-slate-500/20 group-hover:to-slate-500/10 group-hover:shadow-slate-500/25",
      textHover: "group-hover:text-slate-400",
    },
    createIcon: "bg-slate-500/10 text-slate-400",
  },
};

export function getFeatureColors(feature: FeatureKey): FeatureColorStyles {
  return FEATURE_COLORS[feature];
}
