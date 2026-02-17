"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import {
  GENERAL_TOUR_ID,
  GENERAL_TOUR_STEPS,
  ROUTE_BY_TOUR_ID,
  STEPS_BY_TOUR_ID,
  getTourTargetElement,
} from "./tour-config";

export type { TourStep } from "./tour-config";

type TourContextType = {
  isOpen: boolean;
  currentStepIndex: number;
  steps: typeof GENERAL_TOUR_STEPS;
  startTour: (tourType?: string) => void;
  endTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
};

const TourContext = createContext<TourContextType | undefined>(undefined);

const TOUR_COMPLETED_KEY = "tourCompleted";
const MOBILE_BREAKPOINT_PX = 768;

function getFirstStepTargetId(tourType: string): string | null {
  const steps = STEPS_BY_TOUR_ID[tourType];
  return steps?.[0]?.targetId ?? null;
}

function isSidebarStep(step: { targetId: string }): boolean {
  return step.targetId.startsWith("sidebar-nav-");
}

export function TourProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [currentTourType, setCurrentTourType] =
    useState<string>(GENERAL_TOUR_ID);
  const pathname = usePathname();
  const router = useRouter();
  const { isSignedIn } = useAuth();

  const [pendingTour, setPendingTour] = useState<{
    type: string;
    active: boolean;
  }>({
    type: "",
    active: false,
  });

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`);
    const handler = () => setIsMobile(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const currentSteps = useMemo(() => {
    const steps = STEPS_BY_TOUR_ID[currentTourType] ?? GENERAL_TOUR_STEPS;
    if (currentTourType === GENERAL_TOUR_ID && isMobile) {
      return steps.filter((s) => !isSidebarStep(s));
    }
    return steps;
  }, [currentTourType, isMobile]);

  useEffect(() => {
    if (currentStepIndex >= currentSteps.length && currentSteps.length > 0) {
      setCurrentStepIndex(currentSteps.length - 1);
    }
  }, [currentSteps.length, currentStepIndex]);

  const endTour = useCallback(() => {
    setIsOpen(false);
    localStorage.setItem(TOUR_COMPLETED_KEY, "true");
  }, []);

  const skipTour = useCallback(() => {
    endTour();
  }, [endTour]);

  const nextStep = useCallback(() => {
    if (currentStepIndex < currentSteps.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      endTour();
    }
  }, [currentStepIndex, currentSteps.length, endTour]);

  const prevStep = useCallback(() => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex((prev) => prev - 1);
    }
  }, [currentStepIndex]);

  const startTour = useCallback(
    (tourType: string = GENERAL_TOUR_ID) => {
      setCurrentTourType(tourType);
      setCurrentStepIndex(0);
      const targetRoute = ROUTE_BY_TOUR_ID[tourType] ?? "/";
      const currentPath = pathname?.replace(/\/$/, "") || "/";
      const targetPath = targetRoute.replace(/\/$/, "") || "/";

      if (currentPath !== targetPath) {
        setPendingTour({ type: tourType, active: true });
        router.push(targetRoute);
      } else {
        setPendingTour({ type: "", active: false });
        setIsOpen(true);
      }
    },
    [pathname, router],
  );

  // First-time auto-open: only if general tour's first step target exists on page
  useEffect(() => {
    if (!isSignedIn) {
      setIsOpen(false);
      return;
    }
    const tourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY);
    if (tourCompleted) return;
    if (pathname !== "/" && pathname !== "/dashboard") return;

    const firstTargetId = getFirstStepTargetId(GENERAL_TOUR_ID);
    if (!firstTargetId) return;

    const checkAndOpen = () => {
      const el = getTourTargetElement(firstTargetId);
      if (el) {
        setIsOpen(true);
      }
    };
    const timer = setTimeout(checkAndOpen, 1000);
    return () => clearTimeout(timer);
  }, [pathname, isSignedIn]);

  // Handle pending tour start after navigation
  useEffect(() => {
    if (!pendingTour.active) return;

    const targetRoute = ROUTE_BY_TOUR_ID[pendingTour.type] ?? "/";
    const currentPath = pathname?.replace(/\/$/, "") || "/";
    const targetPath = targetRoute.replace(/\/$/, "") || "/";

    if (currentPath !== targetPath) return;

    const delay = ["invoices", "quotes", "payments"].includes(pendingTour.type)
      ? 800
      : 500;
    const timer = setTimeout(() => {
      setIsOpen(true);
      setPendingTour({ type: "", active: false });
    }, delay);
    return () => clearTimeout(timer);
  }, [pathname, pendingTour]);

  const value = useMemo<TourContextType>(
    () => ({
      isOpen,
      currentStepIndex,
      steps: currentSteps,
      startTour,
      endTour,
      nextStep,
      prevStep,
      skipTour,
    }),
    [
      isOpen,
      currentStepIndex,
      currentSteps,
      startTour,
      endTour,
      nextStep,
      prevStep,
      skipTour,
    ],
  );

  return <TourContext.Provider value={value}>{children}</TourContext.Provider>;
}

export function useTour() {
  const context = useContext(TourContext);
  if (context === undefined) {
    throw new Error("useTour must be used within a TourProvider");
  }
  return context;
}
