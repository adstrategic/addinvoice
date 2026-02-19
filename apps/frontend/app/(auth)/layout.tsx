"use client";

import type React from "react";
import { motion } from "framer-motion";
import Image from "next/image";
import { Card } from "@/components/ui/card";

export default function AuthLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#0F2027] via-[#203A43] to-[#2C5364] sm:p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 bg-transparent shadow-none p-6 md:border md:border-border/50 md:shadow-2xl md:bg-card/95 md:backdrop-blur">
          <div className="flex justify-center mb-6">
            <Image
              src="/images/addstrategic-banner.png"
              alt="ADSTRATEGIC"
              width={280}
              height={60}
              className="h-12 w-auto hidden md:block"
            />
          </div>
          {children}
          <div className="mt-6 text-center hidden md:block">
            <p className="text-sm text-muted-foreground">
              ADDINVOICES — Powered by ADDSTRATEGIC
            </p>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
