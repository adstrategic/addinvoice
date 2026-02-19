"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
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
  );
}
