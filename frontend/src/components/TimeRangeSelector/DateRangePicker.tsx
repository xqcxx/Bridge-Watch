import { useEffect, useMemo, useState } from "react";
import {
  fromInputDateTimeValue,
  toInputDateTimeValue,
  type TimeRangeSelection,
} from "../../utils/timeRange";

interface DateRangePickerProps {
  value?: TimeRangeSelection;
  onApply: (selection: TimeRangeSelection) => void;
  onClear: () => void;
}

function getShortcutRange(days: number): TimeRangeSelection {
  const now = new Date();
  const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

  return {
    start: start.toISOString(),
    end: now.toISOString(),
  };
}

export default function DateRangePicker({
  value,
  onApply,
  onClear,
}: DateRangePickerProps) {
  const initialStart = useMemo(() => toInputDateTimeValue(value?.start), [value?.start]);
  const initialEnd = useMemo(() => toInputDateTimeValue(value?.end), [value?.end]);

  const [start, setStart] = useState(initialStart);
  const [end, setEnd] = useState(initialEnd);

  useEffect(() => {
    setStart(initialStart);
    setEnd(initialEnd);
  }, [initialEnd, initialStart]);

  const isInvalid = Boolean(start && end && new Date(start) > new Date(end));
  const canApply = Boolean(start && end && !isInvalid);

  return (
    <div className="mt-3 space-y-3 rounded-md border border-stellar-border p-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="text-xs text-stellar-text-secondary">
          Start
          <input
            type="datetime-local"
            value={start}
            onChange={(event) => setStart(event.target.value)}
            className="mt-1 w-full rounded-md border border-stellar-border bg-stellar-dark px-3 py-2 text-sm text-white focus:border-stellar-blue focus:outline-none"
          />
        </label>
        <label className="text-xs text-stellar-text-secondary">
          End
          <input
            type="datetime-local"
            value={end}
            onChange={(event) => setEnd(event.target.value)}
            className="mt-1 w-full rounded-md border border-stellar-border bg-stellar-dark px-3 py-2 text-sm text-white focus:border-stellar-blue focus:outline-none"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => {
            const next = getShortcutRange(1);
            setStart(toInputDateTimeValue(next.start));
            setEnd(toInputDateTimeValue(next.end));
          }}
          className="rounded border border-stellar-border px-2 py-1 text-xs text-stellar-text-secondary hover:text-white"
        >
          Last 24H
        </button>
        <button
          type="button"
          onClick={() => {
            const next = getShortcutRange(7);
            setStart(toInputDateTimeValue(next.start));
            setEnd(toInputDateTimeValue(next.end));
          }}
          className="rounded border border-stellar-border px-2 py-1 text-xs text-stellar-text-secondary hover:text-white"
        >
          Last 7D
        </button>
        <button
          type="button"
          onClick={() => {
            const next = getShortcutRange(30);
            setStart(toInputDateTimeValue(next.start));
            setEnd(toInputDateTimeValue(next.end));
          }}
          className="rounded border border-stellar-border px-2 py-1 text-xs text-stellar-text-secondary hover:text-white"
        >
          Last 30D
        </button>
      </div>

      {isInvalid ? (
        <p className="text-xs text-red-400">Start date must be before end date.</p>
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => {
            if (!canApply) {
              return;
            }

            onApply({
              start: fromInputDateTimeValue(start),
              end: fromInputDateTimeValue(end),
            });
          }}
          disabled={!canApply}
          className="rounded bg-stellar-blue px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          Apply custom range
        </button>

        <button
          type="button"
          onClick={() => {
            setStart("");
            setEnd("");
            onClear();
          }}
          className="rounded border border-stellar-border px-3 py-1.5 text-xs text-stellar-text-secondary hover:text-white"
        >
          Clear custom
        </button>
      </div>
    </div>
  );
}
