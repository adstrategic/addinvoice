"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Plus } from "lucide-react";
import type { ClientResponse } from "@/features/clients";

interface ClientStatsProps {
  clients: ClientResponse[];
}

/**
 * Client statistics cards component
 * Displays total clients, active clients, new this month, and total revenue
 */
export function ClientStats({ clients }: ClientStatsProps) {
  const totalClients = clients.length;
  const activeClients = clients.length;
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const newThisMonth = clients.filter((c) => {
    if (!c.createdAt) return false;
    const createdDate = new Date(c.createdAt);
    return (
      createdDate.getMonth() === currentMonth &&
      createdDate.getFullYear() === currentYear
    );
  }).length;
  const totalRevenue = 0;

  return (
    <div className="grid gap-4 sm:gap-6 grid-cols-2 md:grid-cols-4">
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground">
            Total Clients
          </CardTitle>
          <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-foreground">
            {totalClients}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground">
            Active
          </CardTitle>
          <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-foreground">
            {activeClients}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground">
            New This Month
          </CardTitle>
          <Plus className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-foreground">
            {newThisMonth}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="text-sm sm:text-base font-medium text-muted-foreground">
            Total Revenue
          </CardTitle>
          <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold text-foreground">
            ${totalRevenue.toLocaleString()}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
