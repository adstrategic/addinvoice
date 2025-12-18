"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";
import { motion } from "framer-motion";

interface InvoiceFiltersProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusChange: (value: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

/**
 * Invoice filters component
 * Includes search, status filter dropdown, and tab buttons
 */
export function InvoiceFilters({
  searchTerm,
  onSearchChange,
  statusFilter,
  onStatusChange,
  activeTab,
  onTabChange,
}: InvoiceFiltersProps) {
  return (
    <>
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
                  placeholder="Search invoices..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={onStatusChange}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="issued">Issued</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
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
        className="mb-4 sm:mb-6"
      >
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button
            variant={activeTab === "all" ? "default" : "outline"}
            onClick={() => onTabChange("all")}
            className="whitespace-nowrap"
          >
            All Invoices
          </Button>
          <Button
            variant={activeTab === "emitted" ? "default" : "outline"}
            onClick={() => onTabChange("emitted")}
            className="whitespace-nowrap"
          >
            Emitted
          </Button>
          <Button
            variant={activeTab === "paid" ? "default" : "outline"}
            onClick={() => onTabChange("paid")}
            className="whitespace-nowrap"
          >
            Paid
          </Button>
          <Button
            variant={activeTab === "pending" ? "default" : "outline"}
            onClick={() => onTabChange("pending")}
            className="whitespace-nowrap"
          >
            Pending
          </Button>
          <Button
            variant={activeTab === "drafts" ? "default" : "outline"}
            onClick={() => onTabChange("drafts")}
            className="whitespace-nowrap"
          >
            Drafts
          </Button>
        </div>
      </motion.div>
    </>
  );
}

