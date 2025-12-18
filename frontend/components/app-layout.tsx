"use client"

import type React from "react"

import { Sidebar } from "@/components/sidebar"

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="md:pl-64">
        <main className="min-h-screen">{children}</main>
      </div>
    </div>
  )
}
