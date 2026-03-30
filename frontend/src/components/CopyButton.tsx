import type { KeyboardEvent, MouseEvent } from "react";
import useCopyToClipboard, {
  type CopyFormat,
  type CopyOptions,
} from "../hooks/useCopyToClipboard";

interface CopyButtonProps {
  value: unknown;
  label?: string;
  copiedLabel?: string;
  failedLabel?: string;
  className?: string;
  format?: CopyFormat;
  mimeType?: string;
  serialize?: CopyOptions["serialize"];
  onCopied?: (success: boolean) => void;
  successDurationMs?: number;
  variant?: "button" | "inline";
  stopPropagation?: boolean;
  ariaLabel?: string;
}

export default function CopyButton({
  value,
  label = "Copy",
  copiedLabel = "Copied",
  failedLabel = "Failed",
  className = "",
  format = "text",
  mimeType,
  serialize,
  onCopied,
  successDurationMs,
  variant = "button",
  stopPropagation = true,
  ariaLabel,
}: CopyButtonProps) {
  const { copy, status, message } = useCopyToClipboard();

  const buttonBaseClass =
    variant === "inline"
      ? "text-xs font-medium text-stellar-blue hover:text-white underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-stellar-blue rounded px-1 py-0.5"
      : "inline-flex items-center justify-center min-h-9 px-3 py-1.5 text-xs font-medium rounded-md border border-stellar-border text-stellar-text-secondary hover:text-white hover:border-stellar-blue focus:outline-none focus:ring-2 focus:ring-stellar-blue transition-colors";

  const handleCopy = async (event?: MouseEvent | KeyboardEvent) => {
    if (stopPropagation && event) {
      event.stopPropagation();
    }

    const ok = await copy(value, {
      format,
      mimeType,
      serialize,
      successDurationMs,
    });

    onCopied?.(ok);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const key = event.key.toLowerCase();
    const isCopyShortcut = (event.metaKey || event.ctrlKey) && key === "c";

    if (isCopyShortcut) {
      event.preventDefault();
      void handleCopy(event);
    }
  };

  const visibleLabel =
    status === "success" ? copiedLabel : status === "error" ? failedLabel : label;

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={(event) => {
          void handleCopy(event);
        }}
        onKeyDown={handleKeyDown}
        className={`${buttonBaseClass} ${className}`.trim()}
        aria-label={ariaLabel ?? label}
      >
        {visibleLabel}
      </button>
      <span className="sr-only" role="status" aria-live="polite">
        {message}
      </span>
    </span>
  );
}
