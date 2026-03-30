import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useAssetsWithHealth } from "../hooks/useAssets";
import { useBridges } from "../hooks/useBridges";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface StatItem {
  label: string;
  value: string | number;
  suffix?: string;
}

// ---------------------------------------------------------------------------
// Helpers — scroll-based reveal animation
// ---------------------------------------------------------------------------

function useIntersection(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, visible };
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

/** Animated section wrapper — fades + slides in when scrolled into view. */
function AnimatedSection({
  children,
  className = "",
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const { ref, visible } = useIntersection();

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={[
        "transition-all duration-700 ease-out",
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8",
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

/** Single feature highlight card. */
function FeatureCard({
  icon,
  title,
  description,
  delay,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <AnimatedSection delay={delay}>
      <div className="group rounded-2xl border border-stellar-border bg-stellar-card p-6 hover:border-stellar-blue/50 transition-colors duration-300 h-full">
        <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-stellar-blue/10 text-stellar-blue group-hover:bg-stellar-blue group-hover:text-white transition-colors duration-300">
          {icon}
        </div>
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-stellar-text-secondary">
          {description}
        </p>
      </div>
    </AnimatedSection>
  );
}

/** Live statistic counter card. */
function StatCard({ label, value, suffix = "" }: StatItem) {
  return (
    <div className="rounded-2xl border border-stellar-border bg-stellar-card p-6 text-center">
      <p className="text-3xl font-bold text-white">
        {value}
        <span className="text-stellar-blue">{suffix}</span>
      </p>
      <p className="mt-1 text-sm text-stellar-text-secondary">{label}</p>
    </div>
  );
}

/** "How It Works" numbered step. */
function StepCard({
  step,
  title,
  description,
  delay,
}: {
  step: number;
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <AnimatedSection delay={delay}>
      <div className="flex gap-5">
        <div className="flex-shrink-0 flex h-10 w-10 items-center justify-center rounded-full bg-stellar-blue text-white font-bold text-sm">
          {step}
        </div>
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm text-stellar-text-secondary leading-relaxed">
            {description}
          </p>
        </div>
      </div>
    </AnimatedSection>
  );
}

// ---------------------------------------------------------------------------
// Icons (inline SVG to avoid external icon-library dependency)
// ---------------------------------------------------------------------------

const Icon = {
  Shield: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  ),
  Activity: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
    </svg>
  ),
  BarChart: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
    </svg>
  ),
  Globe: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  ),
  Bell: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Lock: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  ),
  Code: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  Zap: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
    </svg>
  ),
  ArrowRight: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12" />
      <polyline points="12 5 19 12 12 19" />
    </svg>
  ),
  Star: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  ),
};

// ---------------------------------------------------------------------------
// API Preview snippet
// ---------------------------------------------------------------------------

const API_SNIPPET = `// Bridge Watch REST API — example
const response = await fetch(
  "https://api.bridgewatch.io/v1/assets/USDC/health"
);
const { overallScore, factors, trend } = await response.json();
// overallScore: 94
// factors: { liquidityDepth: 96, priceStability: 91, ... }
// trend: "improving"`;

// ---------------------------------------------------------------------------
// Main Landing page
// ---------------------------------------------------------------------------

