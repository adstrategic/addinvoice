"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useHasBusiness } from "@/hooks/useHasBusiness";
import { useBusinesses } from "@/features/businesses";

interface BusinessGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * BusinessGuard component
 * Redirects to /setup if user doesn't have any businesses
 * Use this to protect routes that require a business to exist
 */
export function BusinessGuard({
  children,
  redirectTo = "/setup",
}: BusinessGuardProps) {
  const router = useRouter();
  const { data, isLoading } = useBusinesses();

  const hasBusiness = (data?.data?.length ?? 0) > 0;

  useEffect(() => {
    if (!isLoading && !hasBusiness) {
      router.push(redirectTo);
    }
  }, [hasBusiness, isLoading, router, redirectTo]);

  // Show loading state while checking
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Don't render children if no business exists (redirect will happen)
  if (!hasBusiness) {
    return null;
  }

  return <>{children}</>;
}
