import { useState } from "react";

interface PrintButtonProps {
  /** Label shown on the button. Defaults to "Print / Export PDF". */
  label?: string;
  /** Optional CSS classes to merge onto the button element. */
  className?: string;
  /** Optional callback invoked just before the print dialog opens. */
  onBeforePrint?: () => void;
  /** Optional callback invoked after the print dialog closes. */
  onAfterPrint?: () => void;
}

/**
 * PrintButton (Issue #105)
 *
 * Renders a styled button that triggers the browser's native print dialog.
 * Because modern browsers expose a "Save as PDF" destination inside the
 * print dialog, this component doubles as a zero-dependency PDF export.
 *
 * The button adds itself to a special `print-include` class so that the
 * global `@media print` rule can decide whether to show or hide it.
 */
export default function PrintButton({
  label = "Print / Export PDF",
  className = "",
  onBeforePrint,
  onAfterPrint,
}: PrintButtonProps) {
  const [isPrinting, setIsPrinting] = useState(false);

  const handlePrint = () => {
    setIsPrinting(true);
    onBeforePrint?.();

    // Give React one frame to flush any state updates before opening the dialog
    requestAnimationFrame(() => {
      window.print();
      setIsPrinting(false);
      onAfterPrint?.();
    });
  };

  return (
    <button
      type="button"
      onClick={handlePrint}
      disabled={isPrinting}
      aria-label={label}
      className={[
        "print-include no-print inline-flex items-center gap-2 rounded-lg border",
        "border-stellar-blue bg-stellar-blue/10 px-4 py-2 text-sm font-medium",
        "text-stellar-blue transition-colors hover:bg-stellar-blue hover:text-white",
        "focus:outline-none focus:ring-2 focus:ring-stellar-blue focus:ring-offset-2",
        "focus:ring-offset-stellar-dark disabled:opacity-50 disabled:cursor-not-allowed",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {/* Printer icon */}
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="6 9 6 2 18 2 18 9" />
        <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
        <rect width="12" height="8" x="6" y="14" />
      </svg>
      {isPrinting ? "Opening print dialog…" : label}
    </button>
  );
}
