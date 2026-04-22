import { useMemo } from "react";
import { useLocalStorageState } from "./useLocalStorageState";

export type DashboardWidgetId = "quick-stats" | "asset-health" | "bridge-status";
export type DashboardWidgetSize = "small" | "medium" | "large";

export interface DashboardWidgetDefinition {
  id: DashboardWidgetId;
  title: string;
  description: string;
}

export interface DashboardWidgetConfig {
  id: DashboardWidgetId;
  enabled: boolean;
  size: DashboardWidgetSize;
}

interface DashboardLayout {
  widgets: DashboardWidgetConfig[];
}

const STORAGE_KEY = "bridge-watch:dashboard-layout:v1";

const widgetDefinitions: DashboardWidgetDefinition[] = [
  {
    id: "quick-stats",
    title: "Quick Stats",
    description: "Portfolio-level KPIs and health distribution snapshots.",
  },
  {
    id: "asset-health",
    title: "Asset Health",
    description: "Live scorecards for monitored bridged assets.",
  },
  {
    id: "bridge-status",
    title: "Bridge Status",
    description: "Current bridge availability and anomaly visibility.",
  },
];

const defaultLayout: DashboardLayout = {
  widgets: [
    { id: "quick-stats", enabled: true, size: "medium" },
    { id: "asset-health", enabled: true, size: "large" },
    { id: "bridge-status", enabled: true, size: "medium" },
  ],
};

const presets: Record<string, DashboardLayout> = {
  default: defaultLayout,
  compact: {
    widgets: [
      { id: "quick-stats", enabled: true, size: "small" },
      { id: "asset-health", enabled: true, size: "medium" },
      { id: "bridge-status", enabled: false, size: "small" },
    ],
  },
  operations: {
    widgets: [
      { id: "bridge-status", enabled: true, size: "large" },
      { id: "asset-health", enabled: true, size: "medium" },
      { id: "quick-stats", enabled: true, size: "small" },
    ],
  },
  analyst: {
    widgets: [
      { id: "asset-health", enabled: true, size: "large" },
      { id: "quick-stats", enabled: true, size: "medium" },
      { id: "bridge-status", enabled: true, size: "medium" },
    ],
  },
};

function sanitizeLayout(layout: DashboardLayout): DashboardLayout {
  const seen = new Set<DashboardWidgetId>();
  const normalized: DashboardWidgetConfig[] = [];

  for (const widget of layout.widgets) {
    if (seen.has(widget.id)) continue;
    seen.add(widget.id);
    normalized.push({
      id: widget.id,
      enabled: Boolean(widget.enabled),
      size: widget.size,
    });
  }

  for (const definition of widgetDefinitions) {
    if (!seen.has(definition.id)) {
      normalized.push({
        id: definition.id,
        enabled: true,
        size: "medium",
      });
    }
  }

  return { widgets: normalized };
}

export function useDashboardLayout() {
  const [layout, setLayout] = useLocalStorageState<DashboardLayout>(STORAGE_KEY, defaultLayout);

  const normalizedLayout = useMemo(() => sanitizeLayout(layout), [layout]);

  const enabledWidgets = useMemo(
    () => normalizedLayout.widgets.filter((widget) => widget.enabled),
    [normalizedLayout],
  );

  function setWidgetEnabled(id: DashboardWidgetId, enabled: boolean): void {
    setLayout((prev) => ({
      widgets: sanitizeLayout(prev).widgets.map((widget) =>
        widget.id === id ? { ...widget, enabled } : widget,
      ),
    }));
  }

  function setWidgetSize(id: DashboardWidgetId, size: DashboardWidgetSize): void {
    setLayout((prev) => ({
      widgets: sanitizeLayout(prev).widgets.map((widget) =>
        widget.id === id ? { ...widget, size } : widget,
      ),
    }));
  }

  function reorderWidgets(idsInOrder: DashboardWidgetId[]): void {
    setLayout((prev) => {
      const current = sanitizeLayout(prev).widgets;
      const byId = new Map(current.map((widget) => [widget.id, widget]));
      const reordered = idsInOrder
        .map((id) => byId.get(id))
        .filter((widget): widget is DashboardWidgetConfig => Boolean(widget));

      for (const widget of current) {
        if (!idsInOrder.includes(widget.id)) {
          reordered.push(widget);
        }
      }

      return { widgets: reordered };
    });
  }

  function applyPreset(name: keyof typeof presets): void {
    setLayout(presets[name]);
  }

  function resetToDefault(): void {
    setLayout(defaultLayout);
  }

  function exportLayout(): string {
    return JSON.stringify(sanitizeLayout(normalizedLayout), null, 2);
  }

  function importLayout(payload: string): { ok: boolean; message: string } {
    try {
      const parsed = JSON.parse(payload) as DashboardLayout;
      if (!parsed || !Array.isArray(parsed.widgets)) {
        return { ok: false, message: "Invalid layout payload" };
      }
      setLayout(sanitizeLayout(parsed));
      return { ok: true, message: "Layout imported successfully" };
    } catch {
      return { ok: false, message: "Unable to parse layout JSON" };
    }
  }

  return {
    layout: normalizedLayout,
    widgetDefinitions,
    enabledWidgets,
    setWidgetEnabled,
    setWidgetSize,
    reorderWidgets,
    applyPreset,
    resetToDefault,
    exportLayout,
    importLayout,
  };
}
