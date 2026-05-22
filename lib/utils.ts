import { clsx, type ClassValue } from "clsx";

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatDate(input: string | Date): string {
  const d = typeof input === "string" ? new Date(input) : input;
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function daysUntil(input: string | Date): number {
  const d = typeof input === "string" ? new Date(input) : input;
  const ms = d.getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
}

export function urgencyForDays(days: number): "low" | "medium" | "high" | "overdue" {
  if (days < 0) return "overdue";
  if (days <= 3) return "high";
  if (days <= 10) return "medium";
  return "low";
}
