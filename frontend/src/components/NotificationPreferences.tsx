import { useNotificationContext } from "../hooks/useNotificationContext";

export default function NotificationPreferences() {
  const { preferences, updatePreferences } = useNotificationContext();

  return (
    <div className="bg-stellar-card border border-stellar-border rounded-lg p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-white">Notification Sounds</h3>
          <p className="text-sm text-stellar-text-secondary">
            Play a sound when a new notification arrives.
          </p>
        </div>
        <button
          onClick={() => updatePreferences({ soundEnabled: !preferences.soundEnabled })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-stellar-blue focus:ring-offset-2 focus:ring-offset-stellar-card ${
            preferences.soundEnabled ? "bg-stellar-blue" : "bg-stellar-border"
          }`}
          aria-pressed={preferences.soundEnabled}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              preferences.soundEnabled ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      <div className="pt-4 border-t border-stellar-border">
        <h3 className="text-lg font-medium text-white decoration-stellar-text-muted line-through opacity-50">
          Browser Push Notifications
        </h3>
        <p className="text-sm text-stellar-text-secondary opacity-50">
          Coming Soon: Get alerts even when the dashboard is closed.
        </p>
      </div>
    </div>
  );
}
