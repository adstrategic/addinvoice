"use client";

import type React from "react";
import { useEffect } from "react";
import { Sparkles } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCreatePortalSession, useSubscription } from "@/hooks/use-subscription";
import { hasVoiceAccess } from "@/features/subscriptions/lib/subscription-access";

interface VoicePlanGateProps {
	children: React.ReactNode;
}

export function VoicePlanGate({ children }: VoicePlanGateProps) {
	const { data: subscription, isLoading, isError, error, refetch } = useSubscription();
	const openPortal = useCreatePortalSession();

	useEffect(() => {
		const handleVisibility = () => {
			if (document.visibilityState === "visible") {
				void refetch();
			}
		};

		document.addEventListener("visibilitychange", handleVisibility);
		return () => {
			document.removeEventListener("visibilitychange", handleVisibility);
		};
	}, [refetch]);

	if (isLoading) {
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

	if (subscription?.isActive && !hasVoiceAccess(subscription.plan)) {
		return (
			<div className="min-h-screen flex items-center justify-center p-4 bg-[#162135]">
				<Card className="w-full max-w-lg">
					<CardHeader className="space-y-2">
						<div className="flex items-center gap-2 text-primary">
							<Sparkles className="h-5 w-5" />
							<span className="text-sm font-medium uppercase tracking-wide">
								Voice is a Pro feature
							</span>
						</div>
						<CardTitle>Upgrade to AI Pro to unlock voice assistant</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<p className="text-sm text-muted-foreground">
							Your current plan does not include voice access. Upgrade your
							subscription and this page unlocks automatically after checkout.
						</p>
						<Button
							className="w-full"
							disabled={openPortal.isPending}
							onClick={() => openPortal.mutate("/voice")}
						>
							{openPortal.isPending ? "Redirecting to billing..." : "Upgrade plan"}
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	return <>{children}</>;
}
