"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

interface SplashScreenProps {
  onComplete: () => void;
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 100);

    // Complete after 6 seconds
    const timeout = setTimeout(() => {
      onComplete();
    }, 6000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#48C6C8]">
      <div className="flex flex-col items-center gap-8">
        {/* Animated Logo */}
        <div className="relative">
          <Image
            src="/images/addstrategic-icon.png"
            alt="ADSTRATEGIC"
            width={120}
            height={120}
            className="drop-shadow-2xl"
          />
        </div>

        {/* Brand Text */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-2">AdInvoices</h1>
          <p className="text-white/90 text-lg">Powered by ADSTRATEGIC</p>
        </div>

        {/* Progress Bar */}
        <div className="w-64 h-1 bg-white/30 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </div>
  );
}
