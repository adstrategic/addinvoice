"use client";

import type React from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
	useCreateCheckout,
	useCreatePortalSession,
	useSubscription,
	useSubscriptionPlans,
} from "@/hooks/use-subscription";
import { hasConversationalVoiceAccess } from "@/features/subscriptions/lib/subscription-access";
import type { PlanPricesRecurring } from "@/features/subscriptions/service/subscriptions.service";

interface VoicePlanGateProps {
	children: React.ReactNode;
}

export function VoicePlanGate({ children }: VoicePlanGateProps) {
	const { data: subscription, isLoading, isError, error, refetch } = useSubscription();

	const needsUpgrade =
		Boolean(subscription?.isActive) &&
		!hasConversationalVoiceAccess(subscription?.plan);

	const { data: plans, isLoading: isLoadingPlans } = useSubscriptionPlans({
		enabled: needsUpgrade,
	});
	const openPortal = useCreatePortalSession();
	const createCheckout = useCreateCheckout();

	if (isLoading && !subscription) {
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				<div className="w-full max-w-md space-y-3">
					<Skeleton className="h-8 w-2/3" />
					<Skeleton className="h-5 w-full" />
					<Skeleton className="h-10 w-full" />
				</div>
			</div>
		);
	}

	if (isError) {
		return (
			<div className="min-h-screen flex items-center justify-center p-4">
				<div className="w-full max-w-md space-y-4">
					<Alert variant="destructive">
						<AlertTitle>Could not verify your plan</AlertTitle>
						<AlertDescription>
							{error instanceof Error
								? error.message
								: "We could not check your subscription plan."}
						</AlertDescription>
					</Alert>
					<Button className="w-full" onClick={() => void refetch()}>
						Retry
					</Button>
				</div>
			</div>
		);
	}

	if (needsUpgrade) {
		const isFreeTrial = subscription!.plan === "FREE_TRIAL";

		const handleUpgrade = async () => {
			if (isFreeTrial) {
				const essential = plans?.find((p) => p.id === "ESSENTIAL");
				if (!essential || !("monthly" in essential.prices)) return;
				const { priceId } = (essential.prices as PlanPricesRecurring).monthly;
				try {
					await createCheckout.mutateAsync({ planType: "ESSENTIAL", priceId });
				} catch (err) {
					toast.error("Could not start checkout", {
						description: err instanceof Error ? err.message : "Please try again.",
					});
				}
			} else {
				openPortal.mutate("/voice");
			}
		};

		const isPending = createCheckout.isPending || openPortal.isPending || isLoadingPlans;

		return (
			<div className="min-h-screen flex items-center justify-center p-4 bg-[#162135]">
				<Card className="w-full max-w-lg">
					<CardHeader className="space-y-2">
						<div className="flex items-center gap-2 text-primary">
							<Sparkles className="h-5 w-5" />
							<span className="text-sm font-medium uppercase tracking-wide">
								Essential feature
							</span>
						</div>
						<CardTitle>Upgrade to Essential to unlock the AI bookkeeper</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-sm text-muted-foreground">
							{isFreeTrial
								? "The conversational AI bookkeeper is available on the Essential and Lifetime plans. Voice creation in each module is still available on your free trial."
								: "Your current plan does not include the conversational AI bookkeeper. Upgrade to Essential and this page unlocks automatically after checkout."}
						</p>
						<Button
							className="w-full gap-2"
							disabled={isPending}
							onClick={handleUpgrade}
						>
							{isPending ? (
								<>
									<Loader2 className="h-4 w-4 animate-spin" />
									Redirecting...
								</>
							) : (
								<>
									<Sparkles className="h-4 w-4" />
									{isFreeTrial ? "Upgrade to Essential" : "Upgrade plan"}
								</>
							)}
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return <>{children}</>;
}
