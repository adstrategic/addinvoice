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

  if (isFinishing) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center bg-primary p-4 text-primary-foreground">
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
          <h2 className="text-3xl font-bold tracking-tight">
            You’re exactly where you need to be.
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-md mx-auto">
            Let’s get your business set up so you never have to worry about this
            again.
          </p>
        </motion.div>
      </div>
    );
  }

  const safeIndex = Math.min(
    Math.max(currentStep, 0),
    ONBOARDING_QUESTIONS.length - 1,
  );
  const currentQuestion = ONBOARDING_QUESTIONS[safeIndex]!;

  return (
    <div className="min-h-screen w-full flex flex-col bg-primary items-center p-4 sm:p-6 lg:p-8 relative">
      {/* Header & Progress */}
      <div className="w-full max-w-2xl pt-6 pb-4 sm:pt-12 sm:pb-8 flex flex-col gap-3 shrink-0">
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-primary-foreground/80 uppercase tracking-wider">
            Step {currentStep + 1} of {ONBOARDING_QUESTIONS.length}
          </span>
          <span className="text-sm font-bold text-primary-foreground tracking-wide">
            AddInvoices
          </span>
        </div>
        <Progress
          value={((currentStep + 1) / ONBOARDING_QUESTIONS.length) * 100}
          className="h-2 rounded-full"
        />
      </div>

      {/* Main Content */}
      <div className="w-full max-w-2xl flex-1 flex flex-col justify-start sm:justify-center mt-4 sm:mt-0">
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
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-primary-foreground leading-tight text-center sm:text-left">
              {currentQuestion.question}
            </h1>

            <div className="space-y-3 sm:space-y-4 pt-2">
              {currentQuestion.options.map((option) => (
                <Card
                  key={option.id}
                  className="group relative cursor-pointer border-transparent bg-background text-foreground hover:bg-background/95 hover:border-primary-foreground/40 transition-all duration-300 shadow-sm hover:shadow-md"
                  onClick={() => handleOptionSelect(option.id)}
                >
                  <CardContent className="p-5 sm:p-6 flex items-center gap-4">
                    <div className="shrink-0 w-8 h-8 rounded-full border border-primary/20 flex items-center justify-center text-sm font-bold text-primary bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-colors">
                      {option.id}
                    </div>
                    <span className="sm:text-lg font-medium leading-snug">
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
      <div className="w-full max-w-2xl pb-4 sm:pb-8 flex justify-between items-center shrink-0 mt-auto sm:mt-8 pt-4">
        {currentStep > 0 ? (
          <Button
            variant="ghost"
            className="text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/10"
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
          className="text-primary-foreground/60 hover:text-primary-foreground hover:bg-primary-foreground/10"
          onClick={() => void handleFinish()}
          disabled={completeOnboardingMutation.isPending}
        >
          Skip
        </Button>
      </div>
    </div>
  );
}
