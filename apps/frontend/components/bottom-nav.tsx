'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { getFeatureColors, type FeatureKey } from '@/lib/feature-colors'
import {
  Home,
  FileText,
  FileCheck,
  Users,
  Plus,
  Mic,
  Menu,
  FilePen,
  ClipboardList,
  CreditCard,
  Receipt,
  Package,
  HelpCircle,
  Settings,
  Star,
  type LucideIcon,
} from 'lucide-react'
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import { useHaptic } from '@/hooks/use-haptic'
import { useSubscription } from '@/hooks/use-subscription'
import { planAllowsAdvances } from '@/features/subscriptions/lib/subscription-access'

const mainNavItems = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Invoices', href: '/invoices', icon: FileText },
  { name: 'Estimates', href: '/estimates', icon: FileCheck },
  { name: 'Clients', href: '/clients', icon: Users },
]

type MoreNavItem = {
  name: string
  href: string
  icon: LucideIcon
  feature: FeatureKey
  requiresAdvances: boolean
}

const moreNavItems: MoreNavItem[] = [
  { name: 'Voice', href: '/voice', icon: Mic, feature: 'voice', requiresAdvances: false },
  { name: 'Proposals', href: '/proposals', icon: FilePen, feature: 'proposal', requiresAdvances: false },
  { name: 'Advances', href: '/advances', icon: ClipboardList, feature: 'advance', requiresAdvances: true },
  { name: 'Payments', href: '/payments', icon: CreditCard, feature: 'payment', requiresAdvances: false },
  { name: 'Expenses', href: '/expenses', icon: Receipt, feature: 'expense', requiresAdvances: false },
  { name: 'Catalog', href: '/catalog', icon: Package, feature: 'catalog', requiresAdvances: false },
  { name: 'Reputation', href: '/reputation', icon: Star, feature: 'reputation', requiresAdvances: false },
  { name: 'Ask Me How', href: '/ask-me-how', icon: HelpCircle, feature: 'ask-me-how', requiresAdvances: false },
  { name: 'Settings', href: '/configuration', icon: Settings, feature: 'settings', requiresAdvances: false },
]

type CreateNavItem = {
  label: string
  href: string
  icon: LucideIcon
  feature: FeatureKey
}

const createNavItems: CreateNavItem[] = [
  { label: 'Estimate', href: '/estimates?action=create', icon: FileCheck, feature: 'estimate' },
  { label: 'Invoice', href: '/invoices?action=create', icon: FileText, feature: 'invoice' },
  { label: 'Client', href: '/clients?action=create', icon: Users, feature: 'client' },
  { label: 'Advance', href: '/advances?action=create', icon: ClipboardList, feature: 'advance' },
]

