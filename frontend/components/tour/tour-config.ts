"use client";

import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  FileText,
  FileCheck,
  CreditCard,
  Receipt,
  File,
  Users,
  Package,
  Bell,
  Settings,
  Sparkles,
} from "lucide-react";

export type TourStep = {
  targetId: string;
  title: string;
  content: string;
  position?: "top" | "bottom" | "left" | "right" | "center";
};

export type TourModule = {
  id: string;
  name: string;
  description: string;
  route: string;
  icon: LucideIcon;
};

// General tour (full app overview) - only steps whose targets exist in app
export const GENERAL_TOUR_STEPS: TourStep[] = [
  {
    targetId: "dashboard-total-invoices",
    title: "Dashboard Overview",
    content:
      "Welcome to AddInvoices! This dashboard gives you a quick snapshot of your business health, including total, paid, and overdue invoices.",
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
    targetId: "dashboard-create-invoice-btn",
    title: "Create Invoice",
    content:
      "Ready to get paid? Click this button to create a new invoice instantly. You can also use our 'Invoice by Voice' feature inside!",
    position: "left",
  },
  {
    targetId: "sidebar-nav-configuration",
    title: "Companies & Settings",
    content:
      "Set up your company details, logo, and taxes here. You can manage multiple companies from a single account.",
    position: "right",
  },
  {
    targetId: "sidebar-nav-catalog",
    title: "Product Catalog",
    content:
      "Add your products and services here once, and they'll be ready to auto-fill in your invoices.",
    position: "right",
  },
  {
    targetId: "sidebar-nav-payments",
    title: "Payments",
    content:
      "Keep track of all incoming payments. You can also set up Stripe integration for automatic payments.",
    position: "right",
  },
  {
    targetId: "sidebar-nav-ask-me-how",
    title: "Need Help?",
    content:
      "Visit the 'Ask Me How' section anytime to watch tutorials, restart this tour, or chat with our help assistant.",
    position: "right",
  },
];

const DASHBOARD_TOUR_STEPS: TourStep[] = [
  {
    targetId: "dashboard-total-invoices",
    title: "Total Invoices",
    content:
      "See your total number of invoices at a glance. This includes all invoices regardless of status.",
    position: "bottom",
  },
  {
    targetId: "dashboard-paid-invoices",
    title: "Paid Invoices",
    content:
      "Track how many invoices have been paid. The completion rate shows your payment collection efficiency.",
    position: "bottom",
  },
  {
    targetId: "dashboard-pending-invoices",
    title: "Pending Invoices",
    content:
      "Monitor invoices awaiting payment. Keep an eye on these to follow up with clients.",
    position: "bottom",
  },
  {
    targetId: "dashboard-revenue-chart",
    title: "Revenue Analytics",
    content:
      "Visualize your monthly revenue trends. This chart helps you understand your business growth patterns.",
    position: "top",
  },
  {
    targetId: "dashboard-recent-invoices",
    title: "Recent Activity",
    content:
      "Quick access to your latest invoices. Click on any invoice to view details or take actions.",
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
      "Start creating a new invoice manually. Fill in client details, add items, and send it to your client.",
    position: "bottom",
  },
  {
    targetId: "invoices-search",
    title: "Search Invoices",
    content:
      "Quickly find invoices by number, client name, or amount. Type to filter your results instantly.",
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
      "All your invoices in one place. Click the menu on each invoice to view, edit, download, send, or delete.",
    position: "top",
  },
];

// const QUOTES_TOUR_STEPS: TourStep[] = [
// 	{ targetId: "quotes-create-btn", title: "Create Quote", content: "Generate professional quotes for potential clients. Once accepted, you can convert them to invoices.", position: "bottom" },
// 	{ targetId: "quotes-search", title: "Search Quotes", content: "Find quotes by client name, quote number, or amount.", position: "bottom" },
// 	{ targetId: "quotes-filter", title: "Filter Quotes", content: "Filter by status: pending, accepted, rejected, or expired.", position: "bottom" },
// 	{ targetId: "quotes-list", title: "Quote Management", content: "View all your quotes here. Send them to clients, convert accepted quotes to invoices, or archive old ones.", position: "top" },
// ]

// const REMINDERS_TOUR_STEPS: TourStep[] = [
// 	{ targetId: "reminders-create-btn", title: "Mass Reminders", content: "Send payment reminders to all overdue clients at once with a single click.", position: "bottom" },
// 	{ targetId: "reminders-list", title: "Reminder Lists", content: "Switch between Pending, Scheduled, and History tabs to manage your different reminder queues.", position: "top" },
// ]

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
    targetId: "clients-search",
    title: "Search Clients",
    content: "Quickly find clients by name, email, or phone number.",
    position: "bottom",
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
      "Add items to your catalog. These will auto-complete when creating invoices, saving you time.",
    position: "bottom",
  },
  {
    targetId: "catalog-search",
    title: "Search Catalog",
    content: "Find items in your catalog by name or description.",
    position: "bottom",
  },
  {
    targetId: "catalog-filter",
    title: "Filter by Company",
    content:
      "If you manage multiple companies, filter catalog items by company.",
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
      "Set up your company details: name, logo, address, NIT, and contact information. This appears on all your invoices.",
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
  {
    targetId: "config-notifications",
    title: "General Settings",
    content:
      "Configure default tax rates, notifications, and other application preferences.",
    position: "bottom",
  },
];

export const STEPS_BY_TOUR_ID: Record<string, TourStep[]> = {
  general: GENERAL_TOUR_STEPS,
  dashboard: DASHBOARD_TOUR_STEPS,
  invoices: INVOICES_TOUR_STEPS,
  //   quotes: QUOTES_TOUR_STEPS,
  //   reminders: REMINDERS_TOUR_STEPS,
  payments: PAYMENTS_TOUR_STEPS,
  expenses: EXPENSES_TOUR_STEPS,
  clients: CLIENTS_TOUR_STEPS,
  catalog: CATALOG_TOUR_STEPS,
  configuration: CONFIGURATION_TOUR_STEPS,
};

export const ROUTE_BY_TOUR_ID: Record<string, string> = {
  general: "/",
  dashboard: "/",
  invoices: "/invoices",
  //   quotes: "/quotes",
  //   reminders: "/reminders",
  payments: "/payments",
  expenses: "/expenses",
  clients: "/clients",
  catalog: "/catalog",
  configuration: "/configuration",
};

/** Module tours only (excludes "general"). Used by TourSelectionModal for "Choose Module". */
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
  //   {
  //     id: "quotes",
  //     name: "Quotes",
  //     description: "Generate quotes for clients",
  //     route: "/quotes",
  //     icon: FileCheck,
  //   },
  //   {
  // 	id: "expenses",
  // 	name: "Expenses",
  // 	description: "Record business expenses",
  // 	route: "/expenses",
  // 	icon: Receipt,
  //   },
  //   {
  // 	id: "reminders",
  // 	name: "Reminders",
  // 	description: "Set up payment reminders",
  // 	route: "/reminders",
  // 	icon: Bell,
  //   },
  {
    id: "payments",
    name: "Payments",
    description: "Track payment history",
    route: "/payments",
    icon: CreditCard,
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
