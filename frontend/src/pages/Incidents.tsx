import BridgeIncidentFeed from "../components/BridgeIncidentFeed";

export default function Incidents() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-stellar-text-primary">Incident Feed</h1>
        <p className="mt-2 text-stellar-text-secondary">
          Real-time bridge incident tracking — severity, follow-up actions, and source references.
        </p>
      </div>
      <BridgeIncidentFeed />
    </div>
  );
}
