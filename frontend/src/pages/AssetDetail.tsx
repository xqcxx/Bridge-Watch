import { Suspense } from "react";
import type { CellContext } from "@tanstack/react-table";
import { useParams } from "react-router-dom";
import { DataTable } from "../components/DataTable";
import type { DataTableColumnDef } from "../components/DataTable";
import HealthScoreCard from "../components/HealthScoreCard";
import LiquidityDepthChart from "../components/LiquidityDepthChart";
import PriceChart from "../components/PriceChart";
import { ErrorBoundary, LoadingSpinner } from "../components/Skeleton";
import CopyButton from "../components/CopyButton";
import { useAssetHealth } from "../hooks/useAssets";
import { usePrices } from "../hooks/usePrices";

type PriceSourceRow = {
  source: string;
  price: number;
  timestamp: string;
};

export default function AssetDetail() {
  const { symbol } = useParams<{ symbol: string }>();
  const { data: healthData } = useAssetHealth(symbol ?? "");
  const { data: priceData } = usePrices(symbol ?? "");

  const priceSourceRows: PriceSourceRow[] = (priceData?.sources ?? []) as PriceSourceRow[];

  const priceSourceColumns: Array<DataTableColumnDef<PriceSourceRow>> = [
    {
      id: "source",
      accessorKey: "source",
      header: "Source",
      filterType: "text",
      cell: (ctx: CellContext<PriceSourceRow, unknown>) => {
        const source = String(ctx.getValue());

        return (
          <span className="inline-flex items-center gap-2">
            <span>{source}</span>
            <CopyButton
              value={source}
              label="Copy"
              copiedLabel="Copied"
              failedLabel="Failed"
              variant="inline"
              ariaLabel={`Copy source for ${symbol}`}
            />
          </span>
        );
      },
    },
    {
      id: "price",
      accessorKey: "price",
      header: "Price",
      filterType: "numberRange",
      cell: (ctx: CellContext<PriceSourceRow, unknown>) => {
        const price = Number(ctx.getValue());

        return (
          <span className="inline-flex items-center gap-2">
            <span>${price.toFixed(4)}</span>
            <CopyButton
              value={price}
              label="Copy"
              copiedLabel="Copied"
              failedLabel="Failed"
              variant="inline"
              serialize={(value) => Number(value).toFixed(4)}
              ariaLabel={`Copy price from ${ctx.row.original.source}`}
            />
          </span>
        );
      },
    },
    {
      id: "timestamp",
      accessorKey: "timestamp",
      header: "Last Updated",
      filterType: "text",
      cell: (ctx: CellContext<PriceSourceRow, unknown>) => {
        const timestamp = String(ctx.getValue());

        return (
          <span className="inline-flex items-center gap-2">
            <span>{timestamp}</span>
            <CopyButton
              value={timestamp}
              label="Copy"
              copiedLabel="Copied"
              failedLabel="Failed"
              variant="inline"
              ariaLabel={`Copy timestamp from ${ctx.row.original.source}`}
            />
          </span>
        );
      },
    },
    {
      id: "copy-json",
      header: "Copy JSON",
      enableSorting: false,
      enableColumnFilter: false,
      cell: (ctx: CellContext<PriceSourceRow, unknown>) => (
        <CopyButton
          value={ctx.row.original}
          label="JSON"
          copiedLabel="Copied"
          failedLabel="Failed"
          variant="inline"
          format="pretty-json"
          mimeType="application/json"
          ariaLabel={`Copy ${ctx.row.original.source} row as JSON`}
        />
      ),
    },
  ];

  if (!symbol) {
    return <div className="text-stellar-text-secondary">No asset symbol provided.</div>;
  }

  return (
    <ErrorBoundary onRetry={() => window.location.reload()}>
      <Suspense
        fallback={
          <LoadingSpinner
            message={`Loading ${symbol} details...`}
            progress={25}
            className="max-w-lg mx-auto"
          />
        }
      >
        <div className="space-y-8">
          <header>
            <h1 className="text-3xl font-bold text-stellar-text-primary">{symbol}</h1>
            <p className="mt-2 text-stellar-text-secondary">
              Detailed monitoring for {symbol} on the Stellar network
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <HealthScoreCard
              symbol={symbol}
              overallScore={healthData?.overallScore ?? null}
              factors={healthData?.factors ?? null}
              trend={healthData?.trend ?? null}
            />
            <div className="lg:col-span-2">
              <PriceChart symbol={symbol} />
            </div>
          </div>

          <LiquidityDepthChart symbol={symbol} data={[]} isLoading={false} />

          <DataTable
            data={priceSourceRows}
            columns={priceSourceColumns}
            isLoading={!priceData}
            title="Price Sources"
            description={`Price sources for ${symbol} including last update times`}
            pageSizeOptions={[10, 20, 50]}
            filenameBase={`${symbol}-price-sources`}
            enableRowSelection={true}
            enableMultiSort={true}
            enableColumnReorder={true}
            enableVirtualization={true}
            rowActions={{
              items: [
                {
                  id: "copy-source",
                  label: "Copy source",
                  onSelect: (row) => {
                    void navigator.clipboard.writeText(row.source);
                  },
                },
              ],
            }}
          />
        </div>
      </Suspense>
    </ErrorBoundary>
  );
}
