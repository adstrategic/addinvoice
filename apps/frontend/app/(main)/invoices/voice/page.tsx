"use client";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ArrowLeft, Mic, Square, X } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/hooks/use-toast";
import { TemplateSelectionDialog } from "@/components/template-selection-dialog";
import Image from "next/image";

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

type CompanyTemplate = {
  id: number;
  name: string;
  nit: string;
  address: string;
  email: string;
  phone: string;
  logo: string | null;
  template: string;
  isDefault: boolean;
};

interface InvoiceData {
  clientName: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    tax: number;
  }>;
  notes: string;
  terms: string;
}

export default function InvoiceByVoicePage() {
  const [selectedTemplate, setSelectedTemplate] =
    useState<CompanyTemplate | null>(null);
  const [showTemplateDialog, setShowTemplateDialog] = useState(true);
  const [showInstructions, setShowInstructions] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isAutoListening, setIsAutoListening] = useState(false);
  const [currentSubtitle, setCurrentSubtitle] = useState(
    "Click the microphone to start speaking..."
  );
  const [showEmailConfirmation, setShowEmailConfirmation] = useState(false);
  const [clientEmail, setClientEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [pendingAction, setPendingAction] = useState<"send" | "draft" | null>(
    null
  );
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [invoiceData, setInvoiceData] = useState<InvoiceData>({
    clientName: "",
    invoiceNumber: "",
    issueDate: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split("T")[0],
    items: [],
    notes: "",
    terms: "",
  });
  const [conversationStep, setConversationStep] = useState(0);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<
    Array<{ role: string; content: string }>
  >([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

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

    // Load voices when they become available
    if (window.speechSynthesis) {
      const loadVoices = () => {
        // Voices are now loaded
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  const speakText = async (text: string) => {
    return new Promise<void>((resolve) => {
      const utterance = new SpeechSynthesisUtterance(text);

      // More natural voice settings - slightly slower, warmer pitch
      utterance.rate = 0.95; // Slightly slower for more natural speech
      utterance.pitch = 1.1; // Slightly higher pitch for friendlier tone
      utterance.volume = 1;
      utterance.lang = "en-US";

      // Try to select a more natural voice if available
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          // Prefer female voices as they're often perceived as more friendly
          const preferredVoice = voices.find(
            (voice) =>
              voice.lang.startsWith("en") &&
              (voice.name.includes("Samantha") ||
                voice.name.includes("Victoria") ||
                voice.name.includes("Karen") ||
                voice.name.includes("Fiona") ||
                voice.name.includes("Google UK English Female") ||
                voice.name.includes("Microsoft Zira") ||
                voice.name.includes("Microsoft Hazel") ||
                (voice.name.includes("Female") && voice.lang.startsWith("en")))
          );

          if (preferredVoice) {
            utterance.voice = preferredVoice;
          } else {
            // Fallback to any English female voice
            const englishFemaleVoice = voices.find(
              (voice) =>
                voice.lang.startsWith("en") &&
                voice.name.toLowerCase().includes("female")
            );
            if (englishFemaleVoice) {
              utterance.voice = englishFemaleVoice;
            } else {
              // Final fallback: any English voice
              const englishVoice = voices.find((voice) =>
                voice.lang.startsWith("en")
              );
              if (englishVoice) {
                utterance.voice = englishVoice;
              }
            }
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
        }, 800); // Slightly longer pause for more natural flow
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

  const handleTemplateSelect = (template: CompanyTemplate | null) => {
    if (template) {
      setSelectedTemplate(template);
      setShowTemplateDialog(false);
      setShowInstructions(true);
    } else {
      toast({
        title: "Template required",
        description: "Please select a company template to continue",
        variant: "destructive",
      });
    }
  };

  const handleStartInvoice = () => {
    setShowInstructions(false);
    initializeConversation();
  };

  const initializeConversation = async () => {
    const greetings = [
      `Hi! Great to see you here. I'm excited to help you create an invoice for ${selectedTemplate?.name}. Let's start with the basics — what's your client's name?`,
      `Hello! Welcome to Invoice by Voice. I'm here to make this easy for you. We're creating an invoice for ${selectedTemplate?.name}, so first, who is this invoice going to?`,
      `Hey there! Thanks for choosing Invoice by Voice. Together, we'll get your invoice for ${selectedTemplate?.name} sorted in no time. To get started, what's the name of your client?`,
    ];
    const greeting = greetings[Math.floor(Math.random() * greetings.length)];
    setCurrentSubtitle(greeting);
    await speakText(greeting);
    setConversationStep(1);
  };

  const startListening = () => {
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
      const retries = [
        "I'm sorry, I didn't quite catch that. Could you say it again for me?",
        "Oops, I missed that. Mind repeating that?",
        "Hmm, I didn't get that. Could you try saying it one more time?",
        "I'm having a bit of trouble hearing you. Could you speak a bit louder?",
      ];
      const retry = retries[Math.floor(Math.random() * retries.length)];
      setCurrentSubtitle(retry);
      await speakText(retry);
      return;
    }

    let aiResponse = "";

    switch (conversationStep) {
      case 1:
        if (invoiceData.clientName) {
          break;
        }
        setInvoiceData((prev) => ({
          ...prev,
          clientName: transcript,
        }));
        const clientAcks = [
          `Perfect! ${transcript} it is. I've got that saved. Now, what invoice number would you like to use for this one?`,
          `Excellent! ${transcript} is now set as your client. What's the invoice number you'd like to assign to this invoice?`,
          `Great! I've noted ${transcript} as your client. Moving forward, what invoice number should we use for this invoice?`,
        ];
        aiResponse = clientAcks[Math.floor(Math.random() * clientAcks.length)];
        setCurrentSubtitle(aiResponse);
        await speakText(aiResponse);
        setConversationHistory((prev) => [
          ...prev,
          { role: "assistant", content: aiResponse },
        ]);
        setConversationStep(2);
        break;

      case 2:
        if (invoiceData.invoiceNumber) {
          break;
        }
        setInvoiceData((prev) => ({
          ...prev,
          invoiceNumber: transcript,
        }));
        const numberAcks = [
          `Got it! Invoice number ${transcript} is set. Now, tell me what services or products you're billing for.`,
          `Perfect! Invoice ${transcript} is all set. What would you like to include on this invoice? Describe the work or items for me.`,
          `Excellent! I've recorded invoice number ${transcript}. Now, what products or services should we add to this invoice?`,
        ];
        aiResponse = numberAcks[Math.floor(Math.random() * numberAcks.length)];
        setCurrentSubtitle(aiResponse);
        await speakText(aiResponse);
        setConversationHistory((prev) => [
          ...prev,
          { role: "assistant", content: aiResponse },
        ]);
        setConversationStep(3);
        break;

      case 3:
        if (invoiceData.items.length > 0 && invoiceData.items[0].description) {
          break;
        }
        const itemDescription = transcript;
        const itemAcks = [
          `Sounds good! "${itemDescription}" — I like it. How many units would you like to bill for?`,
          `Perfect! I've got "${itemDescription}" down. What quantity should we set for this?`,
          `Great! "${itemDescription}" is added. Now, how many units are we talking about?`,
        ];
        aiResponse = itemAcks[Math.floor(Math.random() * itemAcks.length)];
        setCurrentSubtitle(aiResponse);
        await speakText(aiResponse);
        setConversationHistory((prev) => [
          ...prev,
          { role: "assistant", content: aiResponse },
        ]);
        setInvoiceData((prev) => ({
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
        setConversationStep(4);
        break;

      case 4:
        if (
          invoiceData.items[0]?.quantity &&
          invoiceData.items[0].quantity > 1
        ) {
          break;
        }
        const quantity = Number.parseInt(lowerTranscript) || 1;
        const qtyAcks = [
          `Perfect! ${quantity} ${
            quantity === 1 ? "unit" : "units"
          } it is. Now, what's the price per unit?`,
          `Excellent! ${quantity} ${
            quantity === 1 ? "unit" : "units"
          } — got it. What's the unit price for this?`,
          `Great! I've set the quantity to ${quantity} ${
            quantity === 1 ? "unit" : "units"
          }. What's the cost per unit?`,
        ];
        aiResponse = qtyAcks[Math.floor(Math.random() * qtyAcks.length)];
        setCurrentSubtitle(aiResponse);
        await speakText(aiResponse);
        setConversationHistory((prev) => [
          ...prev,
          { role: "assistant", content: aiResponse },
        ]);
        setInvoiceData((prev) => ({
          ...prev,
          items: prev.items.map((item, idx) =>
            idx === 0
              ? {
                  ...item,
                  quantity,
                }
              : item
          ),
        }));
        setConversationStep(5);
        break;

      case 5:
        if (
          invoiceData.items[0]?.unitPrice &&
          invoiceData.items[0].unitPrice > 0
        ) {
          break;
        }
        const price =
          Number.parseFloat(lowerTranscript.replace(/[^\d.]/g, "")) || 0;
        const priceAcks = [
          `Perfect! ${price.toFixed(
            2
          )} per unit sounds good. Now, what tax percentage should we apply to this?`,
          `Great! ${price.toFixed(
            2
          )} per unit is set. Is there any tax we need to apply to this invoice?`,
          `Excellent! ${price.toFixed(
            2
          )} per unit — I've got that. What tax percentage should we use?`,
        ];
        aiResponse = priceAcks[Math.floor(Math.random() * priceAcks.length)];
        setCurrentSubtitle(aiResponse);
        await speakText(aiResponse);
        setConversationHistory((prev) => [
          ...prev,
          { role: "assistant", content: aiResponse },
        ]);
        setInvoiceData((prev) => ({
          ...prev,
          items: prev.items.map((item, idx) =>
            idx === 0
              ? {
                  ...item,
                  unitPrice: price,
                }
              : item
          ),
        }));
        setConversationStep(6);
        break;

      case 6:
        if (invoiceData.items[0]?.tax && invoiceData.items[0].tax > 0) {
          break;
        }
        const tax =
          Number.parseFloat(lowerTranscript.replace(/[^\d.]/g, "")) || 0;
        const taxAcks = [
          `${tax}% tax is all set. Do you have any special notes or payment terms you'd like me to add to this invoice?`,
          `${tax}% tax — perfect! Is there anything else you'd like to include? Maybe some notes or payment terms?`,
          `Excellent! ${tax}% tax has been applied. Would you like to add any additional details or payment terms?`,
        ];
        aiResponse = taxAcks[Math.floor(Math.random() * taxAcks.length)];
        setCurrentSubtitle(aiResponse);
        await speakText(aiResponse);
        setConversationHistory((prev) => [
          ...prev,
          { role: "assistant", content: aiResponse },
        ]);
        setInvoiceData((prev) => ({
          ...prev,
          items: prev.items.map((item, idx) =>
            idx === 0
              ? {
                  ...item,
                  tax,
                }
              : item
          ),
        }));
        setConversationStep(7);
        break;

      case 7:
        setInvoiceData((prev) => ({
          ...prev,
          notes: transcript,
        }));
        const summaryAcks = [
          `Wonderful! I've got everything down. Your invoice for ${invoiceData.clientName} is looking great. Would you like me to save this as a draft, or should we send it out right away?`,
          `Perfect! Your invoice for ${invoiceData.clientName} is all ready to go. What would you prefer — save it as a draft for now, or send it out immediately?`,
          `Excellent! Everything is set for ${invoiceData.clientName}. Your invoice is ready. Would you like to save it as a draft, or shall we send it out now?`,
        ];
        aiResponse =
          summaryAcks[Math.floor(Math.random() * summaryAcks.length)];
        setCurrentSubtitle(aiResponse);
        await speakText(aiResponse);
        setConversationHistory((prev) => [
          ...prev,
          { role: "assistant", content: aiResponse },
        ]);
        setConversationStep(8);
        break;

      case 8:
        if (lowerTranscript.includes("send")) {
          setPendingAction("send");
          setShowEmailConfirmation(true);
          const sendMsgs = [
            "Perfect! To send this invoice, I'll need the client's email address. What is it?",
            "Excellent! I'd be happy to send this for you. What's your client's email address?",
            "Great choice! I'll send this right over. Could you give me the client's email address?",
          ];
          aiResponse = sendMsgs[Math.floor(Math.random() * sendMsgs.length)];
          setCurrentSubtitle(aiResponse);
          await speakText(aiResponse);
        } else if (
          lowerTranscript.includes("save") ||
          lowerTranscript.includes("draft")
        ) {
          setPendingAction("draft");
          setShowEmailConfirmation(true);
          const saveMsgs = [
            "Perfect! I'll save this as a draft for you. To complete the draft, I'll need the client's email address. What is it?",
            "Great choice! Let's save this as a draft. What's the client's email address so I can associate it with this invoice?",
            "Excellent! I'll save this as a draft. Could you provide the client's email address?",
          ];
          aiResponse = saveMsgs[Math.floor(Math.random() * saveMsgs.length)];
          setCurrentSubtitle(aiResponse);
          await speakText(aiResponse);
        } else {
          const clarifyMsgs = [
            "I'm not quite sure what you'd like to do. Would you prefer to save this as a draft, or should I send it out right away?",
            "Just to make sure I understand correctly — would you like me to save this as a draft, or send it now?",
            "I didn't catch that clearly. Could you let me know if you'd like to save this as a draft or send it?",
          ];
          aiResponse =
            clarifyMsgs[Math.floor(Math.random() * clarifyMsgs.length)];
          setCurrentSubtitle(aiResponse);
          await speakText(aiResponse);
        }
        break;
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailConfirm = async () => {
    if (!clientEmail.trim()) {
      setEmailError("Please enter an email address");
      return;
    }

    if (!validateEmail(clientEmail)) {
      setEmailError("Please enter a valid email address");
      return;
    }

    setEmailError("");
    setShowEmailConfirmation(false);

    if (pendingAction === "send") {
      const confirmMsgs = [
        "Perfect! I'm sending your invoice now. It should be on its way shortly!",
        "Excellent! Your invoice is being sent right now. The client should receive it very soon!",
        "Great! I'm processing that for you now. Your invoice will be sent momentarily!",
      ];
      const confirmMsg =
        confirmMsgs[Math.floor(Math.random() * confirmMsgs.length)];
      setCurrentSubtitle(confirmMsg);
      await speakText(confirmMsg);
      saveAndSendInvoice();
    } else if (pendingAction === "draft") {
      const confirmMsgs = [
        "Perfect! I'm saving your invoice as a draft right now. You can access it anytime!",
        "Excellent! Your draft is being saved. You'll be able to find it whenever you need it!",
        "Great! I'm saving this as a draft for you. It's all set!",
      ];
      const confirmMsg =
        confirmMsgs[Math.floor(Math.random() * confirmMsgs.length)];
      setCurrentSubtitle(confirmMsg);
      await speakText(confirmMsg);
      saveDraftInvoice();
    }

    setPendingAction(null);
  };

  const saveDraftInvoice = () => {
    if (!selectedTemplate) return;

    const invoiceDraft = {
      id: Date.now(),
      invoiceNumber: invoiceData.invoiceNumber,
      status: "draft",
      issueDate: invoiceData.issueDate,
      dueDate: invoiceData.dueDate,
      clientName: invoiceData.clientName,
      clientEmail: clientEmail,
      companyName: selectedTemplate.name,
      companyAddress: selectedTemplate.address,
      companyNIT: selectedTemplate.nit,
      companyEmail: selectedTemplate.email,
      companyPhone: selectedTemplate.phone,
      items: invoiceData.items,
      notes: invoiceData.notes,
      terms: invoiceData.terms,
      logo: selectedTemplate.logo,
      subtotal: invoiceData.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      ),
      totalTax: invoiceData.items.reduce((sum, item) => {
        const subtotal = item.quantity * item.unitPrice;
        return sum + (subtotal * item.tax) / 100;
      }, 0),
      total: invoiceData.items.reduce((sum, item) => {
        const subtotal = item.quantity * item.unitPrice;
        const tax = (subtotal * item.tax) / 100;
        return sum + subtotal + tax;
      }, 0),
      createdAt: new Date().toISOString(),
    };

    const existingDrafts = JSON.parse(
      localStorage.getItem("invoiceDrafts") || "[]"
    );
    localStorage.setItem(
      "invoiceDrafts",
      JSON.stringify([...existingDrafts, invoiceDraft])
    );

    setSuccessMessage(`Invoice draft saved successfully for ${clientEmail}!`);
    setShowSuccessDialog(true);
  };

  const saveAndSendInvoice = () => {
    if (!selectedTemplate) return;

    const emittedInvoice = {
      id: Date.now(),
      invoiceNumber: invoiceData.invoiceNumber,
      status: "issued",
      issueDate: invoiceData.issueDate,
      dueDate: invoiceData.dueDate,
      clientName: invoiceData.clientName,
      clientEmail: clientEmail,
      companyName: selectedTemplate.name,
      companyAddress: selectedTemplate.address,
      companyNIT: selectedTemplate.nit,
      companyEmail: selectedTemplate.email,
      companyPhone: selectedTemplate.phone,
      items: invoiceData.items,
      notes: invoiceData.notes,
      terms: invoiceData.terms,
      logo: selectedTemplate.logo,
      subtotal: invoiceData.items.reduce(
        (sum, item) => sum + item.quantity * item.unitPrice,
        0
      ),
      totalTax: invoiceData.items.reduce((sum, item) => {
        const subtotal = item.quantity * item.unitPrice;
        return sum + (subtotal * item.tax) / 100;
      }, 0),
      total: invoiceData.items.reduce((sum, item) => {
        const subtotal = item.quantity * item.unitPrice;
        const tax = (subtotal * item.tax) / 100;
        return sum + subtotal + tax;
      }, 0),
      emittedAt: new Date().toISOString(),
    };

    const existingEmitted = JSON.parse(
      localStorage.getItem("emittedInvoices") || "[]"
    );
    localStorage.setItem(
      "emittedInvoices",
      JSON.stringify([...existingEmitted, emittedInvoice])
    );

    setSuccessMessage(`Invoice sent successfully to ${clientEmail}!`);
    setShowSuccessDialog(true);
  };

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col items-center justify-center">
      <div className="absolute top-0 left-0 right-0 flex items-center gap-4 p-6 z-40">
        <Link href="/invoices">
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
              className="rounded-full w-20 h-20 bg-red-500 hover:bg-red-600 text-white shadow-lg"
            >
              <Square className="h-8 w-8" />
            </Button>
          ) : (
            <Button
              onClick={startListening}
              size="lg"
              className={`rounded-full w-20 h-20 text-white shadow-lg ${
                isAutoListening
                  ? "bg-green-500 hover:bg-green-600"
                  : "bg-cyan-500 hover:bg-cyan-600"
              }`}
              disabled={isSpeaking}
            >
              <Mic className="h-8 w-8" />
            </Button>
          )}
        </div>

        <div className="mt-8 text-sm text-gray-400">
          {isListening &&
            (isAutoListening ? "Listening automatically..." : "Listening...")}
          {isSpeaking && "AI is speaking..."}
          {!isListening &&
            !isSpeaking &&
            (isAutoListening ? "Ready to listen" : "Ready to start")}
        </div>
      </div>

      <div className="absolute bottom-6 text-center text-gray-400 text-sm">
        <p>INVOICE BY VOICE</p>
        <p className="text-xs text-gray-500 mt-1">
          POWERED BY <span className="text-cyan-400">ADSTRATEGIC</span>
        </p>
      </div>

      <style>{`
        @keyframes wave {
          0%, 100% {
            height: 20px;
          }
          50% {
            height: 40px;
          }
        }
      `}</style>

      <TemplateSelectionDialog
        open={showTemplateDialog}
        onSelect={handleTemplateSelect}
        onOpenChange={setShowTemplateDialog}
      />

      <Dialog open={showInstructions} onOpenChange={setShowInstructions}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-slate-800 to-slate-900 border-cyan-400/30 text-white">
          <div className="absolute right-4 top-4">
            <button
              onClick={() => setShowInstructions(false)}
              className="text-white hover:text-cyan-400 transition-colors"
              aria-label="Close instructions"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <DialogHeader className="pr-8">
            <DialogTitle className="text-white text-2xl font-bold">
              How to Use Voice Mode
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              Follow these instructions to create your invoice
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-6">
            <div className="space-y-3">
              <div className="flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm">
                  1
                </div>
                <div>
                  <p className="font-semibold text-white">
                    Click the Microphone
                  </p>
                  <p className="text-sm text-gray-400">
                    Press the mic button to start speaking or let it auto-listen
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm">
                  2
                </div>
                <div>
                  <p className="font-semibold text-white">Answer Questions</p>
                  <p className="text-sm text-gray-400">
                    The assistant will ask about client, services, quantities,
                    and prices
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm">
                  3
                </div>
                <div>
                  <p className="font-semibold text-white">Auto-Listening</p>
                  <p className="text-sm text-gray-400">
                    The microphone automatically activates after each response
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400 font-bold text-sm">
                  4
                </div>
                <div>
                  <p className="font-semibold text-white">Save or Send</p>
                  <p className="text-sm text-gray-400">
                    Choose to save as draft or send the invoice directly
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-cyan-500/10 border border-cyan-400/30 rounded-lg p-3 mt-4">
              <p className="text-xs text-gray-300">
                💡 Tip: Speak clearly and wait for the beep before answering.
                The system will automatically detect when you stop speaking.
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowInstructions(false)}
              className="flex-1 bg-transparent border-gray-600 text-white hover:bg-gray-700/50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleStartInvoice}
              className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              Start Voice Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showEmailConfirmation}
        onOpenChange={setShowEmailConfirmation}
      >
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-slate-800 to-slate-900 border-cyan-400/30 text-white">
          <div className="absolute right-4 top-4">
            <button
              onClick={() => setShowEmailConfirmation(false)}
              className="text-white hover:text-cyan-400 transition-colors"
              aria-label="Close"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <DialogHeader className="pr-8">
            <DialogTitle className="text-white text-2xl font-bold">
              Client Email
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {pendingAction === "send"
                ? "Enter the client's email to send this invoice"
                : "Enter the client's email for this draft invoice"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-6">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">
                Email Address
              </label>
              <input
                type="email"
                value={clientEmail}
                onChange={(e) => {
                  setClientEmail(e.target.value);
                  setEmailError("");
                }}
                placeholder="client@example.com"
                className="w-full px-4 py-2 bg-slate-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400"
              />
              {emailError && (
                <p className="text-red-400 text-sm mt-2">{emailError}</p>
              )}
            </div>

            <div className="bg-cyan-500/10 border border-cyan-400/30 rounded-lg p-3">
              <p className="text-xs text-gray-300">
                The invoice will be{" "}
                {pendingAction === "send" ? "sent to" : "associated with"} this
                email address.
              </p>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowEmailConfirmation(false)}
              className="flex-1 bg-transparent border-gray-600 text-white hover:bg-gray-700/50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEmailConfirm}
              className="flex-1 bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              Confirm
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-slate-800 to-slate-900 border-cyan-400/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl font-bold">
              Success!
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {successMessage}
            </DialogDescription>
          </DialogHeader>

          <div className="flex items-center justify-center py-8">
            <div className="w-16 h-16 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <div className="w-12 h-12 rounded-full bg-cyan-400/30 flex items-center justify-center text-cyan-400">
                <svg
                  className="w-8 h-8"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 pt-4">
            <Button
              asChild
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              <Link href="/invoices">Back to Invoices</Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowSuccessDialog(false);
                setConversationStep(0);
                setClientEmail("");
                setInvoiceData({
                  clientName: "",
                  invoiceNumber: "",
                  issueDate: new Date().toISOString().split("T")[0],
                  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split("T")[0],
                  items: [],
                  notes: "",
                  terms: "",
                });
                setShowInstructions(true);
              }}
              className="bg-transparent border-gray-600 text-white hover:bg-gray-700/50"
            >
              Create Another Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent className="sm:max-w-md bg-gradient-to-br from-slate-800 to-slate-900 border-cyan-400/30 text-white">
          <DialogHeader>
            <DialogTitle className="text-white text-2xl">
              Invoice Created Successfully!
            </DialogTitle>
            <DialogDescription className="text-gray-300">
              {currentSubtitle}
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 pt-4">
            <Button
              asChild
              className="bg-cyan-500 hover:bg-cyan-600 text-white"
            >
              <Link href="/invoices">Back to Invoices</Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setShowCompleteDialog(false);
                setConversationStep(0);
                setInvoiceData({
                  clientName: "",
                  invoiceNumber: "",
                  issueDate: new Date().toISOString().split("T")[0],
                  dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                    .toISOString()
                    .split("T")[0],
                  items: [],
                  notes: "",
                  terms: "",
                });
                setShowInstructions(true);
              }}
              className="bg-transparent border-gray-600 text-white hover:bg-gray-700/50"
            >
              Create Another Invoice
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
