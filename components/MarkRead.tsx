"use client";

import { useEffect, useRef } from "react";

export default function MarkRead({ action }: { action: () => Promise<void> }) {
  const sent = useRef(false);

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    void action();
  }, [action]);

  return null;
}