export default function Landing() {
  const { data: assetsData } = useAssetsWithHealth();
  const { data: bridgesData } = useBridges();

  const totalAssets = assetsData?.length ?? 0;
  const totalBridges = bridgesData?.bridges?.length ?? 0;
  const avgScore = useMemo<string>(() => {
    if (!assetsData || assetsData.length === 0) return "—";
    const withScores = assetsData
      .map((a) => a.health?.overallScore)
      .filter((s): s is number => typeof s === "number");
    if (withScores.length === 0) return "—";
    return (withScores.reduce((a, b) => a + b, 0) / withScores.length).toFixed(0);
  }, [assetsData]);

  const stats: StatItem[] = [
    { label: "Assets Monitored", value: totalAssets || "—" },
    { label: "Bridges Tracked", value: totalBridges || "—" },
    { label: "Avg Health Score", value: avgScore, suffix: avgScore !== "—" ? "/100" : "" },
    { label: "Network", value: "Stellar" },
  ];

  const features = [
    {
      icon: <Icon.Activity />,
      title: "Real-Time Health Scores",
      description:
        "Composite 0–100 health score per asset, updated live via WebSocket. Track liquidity depth, price stability, and bridge uptime in one view.",
    },
    {
      icon: <Icon.Shield />,
      title: "Supply Mismatch Detection",
      description:
        "Automatically flag discrepancies between Stellar-issued supply and source-chain collateral, down to 0.1 bp resolution.",
    },
    {
      icon: <Icon.Bell />,
      title: "Price Deviation Alerts",
      description:
        "Configurable low / medium / high severity alerts fire instantly when any asset deviates from its reference price.",
    },
    {
      icon: <Icon.BarChart />,
      title: "Multi-DEX Liquidity Depth",
      description:
        "Aggregate liquidity from Stellar DEX venues at multiple price-impact tiers (0.1 %, 0.5 %, 1 %, 5 %) for USDC/XLM, EURC/XLM, and more.",
    },
    {
      icon: <Icon.Globe />,
      title: "Cross-Bridge Analytics",
      description:
        "Side-by-side comparison across all monitored bridges. Historical trend charts, volume analytics, and bridge performance tables.",
    },
    {
      icon: <Icon.Lock />,
      title: "On-Chain Security Controls",
      description:
        "Emergency pause, two-step admin transfer, and per-role permissions are enforced directly by the Soroban smart contract — not off-chain middleware.",
    },
    {
      icon: <Icon.Code />,
      title: "Open REST & WebSocket API",
      description:
        "Every data point is available via a versioned REST API and a real-time WebSocket feed. Embed Bridge Watch data into your own dashboards in minutes.",
    },
    {
      icon: <Icon.Zap />,
      title: "Automated Health Calculation",
      description:
        "Submit raw component scores and let the contract compute the weighted composite automatically — or supply a manual override for full transparency.",
    },
  ];

  const steps = [
    {
      title: "Connect to Stellar",
      description:
        "Bridge Watch indexes Stellar mainnet (and testnet) events in real time. No wallet connection needed to view public monitoring data.",
    },
    {
      title: "Monitor Your Assets",
      description:
        "Registered assets appear on the dashboard with live health scores. Set deviation thresholds and mismatch alerts tailored to each token.",
    },
    {
      title: "Act on Insights",
      description:
        "Use the dashboard, REST API, or Soroban contract query functions to integrate Bridge Watch data into your own trading, compliance, or ops tooling.",
    },
    {
      title: "Generate Reports",
      description:
        "Export print-ready PDF reports of network overviews, per-asset breakdowns, and bridge status summaries with a single click.",
    },
  ];

  return (
    <div className="min-h-screen bg-stellar-dark">

      {/* ── Navbar ── */}
      <nav className="sticky top-0 z-50 border-b border-stellar-border bg-stellar-dark/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link
              to="/"
              className="text-xl font-bold text-white focus:outline-none focus:ring-2 focus:ring-stellar-blue rounded-sm"
            >
              Bridge <span className="text-stellar-blue">Watch</span>
            </Link>
            <div className="flex items-center gap-3">
              <Link
                to="/dashboard"
                className="hidden sm:block text-sm text-stellar-text-secondary hover:text-white transition-colors"
              >
                Dashboard
              </Link>
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-lg bg-stellar-blue px-4 py-2 text-sm font-medium text-white hover:bg-stellar-blue/80 transition-colors focus:outline-none focus:ring-2 focus:ring-stellar-blue"
              >
                Launch App
                <Icon.ArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden pt-24 pb-32 sm:pt-32 sm:pb-40">
        {/* Background glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
        >
          <div className="h-[520px] w-[520px] rounded-full bg-stellar-blue/10 blur-3xl" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Pill badge */}
          <div className="inline-flex items-center gap-1.5 rounded-full border border-stellar-blue/30 bg-stellar-blue/10 px-3 py-1 text-xs font-medium text-stellar-blue mb-6">
            <Icon.Star />
            Open-source · Stellar Network
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight tracking-tight">
            Real-Time Bridge Monitoring
            <br />
            <span className="text-stellar-blue">for Stellar</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-stellar-text-secondary max-w-2xl mx-auto leading-relaxed">
            Bridge Watch gives you instant visibility into cross-chain asset health,
            supply consistency, and liquidity depth — all powered by an auditable
            Soroban smart contract on the Stellar network.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/dashboard"
              className="inline-flex items-center gap-2 rounded-xl bg-stellar-blue px-7 py-3.5 text-base font-semibold text-white shadow-lg shadow-stellar-blue/25 hover:bg-stellar-blue/90 transition-colors focus:outline-none focus:ring-2 focus:ring-stellar-blue focus:ring-offset-2 focus:ring-offset-stellar-dark"
            >
              Open Dashboard
              <Icon.ArrowRight />
            </Link>
            <a
              href="https://github.com/StellaBridge/Bridge-Watch"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-stellar-border px-7 py-3.5 text-base font-semibold text-white hover:border-stellar-blue/50 transition-colors focus:outline-none focus:ring-2 focus:ring-stellar-blue"
            >
              View on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* ── Live Stats ── */}
      <section className="bg-stellar-card border-y border-stellar-border py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection>
            <p className="text-center text-sm font-semibold uppercase tracking-widest text-stellar-text-secondary mb-8">
              Live Network Statistics
            </p>
          </AnimatedSection>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, i) => (
              <AnimatedSection key={stat.label} delay={i * 80}>
                <StatCard {...stat} />
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Everything you need to monitor bridges
            </h2>
            <p className="mt-4 text-stellar-text-secondary max-w-2xl mx-auto">
              From raw on-chain data to actionable health scores, Bridge Watch covers
              the full observability stack for bridged assets on Stellar.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((feature, i) => (
              <FeatureCard key={feature.title} {...feature} delay={i * 60} />
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section className="py-24 bg-stellar-card border-y border-stellar-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <AnimatedSection className="mb-14">
            <h2 className="text-3xl sm:text-4xl font-bold text-white">How it works</h2>
            <p className="mt-4 text-stellar-text-secondary max-w-xl">
              Get from zero to full bridge visibility in four simple steps.
            </p>
          </AnimatedSection>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl">
            {steps.map((step, i) => (
              <StepCard key={step.title} step={i + 1} {...step} delay={i * 100} />
            ))}
          </div>
        </div>
      </section>

      {/* ── API Preview ── */}
      <section className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <AnimatedSection>
              <span className="inline-block rounded-full bg-stellar-blue/10 px-3 py-1 text-xs font-semibold text-stellar-blue uppercase tracking-widest mb-4">
                Developer API
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-white">
                Integrate in minutes
              </h2>
              <p className="mt-4 text-stellar-text-secondary leading-relaxed">
                A clean, versioned REST API and real-time WebSocket feed let you embed
                Bridge Watch data into your own applications, bots, and dashboards
                without any blockchain SDK.
              </p>
              <ul className="mt-6 space-y-2 text-sm text-stellar-text-secondary">
                {[
                  "REST endpoints for assets, bridges, prices, and health scores",
                  "WebSocket channel for live health score updates",
                  "Pagination, filtering, and date-range queries",
                  "OpenAPI spec available for code generation",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 flex-shrink-0 text-stellar-blue">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <div className="mt-8">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center gap-2 rounded-xl bg-stellar-blue px-6 py-3 text-sm font-semibold text-white hover:bg-stellar-blue/90 transition-colors focus:outline-none focus:ring-2 focus:ring-stellar-blue"
                >
                  Explore the dashboard
                  <Icon.ArrowRight />
                </Link>
              </div>
            </AnimatedSection>

            <AnimatedSection delay={150}>
              <div className="rounded-2xl border border-stellar-border bg-stellar-card overflow-hidden">
                <div className="flex items-center gap-1.5 px-4 py-3 border-b border-stellar-border bg-stellar-dark/50">
                  {["#FF5F57", "#FFBD2E", "#27C93F"].map((color) => (
                    <div
                      key={color}
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                  <span className="ml-2 text-xs text-stellar-text-secondary font-mono">
                    bridge-watch-api.ts
                  </span>
                </div>
                <pre className="overflow-x-auto p-5 text-xs leading-relaxed text-green-300 font-mono">
                  <code>{API_SNIPPET}</code>
                </pre>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ── Call to Action ── */}
      <section className="py-24 bg-stellar-card border-t border-stellar-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <AnimatedSection>
            <h2 className="text-3xl sm:text-4xl font-bold text-white">
              Start monitoring your bridges today
            </h2>
            <p className="mt-4 text-stellar-text-secondary max-w-xl mx-auto">
              Bridge Watch is fully open-source. Contributions, forks, and integrations
              are welcome.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 rounded-xl bg-stellar-blue px-8 py-4 text-base font-semibold text-white shadow-lg shadow-stellar-blue/25 hover:bg-stellar-blue/90 transition-colors focus:outline-none focus:ring-2 focus:ring-stellar-blue focus:ring-offset-2 focus:ring-offset-stellar-card"
              >
                Open the Dashboard
                <Icon.ArrowRight />
              </Link>
              <a
                href="https://github.com/StellaBridge/Bridge-Watch"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-xl border border-stellar-border px-8 py-4 text-base font-semibold text-white hover:border-stellar-blue/50 transition-colors focus:outline-none focus:ring-2 focus:ring-stellar-blue"
              >
                Contribute on GitHub
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-stellar-border py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-stellar-text-secondary">
          <p>
            © {new Date().getFullYear()}{" "}
            <span className="text-white font-medium">Bridge Watch</span> — Built on
            Stellar
          </p>
          <div className="flex items-center gap-6">
            <Link to="/dashboard" className="hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link to="/bridges" className="hover:text-white transition-colors">
              Bridges
            </Link>
            <Link to="/analytics" className="hover:text-white transition-colors">
              Analytics
            </Link>
            <a
              href="https://github.com/StellaBridge/Bridge-Watch"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

