"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"

interface AuthContextType {
  isAuthenticated: boolean
  isLoading: boolean
  login: (username: string, password: string) => boolean
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check if user is authenticated on mount
    const authStatus = localStorage.getItem("adinvoices-auth")
    setIsAuthenticated(authStatus === "true")
    setIsLoading(false)
  }, [])

  useEffect(() => {
    // Redirect logic
    if (!isLoading) {
      if (!isAuthenticated && pathname !== "/login") {
        router.push("/login")
      } else if (isAuthenticated && pathname === "/login") {
        router.push("/")
      }
    }
  }, [isAuthenticated, isLoading, pathname, router])

  const login = (username: string, password: string): boolean => {
    if (username === "adstrategic" && password === "adstrategic") {
      setIsAuthenticated(true)
      localStorage.setItem("adinvoices-auth", "true")
      return true
    }
    return false
  }

  const logout = () => {
    setIsAuthenticated(false)
    localStorage.removeItem("adinvoices-auth")
    router.push("/login")
  }

  return <AuthContext.Provider value={{ isAuthenticated, isLoading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
