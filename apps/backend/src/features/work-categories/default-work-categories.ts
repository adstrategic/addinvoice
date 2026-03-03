/**
 * Default global work category definitions (name + Lucide icon name).
 * Kept in sync with packages/db/prisma/seed.ts
 */
export const DEFAULT_WORK_CATEGORIES: readonly {
  icon: string;
  name: string;
}[] = [
  { name: "Accommodation", icon: "Home" },
  { name: "Administration", icon: "ClipboardList" },
  { name: "Airfare", icon: "Plane" },
  { name: "Bank Fees", icon: "Banknote" },
  { name: "Car rental", icon: "Car" },
  { name: "Catering", icon: "UtensilsCrossed" },
  { name: "Clothing", icon: "Shirt" },
  { name: "Consulting", icon: "Briefcase" },
  { name: "Depreciation", icon: "TrendingDown" },
  { name: "Donations", icon: "Heart" },
  { name: "Entertainment", icon: "Music" },
  { name: "Equipment", icon: "Box" },
  { name: "Events", icon: "Calendar" },
  { name: "Fuel", icon: "Fuel" },
  { name: "Hardware", icon: "Cpu" },
  { name: "Health", icon: "HeartPulse" },
  { name: "Insurance", icon: "Shield" },
  { name: "Legal Fees", icon: "Scale" },
  { name: "Licenses and Permits", icon: "FileCheck" },
  { name: "Marketing", icon: "Megaphone" },
  { name: "Meals", icon: "UtensilsCrossed" },
  { name: "Office Supplies", icon: "Package" },
  { name: "Printing", icon: "Printer" },
  { name: "Recruitment", icon: "Users" },
  { name: "Rent or Lease", icon: "Building" },
  { name: "Repairs and Maintenance", icon: "Wrench" },
  { name: "Research", icon: "Search" },
  { name: "Security", icon: "ShieldCheck" },
  { name: "Shipping", icon: "Truck" },
  { name: "Software", icon: "Laptop" },
  { name: "Subscriptions", icon: "Repeat" },
  { name: "Taxes", icon: "Receipt" },
  { name: "Training", icon: "GraduationCap" },
  { name: "Transport", icon: "Bus" },
  { name: "Travel", icon: "Plane" },
  { name: "Utilities", icon: "Zap" },
];
