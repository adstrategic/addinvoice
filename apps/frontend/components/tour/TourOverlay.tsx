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

export function TourOverlay() {
  const { isOpen, currentStepIndex, steps, nextStep, prevStep, skipTour } =
    useTour();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const warnedMissingRef = useRef<string | null>(null);

  const currentStep = steps[currentStepIndex];
  const targetId = currentStep?.targetId ?? null;
  const isLastStep = currentStepIndex === steps.length - 1;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Resize, scroll (passive), and step change: update target rect
  useEffect(() => {
    if (!isOpen || !targetId) return;

    const runUpdate = () => {
      if (!targetId) return;
      const el = getTourTargetElement(targetId);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
        warnedMissingRef.current = null;
      } else {
        setTargetRect(null);
        if (warnedMissingRef.current !== targetId) {
          warnedMissingRef.current = targetId;
        }
      }
    };

    window.addEventListener("resize", runUpdate);
    window.addEventListener("scroll", runUpdate, {
      capture: true,
      passive: true,
    });

    runUpdate();
    return () => {
      window.removeEventListener("resize", runUpdate);
      window.removeEventListener("scroll", runUpdate, { capture: true });
    };
  }, [isOpen, currentStepIndex, targetId]);

  // On step change: scroll target into view and observe resize
  useEffect(() => {
    if (!isOpen || !targetId) return;

    let observer: ResizeObserver | null = null;
    const timer = setTimeout(() => {
      const el = getTourTargetElement(targetId);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
        el.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "center",
        });
        observer = new ResizeObserver(() => {
          setTargetRect(el.getBoundingClientRect());
        });
        observer.observe(el);
      } else {
        setTargetRect(null);
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      observer?.disconnect();
    };
  }, [isOpen, currentStepIndex, targetId]);

  if (!isMounted || !isOpen || !currentStep) return null;

  // Portal to body to ensure it's on top of everything
  if (typeof document === "undefined") return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] overflow-hidden">
      {/* Backdrop with "hole" using 4 divs strategy (guillotine) */}
      {targetRect && (
        <>
          {/* Top */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="absolute bg-black/50 transition-all duration-300 ease-out"
            style={{ top: 0, left: 0, right: 0, height: targetRect.top }}
          />
          {/* Bottom */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="absolute bg-black/50 transition-all duration-300 ease-out"
            style={{ top: targetRect.bottom, left: 0, right: 0, bottom: 0 }}
          />
          {/* Left */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="absolute bg-black/50 transition-all duration-300 ease-out"
            style={{
              top: targetRect.top,
              left: 0,
              width: targetRect.left,
              height: targetRect.height,
            }}
          />
          {/* Right */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            className="absolute bg-black/50 transition-all duration-300 ease-out"
            style={{
              top: targetRect.top,
              left: targetRect.right,
              right: 0,
              height: targetRect.height,
            }}
          />

          {/* Highlight Border/Glow around the target */}
          <div
            className="absolute border-2 border-primary rounded-md shadow-[0_0_20px_rgba(30,202,211,0.5)] pointer-events-none transition-all duration-300 ease-out"
            style={{
              top: targetRect.top - 4,
              left: targetRect.left - 4,
              width: targetRect.width + 8,
              height: targetRect.height + 8,
            }}
          />
        </>
      )}

      {/* If target not found, full backdrop */}
      {!targetRect && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      )}

      {/* Tooltip Card */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center sm:block">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="pointer-events-auto absolute w-[350px] max-w-[90vw]"
            style={{
              // Simple positioning logic
              ...(targetRect
                ? getTooltipStyle(targetRect, currentStep.position)
                : {
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                  }),
            }}
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
                  <Button
                    size="sm"
                    onClick={nextStep}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {isLastStep ? "Finish" : "Next"}{" "}
                    {!isLastStep && <ChevronRight className="h-4 w-4 ml-1" />}
                  </Button>
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>,
    document.body,
  );
}

// Helper to position tooltip around target. Use a conservative height so the card never goes off-screen.
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
      break;
    default:
      top = rect.top + rect.height / 2;
      left = rect.left + rect.width / 2;
      transform = "translate(-50%, -50%)";
      return { top, left, transform };
  }

  // Clamp horizontally
  if ((left as number) + TOOLTIP_CARD_WIDTH > windowWidth) {
    left = windowWidth - TOOLTIP_CARD_WIDTH - TOOLTIP_PADDING;
  }
  if ((left as number) < TOOLTIP_PADDING) {
    left = TOOLTIP_PADDING;
  }

  // Clamp vertically so the full card stays on screen
  if ((top as number) + TOOLTIP_CARD_HEIGHT > windowHeight - TOOLTIP_PADDING) {
    top = windowHeight - TOOLTIP_CARD_HEIGHT - TOOLTIP_PADDING;
  }
  if ((top as number) < TOOLTIP_PADDING) {
    top = TOOLTIP_PADDING;
  }

  return { top, left };
}
