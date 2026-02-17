"use client";

import type React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Upload, Sparkles, Mic, RotateCcw } from "lucide-react";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function LogoAIPage() {
  const { toast } = useToast();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [logoStyle, setLogoStyle] = useState("");
  const [uploadedLogo, setUploadedLogo] = useState<string | null>(null);

  useEffect(() => {
    const draft = localStorage.getItem("logoAiDraft");
    if (draft) {
      const parsed = JSON.parse(draft);
      setBusinessName(parsed.businessName || "");
      setBusinessDescription(parsed.description || "");
      setLogoStyle(parsed.style || "");

      // Clear draft after loading so it doesn't persist forever
      localStorage.removeItem("logoAiDraft");

      toast({
        title: "Voice Input Loaded",
        description: "Your voice preferences have been applied.",
      });
    }
  }, []);

  const handleGenerate = () => {
    if (!businessName.trim()) {
      toast({
        title: "Business name required",
        description: "Please enter your business name to generate a logo.",
        variant: "destructive",
      });
      return;
    }
    alert("Logo generation will be added soon.");
  };

  const handleVoice = () => {
    router.push("/logo-ai/voice");
  };

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedLogo(reader.result as string);
        toast({
          title: "Logo uploaded",
          description: "Your logo has been uploaded successfully.",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleReset = () => {
    setBusinessName("");
    setBusinessDescription("");
    setLogoStyle("");
    setUploadedLogo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast({
      title: "Form reset",
      description: "All fields have been cleared.",
    });
  };

  return (
    <>
      <div className="container mx-auto px-6 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">
            Create Your Logo with AI
          </h1>
          <p className="text-muted-foreground mt-1">
            Generate a modern, professional logo for your business
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-5">
          {/* Left Side Panel: Input Form */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground">
                  Business Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Business Name */}
                <div>
                  <Label>Business Name *</Label>
                  <Input
                    placeholder="Enter the name of your business"
                    className="mt-1"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                  />
                </div>

                {/* Business Description */}
                <div>
                  <Label>Describe what your business does</Label>
                  <Textarea
                    placeholder="Tell the AI what your business is about"
                    className="mt-1"
                    rows={4}
                    value={businessDescription}
                    onChange={(e) => setBusinessDescription(e.target.value)}
                  />
                </div>

                {/* Logo Style */}
                <div>
                  <Label>What style of logo do you want?</Label>
                  <Textarea
                    placeholder="Describe desired style, mood or elements"
                    className="mt-1"
                    rows={4}
                    value={logoStyle}
                    onChange={(e) => setLogoStyle(e.target.value)}
                  />
                </div>

                {/* Upload Existing Logo */}
                <div className="pt-2 border-t border-border">
                  <Label>Already have a logo? Upload it to improve it</Label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    className="hidden"
                  />
                  <Button
                    variant="outline"
                    className="w-full mt-2 gap-2 bg-transparent"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                    Upload Logo
                  </Button>
                  {uploadedLogo && (
                    <div className="mt-3 p-2 rounded-lg border border-border bg-secondary/30 flex items-center gap-3">
                      <div className="h-12 w-12 rounded-md overflow-hidden bg-background flex items-center justify-center">
                        <img
                          src={uploadedLogo || "/placeholder.svg"}
                          alt="Uploaded logo"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground flex-1">
                        Logo uploaded
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <Card className="bg-card border-border">
              <CardContent className="pt-6 space-y-3">
                {/* Create Button */}
                <Button
                  size="lg"
                  className="w-full gap-2"
                  onClick={handleGenerate}
                >
                  <Sparkles className="h-4 w-4" />
                  Create Logo
                </Button>

                {/* Create with Voice Button */}
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full gap-2 bg-transparent"
                  onClick={handleVoice}
                >
                  <Mic className="h-4 w-4" />
                  Create with Voice
                </Button>

                {/* Reset Button */}
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full gap-2 bg-transparent"
                  onClick={handleReset}
                >
                  <RotateCcw className="h-4 w-4" />
                  Reset
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Right Side Panel: Logo Preview */}
          <div className="lg:col-span-3">
            <Card className="bg-card border-border h-full min-h-[600px]">
              <CardHeader>
                <CardTitle className="text-lg font-bold text-foreground">
                  Generated Logo Preview
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[calc(100%-80px)]">
                <div className="w-full h-full rounded-xl border-2 border-dashed border-border bg-secondary/20 flex items-center justify-center p-8">
                  {uploadedLogo ? (
                    <div className="flex flex-col items-center gap-4">
                      <div className="max-w-sm max-h-96 rounded-lg overflow-hidden bg-background p-6 shadow-lg">
                        <img
                          src={uploadedLogo || "/placeholder.svg"}
                          alt="Preview"
                          className="max-w-full max-h-full object-contain"
                        />
                      </div>
                      <p className="text-sm text-muted-foreground text-center">
                        Your uploaded logo preview
                      </p>
                    </div>
                  ) : (
                    <div className="text-center max-w-md">
                      <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <Sparkles className="h-10 w-10 text-primary" />
                      </div>
                      <p className="text-lg font-semibold text-foreground mb-2">
                        Your logo will appear here after generation
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Fill in the business information and click "Create Logo"
                        to generate your AI-powered logo
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
