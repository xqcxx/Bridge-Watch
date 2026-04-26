import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  createMaintenanceOverride,
  getSuppressionRules,
  previewSuppression,
  toggleSuppressionRule,
  type AlertSuppressionRule,
} from "../services/api";

type PreviewPriority = "critical" | "high" | "medium" | "low";
type PreviewType =
  | "price_deviation"
  | "supply_mismatch"
  | "bridge_downtime"
  | "health_score_drop"
  | "volume_anomaly"
  | "reserve_ratio_breach";

const ALERT_TYPES: PreviewType[] = [
  "price_deviation",
  "supply_mismatch",
  "bridge_downtime",
  "health_score_drop",
  "volume_anomaly",
  "reserve_ratio_breach",
];

const PRIORITIES: PreviewPriority[] = ["critical", "high", "medium", "low"];

export default function AlertSuppressionControls() {
  const [rules, setRules] = useState<AlertSuppressionRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [overrideStart, setOverrideStart] = useState("");
  const [overrideEnd, setOverrideEnd] = useState("");

  const [previewAsset, setPreviewAsset] = useState("USDC");
  const [previewSource, setPreviewSource] = useState("price_deviation_bps");
  const [previewType, setPreviewType] = useState<PreviewType>("price_deviation");
  const [previewPriority, setPreviewPriority] = useState<PreviewPriority>("high");
  const [previewResult, setPreviewResult] = useState<string>("");

  const actor = "dashboard";

  const activeCount = useMemo(() => rules.filter((rule) => rule.isActive).length, [rules]);

  const refreshRules = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getSuppressionRules();
      setRules(response.rules);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load suppression rules");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshRules();
  }, []);

  const handleToggle = async (rule: AlertSuppressionRule) => {
    setError(null);
    try {
      await toggleSuppressionRule(rule.id, {
        actor,
        isActive: !rule.isActive,
      });
      await refreshRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to toggle rule");
    }
  };

  const handleOverrideSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!overrideStart || !overrideEnd) {
      setError("Please provide both maintenance start and end.");
      return;
    }

    try {
      await createMaintenanceOverride({
        actor,
        startAt: new Date(overrideStart).toISOString(),
        endAt: new Date(overrideEnd).toISOString(),
        description: "Maintenance override created from settings dashboard",
      });
      setOverrideStart("");
      setOverrideEnd("");
      await refreshRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create maintenance override");
    }
  };

  const handlePreviewSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setPreviewResult("Checking suppression rules...");

    try {
      const response = await previewSuppression({
        actor,
        assetCode: previewAsset,
        source: previewSource,
        alertType: previewType,
        priority: previewPriority,
      });

      if (response.decision.suppressed) {
        const ruleName = response.decision.matchedRule?.name ?? "unknown rule";
        setPreviewResult(`Suppressed by ${ruleName}`);
      } else {
        setPreviewResult("Not suppressed");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Suppression preview failed");
      setPreviewResult("Preview failed");
    }
  };

  return (
    <section className="rounded-xl border border-stellar-border bg-stellar-card p-6 space-y-6" aria-labelledby="suppression-controls-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="suppression-controls-heading" className="text-xl font-semibold text-stellar-text-primary">
            Alert suppression controls
          </h2>
          <p className="text-sm text-stellar-text-secondary mt-1">
            Active: {activeCount} of {rules.length} rules
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refreshRules()}
          className="rounded-md border border-stellar-border bg-stellar-dark px-3 py-2 text-sm text-stellar-text-primary hover:bg-stellar-border/40"
        >
          Refresh
        </button>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      {loading ? (
        <div className="space-y-2">
          <div className="h-10 rounded bg-stellar-border animate-pulse" />
          <div className="h-10 rounded bg-stellar-border animate-pulse" />
        </div>
      ) : (
        <div className="space-y-2">
          {rules.length === 0 ? (
            <p className="text-sm text-stellar-text-secondary">No suppression rules configured.</p>
          ) : (
            rules.map((rule) => (
              <div key={rule.id} className="rounded-lg border border-stellar-border bg-stellar-dark p-3 flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm text-stellar-text-primary font-medium">{rule.name}</p>
                  <p className="text-xs text-stellar-text-secondary">
                    {rule.maintenanceMode ? "Maintenance" : "Standard"}
                    {rule.expiresAt ? ` | Expires ${new Date(rule.expiresAt).toLocaleString()}` : " | No expiry"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => void handleToggle(rule)}
                  className={`rounded px-3 py-1 text-xs font-medium ${
                    rule.isActive
                      ? "bg-green-500/20 text-green-300 border border-green-500/40"
                      : "bg-stellar-border/40 text-stellar-text-secondary border border-stellar-border"
                  }`}
                >
                  {rule.isActive ? "Enabled" : "Disabled"}
                </button>
              </div>
            ))
          )}
        </div>
      )}

      <form onSubmit={handleOverrideSubmit} className="space-y-3 rounded-lg border border-stellar-border p-4">
        <h3 className="text-sm font-semibold text-stellar-text-primary">Create maintenance override</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-xs text-stellar-text-secondary">
            Start (UTC)
            <input
              type="datetime-local"
              value={overrideStart}
              onChange={(event) => setOverrideStart(event.target.value)}
              className="mt-1 w-full rounded border border-stellar-border bg-stellar-dark px-2 py-2 text-sm text-stellar-text-primary"
            />
          </label>
          <label className="text-xs text-stellar-text-secondary">
            End (UTC)
            <input
              type="datetime-local"
              value={overrideEnd}
              onChange={(event) => setOverrideEnd(event.target.value)}
              className="mt-1 w-full rounded border border-stellar-border bg-stellar-dark px-2 py-2 text-sm text-stellar-text-primary"
            />
          </label>
        </div>
        <button type="submit" className="rounded-md bg-stellar-blue px-3 py-2 text-sm font-medium text-white">
          Add override
        </button>
      </form>

      <form onSubmit={handlePreviewSubmit} className="space-y-3 rounded-lg border border-stellar-border p-4">
        <h3 className="text-sm font-semibold text-stellar-text-primary">Preview suppression</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <label className="text-xs text-stellar-text-secondary">
            Asset code
            <input
              type="text"
              value={previewAsset}
              onChange={(event) => setPreviewAsset(event.target.value.toUpperCase())}
              className="mt-1 w-full rounded border border-stellar-border bg-stellar-dark px-2 py-2 text-sm text-stellar-text-primary"
            />
          </label>
          <label className="text-xs text-stellar-text-secondary">
            Source
            <input
              type="text"
              value={previewSource}
              onChange={(event) => setPreviewSource(event.target.value)}
              className="mt-1 w-full rounded border border-stellar-border bg-stellar-dark px-2 py-2 text-sm text-stellar-text-primary"
            />
          </label>
          <label className="text-xs text-stellar-text-secondary">
            Alert type
            <select
              value={previewType}
              onChange={(event) => setPreviewType(event.target.value as PreviewType)}
              className="mt-1 w-full rounded border border-stellar-border bg-stellar-dark px-2 py-2 text-sm text-stellar-text-primary"
            >
              {ALERT_TYPES.map((type) => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs text-stellar-text-secondary">
            Priority
            <select
              value={previewPriority}
              onChange={(event) => setPreviewPriority(event.target.value as PreviewPriority)}
              className="mt-1 w-full rounded border border-stellar-border bg-stellar-dark px-2 py-2 text-sm text-stellar-text-primary"
            >
              {PRIORITIES.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </label>
        </div>
        <button type="submit" className="rounded-md border border-stellar-border bg-stellar-dark px-3 py-2 text-sm text-stellar-text-primary">
          Preview
        </button>
        {previewResult && <p className="text-sm text-stellar-text-secondary">Result: {previewResult}</p>}
      </form>
    </section>
  );
}
