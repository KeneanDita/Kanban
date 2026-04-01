import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isPast } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return "";
  return format(new Date(date), "MMM d, yyyy");
}

export function formatRelativeTime(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function isOverdue(deadline: string | null | undefined): boolean {
  if (!deadline) return false;
  return isPast(new Date(deadline));
}

export const PRIORITY_CONFIG = {
  low: {
    label: "Low",
    className: "badge-low",
    color: "#34D399",
    emoji: "🟢",
  },
  medium: {
    label: "Medium",
    className: "badge-medium",
    color: "#FBBF24",
    emoji: "🟡",
  },
  high: {
    label: "High",
    className: "badge-high",
    color: "#F472B6",
    emoji: "🔴",
  },
} as const;

export const COLUMN_GRADIENTS: Record<string, string> = {
  Todo: "from-pastel-purple to-white",
  "In Progress": "from-pastel-blue to-white",
  Done: "from-pastel-green to-white",
};

export const COLUMN_ACCENT: Record<string, string> = {
  Todo: "#A78BFA",
  "In Progress": "#60A5FA",
  Done: "#34D399",
};

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function randomGradient(seed: string): string {
  const gradients = [
    "from-violet-400 to-pink-400",
    "from-blue-400 to-cyan-400",
    "from-emerald-400 to-teal-400",
    "from-orange-400 to-pink-400",
    "from-indigo-400 to-purple-400",
    "from-rose-400 to-orange-400",
  ];
  const idx = seed.charCodeAt(0) % gradients.length;
  return gradients[idx];
}
