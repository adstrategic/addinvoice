"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  CreditCard,
  Trash2,
  Star,
  StarOff,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { motion, Variants } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type PaymentMethod = {
  id: string;
  type: "credit_card" | "paypal" | "bank_transfer" | "cash" | "other";
  name: string;
  last4?: string;
  expiryMonth?: number;
  expiryYear?: number;
  isDefault?: boolean;
  createdAt?: string;
};

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut",
    },
  },
};

const typeLabels = {
  credit_card: "Credit Card",
  paypal: "PayPal",
  bank_transfer: "Bank Transfer",
  cash: "Cash",
  other: "Other",
};

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(
    null,
  );
  const [formData, setFormData] = useState({
    type: "credit_card" as PaymentMethod["type"],
    name: "",
    last4: "",
    expiryMonth: "",
    expiryYear: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const loadPaymentMethods = () => {
    const methods = JSON.parse(localStorage.getItem("paymentMethods") || "[]");
    setPaymentMethods(methods);
  };

  const handleAdd = () => {
    setEditingMethod(null);
    setFormData({
      type: "credit_card",
      name: "",
      last4: "",
      expiryMonth: "",
      expiryYear: "",
    });
    setDialogOpen(true);
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      type: method.type,
      name: method.name,
      last4: method.last4 || "",
      expiryMonth: method.expiryMonth?.toString() || "",
      expiryYear: method.expiryYear?.toString() || "",
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: string) => {
    const updated = paymentMethods.filter((m) => m.id !== id);
    localStorage.setItem("paymentMethods", JSON.stringify(updated));
    loadPaymentMethods();
    toast({
      title: "Payment method deleted",
      description: "The payment method has been removed",
      variant: "destructive",
    });
  };

  const handleSetDefault = (id: string) => {
    const updated = paymentMethods.map((m) => ({
      ...m,
      isDefault: m.id === id,
    }));
    localStorage.setItem("paymentMethods", JSON.stringify(updated));
    loadPaymentMethods();
    toast({
      title: "Default payment method updated",
      description: "The default payment method has been changed",
    });
  };

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a name for this payment method",
        variant: "destructive",
      });
      return;
    }

    if (formData.type === "credit_card" && !formData.last4) {
      toast({
        title: "Card number required",
        description: "Please enter the last 4 digits of the card",
        variant: "destructive",
      });
      return;
    }

    const methods = [...paymentMethods];

    if (editingMethod) {
      // Update existing
      const index = methods.findIndex((m) => m.id === editingMethod.id);
      if (index !== -1) {
        methods[index] = {
          ...editingMethod,
          ...formData,
          expiryMonth: formData.expiryMonth
            ? parseInt(formData.expiryMonth)
            : undefined,
          expiryYear: formData.expiryYear
            ? parseInt(formData.expiryYear)
            : undefined,
        };
      }
      toast({
        title: "Payment method updated",
        description: "The payment method has been updated successfully",
      });
    } else {
      // Add new
      const newMethod: PaymentMethod = {
        id: Date.now().toString(),
        type: formData.type,
        name: formData.name,
        last4: formData.last4 || undefined,
        expiryMonth: formData.expiryMonth
          ? parseInt(formData.expiryMonth)
          : undefined,
        expiryYear: formData.expiryYear
          ? parseInt(formData.expiryYear)
          : undefined,
        isDefault: methods.length === 0,
        createdAt: new Date().toISOString(),
      };
      methods.push(newMethod);
      toast({
        title: "Payment method added",
        description: "The payment method has been added successfully",
      });
    }

    localStorage.setItem("paymentMethods", JSON.stringify(methods));
    loadPaymentMethods();
    setDialogOpen(false);
  };

  return (
    <>
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-4">
            <Link href="/payments">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
                Payment Methods
              </h1>
              <p className="text-sm sm:text-base text-muted-foreground mt-1">
                Manage your saved payment methods
              </p>
            </div>
          </div>
          <Button
            size="lg"
            onClick={handleAdd}
            className="gap-2 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
          >
            <Plus className="h-5 w-5" />
            Add Payment Method
          </Button>
        </motion.div>

        {paymentMethods.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="bg-card border-border">
              <CardContent className="flex flex-col items-center justify-center py-12">
                <CreditCard className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No payment methods
                </h3>
                <p className="text-muted-foreground text-center mb-6 max-w-md">
                  Add a payment method to quickly record payments. You can add
                  credit cards, PayPal accounts, bank transfers, and more.
                </p>
                <Button onClick={handleAdd} className="gap-2">
                  <Plus className="h-5 w-5" />
                  Add Your First Payment Method
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            {paymentMethods.map((method) => (
              <motion.div key={method.id} variants={cardVariants}>
                <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1 h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                          <CreditCard className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-base font-semibold text-foreground">
                            {method.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {typeLabels[method.type]}
                          </p>
                        </div>
                      </div>
                      {method.isDefault && (
                        <Badge
                          variant="secondary"
                          className="bg-primary/20 text-primary"
                        >
                          Default
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {method.last4 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Card Number:
                          </span>
                          <span className="font-mono text-foreground">
                            •••• {method.last4}
                          </span>
                        </div>
                      )}
                      {method.expiryMonth && method.expiryYear && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">
                            Expires:
                          </span>
                          <span className="text-foreground">
                            {method.expiryMonth.toString().padStart(2, "0")}/
                            {method.expiryYear}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(method)}
                        className="flex-1"
                      >
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          method.isDefault ? null : handleSetDefault(method.id)
                        }
                        disabled={method.isDefault}
                        className="flex-1"
                      >
                        {method.isDefault ? (
                          <>
                            <Star className="h-4 w-4 mr-2" />
                            Default
                          </>
                        ) : (
                          <>
                            <StarOff className="h-4 w-4 mr-2" />
                            Set Default
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(method.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>
                {editingMethod ? "Edit" : "Add"} Payment Method
              </DialogTitle>
              <DialogDescription>
                {editingMethod
                  ? "Update the payment method details"
                  : "Add a new payment method to use when recording payments"}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      type: value as PaymentMethod["type"],
                    })
                  }
                >
                  <SelectTrigger id="type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="credit_card">Credit Card</SelectItem>
                    <SelectItem value="paypal">PayPal</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="name">Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder="e.g., Business Credit Card"
                />
              </div>

              {formData.type === "credit_card" && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="last4">Last 4 Digits *</Label>
                    <Input
                      id="last4"
                      value={formData.last4}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          last4: e.target.value.replace(/\D/g, "").slice(0, 4),
                        })
                      }
                      placeholder="1234"
                      maxLength={4}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="expiryMonth">Expiry Month</Label>
                      <Input
                        id="expiryMonth"
                        type="number"
                        min="1"
                        max="12"
                        value={formData.expiryMonth}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            expiryMonth: e.target.value,
                          })
                        }
                        placeholder="MM"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="expiryYear">Expiry Year</Label>
                      <Input
                        id="expiryYear"
                        type="number"
                        min={new Date().getFullYear()}
                        value={formData.expiryYear}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            expiryYear: e.target.value,
                          })
                        }
                        placeholder="YYYY"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSubmit}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
}