export function BottomNav() {
  const pathname = usePathname()
  const router = useRouter()
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [isMoreOpen, setIsMoreOpen] = useState(false)
  const [isAnyFormOpen, setIsAnyFormOpen] = useState(false)
  const { triggerHaptic } = useHaptic()
  const { data: subscription } = useSubscription()

  useEffect(() => {
    const open = () => setIsAnyFormOpen(true)
    const close = () => setIsAnyFormOpen(false)
    window.addEventListener('app:form-open', open)
    window.addEventListener('app:form-close', close)
    return () => {
      window.removeEventListener('app:form-open', open)
      window.removeEventListener('app:form-close', close)
    }
  }, [])

  // Reset when navigating away from the page that opened a form
  useEffect(() => {
    setIsAnyFormOpen(false)
  }, [pathname])

  const visibleMoreItems = moreNavItems.filter((item) =>
    item.requiresAdvances ? planAllowsAdvances(subscription?.plan) : true,
  )

  const navigate = (href: string, drawer: 'create' | 'more') => {
    triggerHaptic('light')
    if (drawer === 'create') setIsCreateOpen(false)
    if (drawer === 'more') setIsMoreOpen(false)
    setTimeout(() => router.push(href), 100)
  }

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/'
    return pathname.startsWith(href)
  }

  return (
    <>
      {/* Floating action buttons — hidden when any form is open */}
      {!isAnyFormOpen && (
        <div className="fixed bottom-24 right-4 z-50 flex items-center gap-3 md:hidden">
          <Drawer open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DrawerTrigger asChild>
              <button
                type="button"
                onClick={() => triggerHaptic('medium')}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-linear-to-br from-primary-dark via-primary to-primary-light text-primary-foreground shadow-[0_8px_20px_rgba(0,117,135,0.4)] active:scale-90 transition-transform duration-150"
              >
                <Plus className="h-6 w-6" />
              </button>
            </DrawerTrigger>
            <DrawerContent className="px-4 pb-8">
              <DrawerHeader className="text-left px-2">
                <DrawerTitle className="text-xl font-bold">Create new</DrawerTitle>
              </DrawerHeader>
              <div className="flex flex-col gap-2 mt-2">
                {createNavItems.map((item) => {
                  const colors = getFeatureColors(item.feature)
                  return (
                    <div
                      key={item.label}
                      onClick={() => navigate(item.href, 'create')}
                      className="cursor-pointer"
                    >
                      <div className="flex items-center gap-4 rounded-xl p-4 hover:bg-secondary/50 transition-colors">
                        <div
                          className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-lg',
                            colors.createIcon,
                          )}
                        >
                          <item.icon className="h-5 w-5" />
                        </div>
                        <span className="font-medium text-base">{item.label}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </DrawerContent>
          </Drawer>
        </div>
      )}

      {/* Bottom navigation bar — hidden when a form is open */}
      {!isAnyFormOpen && <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-20 items-center justify-around overflow-hidden px-2 sm:px-4 rounded-t-[2.5rem] border-t border-white/20 dark:border-white/5 bg-background/80 pb-2 backdrop-blur-3xl shadow-[0_-15px_40px_rgba(0,0,0,0.08)] md:hidden">
        {mainNavItems.map((item) => {
          const active = isActive(item.href)
          return (
            <Link
              key={item.name}
              href={item.href}
              onClick={() => triggerHaptic('light')}
              className={cn(
                'flex flex-col items-center justify-center shrink-0 w-14 h-14 gap-1 relative',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              <span
                className={cn(
                  'absolute inset-0 rounded-xl -z-10 transition-colors duration-200',
                  active ? 'bg-primary/10' : 'bg-transparent',
                )}
              />
              <item.icon
                className={cn(
                  'h-5 w-5 transition-transform duration-200',
                  active ? 'scale-110' : '',
                )}
              />
              <span className="text-[10px] font-medium">{item.name}</span>
            </Link>
          )
        })}

        {/* More drawer */}
        <Drawer open={isMoreOpen} onOpenChange={setIsMoreOpen}>
          <DrawerTrigger asChild>
            <button
              type="button"
              onClick={() => triggerHaptic('light')}
              className="flex flex-col items-center justify-center shrink-0 w-14 h-14 gap-1 text-muted-foreground outline-none"
            >
              <Menu className="h-5 w-5" />
              <span className="text-[10px] font-medium">More</span>
            </button>
          </DrawerTrigger>
          <DrawerContent className="px-4 pb-8 max-h-[85vh]">
            <DrawerHeader className="text-left px-2">
              <DrawerTitle className="text-xl font-bold">More options</DrawerTitle>
            </DrawerHeader>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4 mt-4 overflow-y-auto px-2 pb-6">
              {visibleMoreItems.map((item) => {
                const colors = getFeatureColors(item.feature)
                return (
                <div
                  key={item.name}
                  onClick={() => navigate(item.href, 'more')}
                  className="flex flex-col items-center gap-2 group cursor-pointer"
                >
                  <div
                    className={cn(
                      'flex h-14 w-14 items-center justify-center rounded-[1.25rem] bg-linear-to-br backdrop-blur-xl border shadow-[0_4px_12px_rgba(0,0,0,0.05)] group-hover:-translate-y-1 transition-all duration-300 relative overflow-hidden',
                      colors.tile.gradient,
                    )}
                  >
                    <div className="absolute inset-0 bg-white/20 dark:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <item.icon className="h-6 w-6 drop-shadow-sm group-hover:scale-110 transition-transform duration-300 relative z-10" />
                  </div>
                  <span
                    className={cn(
                      'text-xs font-semibold text-foreground transition-colors text-center leading-tight',
                      colors.tile.textHover,
                    )}
                  >
                    {item.name}
                  </span>
                </div>
              )})}
            </div>
          </DrawerContent>
        </Drawer>
      </nav>}
    </>
  )
}
