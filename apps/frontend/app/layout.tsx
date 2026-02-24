import type React from "react";
import type { Metadata } from "next";
import dynamic from "next/dynamic";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { Analytics } from "@vercel/analytics/next";
import { ThemeProvider } from "@/components/theme-provider";
import { QueryProvider } from "@/components/providers/query-provider";
import { ClerkTokenProvider } from "@/components/providers/clerk-token-provider";
import { Toaster } from "@/components/ui/toaster";
import "./globals.css";
import { TourProvider } from "@/components/tour/TourContext";
import { TourOverlay } from "@/components/tour/TourOverlay";

const _geist = Geist({ subsets: ["latin"] });
const _geistMono = Geist_Mono({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "ADDINVOICES - Smart Invoicing Software for Freelancers & Businesses",
  description:
    "Streamline your billing with ADDINVOICES. The smart, easy-to-use invoicing software designed for freelancers and small businesses. Create professional invoices, track payments, and get paid faster.",
  keywords:
    "invoicing software, invoice maker, online billing app, freelance invoicing, small business invoicing, invoice management system, ADDINVOICES, ADDSTRATEGIC, smart invoicing",
  generator: "ADDSTRATEGIC",
  applicationName: "ADDINVOICES",
  authors: [
    {
      name: "Nicolas Forero Quevedo",
      url: "https://www.linkedin.com/in/nicolas-forero-quevedo/",
    },
    {
      name: "Santiago Arias Camero",
      url: "https://www.linkedin.com/in/santiago-arias-333990268/",
    },
  ],
  icons: {
    icon: "/images/addinvoices-favicon.png",
    shortcut: "/images/addinvoices-favicon.png",
    apple: "/images/addinvoices-favicon.png",
  },
  openGraph: {
    title:
      "ADDINVOICES - Smart Invoicing Software for Freelancers & Businesses",
    description:
      "Streamline your billing with ADDINVOICES. The smart, easy-to-use invoicing software designed for freelancers and small businesses. Create professional invoices, track payments, and get paid faster.",
    type: "website",
    siteName: "ADDINVOICES",
    images: [
      {
        url: "/addinvoices_seo_app.png",
        width: 1640,
        height: 924,
        alt: "Banner ADDINVOICES",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ADDINVOICES - Smart Invoicing Software",
    description:
      "Streamline your billing with ADDINVOICES. Create professional invoices and get paid faster.",
    images: ["/addinvoices_seo_app.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider signInUrl="/sign-in" signUpUrl="/sign-up">
      <html lang="en" suppressHydrationWarning>
        <body className={`font-sans antialiased`}>
          <ThemeProvider defaultTheme="light" storageKey="adinvoices-theme">
            <QueryProvider>
              <ClerkTokenProvider>
                <TourProvider>
                  <TourOverlay />
                  {children}
                </TourProvider>
              </ClerkTokenProvider>
            </QueryProvider>
            <Toaster />
          </ThemeProvider>
          <Analytics />
        </body>
      </html>
    </ClerkProvider>
  );
}
