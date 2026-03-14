import * as React from "react";
import { TabsList, TabsTrigger } from "@shared/ui";
import { cn } from "@/lib/utils";

interface AdminTabsListProps {
  children: React.ReactNode;
  className?: string;
  columns?: 2 | 3 | 4 | 5;
}

/**
 * Unified tabs list component for admin panel views.
 * Uses underline variant for clean, modern look.
 */
export const AdminTabsList = ({ children, className }: AdminTabsListProps) => {
  return (
    <TabsList
      variant="underline"
      className={cn("w-full", className)}
    >
      {children}
    </TabsList>
  );
};

interface AdminTabsTriggerProps {
  value: string;
  children: React.ReactNode;
  className?: string;
}

export const AdminTabsTrigger = ({ value, children, className }: AdminTabsTriggerProps) => {
  return (
    <TabsTrigger
      value={value}
      className={cn("gap-1.5", className)}
    >
      {children}
    </TabsTrigger>
  );
};
