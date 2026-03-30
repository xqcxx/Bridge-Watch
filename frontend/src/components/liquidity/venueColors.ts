import type { LiquidityVenue } from "../../types/liquidity";

/** Consistent color-coded venue map across all liquidity charts. */
export const VENUE_COLORS: Record<LiquidityVenue, string> = {
  SDEX: "#0057FF",      // Blue
  StellarX: "#00C853",  // Green
  Phoenix: "#9C27B0",   // Purple
};
