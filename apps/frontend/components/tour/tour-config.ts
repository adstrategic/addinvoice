"use client";

import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FileText,
  FileCheck,
  CreditCard,
  Receipt,
  FilePen,
  Users,
  Package,
  Settings,
} from "lucide-react";

export type TourStep = {
  targetId: string;
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
  /** CustomEvent name — tour auto-advances when this event fires on window */
  autoAdvanceOn?: string;
  /** Route to navigate to when the user clicks Next on this step; tour resumes at next step on arrival */
  navigateTo?: string;
};

export type TourModule = {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: LucideIcon;
};

// ─── Onboarding tour (new-user first experience) ──────────────────────────────

export const ONBOARDING_TOUR_ID = "onboarding";

export const ONBOARDING_TOUR_STEPS: TourStep[] = [
  {
    targetId: "clients-create-btn",
    title: "Add Your First Client",
    content:
      "Start by creating a client manually. They'll be linked to your invoices.",
    position: "bottom",
    autoAdvanceOn: "tour:client-created",
  },
  {
    targetId: "sidebar-nav-estimates",
    title: "Estimates",
    content:
      "Create quotes for clients here. Once accepted, convert them to proposals with one click.",
    position: "right",
  },
  {
    targetId: "sidebar-nav-proposals",
    title: "Proposals",
    content:
      "Accepted estimates become proposals. Send them, mark them accepted, or convert to invoices.",
    position: "right",
  },
  {
    targetId: "sidebar-nav-invoices",
    title: "Go to Invoices",
    content:
      "Now let's create your first invoice. Click Invoices in the sidebar to continue.",
    position: "right",
    navigateTo: "/invoices",
  },
  {
    targetId: "invoices-voice-btn",
    title: "Create by Voice",
    content:
      "Tap Add by voice and describe your invoice out loud — we'll handle the rest.",
    position: "bottom",
    autoAdvanceOn: "tour:invoice-voice-clicked",
  },
];

export const ONBOARDING_TOUR_MOBILE_STEPS: TourStep[] = [
  {
    targetId: "clients-create-btn",
    title: "Add Your First Client",
    content:
      "Start by creating a client manually. They'll be linked to your invoices.",
    position: "bottom",
    autoAdvanceOn: "tour:client-created",
  },
  {
    targetId: "sidebar-mobile-trigger",
    title: "Open the Navigation",
    content: "Tap the menu icon to open the navigation sidebar.",
    position: "bottom",
    autoAdvanceOn: "tour:sidebar-opened",
  },
  {
    targetId: "sidebar-nav-estimates",
    title: "Estimates",
    content:
      "Create quotes for clients here. Once accepted, convert them to proposals with one click.",
    position: "right",
  },
  {
    targetId: "sidebar-nav-proposals",
    title: "Proposals",
    content:
      "Accepted estimates become proposals. Send them, mark them accepted, or convert to invoices.",
    position: "right",
  },
  {
    targetId: "sidebar-nav-invoices",
    title: "Go to Invoices",
    content: "Now tap Invoices to continue.",
    position: "right",
    navigateTo: "/invoices",
  },
  {
    targetId: "invoices-voice-btn",
    title: "Create by Voice",
    content:
      "Tap Add by voice and describe your invoice out loud — we'll handle the rest.",
    position: "bottom",
    autoAdvanceOn: "tour:invoice-voice-clicked",
  },
];

// ─── General tour ─────────────────────────────────────────────────────────────

export const GENERAL_TOUR_STEPS: TourStep[] = [
  {
    targetId: "dashboard-total-earned",
    title: "Dashboard Overview",
    content:
      "Welcome to ADDINVOICES! This dashboard gives you a quick snapshot of your business health.",
    position: "bottom",
  },
  {
    targetId: "dashboard-revenue-chart",
    title: "Revenue Tracking",
    content:
      "Track your monthly revenue growth here. The chart updates automatically as you mark invoices as paid.",
    position: "top",
  },
  {
    targetId: "sidebar-nav-estimates",
    title: "Estimates",
    content:
      "Create quotes for clients here. Once accepted, convert them to proposals with one click.",
    position: "right",
  },
  {
    targetId: "sidebar-nav-proposals",
    title: "Proposals",
    content:
      "Accepted estimates become proposals. Send them, mark them accepted, or convert to invoices.",
    position: "right",
  },
  {
    targetId: "sidebar-nav-configuration",
    title: "Companies & Settings",
    content:
      "Set up your company details, logo, and taxes here. You can manage multiple companies.",
    position: "right",
  },
  {
    targetId: "sidebar-nav-ask-me-how",
    title: "Need Help?",
    content:
      "Visit 'Ask Me How' anytime to restart a tour, watch tutorials, or chat with the help assistant.",
    position: "right",
  },
];

