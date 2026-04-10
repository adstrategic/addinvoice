"use client";

import { useCallback, useEffect } from "react";

interface UseUnsavedChangesWarningOptions {
  enabled: boolean;
  message?: string;
}

const DEFAULT_MESSAGE =
  "You have unsaved changes. If you leave this page, your changes may be lost.";

export function useUnsavedChangesWarning({
  enabled,
  message = DEFAULT_MESSAGE,
}: UseUnsavedChangesWarningOptions) {
  const confirmNavigation = useCallback(() => {
    if (!enabled) return true;
    return window.confirm(message);
  }, [enabled, message]);

  useEffect(() => {
    if (!enabled) return;

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;

    const handleDocumentClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target;
      if (!(target instanceof Element)) return;

      const anchor = target.closest("a[href]");
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if (anchor.hasAttribute("data-skip-unsaved-warning")) return;
      if (anchor.target === "_blank") return;

      const href = anchor.getAttribute("href");
      if (
        !href ||
        href.startsWith("#") ||
        href.startsWith("mailto:") ||
        href.startsWith("tel:")
      ) {
        return;
      }

      const nextUrl = new URL(anchor.href, window.location.href);
      const currentUrl = new URL(window.location.href);
      const isSameLocation =
        nextUrl.pathname === currentUrl.pathname &&
        nextUrl.search === currentUrl.search &&
        nextUrl.hash === currentUrl.hash;

      if (isSameLocation) return;

      if (!window.confirm(message)) {
        event.preventDefault();
        event.stopPropagation();
        (event as MouseEvent & { stopImmediatePropagation?: () => void })
          .stopImmediatePropagation?.();
      }
    };

    document.addEventListener("click", handleDocumentClick, true);
    return () => document.removeEventListener("click", handleDocumentClick, true);
  }, [enabled, message]);

  useEffect(() => {
    if (!enabled) return;

    const currentUrl = window.location.href;
    window.history.pushState({ __unsavedChangesGuard: true }, "", currentUrl);

    const handlePopState = () => {
      if (window.confirm(message)) {
        window.removeEventListener("popstate", handlePopState);
        window.history.back();
        return;
      }

      window.history.pushState({ __unsavedChangesGuard: true }, "", currentUrl);
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [enabled, message]);

  return {
    confirmNavigation,
  };
}
