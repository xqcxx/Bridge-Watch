import { createContext } from "react";

export type ThemeName = "light" | "dark";
export type ThemeMode = ThemeName | "system";

export interface ThemeContextValue {
  mode: ThemeMode;
  resolvedTheme: ThemeName;
  setMode: (mode: ThemeMode) => void;
  toggle: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);
