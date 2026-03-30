import React from "react";
import { useShortcuts } from "../context/ShortcutContext";

export const ShortcutConfig: React.FC = () => {
  const { shortcuts, updateShortcut, resetToDefaults } = useShortcuts();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Keyboard Shortcuts
          </h3>
          <p className="text-sm text-gray-500">
            Customize your workflow bindings
          </p>
        </div>
        <button
          onClick={resetToDefaults}
          className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors border border-red-200 dark:border-red-900/50"
        >
          Reset to Defaults
        </button>
      </div>

      <div className="space-y-4">
        {shortcuts.map((shortcut) => (
          <div
            key={shortcut.id}
            className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
          >
            <div className="flex flex-col">
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {shortcut.label}
              </span>
              <span className="text-xs text-gray-500">{shortcut.category}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={shortcut.keys}
                onChange={(e) => updateShortcut(shortcut.id, e.target.value)}
                className="w-32 px-3 py-1.5 text-sm font-mono text-center bg-gray-100 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-stellar-blue focus:border-transparent outline-none dark:text-gray-200"
                placeholder="e.g. g h"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-100 dark:border-blue-900/50">
        <div className="flex gap-3">
          <svg
            className="w-5 h-5 text-blue-600 mt-0.5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <strong>Tip:</strong> For multi-key sequences, use a space between
            keys (e.g., <code className="font-bold">g h</code> for "g" then
            "h"). Single keys like <code className="font-bold">/</code> are also
            supported.
          </p>
        </div>
      </div>
    </div>
  );
};


