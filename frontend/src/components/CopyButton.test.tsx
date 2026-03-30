import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import CopyButton from "./CopyButton";

describe("CopyButton", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });

    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: vi.fn(() => true),
    });
  });

  it("copies plain text and shows success feedback", async () => {
    render(<CopyButton value="0xabc123" label="Copy hash" copiedLabel="Copied" />);

    fireEvent.click(screen.getByRole("button", { name: "Copy hash" }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("0xabc123");
    });

    expect(screen.getByRole("button", { name: "Copy hash" })).toHaveTextContent(
      "Copied"
    );
  });

  it("supports keyboard shortcut copy while focused", async () => {
    render(<CopyButton value="tx-42" label="Copy" />);

    const button = screen.getByRole("button", { name: "Copy" });
    fireEvent.keyDown(button, { key: "c", ctrlKey: true });

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith("tx-42");
    });
  });

  it("shows failed feedback if clipboard and fallback copy fail", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn().mockRejectedValue(new Error("copy denied")),
      },
    });

    Object.defineProperty(document, "execCommand", {
      configurable: true,
      value: vi.fn(() => false),
    });

    render(<CopyButton value="cannot-copy" label="Copy" failedLabel="Failed" />);

    fireEvent.click(screen.getByRole("button", { name: "Copy" }));

    await waitFor(() => {
      expect(screen.getByRole("button", { name: "Copy" })).toHaveTextContent(
        "Failed"
      );
    });
  });
});
