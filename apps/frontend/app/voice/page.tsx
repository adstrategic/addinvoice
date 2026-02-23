"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, useUser } from "@clerk/nextjs";

import "@livekit/components-styles";
import { Loader2 } from "lucide-react";
import { VoiceContent } from "@/components/voice-agent/VoiceContent";

export default function VoiceInvoicePage() {
  const router = useRouter();
  const { user, isLoaded: userLoaded } = useUser();
  const { getToken } = useAuth();
  const [token, setToken] = useState<string | null>(null);

  // Handle authentication redirect
  useEffect(() => {
    if (userLoaded && !user) {
      router.push("/sign-in");
    }
  }, [user, userLoaded, router]);

  // Fetch Clerk token once user is loaded and authenticated
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
      <div className="flex items-center justify-center min-h-screen">
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
