import { lazy, Suspense } from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import { NotificationProvider } from "./context/NotificationContext";
import { useNotifications } from "./hooks/useNotifications";

const Dashboard = lazy(() => import("./pages/Dashboard"));
const AssetDetail = lazy(() => import("./pages/AssetDetail"));
const Bridges = lazy(() => import("./pages/Bridges"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Reports = lazy(() => import("./pages/Reports"));
const Landing = lazy(() => import("./pages/Landing"));
const Settings = lazy(() => import("./pages/Settings"));


function NotificationInitializer() {
  useNotifications();
  return null;
}

function App() {
  return (
    <NotificationProvider>
      <NotificationInitializer />
      <Suspense
        fallback={
          <div className="min-h-screen bg-stellar-dark flex items-center justify-center text-stellar-text-secondary">
            Loading page…
          </div>
        }
      >
        <Routes>
          {/* Landing page — full-page layout with its own nav */}
          <Route path="/" element={<Landing />} />

          {/* App pages — shared Layout with Navbar */}
          <Route element={<Layout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/assets/:symbol" element={<AssetDetail />} />
            <Route path="/bridges" element={<Bridges />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

        </Routes>
      </Suspense>
    </NotificationProvider>
  );
}

export default App;

