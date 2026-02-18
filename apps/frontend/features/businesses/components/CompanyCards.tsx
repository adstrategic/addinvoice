"use client";

import type { BusinessResponse } from "@/features/businesses";
import { CompanyCard } from "./CompanyCard";

interface CompanyCardsProps {
  businesses: BusinessResponse[];
  isLoading: boolean;
  onDeleteRequested: (company: BusinessResponse) => void;
  onSaveSuccess?: () => void;
}

export function CompanyCards({
  businesses,
  isLoading,
  onDeleteRequested,
  onSaveSuccess,
}: CompanyCardsProps) {
  if (isLoading) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Loading businesses...
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No businesses yet. Create your first business!
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {businesses.map((company) => (
        <CompanyCard
          key={company.id}
          company={company}
          onDeleteRequested={onDeleteRequested}
          onSaveSuccess={onSaveSuccess}
        />
      ))}
    </div>
  );
}
