import { useCallback, useRef, useState } from "react";

export type CopyFormat = "text" | "json" | "pretty-json" | "csv" | "url";
export type CopyStatus = "idle" | "success" | "error";

export interface CopyOptions {
  format?: CopyFormat;
  mimeType?: string;
  successDurationMs?: number;
  serialize?: (value: unknown) => string;
}

interface CopyState {
  status: CopyStatus;
  message: string;
}

const DEFAULT_SUCCESS_DURATION_MS = 2000;

function toText(value: unknown, format: CopyFormat): string {
  if (value === null || value === undefined) {
    return "";
  }

  if (format === "url") {
    return String(value);
  }

  if (format === "json") {
    return JSON.stringify(value);
  }

  if (format === "pretty-json") {
    return JSON.stringify(value, null, 2);
  }

  if (format === "csv") {
    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (Array.isArray(item)) {
            return item.map((cell) => String(cell)).join(",");
          }

          if (typeof item === "object" && item !== null) {
            return Object.values(item)
              .map((cell) => String(cell))
              .join(",");
          }

          return String(item);
        })
        .join("\n");
    }

    return String(value);
  }

  if (typeof value === "string") {
    return value;
  }

  return String(value);
}

function fallbackCopyText(text: string): boolean {
  if (typeof document === "undefined") {
    return false;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "fixed";
  textarea.style.top = "0";
  textarea.style.left = "0";
  textarea.style.opacity = "0";

  document.body.appendChild(textarea);
  textarea.select();
  textarea.setSelectionRange(0, textarea.value.length);

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    copied = false;
  }

  document.body.removeChild(textarea);
  return copied;
}

export function useCopyToClipboard() {
  const timeoutRef = useRef<number | null>(null);
  const [state, setState] = useState<CopyState>({
    status: "idle",
    message: "",
  });

  const clearState = useCallback(() => {
    setState({ status: "idle", message: "" });
  }, []);

  const copy = useCallback(
    async (value: unknown, options: CopyOptions = {}): Promise<boolean> => {
      const {
        format = "text",
        mimeType = "text/plain",
        successDurationMs = DEFAULT_SUCCESS_DURATION_MS,
        serialize,
      } = options;

      const text = serialize ? serialize(value) : toText(value, format);

      if (!text) {
        setState({
          status: "error",
          message: "Nothing to copy",
        });
        return false;
      }

      let copied = false;

      try {
        if (
          typeof navigator !== "undefined" &&
          navigator.clipboard &&
          typeof navigator.clipboard.write === "function" &&
          typeof ClipboardItem !== "undefined"
        ) {
          const blob = new Blob([text], { type: mimeType });
          await navigator.clipboard.write([new ClipboardItem({ [mimeType]: blob })]);
          copied = true;
        } else if (
          typeof navigator !== "undefined" &&
          navigator.clipboard &&
          typeof navigator.clipboard.writeText === "function"
        ) {
          await navigator.clipboard.writeText(text);
          copied = true;
        } else {
          copied = fallbackCopyText(text);
        }
      } catch {
        copied = fallbackCopyText(text);
      }

      if (copied) {
        setState({ status: "success", message: "Copied to clipboard" });

        if (timeoutRef.current) {
          window.clearTimeout(timeoutRef.current);
        }

        timeoutRef.current = window.setTimeout(() => {
          clearState();
        }, successDurationMs);

        return true;
      }

      setState({ status: "error", message: "Copy failed" });
      return false;
    },
    [clearState]
  );

  return {
    copy,
    status: state.status,
    message: state.message,
    clearState,
  };
}

export default useCopyToClipboard;
