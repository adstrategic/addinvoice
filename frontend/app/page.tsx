"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell,
} from "recharts";
import {
  FileText,
  CheckCircle2,
  Clock,
  Calendar,
  CalendarDays,
  Plus,
  TrendingUp,
  DollarSign,
} from "lucide-react";
import { AppLayout } from "@/components/app-layout";
import Link from "next/link";
import { useState } from "react";
import { useTheme } from "@/components/theme-provider";
import { motion } from "framer-motion";
import { useAuth } from "@/hooks/use-clerk-auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

// Mock data for monthly revenue
const revenueData = [
  { month: "Jan", revenue: 12500 },
  { month: "Feb", revenue: 15800 },
  { month: "Mar", revenue: 18200 },
  { month: "Apr", revenue: 16900 },
  { month: "May", revenue: 21400 },
  { month: "Jun", revenue: 19800 },
  { month: "Jul", revenue: 23500 },
  { month: "Aug", revenue: 25100 },
  { month: "Sep", revenue: 22800 },
  { month: "Oct", revenue: 27300 },
  { month: "Nov", revenue: 29600 },
  { month: "Dec", revenue: 31200 },
];

// Mock data for recent invoices
const recentInvoices = [
  {
    id: "INV-001",
    client: "Acme Corp",
    amount: 5420,
    status: "paid",
    date: "2025-01-15",
  },
  {
    id: "INV-002",
    client: "TechStart Inc",
    amount: 3280,
    status: "pending",
    date: "2025-01-18",
  },
  {
    id: "INV-003",
    client: "Global Solutions",
    amount: 7650,
    status: "paid",
    date: "2025-01-19",
  },
  {
    id: "INV-004",
    client: "Digital Ventures",
    amount: 4190,
    status: "pending",
    date: "2025-01-20",
  },
  {
    id: "INV-005",
    client: "Innovation Labs",
    amount: 6320,
    status: "paid",
    date: "2025-01-21",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export default function Dashboard() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const { theme } = useTheme();
  // const { isAuthenticated, isLoading } = useAuth()
  const router = useRouter();

  const barColor = "#007587";

  // // Redirect to sign-in if not authenticated
  // useEffect(() => {
  //   if (!isLoading && !isAuthenticated) {
  //     router.push("/sign-in");
  //   }
  // }, [isAuthenticated, isLoading, router]);

  // Show loading state
  // if (isLoading) {
  //   return (
  //     <div className="min-h-screen flex items-center justify-center">
  //       <p>Loading...</p>
  //     </div>
  //   );
  // }

  // Don't render dashboard if not authenticated (redirect will happen)
  // if (!isAuthenticated) {
  //   return null;
  // }

  return (
    <AppLayout>
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <motion.div
          className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mb-6 sm:mb-8"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          <motion.div variants={cardVariants}>
            <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Invoices
                </CardTitle>
                <FileText className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">248</div>
                <p className="text-xs text-muted-foreground mt-1">
                  <span className="text-primary font-semibold">+12%</span> from
                  last month
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Paid Invoices
                </CardTitle>
                <CheckCircle2 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">186</div>
                <p className="text-xs text-muted-foreground mt-1">
                  75% completion rate
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      Pending Invoices
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      Awaiting payment
                    </p>
                  </div>
                  <Clock className="h-4 w-4 text-chart-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">62</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      This Week
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="text-primary font-semibold">+3</span> new
                      invoices
                    </p>
                  </div>
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">18</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div variants={cardVariants}>
            <Card className="bg-card border-border hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 hover:-translate-y-1">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      This Month
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      <span className="text-primary font-semibold">+8%</span> vs
                      last month
                    </p>
                  </div>
                  <CalendarDays className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">67</div>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="mb-6 sm:mb-8 bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
                    Monthly Revenue
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Revenue trends over the past 12 months
                  </p>
                </div>
                <div className="flex items-center gap-2 text-primary">
                  <TrendingUp className="h-5 w-5" />
                  <span className="text-2xl font-bold">$31.2K</span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300} minHeight={250}>
                <BarChart data={revenueData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                    opacity={0.3}
                  />
                  <XAxis
                    dataKey="month"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `$${value / 1000}K`}
                  />
                  <Tooltip
                    cursor={false}
                    position={{ y: 0 }}
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "var(--radius)",
                      color: "hsl(var(--popover-foreground))",
                      boxShadow:
                        "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
                      zIndex: 1000,
                      padding: "12px",
                    }}
                    labelStyle={{
                      color: "hsl(var(--popover-foreground))",
                      fontWeight: 600,
                      marginBottom: "4px",
                    }}
                    formatter={(value: number) => [
                      `$${value.toLocaleString()}`,
                      "Revenue",
                    ]}
                  />
                  <Bar
                    dataKey="revenue"
                    radius={[8, 8, 0, 0]}
                    barSize={35}
                    onMouseEnter={(_, index) => setHoveredIndex(index)}
                    onMouseLeave={() => setHoveredIndex(null)}
                  >
                    {revenueData.map((_, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={barColor}
                        opacity={
                          hoveredIndex === null || hoveredIndex === index
                            ? 1
                            : 0.3
                        }
                        style={{ transition: "opacity 0.3s ease-in-out" }}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card className="bg-card border-border shadow-sm hover:shadow-md transition-shadow duration-300">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
                    Recent Invoices
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Latest invoice activity
                  </p>
                </div>
                <Link href="/invoices">
                  <Button
                    variant="outline"
                    size="sm"
                    className="hover:bg-primary/10 hover:text-primary hover:border-primary transition-all duration-300 bg-transparent"
                  >
                    View All
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 sm:space-y-4">
                {recentInvoices.map((invoice, index) => (
                  <motion.div
                    key={invoice.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.6 + index * 0.1 }}
                    className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-4 rounded-lg bg-secondary/50 border border-border hover:border-primary/50 hover:bg-secondary/70 transition-all duration-300 hover:shadow-md cursor-pointer"
                  >
                    <div className="flex items-center gap-3 sm:gap-4">
                      <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center flex-shrink-0">
                        <DollarSign className="h-5 w-5 text-primary" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate">
                          {invoice.id}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {invoice.client}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6 pl-[52px] sm:pl-0">
                      <div className="text-left sm:text-right">
                        <p className="font-semibold text-foreground">
                          ${invoice.amount.toLocaleString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {invoice.date}
                        </p>
                      </div>
                      <Badge
                        variant={
                          invoice.status === "paid" ? "default" : "secondary"
                        }
                        className={
                          invoice.status === "paid"
                            ? "bg-primary/20 text-primary hover:bg-primary/30"
                            : "bg-chart-4/20 text-chart-4 hover:bg-chart-4/30"
                        }
                      >
                        {invoice.status === "paid" ? "Paid" : "Pending"}
                      </Badge>
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <Link href="/invoices/new">
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{
            duration: 0.5,
            delay: 1,
            type: "spring",
            stiffness: 200,
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Button
            size="lg"
            className="fixed bottom-6 right-6 sm:bottom-8 sm:right-8 h-12 w-12 sm:h-14 sm:w-14 rounded-full shadow-lg hover:shadow-xl hover:shadow-primary/30 transition-all bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Plus className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="sr-only">Create Invoice</span>
          </Button>
        </motion.div>
      </Link>
    </AppLayout>
  );
}
