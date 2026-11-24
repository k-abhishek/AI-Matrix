/**
 * Format seconds into a human-readable uptime string "Xh Xm Xs"
 */
export function formatUptime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(" ");
}

/**
 * Format an ISO date string to a human-readable string with 12-hour format and local timezone
 * Example: "13 Nov 2026, 02:02:41 AM IST"
 */
export function formatDate(isoString?: string | null): string {
  if (!isoString) return "-";
  const date = new Date(isoString);
  if (isNaN(date.getTime())) return "-";

  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });
}

/**
 * Format duration between two timestamps into a human-readable string (e.g. "9m 29s", "45s", "1h 12m")
 */
export function formatDuration(
  startIso?: string | null,
  endIso?: string | null,
): string | null {
  if (!startIso) return null;
  const start = new Date(startIso).getTime();
  const end = endIso ? new Date(endIso).getTime() : Date.now();
  if (isNaN(start) || isNaN(end) || end < start) return null;

  const diffSec = Math.floor((end - start) / 1000);
  if (diffSec < 1) return "< 1s";
  const h = Math.floor(diffSec / 3600);
  const m = Math.floor((diffSec % 3600) / 60);
  const s = diffSec % 60;

  const parts: string[] = [];
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  if (s > 0 || parts.length === 0) parts.push(`${s}s`);

  return parts.join(" ");
}

/**
 * Format raw bytes into human-readable representation (B, KB, MB, GB, TB)
 */
export function formatBytes(bytes: number | bigint = 0): string {
  const num = typeof bytes === "bigint" ? Number(bytes) : bytes;
  if (!num || num <= 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(num) / Math.log(k));
  return `${parseFloat((num / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Map run status to standard badge color variants
 */
export function getStatusBadgeVariant(
  status?: string | null,
): "success" | "warning" | "error" | "info" {
  switch (status?.toUpperCase()) {
    case "COMPLETED":
      return "success";
    case "RUNNING":
    case "PENDING":
      return "info";
    case "PARTIALLY_COMPLETED":
    case "CANCELLED":
      return "warning";
    case "FAILED":
    case "INTERRUPTED":
      return "error";
    default:
      return "info";
  }
}

/**
 * Join truthy class names into a single string
 */
export function classNames(...classes: string[]): string {
  return classes.filter(Boolean).join(" ");
}
