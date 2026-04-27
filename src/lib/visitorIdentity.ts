const DISPLAY_NAME_KEY = "esnupi.visitor_display_name";
const GUEST_KEY = "esnupi.visitor_guest";

export function getVisitorDisplayName(): string | null {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(DISPLAY_NAME_KEY);
  const t = v?.trim();
  return t ? t : null;
}

export function setVisitorDisplayName(name: string): void {
  window.localStorage.removeItem(GUEST_KEY);
  window.localStorage.setItem(DISPLAY_NAME_KEY, name.trim());
}

export function setVisitorAsGuest(): void {
  window.localStorage.removeItem(DISPLAY_NAME_KEY);
  window.localStorage.setItem(GUEST_KEY, "1");
}

export function isVisitorGuest(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(GUEST_KEY) === "1";
}

export function hasCompletedVisitorGate(): boolean {
  if (typeof window === "undefined") return false;
  return Boolean(getVisitorDisplayName()) || isVisitorGuest();
}
