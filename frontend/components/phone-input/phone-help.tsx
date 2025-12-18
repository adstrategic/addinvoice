import React from "react";
import { Info } from "lucide-react";

interface PhoneHelpProps {
  className?: string;
}

export const PhoneHelp: React.FC<PhoneHelpProps> = ({ className = "" }) => {
  return (
    <div
      className={`flex items-center gap-2 text-xs text-muted-foreground ${className}`}
    >
      <Info className="h-3 w-3" />
      <span>Enter the number with country code. E.g.: +57 301 123 4567</span>
    </div>
  );
};
