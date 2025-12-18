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

interface QuoteData {
  clientName: string;
  quoteNumber: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    tax: number;
  }>;
  notes: string;
}

export default function QuoteByVoicePage() {
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAutoListening, setIsAutoListening] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState(
    "Click the microphone to start speaking..."
  );
  const [quoteData, setQuoteData] = useState<QuoteData>({
    clientName: "",
    quoteNumber: "",
    items: [],
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
      "Hi! Let's create a new quote. Who is this quote for?",
      "Hello! Ready to make a quote. What's the client's name?",
      "Hey! I can help you with a quote. Who is the client?",
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
      case 1: // Client Name
        setQuoteData((prev) => ({ ...prev, clientName: transcript }));
        const clientAcks = [
          `Okay, ${transcript}. What should be the quote number?`,
          `Got it, ${transcript}. What quote number do you want to use?`,
          `Client is ${transcript}. And the quote number?`,
        ];
        aiResponse = clientAcks[Math.floor(Math.random() * clientAcks.length)];
        setCurrentSubtitle(aiResponse);
        await speakText(aiResponse);
        setConversationStep(2);
        break;

      case 2: // Quote Number
        setQuoteData((prev) => ({ ...prev, quoteNumber: transcript }));
        const numAcks = [
          `Quote ${transcript}. Now, tell me what item you are quoting for.`,
          `Number ${transcript} set. What's the product or service description?`,
          `Okay, ${transcript}. What are we adding to this quote?`,
        ];
        aiResponse = numAcks[Math.floor(Math.random() * numAcks.length)];
        setCurrentSubtitle(aiResponse);
        await speakText(aiResponse);
        setConversationStep(3);
        break;

      case 3: // Item Description
        const itemDescription = transcript;
        setQuoteData((prev) => ({
          ...prev,
          items: [
            {
              description: itemDescription,
              quantity: 1,
              unitPrice: 0,
              tax: 0,
            },
          ],
        }));
        const itemAcks = [
          `"${itemDescription}" added. How many units?`,
          `Okay, "${itemDescription}". What is the quantity?`,
          `Got "${itemDescription}". How many?`,
        ];
        aiResponse = itemAcks[Math.floor(Math.random() * itemAcks.length)];
        setCurrentSubtitle(aiResponse);
        await speakText(aiResponse);
        setConversationStep(4);
        break;

      case 4: // Quantity
        const quantity = parseInt(lowerTranscript.replace(/[^\d]/g, "")) || 1;
        setQuoteData((prev) => ({
          ...prev,
          items: prev.items.map((item, idx) =>
            idx === 0 ? { ...item, quantity } : item
          ),
        }));
        const qtyAcks = [
          `${quantity} units. What is the price per unit?`,
          `Quantity set to ${quantity}. What's the unit price?`,
          `Okay, ${quantity}. How much does each cost?`,
        ];
        aiResponse = qtyAcks[Math.floor(Math.random() * qtyAcks.length)];
        setCurrentSubtitle(aiResponse);
        await speakText(aiResponse);
        setConversationStep(5);
        break;

      case 5: // Price
        const price = parseFloat(lowerTranscript.replace(/[^\d.]/g, "")) || 0;
        setQuoteData((prev) => ({
          ...prev,
          items: prev.items.map((item, idx) =>
            idx === 0 ? { ...item, unitPrice: price } : item
          ),
        }));
        const priceAcks = [
          `$${price} per unit. Any tax percentage?`,
          `Price is $${price}. What tax rate should apply?`,
          `Okay, $${price}. Tax percentage?`,
        ];
        aiResponse = priceAcks[Math.floor(Math.random() * priceAcks.length)];
        setCurrentSubtitle(aiResponse);
        await speakText(aiResponse);
        setConversationStep(6);
        break;

      case 6: // Tax
        const tax = parseFloat(lowerTranscript.replace(/[^\d.]/g, "")) || 0;
        setQuoteData((prev) => ({
          ...prev,
          items: prev.items.map((item, idx) =>
            idx === 0 ? { ...item, tax } : item
          ),
        }));
        const taxAcks = [
          `${tax}% tax. Any special notes for this quote?`,
          `Tax set to ${tax}%. Do you want to add any notes?`,
          `Okay, ${tax}%. Any additional notes?`,
        ];
        aiResponse = taxAcks[Math.floor(Math.random() * taxAcks.length)];
        setCurrentSubtitle(aiResponse);
        await speakText(aiResponse);
        setConversationStep(7);
        break;

      case 7: // Notes
        const notes = lowerTranscript.includes("no") || lowerTranscript.includes("none") ? "" : transcript;
        setQuoteData((prev) => ({ ...prev, notes }));
        
        const finalAcks = [
          "Perfect! I've saved your quote as a draft. Redirecting you now.",
          "All done! Quote draft saved. Taking you back to the quotes page.",
          "Great! That's all recorded. Going back to quotes.",
        ];
        aiResponse = finalAcks[Math.floor(Math.random() * finalAcks.length)];
        setCurrentSubtitle(aiResponse);
        await speakText(aiResponse);
        
        // Save and redirect
        saveQuote({ ...quoteData, notes });
        setTimeout(() => {
            router.push("/quotes");
        }, 3000);
        break;
    }
  };

  const saveQuote = (data: QuoteData) => {
    const subtotal = data.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
    const totalTax = data.items.reduce((sum, item) => sum + (item.quantity * item.unitPrice * item.tax) / 100, 0);
    const total = subtotal + totalTax;

    const newQuote = {
      id: Date.now(),
      ...data,
      status: "draft",
      issueDate: new Date().toISOString().split("T")[0],
      validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // +30 days
      subtotal,
      totalTax,
      total,
      createdAt: new Date().toISOString(),
    };
    
    const existing = JSON.parse(localStorage.getItem("quoteDrafts") || "[]");
    localStorage.setItem("quoteDrafts", JSON.stringify([newQuote, ...existing]));
    
    toast({
      title: "Quote Saved",
      description: "Your quote draft has been successfully recorded.",
    });
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center">
      <div className="absolute top-0 left-0 right-0 flex items-center gap-4 p-6 z-40">
        <Link href="/quotes">
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
