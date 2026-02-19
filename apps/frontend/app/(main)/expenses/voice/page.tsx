"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Mic } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { useRouter } from "next/navigation";

// Speech Recognition types
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  abort(): void;
  onstart: ((this: SpeechRecognition, ev: Event) => void) | null;
  onend: ((this: SpeechRecognition, ev: Event) => void) | null;
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => void)
    | null;
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => void)
    | null;
}

interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare global {
  interface Window {
    SpeechRecognition?: {
      new (): SpeechRecognition;
    };
    webkitSpeechRecognition?: {
      new (): SpeechRecognition;
    };
  }
}

interface ExpenseData {
  description: string;
  amount: number;
  category: string;
  date: string;
  notes: string;
}

const expenseCategories = [
  "Office Supplies",
  "Travel",
  "Meals & Entertainment",
  "Software & Subscriptions",
  "Marketing & Advertising",
  "Professional Services",
  "Utilities",
  "Rent",
  "Equipment",
  "Other",
];

export default function ExpenseByVoicePage() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAutoListening, setIsAutoListening] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState(
    "Click the microphone to start speaking..."
  );
  const [expenseData, setExpenseData] = useState<ExpenseData>({
    description: "",
    amount: 0,
    category: "Other",
    date: new Date().toISOString().split("T")[0],
    notes: "",
  });
  const [conversationStep, setConversationStep] = useState(0);
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognitionConstructor =
      window.SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      null;
    if (SpeechRecognitionConstructor) {
      const recognition = new SpeechRecognitionConstructor();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        console.error("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const speakText = async (text: string) => {
    return new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 1.1;
      utterance.volume = 1;
      utterance.lang = "en-US";

      if (typeof window !== "undefined" && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          const preferredVoice = voices.find(
            (voice) =>
              voice.lang.startsWith("en") &&
              (voice.name.includes("Samantha") ||
                voice.name.includes("Victoria") ||
                voice.name.includes("Google UK English Female"))
          );
          if (preferredVoice) {
            utterance.voice = preferredVoice;
          }
        }
      }

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        setIsSpeaking(false);
        setIsAutoListening(true);
        setTimeout(() => {
          if (recognitionRef.current && conversationStep > 0) {
            recognitionRef.current.start();
          }
        }, 800);
        resolve();
      };

      utterance.onerror = () => {
        setIsSpeaking(false);
        resolve();
      };

      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
        window.speechSynthesis.speak(utterance);
      } else {
        resolve();
      }
    });
  };

  const initializeConversation = async () => {
    const greetings = [
      "Hi! Let's record a new expense. What is this expense for?",
      "Hello! Ready to track an expense. Please describe what you bought.",
      "Hey! I can help you log an expense. What's the description?",
    ];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    setCurrentSubtitle(greeting);
    await speakText(greeting);
    setConversationStep(1);
  };

  const startListening = () => {
    if (conversationStep === 0) {
      initializeConversation();
      return;
    }

    if (!recognitionRef.current) return;

    recognitionRef.current.onresult = async (event: SpeechRecognitionEvent) => {
      let isFinal = false;
      const transcript = Array.from(event.results)
        .map((result: SpeechRecognitionResult) => {
          if (result.isFinal) isFinal = true;
          return result.item(0)?.transcript || result[0]?.transcript || "";
        })
        .join("");

      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }

      if (isFinal) {
        silenceTimeoutRef.current = setTimeout(() => {
          if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsAutoListening(false);
          }
        }, 500);

        await processVoiceInput(transcript);
      }
    };

    recognitionRef.current.start();
  };

  const processVoiceInput = async (transcript: string) => {
    const lowerTranscript = transcript.toLowerCase().trim();

    setConversationHistory((prev) => [
      ...prev,
      { role: "user", content: transcript },
    ]);

    if (!transcript || transcript.length < 2) {
      const retry = "I didn't catch that. Could you say it again?";
      setCurrentSubtitle(retry);
      await speakText(retry);
      return;
    }

    let aiResponse = "";

    switch (conversationStep) {
      case 1: // Description
        setExpenseData((prev) => ({ ...prev, description: transcript }));
        const descAcks = [
          `Got it, "${transcript}". How much was it?`,
          `Okay, "${transcript}". What was the total amount?`,
          `Understood. And the cost?`,
        ];
        aiResponse = descAcks[Math.floor(Math.random() * descAcks.length)];
        setCurrentSubtitle(aiResponse);
        await speakText(aiResponse);
        setConversationStep(2);
        break;

      case 2: // Amount
        const amount = parseFloat(lowerTranscript.replace(/[^\d.]/g, "")) || 0;
        if (amount === 0) {
           aiResponse = "I couldn't hear a valid amount. Please say the price again, like '50 dollars'.";
           setCurrentSubtitle(aiResponse);
           await speakText(aiResponse);
           return;
        }
        setExpenseData((prev) => ({ ...prev, amount }));
        const amountAcks = [
          `$${amount}. What category should I put this in?`,
          `$${amount}, noted. Which category fits best?`,
          `Okay, $${amount}. Is this for Office Supplies, Travel, or something else?`,
        ];
        aiResponse = amountAcks[Math.floor(Math.random() * amountAcks.length)];
        setCurrentSubtitle(aiResponse);
        await speakText(aiResponse);
        setConversationStep(3);
        break;

      case 3: // Category
        // Simple matching logic
        let matchedCategory = "Other";
        for (const cat of expenseCategories) {
          if (lowerTranscript.includes(cat.toLowerCase())) {
            matchedCategory = cat;
            break;
          }
        }
        setExpenseData((prev) => ({ ...prev, category: matchedCategory }));
        
        const catAcks = [
          `I've set it to ${matchedCategory}. When did this expense happen?`,
          `Category is ${matchedCategory}. What was the date of the expense?`,
          `Okay, ${matchedCategory}. Is this from today, yesterday, or another date?`,
        ];
        aiResponse = catAcks[Math.floor(Math.random() * catAcks.length)];
        setCurrentSubtitle(aiResponse);
        await speakText(aiResponse);
        setConversationStep(4);
        break;

      case 4: // Date
        let date = new Date().toISOString().split("T")[0];
        if (lowerTranscript.includes("yesterday")) {
          const d = new Date();
          d.setDate(d.getDate() - 1);
          date = d.toISOString().split("T")[0];
        } else if (lowerTranscript.includes("today")) {
           // keep default
        } else {
           // Try to parse? For now, default to today if not clear, or maybe just accept it if we had a smart parser.
           // We'll stick to today/yesterday or just current date for simplicity in this MVP unless they say a specific date which is hard to parse without a library.
           // Let's just assume today if unclear for now to keep it robust.
        }

        setExpenseData((prev) => ({ ...prev, date }));
        const dateAcks = [
          `Recorded for ${date}. Any notes you want to add?`,
          `Date set to ${date}. Do you have any extra notes?`,
          `Okay, ${date}. Any additional details?`,
        ];
        aiResponse = dateAcks[Math.floor(Math.random() * dateAcks.length)];
        setCurrentSubtitle(aiResponse);
        await speakText(aiResponse);
        setConversationStep(5);
        break;

      case 5: // Notes
        const notes = lowerTranscript.includes("no") || lowerTranscript.includes("none") ? "" : transcript;
        setExpenseData((prev) => ({ ...prev, notes }));
        
        const finalAcks = [
          "Perfect! I've saved your expense. Redirecting you to the list now.",
          "All done! Expense saved. Taking you back to the expenses page.",
          "Great! That's all recorded. Going back to expenses.",
        ];
        aiResponse = finalAcks[Math.floor(Math.random() * finalAcks.length)];
        setCurrentSubtitle(aiResponse);
        await speakText(aiResponse);
        
        // Save and redirect
        saveExpense({ ...expenseData, notes });
        setTimeout(() => {
            router.push("/expenses");
        }, 3000);
        break;
    }
  };

  const saveExpense = (data: ExpenseData) => {
    const newExpense = {
      id: Date.now().toString(),
      ...data,
      createdAt: new Date().toISOString(),
    };
    const existing = JSON.parse(localStorage.getItem("expenses") || "[]");
    localStorage.setItem("expenses", JSON.stringify([newExpense, ...existing]));
    toast({
      title: "Expense Saved",
      description: "Your expense has been successfully recorded.",
    });
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center">
      <div className="absolute top-0 left-0 right-0 flex items-center gap-4 p-6 z-40">
        <Link href="/expenses">
          <Button
            variant="ghost"
            size="icon"
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      <div className="flex flex-col items-center justify-center flex-1 w-full px-6">
        <div
          className={`mb-8 transition-all duration-300 ${
            isSpeaking ? "animate-pulse scale-110" : "scale-100"
          }`}
        >
          <Image
            src="/images/adstrategic-icon.png"
            alt="AdStrategic"
            width={120}
            height={120}
            className="mx-auto"
          />
        </div>

        {(isSpeaking || isListening) && (
          <div className="flex items-center justify-center gap-1 mb-8 h-12">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className={`w-1 rounded-full ${
                  isSpeaking ? "bg-cyan-400" : "bg-green-400"
                }`}
                style={{
                  height: `${20 + Math.sin(i * 0.5) * 15}px`,
                  animation: `wave 0.5s ease-in-out ${i * 0.05}s infinite`,
                }}
              />
            ))}
          </div>
        )}

        <div className="mb-12 min-h-16 text-center max-w-2xl">
          <p className="text-2xl font-semibold text-white text-balance">
            {currentSubtitle}
          </p>
        </div>

        <div className="flex items-center gap-4">
          {isListening ? (
            <Button
              onClick={() => {
                recognitionRef.current?.stop();
                setIsAutoListening(false);
              }}
              size="lg"
              className="rounded-full w-16 h-16 bg-red-500 hover:bg-red-600 text-white shadow-[0_0_30px_rgba(239,68,68,0.5)] animate-pulse"
            >
              <div className="w-4 h-4 bg-white rounded-sm" />
            </Button>
          ) : (
            <Button
              onClick={startListening}
              size="lg"
              className={`rounded-full w-16 h-16 transition-all duration-300 ${
                conversationStep === 0
                  ? "bg-white text-slate-900 hover:bg-gray-200 shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                  : "bg-green-500 hover:bg-green-600 text-white shadow-[0_0_30px_rgba(34,197,94,0.5)]"
              }`}
            >
              <Mic className="h-8 w-8" />
            </Button>
          )}
        </div>

        <p className="mt-8 text-slate-400 text-sm">
          {conversationStep === 0
            ? "Tap the microphone to start"
            : isListening
            ? "Listening..."
            : "Tap to speak"}
        </p>
      </div>

      <style jsx global>{`
        @keyframes wave {
          0%,
          100% {
            transform: scaleY(1);
          }
          50% {
            transform: scaleY(1.5);
          }
        }
      `}</style>
    </div>
  );
}
