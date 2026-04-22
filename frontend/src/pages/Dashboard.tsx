import { useState, useMemo, useCallback, Suspense } from "react";
import { Link } from "react-router-dom";
import {
  DndContext,
  PointerSensor,
  KeyboardSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAssetsWithHealth, useHealthUpdater } from "../hooks/useAssets";
import { useBridges } from "../hooks/useBridges";
import { useWebSocket } from "../hooks/useWebSocket";
import { useRefreshControls } from "../hooks/useRefreshControls";
import HealthScoreCard from "../components/HealthScoreCard";
import BridgeStatusCard from "../components/BridgeStatusCard";
import QuickStatsWidget from "../components/QuickStats/QuickStatsWidget";
import OnboardingDialog from "../components/OnboardingDialog";
import RefreshControls from "../components/RefreshControls";
import WidgetGallery from "../components/dashboard/WidgetGallery";
import { SkeletonCard, ErrorBoundary } from "../components/Skeleton";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import {
  useDashboardLayout,
  type DashboardWidgetId,
} from "../hooks/useDashboardLayout";
import type {
  AssetWithHealth,
  SortField,
  SortOrder,
  FilterStatus,
  HealthScore,
} from "../types";

function getHealthStatus(score: number | null): FilterStatus {
  if (score === null) return "all";
  if (score >= 80) return "healthy";
  if (score >= 50) return "warning";
  return "critical";
}

function sortAssets(assets: AssetWithHealth[], field: SortField, order: SortOrder): AssetWithHealth[] {
  return [...assets].sort((a, b) => {
    let comparison = 0;
    if (field === "symbol") {
      comparison = a.symbol.localeCompare(b.symbol);
    } else if (field === "score") {
      const scoreA = a.health?.overallScore ?? -1;
      const scoreB = b.health?.overallScore ?? -1;
      comparison = scoreA - scoreB;
    }
    return order === "asc" ? comparison : -comparison;
  });
}

function filterAssets(assets: AssetWithHealth[], status: FilterStatus): AssetWithHealth[] {
  if (status === "all") return assets;
  return assets.filter((asset) => {
    const assetStatus = getHealthStatus(asset.health?.overallScore ?? null);
    return assetStatus === status;
  });
}

function SortableWidgetRow({
  id,
  label,
}: {
  id: DashboardWidgetId;
  label: string;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.8 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center justify-between rounded-md border border-stellar-border bg-stellar-dark px-3 py-2"
    >
      <span className="text-sm text-stellar-text-primary">{label}</span>
      <button
        type="button"
        className="rounded px-2 py-1 text-xs text-stellar-text-secondary hover:text-stellar-text-primary"
        aria-label="Drag to reorder widget"
        {...attributes}
        {...listeners}
      >
        Drag
      </button>
    </div>
  );
}

function widgetSizeClasses(size: "small" | "medium" | "large"): string {
  if (size === "small") return "lg:col-span-1";
  if (size === "large") return "lg:col-span-3";
  return "lg:col-span-2";
}

