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

const toCamelCase = (str: string): string => {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
}

export const camelCaseKeys = (obj: unknown): unknown => {
  if (Array.isArray(obj)) return obj.map(camelCaseKeys)
  if (obj !== null && typeof obj === "object") {
    return Object.fromEntries(
      Object.entries(obj).map(([key, value]) => [toCamelCase(key), camelCaseKeys(value)])
    )
  }
  return obj
}

export const ucFirst = (str: string) => str.charAt(0).toUpperCase() + str.slice(1)
