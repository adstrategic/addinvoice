"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";
import { Loader2 } from "lucide-react";

const VoiceContent = dynamic(
	() =>
		import("@/components/voice-agent/VoiceContent").then((mod) => mod.VoiceContent),
	{
		ssr: false,
		loading: () => (
			<div className="flex items-center justify-center min-h-screen gap-3">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
				<p className="text-sm text-muted-foreground">Loading voice assistant...</p>
			</div>
		),
	},
);

export default function VoiceInvoicePage() {
	const router = useRouter();
	const { user, isLoaded: userLoaded } = useUser();
	const { getToken } = useAuth();
	const [token, setToken] = useState<string | null>(null);

	useEffect(() => {
		if (userLoaded && !user) {
			router.push("/sign-in");
		}
	}, [user, userLoaded, router]);

	useEffect(() => {
		if (!userLoaded || !user) return;
		getToken().then(setToken);
	}, [userLoaded, user, getToken]);

	const refreshToken = async () => {
		const newToken = await getToken();
		if (newToken) setToken(newToken);
	};

	const participant_name =
		user?.fullName || user?.emailAddresses[0]?.emailAddress || "User";

	if (!userLoaded || !user || !token) {
		return (
			<div className="flex items-center justify-center min-h-screen gap-3">
				<Loader2 className="h-8 w-8 animate-spin text-primary" />
				<p className="text-sm text-muted-foreground">Loading...</p>
			</div>
		);
	}

	return (
		<VoiceContent
			token={token}
			refreshToken={refreshToken}
			participant_name={participant_name}
		/>
	);
}
