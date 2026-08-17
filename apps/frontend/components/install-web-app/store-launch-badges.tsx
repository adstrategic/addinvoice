import { cn } from "@/lib/utils";

function GooglePlayBadge() {
  return (
    <svg
      role="img"
      aria-label="GET IT ON Google Play"
      viewBox="0 0 155 46"
      className="h-10 w-auto"
    >
      <rect width="155" height="46" rx="8" fill="#000" />
      <rect
        x="0.5"
        y="0.5"
        width="154"
        height="45"
        rx="7.5"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.35"
      />
      <g transform="translate(12 10)">
        <path d="M1.2 1.1v23.8l13.2-11.9L1.2 1.1Z" fill="#4285F4" />
        <path d="M1.2 24.9 15.6 13 20 16.9 3.9 26.4c-.8.5-1.8.4-2.5-.2l-.2-.2Z" fill="#34A853" />
        <path d="M1.2 1.1 15.6 13 20 9.1 3.9-.4C3.1-.9 2.1-.8 1.4-.2L1.2 0v1.1Z" fill="#EA4335" />
        <path d="M15.6 13 20 9.1v7.8L15.6 13Z" fill="#FBBC04" />
      </g>
      <text
        x="42"
        y="16"
        fill="#fff"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="7"
        letterSpacing="0.6"
      >
        GET IT ON
      </text>
      <text
        x="42"
        y="32"
        fill="#fff"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="14"
        fontWeight="600"
      >
        Google Play
      </text>
    </svg>
  );
}

function AppStoreBadge() {
  return (
    <svg
      role="img"
      aria-label="Download on the App Store"
      viewBox="0 0 155 46"
      className="h-10 w-auto"
    >
      <rect width="155" height="46" rx="8" fill="#000" />
      <rect
        x="0.5"
        y="0.5"
        width="154"
        height="45"
        rx="7.5"
        fill="none"
        stroke="#fff"
        strokeOpacity="0.35"
      />
      <path
        fill="#fff"
        transform="translate(12.5 11) scale(0.95)"
        d="M12.15 6.9c-.95 0-2.42-1.08-3.96-1.04-2.04.03-3.91 1.18-4.96 3.01-2.12 3.68-.55 9.1 1.52 12.09 1.01 1.45 2.21 3.09 3.79 3.04 1.52-.07 2.09-.99 3.94-.99 1.83 0 2.35.99 3.96.95 1.64-.03 2.68-1.48 3.68-2.95 1.16-1.69 1.64-3.33 1.66-3.42-.04-.01-3.18-1.22-3.22-4.86-.03-3.04 2.48-4.49 2.6-4.56-1.43-2.09-3.62-2.32-4.39-2.38-2-.16-3.68 1.09-4.62 1.09zm3.38-3.07c.84-1.01 1.4-2.43 1.24-3.83-1.21.05-2.66.81-3.53 1.82-.78.9-1.45 2.34-1.27 3.71 1.34.1 2.71-.69 3.56-1.7z"
      />
      <text
        x="42"
        y="16"
        fill="#fff"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="7"
        letterSpacing="0.4"
      >
        Download on the
      </text>
      <text
        x="42"
        y="32"
        fill="#fff"
        fontFamily="Arial, Helvetica, sans-serif"
        fontSize="14"
        fontWeight="600"
      >
        App Store
      </text>
    </svg>
  );
}

interface StoreLaunchBadgesProps {
  className?: string;
}

export function StoreLaunchBadges({ className }: StoreLaunchBadgesProps) {
  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <p className="text-xs font-semibold tracking-[0.28em] text-muted-foreground uppercase">
        Launching soon
      </p>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <GooglePlayBadge />
        <AppStoreBadge />
      </div>
    </div>
  );
}
