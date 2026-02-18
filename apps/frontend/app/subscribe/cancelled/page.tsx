"use client";

import { XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function SubscribeCancelledPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background py-12 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-red-100 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-red-600" />
          </div>
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
          <CardDescription>
            Your payment was cancelled. No charges were made.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            You can try again anytime or contact us if you need assistance.
          </p>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="flex-1">
              <Link href="/subscribe">Try Again</Link>
            </Button>
            <Button asChild className="flex-1">
              <Link href="/">Go to Dashboard</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
