# Clipboard Copy API

Bridge Watch provides reusable copy-to-clipboard primitives for hashes, addresses, values, and shareable links.

## One-click button

```tsx
import CopyButton from "../components/CopyButton";

<CopyButton
  value={transaction.txHash}
  label="Copy"
  copiedLabel="Copied"
  failedLabel="Failed"
  ariaLabel="Copy transaction hash"
/>
```

## Inline copy trigger

```tsx
<CopyButton
  value={transaction.senderAddress}
  variant="inline"
  label="Copy"
  copiedLabel="Copied"
  failedLabel="Failed"
  ariaLabel="Copy sender address"
/>
```

## Copy formatted data

```tsx
<CopyButton
  value={transaction}
  format="pretty-json"
  mimeType="application/json"
  label="JSON"
  copiedLabel="Copied"
  failedLabel="Failed"
  ariaLabel="Copy transaction as JSON"
/>
```

## Hook usage

```tsx
import { useCopyToClipboard } from "../hooks/useCopyToClipboard";

function Example() {
  const { copy, status, message } = useCopyToClipboard();

  async function handleCopyCsv() {
    await copy([
      ["source", "price"],
      ["sdex", "0.9998"],
    ], { format: "csv" });
  }

  return (
    <>
      <button type="button" onClick={() => void handleCopyCsv()}>
        Copy CSV
      </button>
      <p aria-live="polite">{status === "idle" ? "" : message}</p>
    </>
  );
}
```

## Supported formats

- text
- url
- json
- pretty-json
- csv

## Keyboard support

The copy button supports keyboard activation and focused shortcut copy with Ctrl+C (Windows/Linux) and Cmd+C (macOS).

## Mobile support

The default copy button uses a minimum touch target height and works with the Clipboard API in modern mobile browsers.
