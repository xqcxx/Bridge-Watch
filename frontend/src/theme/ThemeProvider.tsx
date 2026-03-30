import { useCallback, useEffect, useMemo, useState } from "react";
import { ThemeContext, type ThemeMode, type ThemeName } from "./ThemeContext";
import {
  THEME_STORAGE_KEY,
  applyThemeToDocument,
  getSystemTheme,
  normalizeMode,
  resolveTheme,
} from "./themeStorage";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(() => {
    try {
      return normalizeMode(window.localStorage.getItem(THEME_STORAGE_KEY));
    } catch {
      return "system";
    }
  });

  const [systemTheme, setSystemTheme] = useState<ThemeName>(() => getSystemTheme());

  useEffect(() => {
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mq) return;

    const onChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? "dark" : "light");
    };

    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  const resolvedTheme = useMemo<ThemeName>(() => {
    return mode === "system" ? systemTheme : mode;
  }, [mode, systemTheme]);

  useEffect(() => {
    applyThemeToDocument(mode);

    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch {
      // ignore
    }
  }, [mode]);

  const setMode = useCallback((next: ThemeMode) => {
    setModeState(next);
  }, []);

  const toggle = useCallback(() => {
    setModeState((prev) => {
      const currentResolved = resolveTheme(prev);
      return currentResolved === "dark" ? "light" : "dark";
    });
  }, []);

  const value = useMemo(
    () => ({
      mode,
      resolvedTheme,
      setMode,
      toggle,
    }),
    [mode, resolvedTheme, setMode, toggle]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
