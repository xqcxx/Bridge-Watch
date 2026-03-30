import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useCopyToClipboard } from "./useCopyToClipboard";

function HookHarness() {
  const { copy, status } = useCopyToClipboard();

  return (
    <div>
      <button
        type="button"
        onClick={() => {
          void copy({ bridge: "Stellar", amount: 12.4 }, { format: "pretty-json" });
        }}
      >
        Copy JSON
      </button>
      <span data-testid="status">{status}</span>
    </div>
  );
}

describe("useCopyToClipboard", () => {
  beforeEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it("copies formatted payloads with pretty JSON", async () => {
    render(<HookHarness />);

    fireEvent.click(screen.getByRole("button", { name: "Copy JSON" }));

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        '{\n  "bridge": "Stellar",\n  "amount": 12.4\n}'
      );
    });

    expect(screen.getByTestId("status")).toHaveTextContent("success");
  });
});
