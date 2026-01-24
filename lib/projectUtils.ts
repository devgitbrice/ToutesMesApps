import { useEffect, useState } from "react";

// ✅ Hook pour éviter de saturer l'API
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export function normalizeUrl(raw: string) {
  const v = (raw ?? "").trim();
  if (!v) return "";
  return /^https?:\/\//i.test(v) ? v : `https://${v}`;
}

export function buildTtsText(title: string, description: string) {
  const t = (title ?? "").toString().trim();
  const d = (description ?? "").toString().trim();
  return [t, d].filter(Boolean).join(". ").slice(0, 1500);
}