export default function Dashboard() {
  const refreshControls = useRefreshControls({
    viewId: "dashboard",
    targets: [
      { id: "assets", label: "Assets", queryKey: ["assets-with-health"] },
      { id: "bridges", label: "Bridges", queryKey: ["bridges"] },
    ],
    defaultIntervalMs: 30_000,
  });

  const {
    data: assetsData,
    isLoading: assetsLoading,
    error: assetsError,
    refetch: refetchAssets,
  } = useAssetsWithHealth({
    refetchInterval: refreshControls.preferences.autoRefreshEnabled
      ? refreshControls.preferences.refreshIntervalMs
      : false,
    refetchOnWindowFocus: refreshControls.preferences.refreshOnFocus,
  });
  const { data: bridgesData, isLoading: bridgesLoading, refetch: refetchBridges } = useBridges({
    refetchInterval: refreshControls.preferences.autoRefreshEnabled
      ? refreshControls.preferences.refreshIntervalMs
      : false,
    refetchOnWindowFocus: refreshControls.preferences.refreshOnFocus,
  });
  const { updateHealth } = useHealthUpdater();

  const [sortField, setSortField] = useState<SortField>("score");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [filterStatus, setFilterStatus] = useState<FilterStatus>("all");

  const [onboardingCompleted, setOnboardingCompleted] = useLocalStorageState(
    "bridge-watch:onboarding:v1",
    false
  );
  const [customizationOpen, setCustomizationOpen] = useState(false);
  const [layoutPayload, setLayoutPayload] = useState("");
  const [layoutMessage, setLayoutMessage] = useState<string | null>(null);
  const [onboardingOpen, setOnboardingOpen] = useState(!onboardingCompleted);

  const {
    layout,
    widgetDefinitions,
    enabledWidgets,
    setWidgetEnabled,
    setWidgetSize,
    reorderWidgets,
    applyPreset,
    resetToDefault,
    exportLayout,
    importLayout,
  } = useDashboardLayout();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleHealthUpdate = useCallback(
    (data: unknown) => {
      const healthData = data as { channel: string } & HealthScore;
      if (healthData.symbol) {
        updateHealth(healthData);
      }
    },
    [updateHealth]
  );

  useWebSocket("health-updates", handleHealthUpdate);

  const refreshTargets = [
    { id: "assets", label: "Assets", refetch: refetchAssets },
    { id: "bridges", label: "Bridges", refetch: refetchBridges },
  ];

  const processedAssets = useMemo(() => {
    if (!assetsData) return [];
    const filtered = filterAssets(assetsData, filterStatus);
    return sortAssets(filtered, sortField, sortOrder);
  }, [assetsData, filterStatus, sortField, sortOrder]);

  const statusCounts = useMemo(() => {
    if (!assetsData) return { healthy: 0, warning: 0, critical: 0 };
    return assetsData.reduce(
      (acc, asset) => {
        const status = getHealthStatus(asset.health?.overallScore ?? null);
        if (status !== "all") {
          acc[status]++;
        }
        return acc;
      },
      { healthy: 0, warning: 0, critical: 0 }
    );
  }, [assetsData]);

  const widgetMap = useMemo(
    () => new Map(widgetDefinitions.map((definition) => [definition.id, definition])),
    [widgetDefinitions],
  );

  const onWidgetDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const currentIds = layout.widgets.map((widget) => widget.id);
      const oldIndex = currentIds.indexOf(active.id as DashboardWidgetId);
      const newIndex = currentIds.indexOf(over.id as DashboardWidgetId);
      if (oldIndex < 0 || newIndex < 0) return;

      reorderWidgets(arrayMove(currentIds, oldIndex, newIndex));
    },
    [layout.widgets, reorderWidgets],
  );

  const renderedWidgets = useMemo(
    () =>
      layout.widgets
        .filter((widget) => widget.enabled)
        .map((widget) => ({
          ...widget,
          definition: widgetMap.get(widget.id),
        }))
        .filter((widget) => Boolean(widget.definition)),
    [layout.widgets, widgetMap],
  );

  return (
    <div className="space-y-8">
      <OnboardingDialog
        open={onboardingOpen}
        onClose={() => setOnboardingOpen(false)}
        onComplete={() => {
          setOnboardingCompleted(true);
          setOnboardingOpen(false);
        }}
      />

      <header>
        <h1 className="text-3xl font-bold text-stellar-text-primary">Dashboard</h1>
        <p className="mt-2 text-stellar-text-secondary">
          Real-time monitoring of bridged assets on the Stellar network
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setCustomizationOpen((value) => !value)}
            className="rounded-md border border-stellar-border px-3 py-2 text-sm text-stellar-text-secondary hover:text-stellar-text-primary"
          >
            {customizationOpen ? "Close customization" : "Customize widgets"}
          </button>
          <button
            type="button"
            onClick={() => {
              setLayoutPayload(exportLayout());
              setLayoutMessage("Layout exported to editor below.");
            }}
            className="rounded-md border border-stellar-border px-3 py-2 text-sm text-stellar-text-secondary hover:text-stellar-text-primary"
          >
            Export layout
          </button>
          <button
            type="button"
            onClick={() => {
              const result = importLayout(layoutPayload);
              setLayoutMessage(result.message);
            }}
            className="rounded-md border border-stellar-border px-3 py-2 text-sm text-stellar-text-secondary hover:text-stellar-text-primary"
          >
            Import layout
          </button>
          <button
            type="button"
            onClick={() => resetToDefault()}
            className="rounded-md border border-stellar-border px-3 py-2 text-sm text-stellar-text-secondary hover:text-stellar-text-primary"
          >
            Reset default
          </button>
        </div>
        {layoutMessage && <p className="mt-2 text-xs text-stellar-text-secondary">{layoutMessage}</p>}
        {!onboardingOpen && !onboardingCompleted && (
          <button
            type="button"
            onClick={() => setOnboardingOpen(true)}
            className="mt-4 text-sm text-stellar-blue hover:underline focus:outline-none focus:ring-2 focus:ring-stellar-blue rounded-md px-2 py-1"
          >
            Continue onboarding
          </button>
        )}
        {onboardingCompleted && (
          <button
            type="button"
            onClick={() => setOnboardingOpen(true)}
            className="mt-4 text-sm text-stellar-text-secondary hover:text-stellar-text-primary focus:outline-none focus:ring-2 focus:ring-stellar-blue rounded-md px-2 py-1"
          >
            Show onboarding
          </button>
        )}
      </header>

      {customizationOpen && (
        <section className="space-y-4 rounded-lg border border-stellar-border bg-stellar-card p-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-medium text-stellar-text-primary">Preset layouts</p>
            <button
              type="button"
              onClick={() => applyPreset("default")}
              className="rounded-md border border-stellar-border px-2 py-1 text-xs text-stellar-text-secondary"
            >
              Default
            </button>
            <button
              type="button"
              onClick={() => applyPreset("compact")}
              className="rounded-md border border-stellar-border px-2 py-1 text-xs text-stellar-text-secondary"
            >
              Compact
            </button>
            <button
              type="button"
              onClick={() => applyPreset("operations")}
              className="rounded-md border border-stellar-border px-2 py-1 text-xs text-stellar-text-secondary"
            >
              Operations
            </button>
            <button
              type="button"
              onClick={() => applyPreset("analyst")}
              className="rounded-md border border-stellar-border px-2 py-1 text-xs text-stellar-text-secondary"
            >
              Analyst
            </button>
          </div>

          <WidgetGallery
            definitions={widgetDefinitions}
            layout={layout.widgets}
            onToggle={setWidgetEnabled}
            onResize={setWidgetSize}
          />

          <div className="rounded-lg border border-stellar-border bg-stellar-dark p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-stellar-text-secondary">
              Drag to reorder
            </h3>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onWidgetDragEnd}>
              <SortableContext items={layout.widgets.map((widget) => widget.id)} strategy={verticalListSortingStrategy}>
                <div className="mt-3 space-y-2">
                  {layout.widgets.map((widget) => (
                    <SortableWidgetRow
                      key={widget.id}
                      id={widget.id}
                      label={widgetMap.get(widget.id)?.title ?? widget.id}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>

          <label htmlFor="layout-json" className="block text-xs text-stellar-text-secondary">
            Layout import/export payload
          </label>
          <textarea
            id="layout-json"
            value={layoutPayload}
            onChange={(event) => setLayoutPayload(event.target.value)}
            rows={5}
            className="w-full rounded-md border border-stellar-border bg-stellar-dark px-3 py-2 text-xs text-stellar-text-primary focus:outline-none focus:ring-2 focus:ring-stellar-blue"
          />
        </section>
      )}

      <RefreshControls
        autoRefreshEnabled={refreshControls.preferences.autoRefreshEnabled}
        onAutoRefreshEnabledChange={refreshControls.setAutoRefreshEnabled}
        refreshIntervalMs={refreshControls.preferences.refreshIntervalMs}
        onRefreshIntervalChange={refreshControls.setRefreshIntervalMs}
        refreshOnFocus={refreshControls.preferences.refreshOnFocus}
        onRefreshOnFocusChange={refreshControls.setRefreshOnFocus}
        targets={refreshTargets}
        selectedTargetIds={refreshControls.preferences.selectedTargetIds}
        onSelectedTargetIdsChange={refreshControls.setSelectedTargetIds}
        onRefresh={refreshControls.refreshNow}
        onCancelRefresh={refreshControls.cancelRefresh}
        isRefreshing={refreshControls.isRefreshing}
        lastUpdatedAt={refreshControls.lastUpdatedAt}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {renderedWidgets.some((widget) => widget.id === "quick-stats") && (
          <section className={widgetSizeClasses(layout.widgets.find((widget) => widget.id === "quick-stats")?.size ?? "medium")}> 
            <QuickStatsWidget
              assets={assetsData ?? []}
              bridges={bridgesData?.bridges ?? []}
              isLoading={assetsLoading || bridgesLoading}
            />
          </section>
        )}

        {renderedWidgets.some((widget) => widget.id === "asset-health") && (
          <section
            aria-labelledby="asset-health-heading"
            className={widgetSizeClasses(layout.widgets.find((widget) => widget.id === "asset-health")?.size ?? "large")}
          >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <h2 id="asset-health-heading" className="text-xl font-semibold text-stellar-text-primary">
            Asset Health
          </h2>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="filter-status" className="sr-only">
                Filter by status
              </label>
              <select
                id="filter-status"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as FilterStatus)}
                className="bg-stellar-card border border-stellar-border rounded-lg px-3 py-2 text-sm text-stellar-text-primary focus:outline-none focus:ring-2 focus:ring-stellar-blue"
              >
                <option value="all">All Assets</option>
                <option value="healthy">Healthy ({statusCounts.healthy})</option>
                <option value="warning">Warning ({statusCounts.warning})</option>
                <option value="critical">Critical ({statusCounts.critical})</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <label htmlFor="sort-field" className="sr-only">
                Sort by
              </label>
              <select
                id="sort-field"
                value={sortField}
                onChange={(e) => setSortField(e.target.value as SortField)}
                className="bg-stellar-card border border-stellar-border rounded-lg px-3 py-2 text-sm text-stellar-text-primary focus:outline-none focus:ring-2 focus:ring-stellar-blue"
              >
                <option value="score">Sort by Score</option>
                <option value="symbol">Sort by Name</option>
              </select>

              <button
                type="button"
                onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
                className="bg-stellar-card border border-stellar-border rounded-lg px-3 py-2 text-sm text-stellar-text-primary hover:bg-stellar-border focus:outline-none focus:ring-2 focus:ring-stellar-blue"
                aria-label={`Sort ${sortOrder === "asc" ? "descending" : "ascending"}`}
              >
                {sortOrder === "asc" ? "↑" : "↓"}
              </button>
            </div>
          </div>
        </div>

        <ErrorBoundary onRetry={() => window.location.reload()}>
          <Suspense
            fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <SkeletonCard key={i} rows={4} ariaLabel={`Loading asset ${i}`} />
                ))}
              </div>
            }
          >
            {assetsError ? (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 text-center" role="alert">
                <p className="text-red-400 font-medium">Failed to load asset data</p>
                <p className="text-sm text-red-400/80 mt-1">Please check your connection and try again.</p>
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="mt-3 px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-400"
                >
                  Retry
                </button>
              </div>
            ) : assetsLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5].map((i) => (
                  <SkeletonCard key={i} rows={5} ariaLabel={`Loading asset ${i}`} />
                ))}
              </div>
            ) : processedAssets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {processedAssets.map((asset) => (
                  <Link
                    key={asset.symbol}
                    to={`/assets/${asset.symbol}`}
                    className="block focus:outline-none focus:ring-2 focus:ring-stellar-blue rounded-lg"
                  >
                    <HealthScoreCard
                      symbol={asset.symbol}
                      name={asset.name}
                      overallScore={asset.health?.overallScore ?? null}
                      factors={asset.health?.factors ?? null}
                      trend={asset.health?.trend ?? null}
                    />
                  </Link>
                ))}
              </div>
            ) : filterStatus !== "all" ? (
              <div className="bg-stellar-card border border-stellar-border rounded-lg p-8 text-center">
                <p className="text-stellar-text-secondary">No assets match the selected filter.</p>
                <button type="button" onClick={() => setFilterStatus("all")} className="mt-3 text-sm text-stellar-blue hover:underline">
                  Clear filter
                </button>
              </div>
            ) : (
              <div className="bg-stellar-card border border-stellar-border rounded-lg p-8 text-center">
                <p className="text-stellar-text-secondary">
                  No monitored assets yet. Configure assets in the backend to get started.
                </p>
              </div>
            )}
          </Suspense>
        </ErrorBoundary>
          </section>
        )}

        {renderedWidgets.some((widget) => widget.id === "bridge-status") && (
          <section
            aria-labelledby="bridge-status-heading"
            className={widgetSizeClasses(layout.widgets.find((widget) => widget.id === "bridge-status")?.size ?? "medium")}
          >
        <div className="flex items-center justify-between mb-4">
          <h2 id="bridge-status-heading" className="text-xl font-semibold text-stellar-text-primary">
            Bridge Status
          </h2>
          <Link to="/bridges" className="text-sm text-stellar-blue hover:underline">
            View all
          </Link>
        </div>
        <ErrorBoundary onRetry={() => window.location.reload()}>
          <Suspense
            fallback={
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <SkeletonCard key={i} rows={5} ariaLabel={`Loading bridge ${i}`} />
                ))}
              </div>
            }
          >
            {bridgesLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <SkeletonCard key={i} rows={5} ariaLabel={`Loading bridge ${i}`} />
                ))}
              </div>
            ) : bridgesData && bridgesData.bridges.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {bridgesData.bridges.map((bridge) => (
                  <BridgeStatusCard key={bridge.name} {...bridge} />
                ))}
              </div>
            ) : (
              <div className="bg-stellar-card border border-stellar-border rounded-lg p-8 text-center">
                <p className="text-stellar-text-secondary">No bridge data available yet.</p>
              </div>
            )}
          </Suspense>
        </ErrorBoundary>
          </section>
        )}
      </div>

      {enabledWidgets.length === 0 && (
        <section className="rounded-lg border border-stellar-border bg-stellar-card p-6 text-center">
          <p className="text-stellar-text-secondary">All widgets are currently hidden.</p>
          <button
            type="button"
            onClick={() => setCustomizationOpen(true)}
            className="mt-3 text-sm text-stellar-blue hover:underline"
          >
            Open customization panel
          </button>
        </section>
      )}
    </div>
  );
}
