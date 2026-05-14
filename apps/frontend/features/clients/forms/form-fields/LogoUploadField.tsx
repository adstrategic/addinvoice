"use client";

import { useRef } from "react";
import { Building2, Camera, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface LogoUploadFieldProps {
  logoDisplayUrl: string | null;
  clientName: string;
  onFileSelect: (file: File) => void;
  isUploading: boolean;
}

function getInitials(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function LogoUploadField({
  logoDisplayUrl,
  clientName,
  onFileSelect,
  isUploading,
}: LogoUploadFieldProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    if (!isUploading) {
      inputRef.current?.click();
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
      e.target.value = "";
    }
  };

  const initials = getInitials(clientName);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="relative group cursor-pointer"
        onClick={handleClick}
        title="Click to upload logo"
      >
        <Avatar className="h-20 w-20 ring-2 ring-border group-hover:ring-primary transition-all">
          {logoDisplayUrl && (
            <AvatarImage
              src={logoDisplayUrl}
              alt="Client logo"
              className="object-contain"
            />
          )}
          <AvatarFallback className="bg-muted text-muted-foreground text-xl">
            {isUploading ? (
              <Loader2 className="h-6 w-6 animate-spin" />
            ) : initials ? (
              initials
            ) : (
              <Building2 className="h-8 w-8" />
            )}
          </AvatarFallback>
        </Avatar>

        {!isUploading && (
          <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
            <Camera className="h-6 w-6 text-white" />
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        {isUploading ? "Uploading…" : "Click to upload logo (optional)"}
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
