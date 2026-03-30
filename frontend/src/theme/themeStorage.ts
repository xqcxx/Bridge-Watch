import type { ThemeMode, ThemeName } from "./ThemeContext";

export const THEME_STORAGE_KEY = "bridge-watch:theme:v1";

export function getSystemTheme(): ThemeName {
  if (typeof window === "undefined") return "dark";
  return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}

export function normalizeMode(value: string | null): ThemeMode {
  if (value === "light" || value === "dark" || value === "system") return value;
  return "system";
}

export function resolveTheme(mode: ThemeMode): ThemeName {
  return mode === "system" ? getSystemTheme() : mode;
}

export function applyThemeToDocument(mode: ThemeMode) {
  const resolved = resolveTheme(mode);
  const root = document.documentElement;

  if (resolved === "dark") root.classList.add("dark");
  else root.classList.remove("dark");

  root.setAttribute("data-theme", resolved);
  root.setAttribute("data-theme-mode", mode);
}
