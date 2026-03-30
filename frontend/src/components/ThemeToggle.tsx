import { useTheme } from "../theme/useTheme";

export default function ThemeToggle() {
  const { mode, resolvedTheme, toggle } = useTheme();

  const label = resolvedTheme === "dark" ? "Switch to light theme" : "Switch to dark theme";
  const isDark = resolvedTheme === "dark";
  const text = isDark ? "Dark" : "Light";

  return (
    <button
      type="button"
      onClick={toggle}
      role="switch"
      aria-checked={isDark}
      className="inline-flex items-center gap-2 rounded-full border border-stellar-border bg-stellar-card px-2 py-1 text-xs font-medium text-stellar-text-primary hover:border-stellar-blue focus:outline-none focus:ring-2 focus:ring-stellar-blue"
      aria-label={label}
      title={mode === "system" ? `Theme: ${text} (System)` : `Theme: ${text}`}
    >
      <span
        aria-hidden="true"
        className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-stellar-border transition-colors ${
          isDark ? "bg-stellar-blue" : "bg-stellar-border/60"
        }`}
      >
        <span
          aria-hidden="true"
          className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
            isDark ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </span>
      <span className="tabular-nums">{text}</span>
    </button>
  );
}
