"use client";

import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function TaskCardSkeleton() {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-card space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-full" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex items-center justify-between pt-1">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-7 w-7 rounded-full" />
      </div>
    </div>
  );
}

export function ColumnSkeleton() {
  return (
    <div className="w-[320px] flex-shrink-0 space-y-3">
      <Skeleton className="h-10 w-48 mb-4" />
      <TaskCardSkeleton />
      <TaskCardSkeleton />
      <TaskCardSkeleton />
    </div>
  );
}

export function KanbanSkeleton() {
  return (
    <div className="flex gap-6 p-6">
      <ColumnSkeleton />
      <ColumnSkeleton />
      <ColumnSkeleton />
    </div>
  );
}
