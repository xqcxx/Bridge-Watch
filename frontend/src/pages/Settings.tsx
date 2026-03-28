import React from "react";
import NotificationPreferences from "../components/NotificationPreferences";
import { useNotificationContext } from "../context/NotificationContext";

export default function Settings() {
  const { addNotification } = useNotificationContext();

  const triggerTestNotification = (type: "alert" | "system" | "info") => {
    addNotification({
      title: `Test ${type.charAt(0).toUpperCase() + type.slice(1)}`,
      message: `This is a test ${type} notification to verify the Notification Center functionality.`,
      type,
      link: type === "alert" ? "/dashboard" : undefined,
    });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-stellar-text-secondary">
          Manage your application preferences and notification settings.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <section id="notifications">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-stellar-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              Notification Settings
            </h2>
            <NotificationPreferences />
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-stellar-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a2 2 0 00-1.96 1.414l-.477 2.387a2 2 0 00.547 1.022l1.414 1.414a2 2 0 001.022.547l2.387.477a2 2 0 001.96-1.414l.477-2.387a2 2 0 00-.547-1.022l-1.414-1.414z" />
              </svg>
              Developer Tools
            </h2>
            <div className="bg-stellar-card border border-stellar-border rounded-lg p-6">
              <p className="text-sm text-stellar-text-secondary mb-4">
                Trigger manual notifications to test the real-time alerting system.
              </p>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => triggerTestNotification("info")}
                  className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-md hover:bg-blue-500/30 transition-colors text-sm font-medium"
                >
                  Test Info
                </button>
                <button
                  onClick={() => triggerTestNotification("system")}
                  className="px-4 py-2 bg-stellar-blue/20 text-stellar-blue border border-stellar-blue/30 rounded-md hover:bg-stellar-blue/30 transition-colors text-sm font-medium"
                >
                  Test System
                </button>
                <button
                  onClick={() => triggerTestNotification("alert")}
                  className="px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-md hover:bg-red-500/30 transition-colors text-sm font-medium"
                >
                  Test Alert
                </button>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <div className="bg-stellar-card border border-stellar-border rounded-lg p-6">
            <h3 className="text-white font-medium mb-2">Profile Information</h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 rounded-full bg-stellar-blue flex items-center justify-center text-xl font-bold text-white">
                JS
              </div>
              <div>
                <p className="text-white font-medium">John Stellar</p>
                <p className="text-xs text-stellar-text-secondary">Network Operator</p>
              </div>
            </div>
            <button disabled className="w-full py-2 bg-stellar-border text-stellar-text-muted rounded-md text-sm cursor-not-allowed">
              Edit Profile (Locked)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
