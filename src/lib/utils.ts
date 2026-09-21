import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getErrorMessage(err: any, fallback = "An unexpected error occurred"): string {
  if (!err) return fallback;
  const detail = err?.response?.data?.detail;
  if (!detail) {
    return err?.response?.data?.message || err?.message || fallback;
  }
  if (typeof detail === "string") {
    return detail;
  }
  if (Array.isArray(detail)) {
    return detail
      .map((d: any) => {
        if (typeof d === "string") return d;
        const field = Array.isArray(d.loc)
          ? d.loc.filter((l: any) => l !== "body").join(".")
          : "";
        return field ? `${field}: ${d.msg}` : d.msg || JSON.stringify(d);
      })
      .join(", ");
  }
  if (typeof detail === "object") {
    return detail.msg || detail.message || JSON.stringify(detail);
  }
  return String(detail);
}
