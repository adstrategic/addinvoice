"use client"

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, Sparkles, Lock, Mic, Mail, Zap, Loader2 } from "lucide-react"
import {
  useCreateCheckout,
  useSubscriptionPlans,
} from "@/hooks/use-subscription"
import type { UpgradeDialogPayload } from "@/lib/upgrade-dialog/store"
import type { PlanPricesRecurring } from "@/features/subscriptions/service/subscriptions.service"

interface Config {
  title: string
  description: string
  badge: string
  badgeVariant: "default" | "secondary" | "destructive" | "outline"
  icon: React.ElementType
  iconColor: string
  benefits: string[]
  ctaLabel: string
}

const CONFIG: Record<UpgradeDialogPayload["code"], Config> = {
  TRIAL_MODULE_LIMIT: {
    title: "You've reached your trial limit",
    description:
      "Your free trial includes 4 items per module — cumulative and permanent. Upgrade to keep creating without limits.",
    badge: "Free Trial Limit",
    badgeVariant: "secondary",
    icon: Lock,
    iconColor: "text-amber-500",
    benefits: [
      "Unlimited invoices, estimates & expenses",
      "Full email delivery for all documents",
      "Voice creation with unlimited sessions",
      "Advances module access",
      "PDF generation & payment tracking",
    ],
    ctaLabel: "Upgrade to Essential",
  },
  TRIAL_EMAIL_LIMIT: {
    title: "Email limit reached",
    description:
      "Your free trial includes 4 emails across all modules. Upgrade to send unlimited documents to your clients.",
    badge: "Free Trial Limit",
    badgeVariant: "secondary",
    icon: Mail,
    iconColor: "text-blue-500",
    benefits: [
      "Unlimited email delivery",
      "Automatic payment reminders",
      "Professional PDF attachments",
      "Delivery confirmations",
    ],
    ctaLabel: "Upgrade to Essential",
  },
  VOICE_MONTHLY_LIMIT: {
    title: "Monthly voice limit reached",
    description:
      "You've used all 25 voice-created items for this month on the Minimum plan. Upgrade to Essential for unlimited voice sessions.",
    badge: "Monthly Limit",
    badgeVariant: "outline",
    icon: Mic,
    iconColor: "text-violet-500",
    benefits: [
      "Unlimited voice creation sessions",
      "AI bookkeeper conversational assistant",
      "All modules accessible via voice",
      "Advances module unlocked",
    ],
    ctaLabel: "Upgrade to Essential",
  },
  ADVANCES_PLAN_REQUIRED: {
    title: "Advances module not included",
    description:
      "The Advances module is available on Essential and Lifetime plans. It lets you track advances and partial payments with ease.",
    badge: "Plan Upgrade Required",
    badgeVariant: "outline",
    icon: Zap,
    iconColor: "text-primary",
    benefits: [
      "Full Advances module with tracking",
      "Unlimited voice sessions",
      "AI bookkeeper conversational assistant",
      "Everything in Minimum, plus more",
    ],
    ctaLabel: "Upgrade to Essential",
  },
}

interface UpgradeDialogProps {
  payload: UpgradeDialogPayload | null
  onClose: () => void
}

export function UpgradeDialog({ payload, onClose }: UpgradeDialogProps) {
  const { data: plans } = useSubscriptionPlans()
  const createCheckout = useCreateCheckout()

  if (!payload) return null

  const config = CONFIG[payload.code]
  const Icon = config.icon

  const handleUpgrade = async () => {
    const essential = plans?.find((p) => p.id === "ESSENTIAL")
    if (!essential || !("monthly" in essential.prices)) return
    const { priceId } = (essential.prices as PlanPricesRecurring).monthly
    onClose()
    await createCheckout.mutateAsync({ planType: "ESSENTIAL", priceId })
  }

  return (
    <Dialog open onOpenChange={(open) => { if (!open) onClose() }}>
      <DialogContent className="sm:max-w-md p-0 overflow-hidden gap-0">
        {/* Header gradient band */}
        <div className="relative flex flex-col items-center gap-3 bg-linear-to-b from-primary/10 to-transparent px-6 pt-8 pb-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background shadow-sm border">
            <Icon className={`h-7 w-7 ${config.iconColor}`} />
          </div>

          <Badge variant={config.badgeVariant} className="text-xs">
            {config.badge}
          </Badge>

          <DialogHeader className="gap-1.5 space-y-0">
            <DialogTitle className="text-xl font-semibold leading-tight">
              {config.title}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              {config.description}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Benefits */}
        <div className="px-6 pb-2">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            What you get by upgrading
          </p>
          <ul className="space-y-2">
            {config.benefits.map((benefit) => (
              <li key={benefit} className="flex items-start gap-2.5 text-sm">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <Check className="h-2.5 w-2.5 text-primary" />
                </span>
                {benefit}
              </li>
            ))}
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2 px-6 py-5">
          <Button
            className="w-full gap-2"
            onClick={handleUpgrade}
            disabled={createCheckout.isPending}
          >
            {createCheckout.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Redirecting to checkout...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {config.ctaLabel}
              </>
            )}
          </Button>
          <Button
            variant="ghost"
            className="w-full text-muted-foreground"
            onClick={onClose}
            disabled={createCheckout.isPending}
          >
            Maybe later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
