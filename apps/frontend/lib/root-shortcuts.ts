export const ROOT_SHORTCUTS_DISMISSED_KEY = "addinvoice-root-shortcuts-dismissed";

/** Persisted for the browser tab session so `/` shows the dashboard after the first entry. */
export function dismissRootShortcuts(): void {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(ROOT_SHORTCUTS_DISMISSED_KEY, "1");
  } catch {
    // Private mode or quota — treat as dismissed to avoid trapping the user.
  }
}

export function hasDismissedRootShortcuts(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return sessionStorage.getItem(ROOT_SHORTCUTS_DISMISSED_KEY) === "1";
  } catch {
    return true;
  }
}
