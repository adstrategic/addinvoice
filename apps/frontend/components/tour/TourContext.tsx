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
  ONBOARDING_TOUR_ID,
  ONBOARDING_TOUR_MOBILE_STEPS,
  ONBOARDING_TOUR_STEPS,
  ROUTE_BY_TOUR_ID,
  STEPS_BY_TOUR_ID,
  getTourTargetElement,
} from "./tour-config";
import {
  useCompleteOnboardingTour,
  useOnboardingStatus,
} from "@/features/onboarding/hooks/useOnboarding";

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

  // pendingTour: used when startTour() must navigate before opening
  const [pendingTour, setPendingTour] = useState<{
    type: string;
    active: boolean;
  }>({ type: "", active: false });

  // Stamp the body so non-React components (e.g. Radix Sheet) can detect tour activity
  // without importing tour logic.
  useEffect(() => {
    if (isOpen) {
      document.body.dataset.tourActive = "true";
    } else {
      delete document.body.dataset.tourActive;
    }
    return () => { delete document.body.dataset.tourActive; };
  }, [isOpen]);

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT_PX - 1}px)`);
    const handler = () => setIsMobile(mq.matches);
    handler();
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const { data: onboardingStatus } = useOnboardingStatus({ enabled: !!isSignedIn });
  const completeOnboardingTour = useCompleteOnboardingTour();

  const currentSteps = useMemo(() => {
    if (currentTourType === ONBOARDING_TOUR_ID) {
      return isMobile ? ONBOARDING_TOUR_MOBILE_STEPS : ONBOARDING_TOUR_STEPS;
    }
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
    if (currentTourType === ONBOARDING_TOUR_ID) {
      completeOnboardingTour.mutate();
    } else {
      localStorage.setItem(TOUR_COMPLETED_KEY, "true");
    }
  }, [currentTourType, completeOnboardingTour]);

  const skipTour = useCallback(() => {
    endTour();
  }, [endTour]);

  // nextStep does NOT handle navigation — steps with navigateTo have no Next button;
  // the user clicks the real element and the pathname watcher advances the step.
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

  // Auto-open general tour on first visit to dashboard
  useEffect(() => {
    if (!isSignedIn) {
      setIsOpen(false);
      return;
    }
    const tourCompleted = localStorage.getItem(TOUR_COMPLETED_KEY);
    if (tourCompleted) return;
    if (pathname !== "/" && pathname !== "/dashboard") return;

    const timer = setTimeout(() => {
      const el = getTourTargetElement(GENERAL_TOUR_STEPS[0].targetId);
      if (el) {
        setCurrentTourType(GENERAL_TOUR_ID);
        setCurrentStepIndex(0);
        setIsOpen(true);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [pathname, isSignedIn]);

  // Auto-open onboarding tour on /clients for new users (DB-backed flag)
  useEffect(() => {
    if (!isSignedIn) return;
    if (pathname !== "/clients") return;
    if (onboardingStatus?.onboardingTourCompletedAt) return;
    if (isOpen) return;

    const timer = setTimeout(() => {
      const firstStepId = isMobile
        ? ONBOARDING_TOUR_MOBILE_STEPS[0].targetId
        : ONBOARDING_TOUR_STEPS[0].targetId;
      const el = getTourTargetElement(firstStepId);
      if (el) {
        setCurrentTourType(ONBOARDING_TOUR_ID);
        setCurrentStepIndex(0);
        setIsOpen(true);
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [pathname, isSignedIn, onboardingStatus, isOpen, isMobile]);

  // When the user navigates to the step's navigateTo route, advance automatically.
  // The tour stays open throughout — the overlay hides itself while polling for the next element.
  useEffect(() => {
    if (!isOpen) return;
    const step = currentSteps[currentStepIndex];
    if (!step?.navigateTo) return;
    const currentPath = pathname?.replace(/\/$/, "") || "/";
    const targetPath = step.navigateTo.replace(/\/$/, "");
    if (currentPath !== targetPath) return;
    setCurrentStepIndex((prev) => prev + 1);
  }, [pathname, isOpen, currentStepIndex, currentSteps]);

  // Handle pending tour start after navigation (startTour cross-page).
  // No fixed delay — TourOverlay polls for the element itself.
  useEffect(() => {
    if (!pendingTour.active) return;
    const targetRoute = ROUTE_BY_TOUR_ID[pendingTour.type] ?? "/";
    const currentPath = pathname?.replace(/\/$/, "") || "/";
    const targetPath = targetRoute.replace(/\/$/, "") || "/";
    if (currentPath !== targetPath) return;
    setIsOpen(true);
    setPendingTour({ type: "", active: false });
  }, [pathname, pendingTour]);

  // Auto-advance on DOM CustomEvent (e.g. 'tour:client-created').
  // Defer on the last step so the triggering click can open dialogs first.
  useEffect(() => {
    if (!isOpen) return;
    const step = currentSteps[currentStepIndex];
    if (!step?.autoAdvanceOn) return;
    const eventName = step.autoAdvanceOn;
    const isLastStep = currentStepIndex >= currentSteps.length - 1;
    const handler = () => {
      const finish = () => {
        if (isLastStep) endTour();
        else nextStep();
      };
      if (isLastStep) {
        requestAnimationFrame(finish);
      } else {
        finish();
      }
    };
    window.addEventListener(eventName, handler);
    return () => window.removeEventListener(eventName, handler);
  }, [isOpen, currentStepIndex, currentSteps, nextStep, endTour]);

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
