import { ReferenceArea } from "recharts";

export interface DeviationHighlightRange {
  x1: number;
  x2: number;
}

export interface DeviationHighlightOverlayProps {
  ranges: DeviationHighlightRange[];
}

export default function DeviationHighlightOverlay({
  ranges,
}: DeviationHighlightOverlayProps) {
  if (!ranges.length) return null;

  return (
    <>
      {ranges.map((r, idx) => (
        <ReferenceArea
          key={`${r.x1}-${r.x2}-${idx}`}
          x1={r.x1}
          x2={r.x2}
          ifOverflow="hidden"
          fill="#FF6B35"
          fillOpacity={0.12}
          strokeOpacity={0}
        />
      ))}
    </>
  );
}