// ─── Module-specific tours ────────────────────────────────────────────────────

const DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    targetId: "dashboard-total-earned",
    title: "Total Earned",
    content:
      "Your total revenue from paid invoices. This is the money that's already in your pocket.",
    position: "bottom",
  },
  {
    targetId: "dashboard-total-spent",
    title: "Total Spent",
    content:
      "Track your total business expenses here. Keeping an eye on spending helps you manage profitability.",
    position: "bottom",
  },
  {
    targetId: "dashboard-customers-owe",
    title: "Customers Owe",
    content:
      "The total outstanding amount clients still owe you. Follow up on these to improve cash flow.",
    position: "bottom",
  },
  {
    targetId: "dashboard-revenue-chart",
    title: "Revenue Analytics",
    content:
      "Visualize your monthly revenue trends. This chart helps you understand your business growth.",
    position: "top",
  },
  {
    targetId: "dashboard-recent-invoices",
    title: "Recent Activity",
    content:
      "Quick access to your latest invoices. Click any invoice to view details or take actions.",
    position: "top",
  },
  {
    targetId: "dashboard-create-invoice-btn",
    title: "Quick Create",
    content:
      "Create a new invoice from anywhere with this floating action button.",
    position: "left",
  },
];

const INVOICES_TOUR_STEPS: TourStep[] = [
  {
    targetId: "invoices-create-btn",
    title: "Create Invoice",
    content:
      "Start creating a new invoice manually. Fill in client details, add items, and send it.",
    position: "bottom",
  },
  {
    targetId: "invoices-voice-btn",
    title: "Voice Invoice",
    content:
      "Tap Add by voice and describe your invoice — client, items, amounts. We'll fill it in.",
    position: "bottom",
  },
  {
    targetId: "invoices-filter",
    title: "Filter by Status",
    content:
      "Filter invoices by status: paid, overdue, issued, or draft. Narrow down what you're looking for.",
    position: "bottom",
  },
  {
    targetId: "invoices-list",
    title: "Invoice List",
    content:
      "All your invoices in one place. Click the menu on each row to view, download, send, or delete.",
    position: "top",
  },
];

const ESTIMATES_TOUR_STEPS: TourStep[] = [
  {
    targetId: "estimates-create-btn",
    title: "Create Estimate",
    content:
      "Draft a professional quote for a client. Set items, prices, and terms before sending.",
    position: "bottom",
  },
  {
    targetId: "estimates-voice-btn",
    title: "Voice Estimate",
    content:
      "Describe your estimate by voice — client, line items, and amounts — and we'll generate it.",
    position: "left",
  },
  {
    targetId: "estimates-list",
    title: "Convert to Proposal",
    content:
      "Once a client accepts, use the action menu on any estimate to convert it to a proposal.",
    position: "top",
  },
];

const PROPOSALS_TOUR_STEPS: TourStep[] = [
  {
    targetId: "proposals-filter",
    title: "Proposals",
    content:
      "Proposals come from estimates your client has accepted. Filter by status to manage them.",
    position: "bottom",
  },
  {
    targetId: "proposals-list",
    title: "Manage Proposals",
    content:
      "Send proposals, mark them accepted, or convert to an invoice — all from the action menu.",
    position: "top",
  },
];

const PAYMENTS_TOUR_STEPS: TourStep[] = [
  {
    targetId: "payments-balance",
    title: "Balance Overview",
    content:
      "See your total balance, pending payments, and overdue amounts at a glance.",
    position: "bottom",
  },
  {
    targetId: "payments-history",
    title: "Payment History",
    content:
      "Track all payment transactions. View payment dates, amounts, and associated invoices.",
    position: "top",
  },
];

const EXPENSES_TOUR_STEPS: TourStep[] = [
  {
    targetId: "expenses-create-btn",
    title: "Add Expense",
    content:
      "Record business expenses manually. Track spending by category and date.",
    position: "bottom",
  },
  {
    targetId: "expenses-search",
    title: "Search Expenses",
    content:
      "Find expenses by description, category, or amount. Filter your expense history easily.",
    position: "bottom",
  },
  {
    targetId: "expenses-list",
    title: "Expense Tracking",
    content:
      "View all your business expenses. Edit, delete, or export for accounting purposes.",
    position: "top",
  },
];

