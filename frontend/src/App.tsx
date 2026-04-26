import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import AssetDetail from "./pages/AssetDetail";
import Bridges from "./pages/Bridges";
import Analytics from "./pages/Analytics";
import WatchlistsPage from "./pages/Watchlists";
import Incidents from "./pages/Incidents";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Dashboard />} />
        <Route path="/assets/:symbol" element={<AssetDetail />} />
        <Route path="/bridges" element={<Bridges />} />
        <Route path="/incidents" element={<Incidents />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/watchlists" element={<WatchlistsPage />} />
      </Route>
    </Routes>
  );
}

export default App;
