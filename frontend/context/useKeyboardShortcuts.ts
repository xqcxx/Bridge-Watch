import { useEffect, useRef, useState } from "react";
import { useShortcuts } from "../context/ShortcutContext";

type ShortcutHandler = () => void;

export const useKeyboardShortcuts = (
  handlers: Record<string, ShortcutHandler>
) => {
  const { shortcuts, setHelpOpen } = useShortcuts();
  const [sequence, setSequence] = useState<string[]>([]);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // 1. Ignore if typing in input fields
      const target = event.target as HTMLElement;
      const isInput =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;

      if (isInput) return;

      const key = event.key.toLowerCase();
      const newSequence = [...sequence, key];
      const sequenceString = newSequence.join(" ");

      // 2. Clear sequence timer
      if (timerRef.current) clearTimeout(timerRef.current);

      // 3. Match sequence against defined shortcuts
      const matchedShortcut = shortcuts.find(
        (s) => s.keys.toLowerCase() === sequenceString
      );

      if (matchedShortcut) {
        // Check if a handler is registered for this ID
        if (handlers[matchedShortcut.id]) {
          event.preventDefault();
          handlers[matchedShortcut.id]();
          setSequence([]); // Reset after successful trigger
          return;
        }

        // Global handler for help
        if (matchedShortcut.id === "general-help") {
          event.preventDefault();
          setHelpOpen(true);
          setSequence([]);
          return;
        }

        // If it matched a shortcut but no handler is registered for it here,
        // we should still clear the sequence state.
        setSequence([]);
      }

      // 4. Check if current sequence is a prefix of any shortcut
      const isPrefix = shortcuts.some((s) =>
        s.keys.toLowerCase().startsWith(sequenceString)
      );

      if (isPrefix) {
        setSequence(newSequence);
        // Reset sequence if no second key is pressed within 1 second
        timerRef.current = setTimeout(() => {
          setSequence([]);
        }, 1000);
      } else {
        // Reset if it doesn't match a prefix
        setSequence([]);

        // Try matching a single key if the sequence failed
        const singleMatch = shortcuts.find((s) => s.keys.toLowerCase() === key);
        if (singleMatch && handlers[singleMatch.id]) {
          event.preventDefault();
          handlers[singleMatch.id]();
        } else if (singleMatch?.id === "general-help") {
          event.preventDefault();
          setHelpOpen(true);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [sequence, shortcuts, handlers, setHelpOpen]);
};
