import React from "react";
import { useShortcuts } from "../context/ShortcutContext";

export const ShortcutHelp: React.FC = () => {
  const { shortcuts, isHelpOpen, setHelpOpen } = useShortcuts();

  if (!isHelpOpen) return null;

  const categories = Array.from(new Set(shortcuts.map((s) => s.category)));

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm"
      onClick={() => setHelpOpen(false)}
    >
      <div
        className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 max-w-2xl w-full mx-4 overflow-hidden border border-gray-200 dark:border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Keyboard Shortcuts
          </h2>
          <button
            onClick={() => setHelpOpen(false)}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
          >
            <span className="sr-only">Close</span>
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-8 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {categories.map((category) => (
            <div key={category}>
              <h3 className="text-sm font-semibold text-stellar-blue uppercase tracking-wider mb-4 border-b border-gray-100 dark:border-gray-700 pb-2">
                {category}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shortcuts
                  .filter((s) => s.category === category)
                  .map((shortcut) => (
                    <div
                      key={shortcut.id}
                      className="flex justify-between items-center"
                    >
                      <span className="text-gray-600 dark:text-gray-400">
                        {shortcut.label}
                      </span>
                      <div className="flex gap-1">
                        {shortcut.keys.split(" ").map((key, idx) => (
                          <React.Fragment key={idx}>
                            <kbd className="px-2 py-1 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded text-xs font-mono font-bold text-gray-800 dark:text-gray-200 shadow-sm">
                              {key === " " ? "Space" : key.toUpperCase()}
                            </kbd>
                            {idx < shortcut.keys.split(" ").length - 1 && (
                              <span className="text-gray-400 self-center">
                                then
                              </span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-8 text-center text-sm text-gray-500 italic">
          Press <kbd className="font-bold">Esc</kbd> or click outside to close
        </p>
      </div>
    </div>
  );
};
