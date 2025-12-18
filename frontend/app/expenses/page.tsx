"use client";

import { AppLayout } from "@/components/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Plus,
  Search,
  Receipt,
  DollarSign,
  Calendar,
  MoreVertical,
  Trash2,
  Upload,
  Mic,
} from "lucide-react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useRouter } from "next/navigation";
import { motion, Variants } from "framer-motion";

// Types
type Expense = {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  receipt?: string;
  notes?: string;
  createdAt: string;
  ocrData?: {
    merchant?: string;
    total?: number;
    date?: string;
    items?: string[];
  };
};

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

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const { toast } = useToast();
  const router = useRouter();

  useEffect(() => {
    loadExpenses();
  }, []);

  const loadExpenses = () => {
    const stored = JSON.parse(localStorage.getItem("expenses") || "[]");
    // Sort by date (most recent first)
    const sorted = stored.sort((a: Expense, b: Expense) => {
      const dateA = new Date(a.date || a.createdAt).getTime();
      const dateB = new Date(b.date || b.createdAt).getTime();
      return dateB - dateA;
    });
    setExpenses(sorted);
  };

  const filteredExpenses = expenses.filter((expense) => {
    const matchesSearch =
      expense.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      expense.amount.toString().includes(searchQuery) ||
      expense.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || expense.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const stats = {
    total: expenses.length,
    totalAmount: expenses.reduce((sum, exp) => sum + exp.amount, 0),
    thisMonth: expenses.filter((exp) => {
      const expDate = new Date(exp.date || exp.createdAt);
      const now = new Date();
      return (
        expDate.getMonth() === now.getMonth() &&
        expDate.getFullYear() === now.getFullYear()
      );
    }).length,
    thisMonthAmount: expenses
      .filter((exp) => {
        const expDate = new Date(exp.date || exp.createdAt);
        const now = new Date();
        return (
          expDate.getMonth() === now.getMonth() &&
          expDate.getFullYear() === now.getFullYear()
        );
      })
      .reduce((sum, exp) => sum + exp.amount, 0),
  };

  const handleDelete = (expenseId: string) => {
    const updated = expenses.filter((exp) => exp.id !== expenseId);
    localStorage.setItem("expenses", JSON.stringify(updated));
    loadExpenses();
    toast({
      title: "Expense deleted",
      description: "The expense has been removed",
      variant: "destructive",
    });
  };

  // Note: View/Edit pages not implemented yet
  // For now, users can delete and recreate expenses if needed

  return (
    <AppLayout>
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <motion.div
          className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              Expenses
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground mt-1">
              Track and manage your business expenses
            </p>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <Link href="/expenses/voice" className="flex-1 sm:flex-none">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 w-full hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 bg-transparent"
              >
                <Mic className="h-5 w-5" />
                Add by Voice
              </Button>
            </Link>
            <Link href="/expenses/upload" className="flex-1 sm:flex-none">
              <Button
                size="lg"
                variant="outline"
                className="gap-2 w-full hover:shadow-lg hover:shadow-primary/20 transition-all duration-300 bg-transparent"
              >
                <Upload className="h-5 w-5" />
                Upload Receipt
              </Button>
            </Link>
            <Link href="/expenses/new" className="flex-1 sm:flex-none">
              <Button
                size="lg"
                className="gap-2 w-full hover:shadow-lg hover:shadow-primary/20 transition-all duration-300"
              >
                <Plus className="h-5 w-5" />
                Add Expense
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-4 mb-6 sm:mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={cardVariants}>
            <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground">
                  Total Expenses
                </CardTitle>
                <Receipt className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-foreground">
                  {stats.total}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground">
                  Total Amount
                </CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-foreground">
                  ${stats.totalAmount.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground">
                  This Month
                </CardTitle>
                <Calendar className="h-4 w-4 text-chart-4" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-foreground">
                  {stats.thisMonth}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground">
                  This Month Amount
                </CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl sm:text-3xl font-bold text-foreground">
                  ${stats.thisMonthAmount.toLocaleString()}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="mb-4 sm:mb-6 bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardContent className="pt-4 sm:pt-6">
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search expenses..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Filter by category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {expenseCategories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
        >
          <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader>
              <CardTitle className="text-lg sm:text-xl font-bold text-foreground">
                Expenses ({filteredExpenses.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {filteredExpenses.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No expenses found matching your filters
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredExpenses.map((expense, index) => (
                    <motion.div
                      key={expense.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{
                        duration: 0.3,
                        delay: 0.5 + index * 0.05,
                      }}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-3 sm:p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 hover:bg-secondary/70 transition-all duration-300 hover:shadow-md"
                    >
                      <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0">
                        <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                          <Receipt className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                            <p className="font-semibold text-foreground text-sm sm:text-base">
                              {expense.description}
                            </p>
                            <Badge variant="secondary" className="text-xs">
                              {expense.category}
                            </Badge>
                            {expense.receipt && (
                              <Badge
                                variant="outline"
                                className="text-xs bg-green-500/10 text-green-600 border-green-500/20"
                              >
                                Receipt
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(expense.date || expense.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-3 sm:gap-6 pl-[52px] sm:pl-0">
                        <div className="text-left sm:text-right">
                          <p className="font-semibold text-foreground text-sm sm:text-base">
                            ${expense.amount.toLocaleString()}
                          </p>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="shrink-0 hover:bg-primary/10 hover:text-primary transition-colors duration-300"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => handleDelete(expense.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  );
}

