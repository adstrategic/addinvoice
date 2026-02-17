"use client";

import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion } from "framer-motion";
import { LayoutDashboard, Sparkles, ArrowLeft } from "lucide-react";
import { TOUR_REGISTRY } from "./tour-config";

type TourSelectionModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectTour: (tourType: string) => void;
};

export function TourSelectionModal({
  open,
  onOpenChange,
  onSelectTour,
}: TourSelectionModalProps) {
  const [view, setView] = useState<"main" | "modules">("main");

  const handleSelectGeneral = () => {
    onSelectTour("general");
    onOpenChange(false);
    setView("main");
  };

  const handleSelectModule = (moduleId: string) => {
    onSelectTour(moduleId);
    onOpenChange(false);
    setView("main");
  };

  const handleBack = () => {
    setView("main");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] p-0 flex flex-col overflow-hidden">
        {view === "main" ? (
          <>
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
              <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                Choose Your Tour
              </DialogTitle>
              <DialogDescription className="text-base">
                Select how you'd like to explore AddInvoices
              </DialogDescription>
            </DialogHeader>

            <div className="p-6 grid gap-4 md:grid-cols-2 overflow-y-auto min-h-0 flex-1">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card
                  className="cursor-pointer border-2 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 h-full group"
                  onClick={handleSelectGeneral}
                >
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Sparkles className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">General Tour</CardTitle>
                    <CardDescription className="text-base">
                      A complete walkthrough of AddInvoices
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Perfect for first-time users. This tour covers the
                      dashboard, key features, and navigation to help you get
                      started quickly.
                    </p>
                    <Button className="w-full mt-4" size="lg">
                      Start General Tour
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <Card
                  className="cursor-pointer border-2 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10 transition-all duration-300 h-full group"
                  onClick={() => setView("modules")}
                >
                  <CardHeader>
                    <div className="h-12 w-12 rounded-lg bg-primary/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <LayoutDashboard className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">
                      Module-Specific Tour
                    </CardTitle>
                    <CardDescription className="text-base">
                      Learn about a specific feature
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Choose a specific module to learn about. Great for
                      exploring new features or refreshing your knowledge on a
                      particular area.
                    </p>
                    <Button className="w-full mt-4" size="lg" variant="outline">
                      Choose Module
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="px-6 pt-6 pb-4 border-b border-border shrink-0">
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleBack}
                  className="hover:bg-secondary"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <DialogTitle className="text-2xl font-bold">
                    Select a Module
                  </DialogTitle>
                  <DialogDescription className="text-base">
                    Choose which feature you'd like to learn about
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <ScrollArea className="flex-1 min-h-0 px-6 py-4">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 pb-4">
                {TOUR_REGISTRY.map((module, index) => {
                  const Icon = module.icon;
                  return (
                    <motion.div
                      key={module.id}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ duration: 0.2, delay: index * 0.03 }}
                    >
                      <Card
                        className="cursor-pointer hover:border-primary/50 hover:shadow-md hover:shadow-primary/10 transition-all duration-300 group h-full"
                        onClick={() => handleSelectModule(module.id)}
                      >
                        <CardHeader className="pb-3">
                          <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <Icon className="h-5 w-5 text-primary" />
                          </div>
                          <CardTitle className="text-base">
                            {module.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-xs text-muted-foreground">
                            {module.description}
                          </p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  );
                })}
              </div>
            </ScrollArea>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
