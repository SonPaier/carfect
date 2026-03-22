import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Joins street and city into a single display string, e.g. "ul. Kwiatowa 1, Warszawa". */
export function formatAddress(street: string | null, city: string | null): string {
  return [street, city].filter(Boolean).join(', ');
}
