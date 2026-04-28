"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import {
  useCompleteOnboarding,
  useOnboardingStatus,
} from "@/features/onboarding/hooks/useOnboarding";
import { useHasBusiness } from "@/hooks/useHasBusiness";

const ONBOARDING_QUESTIONS = [
  {
    question:
      "How much time do invoices and admin tasks take away from your real work?",
    options: [
      { id: "A", text: "Less than 30 minutes a week" },
      { id: "B", text: "1–3 hours per week" },
      { id: "C", text: "Several hours every week" },
      { id: "D", text: "It feels endless / I hate doing it" },
    ],
  },
  {
    question: "How are you currently managing invoices, clients, and payments?",
    options: [
      { id: "A", text: "Spreadsheets or manual documents" },
      { id: "B", text: "Multiple tools that don’t connect well" },
      { id: "C", text: "An invoicing app that feels complicated" },
      { id: "D", text: "I’m just starting / I don’t have a system" },
    ],
  },
  {
    question: "How would you like AddInvoices to help you the most?",
    options: [
      { id: "A", text: "Save time with faster invoicing" },
      { id: "B", text: "Automate reminders, payments, and tracking" },
      { id: "C", text: "Manage everything by voice" },
      { id: "D", text: "All of the above" },
    ],
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { hasBusiness, isLoading: isLoadingBusiness } = useHasBusiness();
  const {
    data: onboarding,
    isLoading: isLoadingOnboarding,
    isFetching: isFetchingOnboarding,
  } = useOnboardingStatus();
  const completeOnboardingMutation = useCompleteOnboarding();

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [selections, setSelections] = useState<Record<number, string>>({});
  const [isFinishing, setIsFinishing] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);

  // Rotate background images every 7 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex((prev) => prev + 1);
    }, 7000);
    return () => clearInterval(timer);
  }, []);


  // Wait a little before showing first question for smooth entrance
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // If onboarding already completed, redirect forward
  useEffect(() => {
    if (!mounted) return;
    if (isLoadingOnboarding || isFetchingOnboarding) return;

    if (onboarding?.completedAt) {
      if (!isLoadingBusiness && !hasBusiness) {
        router.replace("/setup");
      } else {
        router.replace("/");
      }
    }
  }, [
    hasBusiness,
    isFetchingOnboarding,
    isLoadingBusiness,
    isLoadingOnboarding,
    mounted,
    onboarding?.completedAt,
    router,
  ]);

  const handleOptionSelect = (optionId: string) => {
    const updatedSelections = {
      ...selections,
      [currentStep]: optionId,
    };
    setSelections(updatedSelections);

    if (currentStep < ONBOARDING_QUESTIONS.length - 1) {
      setDirection(1);
      setCurrentStep(currentStep + 1);
    } else {
      void handleFinish(updatedSelections);
    }
  };

  const handleFinish = async (
    finalSelections: Record<number, string> = selections,
  ) => {
    setIsFinishing(true);

    const payloadAnswers = {
      version: 1,
      submittedAt: new Date().toISOString(),
      questions: ONBOARDING_QUESTIONS.map((q, index) => {
        const selectedOptionId = finalSelections[index] ?? null;
        const selectedOption =
          selectedOptionId == null
            ? null
            : q.options.find((o) => o.id === selectedOptionId) ?? null;

        return {
          index,
          question: q.question,
          selectedOptionId,
          selectedOptionText: selectedOption?.text ?? null,
        };
      }),
    };

    try {
      await completeOnboardingMutation.mutateAsync({
        answers: payloadAnswers,
      });
    } catch {
      // If backend says already completed, just continue forward
    }

    // Smooth transition to business setup
    setTimeout(() => {
      router.push("/setup");
    }, 1500);
  };

  const slideVariants = {
    hidden: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
    }),
    visible: {
      x: 0,
      opacity: 1,
      transition: {
        type: "spring" as const,
        stiffness: 300,
        damping: 30,
      },
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -50 : 50,
      opacity: 0,
      transition: {
        duration: 0.2,
      },
    }),
  };

  if (!mounted || isLoadingOnboarding) return null;

  const safeIndex = Math.min(
    Math.max(currentStep, 0),
    ONBOARDING_QUESTIONS.length - 1,
  );
  const currentQuestion = ONBOARDING_QUESTIONS[safeIndex]!;

  return (
    <div className="min-h-screen w-full flex flex-col items-center p-4 sm:p-6 lg:p-8 relative overflow-hidden bg-primary">
      {/* Background Images */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <AnimatePresence>
          <motion.div
            key={bgIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.5 }}
            className="absolute inset-0"
          >
            <picture>
              <source
                media="(min-width: 768px)"
                srcSet={`/images/onboarding-pics/do${(bgIndex % 2) + 1}.png`}
              />
              <img
                src={`/images/onboarding-pics/ro${(bgIndex % 5) + 1}.png`}
                alt="Background"
                className="w-full h-full object-cover"
              />
            </picture>
          </motion.div>
        </AnimatePresence>
        {/* Overlay to ensure text readability */}
        <div className="absolute inset-0 bg-primary/40 mix-blend-multiply" />
      </div>

      {isFinishing ? (
        <div className="relative z-10 w-full flex flex-col items-center justify-center flex-1 text-white">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="text-center space-y-6"
          >
            <div className="h-20 w-20 bg-background text-primary rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg
                className="w-10 h-10 animate-[bounce_2s_infinite]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold tracking-tight drop-shadow-md">
              You’re exactly where you need to be.
            </h2>
            <p className="text-white/90 text-lg max-w-md mx-auto drop-shadow-md">
              Let’s get your business set up so you never have to worry about this
              again.
            </p>
          </motion.div>
        </div>
      ) : (
        <>
          {/* Header & Progress */}
          <div className="relative z-10 w-full max-w-2xl pt-6 pb-4 sm:pt-12 sm:pb-8 flex flex-col gap-3 shrink-0">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-white/90 uppercase tracking-wider shadow-sm">
                Step {currentStep + 1} of {ONBOARDING_QUESTIONS.length}
              </span>
              <span className="text-sm font-bold text-white tracking-wide shadow-sm">
                AddInvoices
              </span>
            </div>
            <Progress
              value={((currentStep + 1) / ONBOARDING_QUESTIONS.length) * 100}
              className="h-2 rounded-full bg-white/20 [&>div]:bg-white"
            />
          </div>

          {/* Main Content */}
          <div className="relative z-10 w-full max-w-2xl flex-1 flex flex-col justify-start sm:justify-center mt-4 sm:mt-0">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={currentStep}
                custom={direction}
                variants={slideVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="w-full space-y-8"
              >
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-4 sm:p-5 shadow-lg">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white leading-tight text-center sm:text-left drop-shadow-md">
                    {currentQuestion.question}
                  </h1>
                </div>

                <div className="space-y-3 sm:space-y-4 pt-2">
                  {currentQuestion.options.map((option) => (
                    <Card
                      key={option.id}
                      className="group relative cursor-pointer border border-white/20 bg-white/10 backdrop-blur-sm text-white hover:bg-white/20 hover:border-white/40 transition-all duration-300 shadow-lg hover:shadow-xl"
                      onClick={() => handleOptionSelect(option.id)}
                    >
                      <CardContent className="py-2.5 px-4 sm:py-3 sm:px-5 flex items-center gap-3 sm:gap-4">
                        <div className="shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-white/30 flex items-center justify-center text-xs sm:text-sm font-bold text-white bg-white/10 group-hover:bg-white group-hover:text-primary group-hover:border-white transition-colors">
                          {option.id}
                        </div>
                        <span className="text-base sm:text-lg font-medium leading-snug">
                          {option.text}
                        </span>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Footer Navigation */}
          <div className="relative z-10 w-full max-w-2xl pb-4 sm:pb-8 flex justify-between items-center shrink-0 mt-auto sm:mt-8 pt-4">
            {currentStep > 0 ? (
              <Button
                variant="ghost"
                className="text-white/80 hover:text-white hover:bg-white/20"
                onClick={() => {
                  setDirection(-1);
                  setCurrentStep(currentStep - 1);
                }}
              >
                &larr; Back
              </Button>
            ) : (
              <div className="h-10"></div>
            )}

            <Button
              variant="ghost"
              className="text-white/60 hover:text-white hover:bg-white/20"
              onClick={() => void handleFinish()}
              disabled={completeOnboardingMutation.isPending}
            >
              Skip
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
