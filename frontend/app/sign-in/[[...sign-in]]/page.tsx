"use client";

import { SignIn } from "@clerk/nextjs";
import { motion } from "framer-motion";
import Image from "next/image";
import { Card } from "@/components/ui/card";

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F2027] via-[#203A43] to-[#2C5364] sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-border/50 shadow-2xl bg-card/95 backdrop-blur p-6">
          <div className="flex justify-center mb-6">
            <Image
              src="/images/addstrategic-banner.png"
              alt="ADSTRATEGIC"
              width={280}
              height={60}
              className="h-12 w-auto"
            />
          </div>
          <SignIn
            appearance={{
              elements: {
                rootBox: "mx-auto",
                card: "shadow-none bg-transparent",
                headerTitle: "text-2xl font-bold text-foreground",
                headerSubtitle: "text-muted-foreground",
                socialButtonsBlockButton:
                  "bg-background border-border hover:bg-accent",
                formButtonPrimary:
                  "bg-primary hover:bg-primary/90 text-primary-foreground font-semibold",
                formFieldInput:
                  "bg-background border-border focus:border-primary",
                footerActionLink: "text-primary hover:text-primary/80",
              },
            }}
            routing="path"
            path="/sign-in"
            signUpUrl="/sign-up"
            afterSignInUrl="/"
          />
          <div className="mt-6 text-center">
            <p className="text-sm text-muted-foreground">
              ADDINVOICES — Powered by ADDSTRATEGIC
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
