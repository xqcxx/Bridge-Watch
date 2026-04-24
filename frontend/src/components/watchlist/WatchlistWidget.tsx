import { useCallback, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useWatchlist } from "../../hooks/useWatchlist";
import { useWebSocket } from "../../hooks/useWebSocket";

interface AssetAlert {
  symbol: string;
  message: string;
  severity?: "info" | "warning" | "error";
  timestamp?: string;
}

function asAssetAlert(value: unknown): AssetAlert | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const payload = value as Record<string, unknown>;
  if (typeof payload.symbol !== "string" || typeof payload.message !== "string") {
    return null;
  }

  return {
    symbol: payload.symbol.toUpperCase(),
    message: payload.message,
    severity:
      payload.severity === "warning" || payload.severity === "error"
        ? payload.severity
        : "info",
    timestamp: typeof payload.timestamp === "string" ? payload.timestamp : undefined,
  };
}

export default function WatchlistWidget() {
  const { activeWatchlist, activeSymbols } = useWatchlist();
  const [alerts, setAlerts] = useState<AssetAlert[]>([]);

  const symbolsSet = useMemo(() => new Set(activeSymbols), [activeSymbols]);

  const onAlert = useCallback(
    (raw: unknown) => {
      const alert = asAssetAlert(raw);
      if (!alert || !symbolsSet.has(alert.symbol)) {
        return;
      }

      setAlerts((previous) => [alert, ...previous].slice(0, 5));
    },
    [symbolsSet]
  );

  useWebSocket("alerts", onAlert);

  return (
    <section className="rounded-lg border border-stellar-border bg-stellar-card p-6">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Watchlist quick access</h2>
        <Link to="/watchlists" className="text-sm text-stellar-blue hover:underline">
          Manage
        </Link>
      </div>

      <p className="mb-3 text-xs text-stellar-text-secondary">
        Active list: {activeWatchlist?.name ?? "None"}
      </p>

      {activeSymbols.length === 0 ? (
        <p className="text-sm text-stellar-text-secondary">Add assets to track focused updates.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {activeSymbols.slice(0, 8).map((symbol) => (
            <Link
              key={symbol}
              to={`/assets/${symbol}`}
              className="rounded border border-stellar-border px-3 py-1 text-xs text-white hover:bg-stellar-dark"
            >
              {symbol}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-4">
        <h3 className="mb-2 text-sm font-medium text-white">Watchlist alerts</h3>
        {alerts.length === 0 ? (
          <p className="text-xs text-stellar-text-secondary">No focused alerts yet.</p>
        ) : (
          <ul className="space-y-2 text-xs">
            {alerts.map((alert, index) => (
              <li key={`${alert.symbol}-${index}`} className="rounded border border-stellar-border p-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-white">{alert.symbol}</span>
                  <span
                    className={
                      alert.severity === "error"
                        ? "text-red-300"
                        : alert.severity === "warning"
                          ? "text-yellow-300"
                          : "text-stellar-text-secondary"
                    }
                  >
                    {alert.severity?.toUpperCase()}
                  </span>
                </div>
                <p className="mt-1 text-stellar-text-secondary">{alert.message}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
