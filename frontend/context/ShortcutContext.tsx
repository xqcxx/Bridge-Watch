import React, { createContext, useContext, useState, useEffect } from "react";

export type ShortcutCategory = "Navigation" | "Actions" | "General";

export interface Shortcut {
  id: string;
  keys: string; // e.g., "g h" or "/"
  label: string;
  category: ShortcutCategory;
  description?: string;
}

interface ShortcutContextType {
  shortcuts: Shortcut[];
  updateShortcut: (id: string, newKeys: string) => void;
  resetToDefaults: () => void;
  isHelpOpen: boolean;
  setHelpOpen: (open: boolean) => void;
}

const DEFAULT_SHORTCUTS: Shortcut[] = [
  { id: "nav-home", keys: "g h", label: "Go to Home", category: "Navigation" },
  {
    id: "nav-bridges",
    keys: "g b",
    label: "Go to Bridges",
    category: "Navigation",
  },
  {
    id: "nav-assets",
    keys: "g a",
    label: "Go to Assets",
    category: "Navigation",
  },
  {
    id: "nav-liquidity",
    keys: "g l",
    label: "Go to Liquidity",
    category: "Navigation",
  },
  { id: "action-search", keys: "/", label: "Search", category: "Actions" },
  {
    id: "action-refresh",
    keys: "r",
    label: "Refresh Data",
    category: "Actions",
  },
  { id: "action-theme", keys: "t", label: "Toggle Theme", category: "Actions" },
  { id: "general-help", keys: "?", label: "Show Help", category: "General" },
];

const ShortcutContext = createContext<ShortcutContextType | undefined>(
  undefined
);

const STORAGE_KEY = "sbw_user_shortcuts";

export const ShortcutProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [shortcuts, setShortcuts] = useState<Shortcut[]>(DEFAULT_SHORTCUTS);
  const [isHelpOpen, setHelpOpen] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Merge defaults with saved to handle new shortcuts in updates
        const merged = DEFAULT_SHORTCUTS.map((def) => {
          const user = parsed.find((p: Shortcut) => p.id === def.id);
          return user ? { ...def, keys: user.keys } : def;
        });
        setShortcuts(merged);
      } catch (e) {
        console.error("Failed to parse shortcuts", e);
      }
    }
  }, []);

  const updateShortcut = (id: string, newKeys: string) => {
    const updated = shortcuts.map((s) =>
      s.id === id ? { ...s, keys: newKeys } : s
    );
    setShortcuts(updated);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  };

  const resetToDefaults = () => {
    setShortcuts(DEFAULT_SHORTCUTS);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <ShortcutContext.Provider
      value={{
        shortcuts,
        updateShortcut,
        resetToDefaults,
        isHelpOpen,
        setHelpOpen,
      }}
    >
      {children}
    </ShortcutContext.Provider>
  );
};

export const useShortcuts = () => {
  const context = useContext(ShortcutContext);
  if (!context)
    throw new Error("useShortcuts must be used within ShortcutProvider");
  return context;
};
