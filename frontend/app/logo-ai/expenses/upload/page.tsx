"use client";

import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, Upload, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState, useRef } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

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

// Placeholder OCR function - simulates OCR extraction
const simulateOCR = async (file: File): Promise<{
  merchant?: string;
  total?: number;
  date?: string;
  items?: string[];
}> => {
  // Simulate API call delay
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Return mock OCR data
  return {
    merchant: "Sample Merchant",
    total: 125.50,
    date: new Date().toISOString().split("T")[0],
    items: ["Item 1", "Item 2"],
  };
};

export default function UploadReceiptPage() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrData, setOcrData] = useState<{
    merchant?: string;
    total?: number;
    date?: string;
    items?: string[];
  } | null>(null);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [notes, setNotes] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const router = useRouter();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    if (!selectedFile.type.startsWith("image/") && selectedFile.type !== "application/pdf") {
      toast({
        title: "Invalid file type",
        description: "Please upload an image or PDF file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (selectedFile.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB",
        variant: "destructive",
      });
      return;
    }

    setFile(selectedFile);

    // Create preview for images
    if (selectedFile.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setPreview(null);
    }

    // Auto-process OCR
    handleOCR(selectedFile);
  };

  const handleOCR = async (fileToProcess: File) => {
    setIsProcessing(true);
    try {
      const extracted = await simulateOCR(fileToProcess);
      setOcrData(extracted);
      
      // Auto-fill form fields
      if (extracted.merchant) {
        setDescription(extracted.merchant);
      }
      if (extracted.total) {
        setAmount(extracted.total.toString());
      }
      
      toast({
        title: "Receipt processed",
        description: "Information extracted from receipt",
      });
    } catch (error) {
      toast({
        title: "OCR processing failed",
        description: "Could not extract information from receipt. Please enter manually.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!file) {
      toast({
        title: "Receipt required",
        description: "Please upload a receipt image or PDF",
        variant: "destructive",
      });
      return;
    }

    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please enter a description for the expense",
        variant: "destructive",
      });
      return;
    }

    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Amount required",
        description: "Please enter a valid amount",
        variant: "destructive",
      });
      return;
    }

    if (!category) {
      toast({
        title: "Category required",
        description: "Please select a category",
        variant: "destructive",
      });
      return;
    }

    // Convert file to base64 for storage
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Receipt = reader.result as string;

      const expenses = JSON.parse(localStorage.getItem("expenses") || "[]");
      const newExpense = {
        id: Date.now().toString(),
        description: description.trim(),
        amount: parseFloat(amount),
        category,
        date: ocrData?.date || new Date().toISOString().split("T")[0],
        notes: notes.trim(),
        receipt: base64Receipt,
        ocrData,
        createdAt: new Date().toISOString(),
      };

      expenses.push(newExpense);
      localStorage.setItem("expenses", JSON.stringify(expenses));

      toast({
        title: "Expense added",
        description: "The expense with receipt has been added successfully",
      });

      router.push("/expenses");
    };
    reader.readAsDataURL(file);
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 max-w-4xl">
        <motion.div
          className="flex items-center gap-4 mb-6 sm:mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/expenses">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Upload Receipt
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Upload a receipt and extract expense information automatically
            </p>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Upload Receipt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  {!preview && !file && (
                    <div className="space-y-4">
                      <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                      <div>
                        <p className="text-sm font-medium text-foreground mb-1">
                          Click to upload or drag and drop
                        </p>
                        <p className="text-xs text-muted-foreground">
                          PNG, JPG, PDF up to 10MB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Select File
                      </Button>
                    </div>
                  )}
                  {preview && (
                    <div className="space-y-4">
                      <img
                        src={preview}
                        alt="Receipt preview"
                        className="max-h-64 mx-auto rounded-lg border border-border"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setFile(null);
                          setPreview(null);
                          setOcrData(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                  {file && !preview && (
                    <div className="space-y-4">
                      <div className="bg-secondary rounded-lg p-4">
                        <p className="text-sm font-medium text-foreground">
                          {file.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(file.size / 1024).toFixed(2)} KB
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setFile(null);
                          setOcrData(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  )}
                </div>

                {isProcessing && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing receipt...
                  </div>
                )}

                {ocrData && !isProcessing && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <p className="text-sm font-medium text-green-600">
                        Information Extracted
                      </p>
                    </div>
                    {ocrData.merchant && (
                      <p className="text-xs text-muted-foreground">
                        Merchant: {ocrData.merchant}
                      </p>
                    )}
                    {ocrData.total && (
                      <p className="text-xs text-muted-foreground">
                        Total: ${ocrData.total.toFixed(2)}
                      </p>
                    )}
                    {ocrData.date && (
                      <p className="text-xs text-muted-foreground">
                        Date: {new Date(ocrData.date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle>Expense Details</CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="description">Description *</Label>
                    <Input
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="e.g., Office supplies from Staples"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">Amount *</Label>
                      <Input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger id="category">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {expenseCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>
                              {cat}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Additional notes about this expense"
                      rows={3}
                    />
                  </div>

                  <div className="flex gap-4 pt-4">
                    <Link href="/expenses" className="flex-1">
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                      >
                        Cancel
                      </Button>
                    </Link>
                    <Button type="submit" className="flex-1" disabled={!file}>
                      Save Expense
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </AppLayout>
  );
}

