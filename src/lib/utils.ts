import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const base64UrlDecode = (value: string) => {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), "=");
  if (typeof window !== "undefined" && typeof window.atob === "function") {
    return window.atob(padded);
  }
  return Buffer.from(padded, "base64").toString("binary");
};

export type DecodedJwtPayload = Record<string, unknown> & {
  user_id?: string | number;
  email?: string;
  first_name?: string;
  last_name?: string;
  role?: string;
};

export const decodeJwtPayload = (token: string): DecodedJwtPayload | null => {
  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }
    const decoded = base64UrlDecode(payload);
    return JSON.parse(decoded) as DecodedJwtPayload;
  } catch {
    return null;
  }
};
