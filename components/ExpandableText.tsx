"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

// Uzun entry'ler kısalır; "devamını oku" yerinde açar.
// Yükseklik satır yüksekliğinin tam katı: son satır yarım kesilmez.
const COLLAPSED_LINES = 9;
const LINE_HEIGHT_EM = 1.7;
const COLLAPSED_HEIGHT_EM = COLLAPSED_LINES * LINE_HEIGHT_EM;

export default function ExpandableText({ children }: { children: ReactNode }) {
  const [expanded, setExpanded] = useState(false);
  const [needsToggle, setNeedsToggle] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = box.current;
    if (!element) return;
    const collapsedPx = COLLAPSED_HEIGHT_EM * parseFloat(getComputedStyle(element).fontSize);
    setNeedsToggle(element.scrollHeight > collapsedPx + 8);
  }, []);

  return (
    <div>
      <div
        ref={box}
        className="overflow-hidden"
        style={
          expanded || !needsToggle ? undefined : { maxHeight: `${COLLAPSED_HEIGHT_EM}em` }
        }
      >
        {children}
      </div>
      {needsToggle && !expanded && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className="mt-1 text-sm italic text-muted hover:text-ink"
        >
          devamını oku
        </button>
      )}
    </div>
  );
}
