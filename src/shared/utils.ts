import { MIN_MEANINGFUL_LENGTH } from "./constants";

export function normalizeText(value: string, max = 160): string {
  return value.replace(/\s+/g, " ").trim().toLowerCase().slice(0, max);
}

export function hasMeaningfulText(value: string): boolean {
  return value.trim().length >= MIN_MEANINGFUL_LENGTH;
}

export function safePageLocation(locationLike: Pick<Location, "origin" | "pathname">): {
  origin: string;
  pathname: string;
} {
  return {
    origin: locationLike.origin,
    pathname: locationLike.pathname || "/"
  };
}

export function formatRelativeTime(timestamp: number, now = Date.now()): string {
  const seconds = Math.max(0, Math.floor((now - timestamp) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"} ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

export function debounce<T extends (...args: never[]) => void>(fn: T, delay: number): T & { cancel: () => void } {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const wrapped = ((...args: never[]) => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  }) as T & { cancel: () => void };
  wrapped.cancel = () => {
    if (timer !== undefined) clearTimeout(timer);
  };
  return wrapped;
}

export function createElement<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  text?: string,
  className?: string
): HTMLElementTagNameMap[K] {
  const element = document.createElement(tag);
  if (text !== undefined) element.textContent = text;
  if (className !== undefined) element.className = className;
  return element;
}
