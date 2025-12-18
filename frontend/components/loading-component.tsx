import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "./ui/card";

interface LoadingComponentProps {
  variant?: "default" | "table" | "card" | "form" | "list" | "dashboard";
  className?: string;
  rows?: number;
  showHeader?: boolean;
  showAvatar?: boolean;
  showActions?: boolean;
}

export function LoadingComponent({
  variant = "default",
  className,
  rows = 3,
  showHeader = false,
  showAvatar = false,
  showActions = false,
}: LoadingComponentProps) {
  const renderSkeletonRows = () => {
    return Array.from({ length: rows }, (_, index) => (
      <div key={index} className="flex items-center space-x-4 py-3">
        {showAvatar && <Skeleton className="h-10 w-10 rounded-full" />}
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
        {showActions && (
          <div className="flex space-x-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-8 w-16" />
          </div>
        )}
      </div>
    ));
  };

  const renderTableSkeleton = () => (
    <div className="space-y-3">
      {showHeader && (
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>
      )}
      <div className="space-y-2">
        {Array.from({ length: rows }, (_, index) => (
          <div key={index} className="flex items-center space-x-4 py-2">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-4 w-16" />
            {showActions && (
              <div className="flex space-x-2 ml-auto">
                <Skeleton className="h-6 w-6" />
                <Skeleton className="h-6 w-6" />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderCardSkeleton = () => (
    <div className="space-y-4">
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
      <div className="flex justify-between items-center pt-2">
        <Skeleton className="h-8 w-20" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );

  const renderFormSkeleton = () => (
    <div className="space-y-6">
      {Array.from({ length: rows }, (_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </div>
      ))}
      <div className="flex space-x-3 pt-4">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );

  const renderListSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: rows }, (_, index) => (
        <div
          key={index}
          className="flex items-center space-x-3 p-3 border rounded-lg"
        >
          {showAvatar && <Skeleton className="h-12 w-12 rounded-full" />}
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </div>
          {showActions && (
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-16" />
              <Skeleton className="h-8 w-16" />
            </div>
          )}
        </div>
      ))}
    </div>
  );

  const renderDashboardSkeleton = () => (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="p-4 border rounded-lg">
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-3 w-24 mt-2" />
          </div>
        ))}
      </div>

      {/* Chart area */}
      <div className="p-4 border rounded-lg">
        <Skeleton className="h-6 w-32 mb-4" />
        <Skeleton className="h-64 w-full" />
      </div>

      {/* Recent activity */}
      <div className="p-4 border rounded-lg">
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="space-y-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div key={index} className="flex items-center space-x-3">
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
              <Skeleton className="h-3 w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (variant) {
      case "table":
        return renderTableSkeleton();
      case "card":
        return renderCardSkeleton();
      case "form":
        return renderFormSkeleton();
      case "list":
        return renderListSkeleton();
      case "dashboard":
        return renderDashboardSkeleton();
      default:
        return renderSkeletonRows();
    }
  };

  return (
    <div className={cn("w-full animate-pulse", className)}>
      {renderContent()}
    </div>
  );
}

// Componente específico para fallback de Suspense
export function SuspenseFallback() {
  return (
    <Card className="flex items-center m-4 justify-center min-h-[200px] w-auto">
      <CardContent className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
        <Skeleton className="h-4 w-32 mx-auto" />
      </CardContent>
    </Card>
  );
}

// Componente para páginas completas
export function PageLoading() {
  return (
    <div className="min-h-screen p-6 space-y-6">
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 border rounded-lg">
            <Skeleton className="h-6 w-48 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-4 border rounded-lg">
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="flex items-center space-x-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoadingComponent;
