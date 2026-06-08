"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CreditCard } from "lucide-react";
import { formatCurrency, cn } from "@/lib/utils";
import { ModuleHeroLabel } from "@/components/shared/module-ui";
import { getListCardTheme } from "@/components/shared/list-card-theme";

const glassCard =
  "bg-linear-to-br from-card/60 to-card/20 backdrop-blur-2xl border-white/20 dark:border-white/10 hover:-translate-y-1 hover:shadow-lg transition-all duration-300";

interface PaymentStatsProps {
  totalReceived: number;
  paymentsCount: number;
}

export function PaymentStats({
  totalReceived,
  paymentsCount,
}: PaymentStatsProps) {
  const theme = getListCardTheme("payment");

  return (
    <div className="mb-6">
      <div className="mb-5 text-center sm:text-left">
        <ModuleHeroLabel variant="payment">Total Received</ModuleHeroLabel>
        <h2
          data-tour-id="payments-balance"
          className="text-4xl sm:text-5xl font-extrabold tracking-tight text-foreground font-mono tabular-nums"
        >
          {formatCurrency(totalReceived)}
        </h2>
      </div>

      <div className="max-w-xs">
        <Card className={glassCard}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 p-4">
            <CardTitle className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
              Total Payments
            </CardTitle>
            <div className={cn("p-1.5 rounded-lg", theme.statIconWrap)}>
              <CreditCard className={cn("h-4 w-4", theme.statIcon)} />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <div className="text-3xl font-black font-mono text-foreground">
              {paymentsCount}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
