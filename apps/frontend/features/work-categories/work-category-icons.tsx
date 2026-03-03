"use client";

import type { LucideIcon } from "lucide-react";
import {
  Banknote,
  Box,
  Briefcase,
  Building,
  Bus,
  Calendar,
  Car,
  ClipboardList,
  Cpu,
  FileCheck,
  Fuel,
  GraduationCap,
  Heart,
  HeartPulse,
  Home,
  Laptop,
  Megaphone,
  Music,
  Package,
  Plane,
  Printer,
  Receipt,
  Repeat,
  Search,
  Shirt,
  Shield,
  ShieldCheck,
  Tag,
  TrendingDown,
  Truck,
  Users,
  UtensilsCrossed,
  Wrench,
  Zap,
} from "lucide-react";

const WORK_CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  Banknote,
  Box,
  Briefcase,
  Building,
  Bus,
  Calendar,
  Car,
  ClipboardList,
  Cpu,
  FileCheck,
  Fuel,
  GraduationCap,
  Heart,
  HeartPulse,
  Home,
  Laptop,
  Megaphone,
  Music,
  Package,
  Plane,
  Printer,
  Receipt,
  Repeat,
  Search,
  Shirt,
  Shield,
  ShieldCheck,
  Tag,
  TrendingDown,
  Truck,
  Users,
  UtensilsCrossed,
  Wrench,
  Zap,
};

const FALLBACK_ICON: LucideIcon = Tag;

/**
 * Returns the Lucide icon component for a work category icon name.
 * Uses a fallback icon when the name is unknown or missing.
 */
export function getWorkCategoryIcon(
  iconName: string | null | undefined,
): LucideIcon {
  if (!iconName || typeof iconName !== "string") {
    return FALLBACK_ICON;
  }
  return WORK_CATEGORY_ICON_MAP[iconName] ?? FALLBACK_ICON;
}
