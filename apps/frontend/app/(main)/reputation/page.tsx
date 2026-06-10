"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Star,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Link as LinkIcon,
  Share2,
  PlayCircle,
  Instagram,
  Youtube,
  Video,
  RefreshCw,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShareLinkDialog } from "@/components/share-link-dialog";
import { useTheme } from "@/components/theme-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function ReputationPage() {
  const { toast } = useToast();
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  const [googleBusinessLink, setGoogleBusinessLink] = useState("");
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [companyId, setCompanyId] = useState("default-company");
  const [hasRequestedReview, setHasRequestedReview] = useState(false);
  const [showLeadDialog, setShowLeadDialog] = useState(false);
  const [leadData, setLeadData] = useState({ name: "", email: "", phone: "" });

  useEffect(() => {
    setMounted(true);
    const requested = localStorage.getItem("botsy_review_requested") === "true";
    setHasRequestedReview(requested);

    // Load reviews and config
    const savedLink = localStorage.getItem("googleBusinessLink") || "";
    setGoogleBusinessLink(savedLink);

    const savedCompanies = JSON.parse(
      localStorage.getItem("companies") || "[]",
    );
    if (savedCompanies.length > 0) {
      setCompanyId(savedCompanies[0].id.toString());
    }
  }, []);

  const handleRequestReviewClick = () => {
    if (hasRequestedReview) {
      document
        .getElementById("conversion-section")
        ?.scrollIntoView({ behavior: "smooth" });
    } else {
      setShowShareDialog(true);
      setHasRequestedReview(true);
      localStorage.setItem("botsy_review_requested", "true");
    }
  };

  const handleResetRequest = () => {
    setHasRequestedReview(false);
    localStorage.removeItem("botsy_review_requested");
    toast({
      title: "Test Mode",
      description: "The review request limit has been reset.",
    });
  };

  const handleLeadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Thank you!",
      description:
        "A Botsy expert will contact you soon to activate your automation.",
    });
    setShowLeadDialog(false);
    setLeadData({ name: "", email: "", phone: "" });
  };

  const handleSaveLink = () => {
    localStorage.setItem("googleBusinessLink", googleBusinessLink);
    toast({
      title: "Link Saved",
      description: "Google Business link updated successfully.",
    });
  };

  const bgImage =
    mounted && theme === "dark"
      ? "/images/fondos_dark_pulpos.png"
      : "/images/fondos_light_pulpos.png";

  return (
    <div
      style={{ backgroundImage: `url('${bgImage}')` }}
      className="-m-6 -mb-12"
    >
      <div className="p-4 sm:p-6 md:p-10 max-w-6xl mx-auto space-y-8">
        <div className="flex flex-col items-center text-center gap-0 mb-8">
          <div className="w-32 h-24 flex items-center justify-center shrink-0">
            <img
              src="/images/botsy_logo_og.png"
              alt="Botsy Logo Light"
              className="w-full h-full object-contain dark:hidden"
            />
            <img
              src="/images/botsy_letras_blancas.png"
              alt="Botsy Logo Dark"
              className="w-full h-full object-contain hidden dark:block"
            />
          </div>
          <div className="flex flex-col items-center gap-2 -mt-2 relative">
            <h1 className="text-3xl md:text-4xl font-black text-foreground">
              Reputation Manager
            </h1>
            <p className="text-muted-foreground">
              Review Filtering System by Botsy.
            </p>
            <div className="mt-1">
              <Badge className="bg-[#E5D9E7] dark:bg-[#341F39] text-[#491C54] dark:text-[#E8D1ED] hover:bg-[#DAC8DC] dark:hover:bg-[#432949] py-1.5 px-4 rounded-full font-bold border-none transition-colors duration-200">
                Exclusive Feature
              </Badge>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* AI Banner */}
            <Card className="bg-gradient-to-r from-[#8B5115] to-[#F7941D] text-white border-0 overflow-hidden relative">
              <div className="absolute right-0 bottom-0 opacity-40 -mr-8 -mb-12 pointer-events-none">
                <img
                  src="/images/icono_botsy.png"
                  alt=""
                  className="w-64 h-64 object-contain"
                />
              </div>
              <CardContent className="p-8 relative z-10">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <img
                      src="/images/icono_botsy.png"
                      alt="Botsy Icon"
                      className="w-12 h-12 object-contain shrink-0 mt-1"
                    />
                    <div>
                      <h2 className="text-2xl font-bold mb-2">
                        Automated Review Filtering
                      </h2>
                      <p className="text-white/90 max-w-md">
                        Botsy automatically requests reviews from your clients.
                        Positive experiences go to Google, while issues are sent
                        privately to you to resolve.
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="secondary"
                    className={`shrink-0 font-bold shadow-lg transition-colors ${
                      hasRequestedReview
                        ? "bg-slate-200 text-slate-400 hover:bg-slate-200 cursor-not-allowed dark:bg-slate-800 dark:text-slate-500"
                        : "bg-white text-[#D97706] hover:bg-white/90"
                    }`}
                    onClick={handleRequestReviewClick}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    Request Review
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Dashboard / Toggles */}
            <Card className="bg-[#F2E5F9]/70 dark:bg-[#1D0C24]/65 backdrop-blur-sm border-[#D8BEEC] dark:border-[#562966]/70">
              <CardHeader>
                <CardTitle>Automation Settings</CardTitle>
                <CardDescription>
                  Configure how Botsy handles your clients&apos; feedback.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Google Business Link */}
                <div className="p-5 bg-[#EEDBF5]/75 dark:bg-[#2A1033]/60 rounded-xl border border-[#DCBEEC]/90 dark:border-[#5A2C6C]/60 mb-6">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="p-2 bg-[#491C54]/10 dark:bg-[#E8D1ED]/10 rounded-lg text-[#491C54] dark:text-[#E8D1ED] shrink-0">
                      <LinkIcon className="w-5 h-5" />
                    </div>
                    <div>
                      <Label className="font-bold text-slate-800 dark:text-slate-200 text-base">
                        Google Business Link
                      </Label>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                        Where should happy clients (4-5 stars) be redirected to
                        post their review?
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-3 pl-12">
                    <Input
                      placeholder="https://g.page/r/..."
                      value={googleBusinessLink}
                      onChange={(e) => setGoogleBusinessLink(e.target.value)}
                      className="bg-white/80 dark:bg-slate-950/80 border-[#DABCEB] dark:border-[#5A2C6C] focus-visible:ring-[#491C54] dark:focus-visible:ring-[#E8D1ED]"
                    />
                    <Button
                      variant="outline"
                      onClick={handleSaveLink}
                      className="shrink-0 border-none bg-[#491C54] hover:bg-[#5C236A] text-white dark:bg-[#E8D1ED] dark:hover:bg-[#FAF0FC] dark:text-[#491C54] font-semibold transition-colors"
                    >
                      Save Link
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#FAF3FD]/90 dark:bg-[#271431]/90 rounded-xl border border-[#DDBEEA] dark:border-[#522561]">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-[#491C54]/10 dark:bg-[#E8D1ED]/10 rounded-lg text-[#491C54] dark:text-[#E8D1ED]">
                      <MessageSquare className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold">Auto-Request Reviews</p>
                      <p className="text-sm text-muted-foreground">
                        Send SMS/Email 24h after job completion.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#FAF3FD]/90 dark:bg-[#271431]/90 rounded-xl border border-[#DDBEEA] dark:border-[#522561]">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-emerald-500/10 dark:bg-emerald-500/20 rounded-lg text-emerald-600 dark:text-emerald-400">
                      <ThumbsUp className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold">Redirect Positive to Google</p>
                      <p className="text-sm text-muted-foreground">
                        4 and 5 star ratings are prompted to post on Google.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-[#FAF3FD]/90 dark:bg-[#271431]/90 rounded-xl border border-[#DDBEEA] dark:border-[#522561]">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-rose-500/10 dark:bg-rose-500/20 rounded-lg text-rose-600 dark:text-rose-400">
                      <ThumbsDown className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-bold">Intercept Negative Reviews</p>
                      <p className="text-sm text-muted-foreground">
                        1 to 3 star ratings open a private support ticket.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Stats & Intercepted Reviews */}
          <div className="space-y-6">
            <Card className="bg-[#F2E5F9]/70 dark:bg-[#1D0C24]/65 backdrop-blur-sm border-[#D8BEEC] dark:border-[#562966]/70">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Reputation Score</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-end gap-2 mb-4">
                  <span className="text-5xl font-black text-foreground">
                    4.8
                  </span>
                  <span className="text-muted-foreground mb-1">/ 5.0</span>
                </div>
                <div className="flex gap-1 text-yellow-400 mb-4">
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current" />
                  <Star className="w-5 h-5 fill-current opacity-50" />
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">
                      Google Reviews
                    </span>
                    <span className="font-bold">142</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground text-green-500">
                      New this month
                    </span>
                    <span className="font-bold text-green-500">+12</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Conversion Section */}
        <div id="conversion-section" className="pt-4 pb-8">
          <Card className="bg-gradient-to-br from-[#491C54] to-[#1D0C24] text-white border-[#DABCEB]/30 overflow-hidden relative">
            {/* Background embellishments */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#E8D1ED]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#D97706]/20 rounded-full blur-3xl -ml-20 -mb-20 pointer-events-none"></div>

            <CardContent className="p-8 md:p-12 relative z-10 flex flex-col md:flex-row gap-10 items-center justify-between">
              <div className="flex-1 space-y-6">
                <div className="space-y-2">
                  <Badge className="bg-[#D97706] text-white hover:bg-[#D97706]/90 border-none px-3 py-1 text-xs mb-2">
                    Go to the next level with Botsy
                  </Badge>
                  <h2 className="text-3xl md:text-4xl font-black leading-tight">
                    Do you want to get more than 10 reviews a day?
                  </h2>
                  <p className="text-xl text-[#E8D1ED]/90 font-medium">
                    I want full review automation.
                  </p>
                </div>

                <p className="text-white/70 max-w-md">
                  Unlock the true potential of your online reputation. Automate
                  follow-ups with every client, filter feedback, and boost your
                  Google ranking automatically without manual effort.
                </p>

                <div className="pt-4 flex flex-col sm:flex-row gap-4">
                  <a href="https://wa.link/16anvv">
                    <Button
                      size="lg"
                      variant="outline"
                      className="border-none bg-[#D97706] hover:bg-[#B46204] text-white font-bold px-8 shadow-lg shadow-[#D97706]/20"
                    >
                      Contact BOTSY
                    </Button>
                  </a>
                </div>
              </div>

              <div className="w-full md:w-[400px] shrink-0 flex flex-col gap-6">
                <div
                  className="relative group cursor-pointer"
                  onClick={() =>
                    window.open(
                      "https://youtu.be/W9FmqvIXVlg?si=WxNtaemrwT7qnhTK",
                      "_blank",
                    )
                  }
                >
                  <div className="aspect-video bg-black/40 rounded-2xl border border-white/10 overflow-hidden relative shadow-2xl">
                    <img
                      src="https://img.youtube.com/vi/W9FmqvIXVlg/maxresdefault.jpg"
                      alt="Video Thumbnail"
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-full bg-[#D97706]/90 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <PlayCircle className="w-8 h-8 text-white ml-1" />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-center gap-3">
                  <span className="text-sm text-white/70 font-semibold uppercase tracking-wider">
                    Follow Botsy
                  </span>
                  <div className="flex items-center gap-4">
                    <a
                      href="https://www.instagram.com/billyvillegas.ai/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
                    >
                      <Instagram className="w-5 h-5" />
                    </a>
                    <a
                      href="https://www.tiktok.com/@billyvillegas.ai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
                    >
                      <Video className="w-5 h-5" />
                    </a>
                    <a
                      href="https://www.youtube.com/@Botsyai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
                    >
                      <Youtube className="w-5 h-5" />
                    </a>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ShareLinkDialog
        open={showShareDialog}
        onOpenChange={setShowShareDialog}
        documentId={companyId}
        documentType="review"
        customUrl={
          typeof window !== "undefined"
            ? `${window.location.origin}/p/review/${companyId}`
            : ""
        }
      />
    </div>
  );
}
