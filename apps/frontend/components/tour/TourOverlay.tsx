"use client";

import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { useTour } from "./TourContext";
import { getTourTargetElement } from "./tour-config";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const TOUR_TARGET_ACTIVE_CLASS = "tour-target-active";

function isSidebarTarget(targetId: string | null): boolean {
  if (!targetId) return false;
  return (
    targetId.startsWith("sidebar-nav-") || targetId === "sidebar-mobile-trigger"
  );
}

/** True when a Radix dialog is open (client form, delete modal, etc.) */
function useDialogOpen(): boolean {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const check = () => {
      setOpen(
        !!document.querySelector(
          '[data-slot="dialog-content"][data-state="open"]',
        ),
      );
    };
    check();
    const observer = new MutationObserver(check);
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["data-state"],
    });
    return () => observer.disconnect();
  }, []);

  return open;
}

export function TourOverlay() {
  const { isOpen, currentStepIndex, steps, nextStep, prevStep, skipTour } =
    useTour();
  const isMobile = useIsMobile();
  const isDialogOpen = useDialogOpen();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [pollExhausted, setPollExhausted] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const pollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const observerRef = useRef<ResizeObserver | null>(null);
  const highlightedElRef = useRef<Element | null>(null);

  const currentStep = steps[currentStepIndex];
  const targetId = currentStep?.targetId ?? null;
  const isLastStep = currentStepIndex === steps.length - 1;
  const suppressNext = !!currentStep?.navigateTo || !!currentStep?.autoAdvanceOn;
  const isAutoAdvanceStep = !!currentStep?.autoAdvanceOn;
  const isInteractionStep =
    suppressNext || (isMobile && isSidebarTarget(targetId));
  const shouldShowBackdrop = !isAutoAdvanceStep && !isInteractionStep;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen || !targetId) {
      setTargetRect(null);
      return;
    }

    if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
    if (observerRef.current) observerRef.current.disconnect();
    setTargetRect(null);
    setPollExhausted(false);

    let attempts = 0;
    const MAX_ATTEMPTS = 25;

    const clearHighlight = () => {
      if (highlightedElRef.current) {
        highlightedElRef.current.classList.remove(TOUR_TARGET_ACTIVE_CLASS);
        highlightedElRef.current = null;
      }
    };

    const applyHighlight = (el: Element) => {
      clearHighlight();
      el.classList.add(TOUR_TARGET_ACTIVE_CLASS);
      highlightedElRef.current = el;
    };

    const tryFind = () => {
      const el = getTourTargetElement(targetId);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
        applyHighlight(el);
        const scrollBlock =
          isMobile && isSidebarTarget(targetId) ? "nearest" : "center";
        el.scrollIntoView({
          behavior: "smooth",
          block: scrollBlock,
          inline: "nearest",
        });
        observerRef.current = new ResizeObserver(() => {
          setTargetRect(el.getBoundingClientRect());
        });
        observerRef.current.observe(el);
      } else if (attempts < MAX_ATTEMPTS) {
        attempts++;
        pollTimerRef.current = setTimeout(tryFind, 150);
      } else {
        setPollExhausted(true);
      }
    };

    tryFind();

    const handlePositionUpdate = () => {
      const el = getTourTargetElement(targetId);
      if (el) setTargetRect(el.getBoundingClientRect());
    };
    window.addEventListener("resize", handlePositionUpdate);
    window.addEventListener("scroll", handlePositionUpdate, {
      capture: true,
      passive: true,
    });

    return () => {
      if (pollTimerRef.current) clearTimeout(pollTimerRef.current);
      if (observerRef.current) observerRef.current.disconnect();
      clearHighlight();
      window.removeEventListener("resize", handlePositionUpdate);
      window.removeEventListener("scroll", handlePositionUpdate, {
        capture: true,
      });
    };
  }, [isOpen, currentStepIndex, targetId, isMobile]);

  if (!isMounted || !isOpen || !currentStep) return null;
  if (isDialogOpen) return null;
  if (!targetRect && !pollExhausted) return null;
  if (typeof document === "undefined") return null;

  const tooltipStyle = targetRect
    ? getTooltipStyle(targetRect, currentStep.position)
    : { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "fixed inset-0 overflow-hidden pointer-events-none",
        isMobile ? "z-[55]" : "z-30",
      )}
    >
      {shouldShowBackdrop &&
        (targetRect ? (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="absolute bg-black/50 transition-all duration-300 ease-out pointer-events-auto"
              style={{ top: 0, left: 0, right: 0, height: targetRect.top }}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="absolute bg-black/50 transition-all duration-300 ease-out pointer-events-auto"
              style={{ top: targetRect.bottom, left: 0, right: 0, bottom: 0 }}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="absolute bg-black/50 transition-all duration-300 ease-out pointer-events-auto"
              style={{
                top: targetRect.top,
                left: 0,
                width: targetRect.left,
                height: targetRect.height,
              }}
            />
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              className="absolute bg-black/50 transition-all duration-300 ease-out pointer-events-auto"
              style={{
                top: targetRect.top,
                left: targetRect.right,
                right: 0,
                height: targetRect.height,
              }}
            />
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm pointer-events-auto"
          />
        ))}

      <div
        className={cn(
          "pointer-events-none",
          isMobile ? "fixed inset-x-0 bottom-0 z-[35] p-4" : "absolute inset-0",
        )}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className={cn(
              "pointer-events-auto",
              isMobile
                ? "w-full"
                : "absolute w-[350px] max-w-[90vw]",
            )}
            style={isMobile ? undefined : tooltipStyle}
          >
            <Card className="shadow-2xl border-primary/20 bg-background/95 backdrop-blur">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle className="text-lg font-bold text-primary">
                    {currentStep.title}
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 -mt-1 -mr-2"
                    onClick={skipTour}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {currentStep.content}
                </p>
              </CardContent>
              <CardFooter className="flex justify-between pt-0">
                <div className="text-xs text-muted-foreground flex items-center">
                  Step {currentStepIndex + 1} of {steps.length}
                </div>
                <div className="flex gap-2">
                  {currentStepIndex > 0 && (
                    <Button variant="outline" size="sm" onClick={prevStep}>
                      <ChevronLeft className="h-4 w-4 mr-1" /> Back
                    </Button>
                  )}
                  {!suppressNext && (
                    <Button
                      size="sm"
                      onClick={nextStep}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      {isLastStep ? "Finish" : "Next"}{" "}
                      {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>,
    document.body,
  );
}

const TOOLTIP_PADDING = 16;
const TOOLTIP_CARD_WIDTH = 350;
const TOOLTIP_CARD_HEIGHT = 280;

function getTooltipStyle(
  rect: DOMRect,
  position?: string,
): React.CSSProperties {
  const windowWidth = typeof window !== "undefined" ? window.innerWidth : 1000;
  const windowHeight = typeof window !== "undefined" ? window.innerHeight : 800;

  let top: number | string = 0;
  let left: number | string = 0;
  let transform = "";

  switch (position) {
    case "top":
      top = rect.top - TOOLTIP_CARD_HEIGHT - TOOLTIP_PADDING;
      left = rect.left + rect.width / 2 - TOOLTIP_CARD_WIDTH / 2;
      if ((top as number) < TOOLTIP_PADDING) {
        top = rect.bottom + TOOLTIP_PADDING;
      }
      break;
    case "bottom":
      top = rect.bottom + TOOLTIP_PADDING;
      left = rect.left + rect.width / 2 - TOOLTIP_CARD_WIDTH / 2;
      break;
    case "left":
      top = rect.top + rect.height / 2 - TOOLTIP_CARD_HEIGHT / 2;
      left = rect.left - TOOLTIP_CARD_WIDTH - TOOLTIP_PADDING;
      if ((left as number) < TOOLTIP_PADDING) {
        left = rect.right + TOOLTIP_PADDING;
      }
      break;
    case "right":
      top = rect.top + rect.height / 2 - TOOLTIP_CARD_HEIGHT / 2;
      left = rect.right + TOOLTIP_PADDING;
      if ((left as number) + TOOLTIP_CARD_WIDTH > windowWidth - TOOLTIP_PADDING) {
        top = rect.bottom + TOOLTIP_PADDING;
        left = rect.left + rect.width / 2 - TOOLTIP_CARD_WIDTH / 2;
        transform = "";
      }
      break;
    default:
      top = rect.top + rect.height / 2;
      left = rect.left + rect.width / 2;
      transform = "translate(-50%, -50%)";
      return { top, left, transform };
  }

  if ((left as number) + TOOLTIP_CARD_WIDTH > windowWidth) {
    left = windowWidth - TOOLTIP_CARD_WIDTH - TOOLTIP_PADDING;
  }
  if ((left as number) < TOOLTIP_PADDING) {
    left = TOOLTIP_PADDING;
  }

  if ((top as number) + TOOLTIP_CARD_HEIGHT > windowHeight - TOOLTIP_PADDING) {
    const aboveTop = rect.top - TOOLTIP_CARD_HEIGHT - TOOLTIP_PADDING;
    if (aboveTop >= TOOLTIP_PADDING) {
      top = aboveTop;
    } else {
      top = windowHeight - TOOLTIP_CARD_HEIGHT - TOOLTIP_PADDING;
    }
  }
  if ((top as number) < TOOLTIP_PADDING) {
    top = TOOLTIP_PADDING;
  }

  if (rectsOverlap(
    { top: top as number, left: left as number, width: TOOLTIP_CARD_WIDTH, height: TOOLTIP_CARD_HEIGHT },
    rect,
  )) {
    top = rect.bottom + TOOLTIP_PADDING;
    left = Math.max(
      TOOLTIP_PADDING,
      Math.min(
        rect.left + rect.width / 2 - TOOLTIP_CARD_WIDTH / 2,
        windowWidth - TOOLTIP_CARD_WIDTH - TOOLTIP_PADDING,
      ),
    );
  }

  return { top, left, transform };
}

function rectsOverlap(
  a: { top: number; left: number; width: number; height: number },
  b: DOMRect,
): boolean {
  const aRight = a.left + a.width;
  const aBottom = a.top + a.height;
  return !(
    aRight < b.left ||
    a.left > b.right ||
    aBottom < b.top ||
    a.top > b.bottom
  );
}
