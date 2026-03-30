import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { axe } from "vitest-axe";
import "@testing-library/jest-dom";
import Analytics from "./Analytics";

vi.mock("../hooks/useAssets", () => ({
  useAssetsWithHealth: () => ({
    data: [
      {
        symbol: "USDC",
        name: "USD Coin",
        health: { overallScore: 88, trend: "stable" },
      },
      {
        symbol: "XLM",
        name: "Stellar",
        health: { overallScore: 73, trend: "improving" },
      },
    ],
    isLoading: false,
    error: null,
  }),
}));

vi.mock("../hooks/usePrices", () => ({
  usePricesForSymbols: (symbols: string[]) =>
    symbols.map((symbol) => ({
      data: {
        symbol,
        vwap: symbol === "USDC" ? 1.0 : 0.11,
        sources: [{ source: "sdex", price: 1, timestamp: "now" }],
        lastUpdated: "now",
      },
      isLoading: false,
    })),
}));

describe("Analytics", () => {
  it("renders comparison cards for selected assets", async () => {
    const { asFragment, container } = render(<Analytics />);

    // Snapshot test
    expect(asFragment()).toMatchSnapshot();

    // Accessibility test
    const results = await axe(container);
    expect(results).toHaveNoViolations();

    expect(screen.getByText("Asset Comparison")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "USDC" }));
    fireEvent.click(screen.getByRole("button", { name: "XLM" }));

    expect(screen.getByRole("article", { name: "USDC comparison metrics" })).toBeInTheDocument();
    expect(screen.getByRole("article", { name: "XLM comparison metrics" })).toBeInTheDocument();
    expect(screen.getByText("Select up to 3 assets for side-by-side comparison.")).toBeInTheDocument();
  });
});