const CLIENTS_TOUR_STEPS: TourStep[] = [
  {
    targetId: "clients-create-btn",
    title: "Add Client",
    content:
      "Add new clients to your database. Store contact info, addresses, and payment details.",
    position: "bottom",
  },
  {
    targetId: "clients-voice-btn",
    title: "Voice Creation",
    content:
      "Add clients hands-free — tap the mic and describe who they are. We'll create the record.",
    position: "left",
  },
  {
    targetId: "clients-list",
    title: "Client Directory",
    content:
      "Manage your client relationships. View invoices, send emails, or update client information.",
    position: "top",
  },
];

const CATALOG_TOUR_STEPS: TourStep[] = [
  {
    targetId: "catalog-create-btn",
    title: "Add Product/Service",
    content:
      "Add items to your catalog. They'll auto-complete when creating invoices, saving you time.",
    position: "bottom",
  },
  {
    targetId: "catalog-search",
    title: "Search Catalog",
    content: "Find items in your catalog by name or description.",
    position: "bottom",
  },
  {
    targetId: "catalog-list",
    title: "Product Library",
    content:
      "Your complete product and service catalog. Edit prices, update descriptions, or remove items.",
    position: "top",
  },
];

const CONFIGURATION_TOUR_STEPS: TourStep[] = [
  {
    targetId: "config-company",
    title: "Company Settings",
    content:
      "Set up your company details: name, logo, address, NIT, and contact info. Appears on all invoices.",
    position: "bottom",
  },
  {
    targetId: "config-profile",
    title: "User Profile",
    content: "Manage your personal information and login credentials.",
    position: "bottom",
  },
  {
    targetId: "config-billing",
    title: "Billing & Payments",
    content:
      "Manage your subscription plan and payment methods for the application.",
    position: "bottom",
  },
];

// ─── Registry & lookup maps ───────────────────────────────────────────────────

export const STEPS_BY_TOUR_ID: Record<string, TourStep[]> = {
  general: GENERAL_TOUR_STEPS,
  onboarding: ONBOARDING_TOUR_STEPS,
  dashboard: DASHBOARD_TOUR_STEPS,
  invoices: INVOICES_TOUR_STEPS,
  estimates: ESTIMATES_TOUR_STEPS,
  proposals: PROPOSALS_TOUR_STEPS,
  payments: PAYMENTS_TOUR_STEPS,
  expenses: EXPENSES_TOUR_STEPS,
  clients: CLIENTS_TOUR_STEPS,
  catalog: CATALOG_TOUR_STEPS,
  configuration: CONFIGURATION_TOUR_STEPS,
};

export const ROUTE_BY_TOUR_ID: Record<string, string> = {
  general: "/",
  onboarding: "/clients",
  dashboard: "/",
  invoices: "/invoices",
  estimates: "/estimates",
  proposals: "/proposals",
  payments: "/payments",
  expenses: "/expenses",
  clients: "/clients",
  catalog: "/catalog",
  configuration: "/configuration",
};

/** Module tours shown in TourSelectionModal. Excludes "general" and "onboarding". */
export const TOUR_REGISTRY: TourModule[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    description: "Overview of your business metrics",
    route: "/",
    icon: LayoutDashboard,
  },
  {
    id: "invoices",
    name: "Invoices",
    description: "Create and manage invoices",
    route: "/invoices",
    icon: FileText,
  },
  {
    id: "estimates",
    name: "Estimates",
    description: "Create quotes and convert to proposals",
    route: "/estimates",
    icon: FileCheck,
  },
  {
    id: "proposals",
    name: "Proposals",
    description: "Manage accepted estimates",
    route: "/proposals",
    icon: FilePen,
  },
  {
    id: "payments",
    name: "Payments",
    description: "Track payment history",
    route: "/payments",
    icon: CreditCard,
  },
  {
    id: "expenses",
    name: "Expenses",
    description: "Record business expenses",
    route: "/expenses",
    icon: Receipt,
  },
  {
    id: "clients",
    name: "Clients",
    description: "Manage client information",
    route: "/clients",
    icon: Users,
  },
  {
    id: "catalog",
    name: "Catalog",
    description: "Product and service catalog",
    route: "/catalog",
    icon: Package,
  },
  {
    id: "configuration",
    name: "Configuration",
    description: "App settings and preferences",
    route: "/configuration",
    icon: Settings,
  },
];

export const GENERAL_TOUR_ID = "general";

/** Resolve DOM element for a tour target (data-tour-id or id). */
export function getTourTargetElement(targetId: string): Element | null {
  if (typeof document === "undefined") return null;
  const byData = document.querySelector(`[data-tour-id="${targetId}"]`);
  if (byData) return byData;
  return document.getElementById(targetId);
}
