"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { motion } from "framer-motion"

interface SplashScreenProps {
  onComplete: () => void
}

export function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + 2
      })
    }, 100)

    // Complete after 6 seconds
    const timeout = setTimeout(() => {
      onComplete()
    }, 6000)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [onComplete])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#48C6C8]"
    >
      <div className="flex flex-col items-center gap-8">
        {/* Animated Logo */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
          className="relative"
        >
          <Image
            src="/images/adstrategic-icon.png"
            alt="ADSTRATEGIC"
            width={120}
            height={120}
            className="drop-shadow-2xl"
          />
        </motion.div>

        {/* Brand Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="text-center"
        >
          <h1 className="text-4xl font-bold text-white mb-2">AdInvoices</h1>
          <p className="text-white/90 text-lg">Powered by ADSTRATEGIC</p>
        </motion.div>

        {/* Progress Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="w-64 h-1 bg-white/30 rounded-full overflow-hidden"
        >
          <motion.div
            className="h-full bg-white rounded-full"
            style={{ width: `${progress}%` }}
            transition={{ duration: 0.1 }}
          />
        </motion.div>
      </div>
    </motion.div>
  )
}
