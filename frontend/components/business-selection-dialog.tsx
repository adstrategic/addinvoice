"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Building2 } from "lucide-react";
import { BusinessResponse } from "@/features/businesses";

type BusinessSelectionDialogProps = {
  open: boolean;
  businesses: BusinessResponse[];
  onSelect: (business: BusinessResponse) => void;
  onOpenChange: (open: boolean) => void;
};

export function BusinessSelectionDialog({
  open,
  businesses,
  onSelect,
  onOpenChange,
}: BusinessSelectionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Select Business</DialogTitle>
          <DialogDescription>
            Choose which business to use for this invoice. This selection is
            required.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {businesses.length > 0 ? (
            <>
              <div className="pt-4">
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Your Businesses
                </h3>
              </div>

              {businesses.map((business) => (
                <Card
                  key={business.id}
                  className="bg-card border-2 border-border hover:border-primary/50 transition-colors cursor-pointer"
                  onClick={() => onSelect(business)}
                >
                  <CardContent className="p-6">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                        {business.logo ? (
                          <img
                            src={business.logo || "/placeholder.svg"}
                            alt={business.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <Building2 className="h-8 w-8 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-lg text-foreground truncate">
                          {business.name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate mt-1">
                          {business.email}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          NIT: {business.nit || "Not set"}
                        </p>
                        {business.address && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {business.address}
                          </p>
                        )}
                        {business.phone && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {business.phone}
                          </p>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No businesses found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Please add a business to create invoices
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
