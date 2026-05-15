import { useCallback } from "react"
import { useSubscription } from "@/hooks/use-subscription"
import { upgradeDialogStore } from "@/lib/upgrade-dialog/store"
import { planAllowsAdvances } from "@/features/subscriptions/lib/subscription-access"
import type { TrialUsageSummary } from "@/features/subscriptions/service/subscriptions.service"

// Matches the backend LimitModule type (excludes 'emails' which is not user-triggered)
type GuardModule = keyof Omit<TrialUsageSummary, "emails">

interface GuardOptions {
  viaVoice?: boolean
}

/**
 * Provides a fast, client-side pre-check against cached subscription data.
 * Call guardCreate() before opening any creation form. Returns true (blocked)
 * and shows the upgrade dialog when the user would hit a limit.
 *
 * The authoritative enforcement still happens server-side — this layer only
 * prevents opening an empty form when we already know it will be rejected.
 */
export function useLimitGuard() {
  const { data: subscription } = useSubscription()

  const guardCreate = useCallback(
    (module: GuardModule, options: GuardOptions = {}): boolean => {
      if (!subscription) return false

      const { plan, trialUsage, voiceUsage } = subscription

      if (module === "advances" && !planAllowsAdvances(plan)) {
        upgradeDialogStore.show({
          code: "ADVANCES_PLAN_REQUIRED",
          message: "The Advances module requires an Essential plan or higher.",
        })
        return true
      }

      if (plan === "FREE_TRIAL" && trialUsage) {
        const usage = trialUsage[module]
        if (usage && usage.used >= usage.limit) {
          upgradeDialogStore.show({
            code: "TRIAL_MODULE_LIMIT",
            message: `Free trial limit reached for ${module} (${usage.limit} max). Upgrade to keep creating.`,
          })
          return true
        }
      }

      if (plan === "MINIMUM" && options.viaVoice && voiceUsage) {
        if (voiceUsage.used >= voiceUsage.limit) {
          upgradeDialogStore.show({
            code: "VOICE_MONTHLY_LIMIT",
            message: `Voice creation limit reached for this month (${voiceUsage.limit} max). Upgrade to Essential for unlimited voice.`,
          })
          return true
        }
      }

      return false
    },
    [subscription],
  )

  return { guardCreate }
}
