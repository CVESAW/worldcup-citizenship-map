import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names, resolving conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a euro amount compactly, e.g. 1_230_000_000 -> "€1.23bn". */
export function formatEuros(n: number): string {
  if (!n || n <= 0) return "—";
  if (n >= 1e9) return `€${(n / 1e9).toFixed(2)}bn`;
  if (n >= 1e6) return `€${Math.round(n / 1e6)}m`;
  if (n >= 1e3) return `€${Math.round(n / 1e3)}k`;
  return `€${n}`;
}

/** Case/diacritic-insensitive normalization used by global search. */
export function normalize(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim();
}
