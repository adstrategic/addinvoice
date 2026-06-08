"use client";

import Link from "next/link";
import { ArrowRight, FileCheck, ScrollText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ProposalFlowHintProps {
  className?: string;
}

export function ProposalFlowHint({ className }: ProposalFlowHintProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-violet-500/20 bg-violet-500/9 px-4 py-4 sm:px-5 sm:py-4",
        className,
      )}
      data-tour-id="proposals-flow-hint"
    >
      <p className="text-sm font-semibold text-violet-600 dark:text-violet-400">
        Proposals come from accepted estimates
      </p>
      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
        You don&apos;t create proposals here directly. Send an estimate to the
        person you&apos;re working with on the job. Once they&apos;re on board,
        convert it to a proposal — that&apos;s the document you send to your
        client.
      </p>

      <ol className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3 text-xs sm:text-sm">
        <li className="flex items-center gap-2 text-muted-foreground">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-orange-500/10 text-orange-500">
            <FileCheck className="h-4 w-4" aria-hidden />
          </span>
          <span>Send estimate to your contact</span>
        </li>
        <ArrowRight
          className="hidden sm:block h-4 w-4 shrink-0 text-muted-foreground/50"
          aria-hidden
        />
        <li className="flex items-center gap-2 text-muted-foreground">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-500">
            <ScrollText className="h-4 w-4" aria-hidden />
          </span>
          <span>Send proposal to your client</span>
        </li>
      </ol>

      <Button
        asChild
        variant="outline"
        size="sm"
        className="mt-4 border-violet-500/30 text-violet-600 hover:bg-violet-500/10 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
      >
        <Link href="/estimates?status=accepted">View accepted estimates</Link>
      </Button>
    </div>
  );
}

export function ProposalEmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-violet-500/25 bg-violet-500/5 px-6 py-10 text-center">
      <ScrollText className="mx-auto mb-4 h-12 w-12 text-violet-500/70" />
      <h3 className="text-lg font-semibold text-foreground">
        No proposals yet
      </h3>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground leading-relaxed">
        Send an estimate to the person you&apos;re working with, convert it once
        they&apos;re on board, then send the proposal to your client. Your
        proposals will show up here.
      </p>
      <Button asChild className="mt-6" variant="default">
        <Link href="/estimates">Go to Estimates</Link>
      </Button>
    </div>
  );
}
