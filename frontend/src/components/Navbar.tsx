import { Link, useLocation } from "react-router-dom";
import { useWatchlist } from "../hooks/useWatchlist";

const navLinks = [
  { to: "/", label: "Dashboard" },
  { to: "/bridges", label: "Bridges" },
  { to: "/analytics", label: "Analytics" },
  { to: "/watchlists", label: "Watchlists" },
];

export default function Navbar() {
  const location = useLocation();
  const { activeSymbols } = useWatchlist();

  return (
    <nav className="border-b border-stellar-border bg-stellar-card">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-8">
            <Link to="/" className="text-xl font-bold text-white">
              Bridge Watch
            </Link>
            <div className="hidden md:flex space-x-4">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    location.pathname === link.to
                      ? "bg-stellar-blue text-white"
                      : "text-stellar-text-secondary hover:text-white"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-2 text-xs text-stellar-text-secondary">
            <span>Quick:</span>
            {activeSymbols.length === 0 ? (
              <span>No watchlist assets</span>
            ) : (
              activeSymbols.slice(0, 3).map((symbol) => (
                <Link
                  key={symbol}
                  to={`/assets/${symbol}`}
                  className="rounded border border-stellar-border px-2 py-1 hover:text-white"
                >
                  {symbol}
                </Link>
              ))
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
