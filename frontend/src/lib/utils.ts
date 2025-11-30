import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(value: unknown): string {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  }
  const n = Number(value);
  if (!Number.isNaN(n)) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(n);
  }
  return "—";
}

export function formatWeight(value: unknown): string {
  if (typeof value === "number" && !Number.isNaN(value)) {
    return `${value.toLocaleString()} lb`;
  }
  const n = Number(value);
  if (!Number.isNaN(n)) {
    return `${n.toLocaleString()} lb`;
  }
  return "—";
}

export function formatDate(dateString: string | undefined): string {
  if (!dateString) return "—";
  try {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(dateString));
  } catch {
    return dateString;
  }
}
