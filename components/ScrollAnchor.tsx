"use client";

import { useEffect, useRef } from "react";

export default function ScrollAnchor() {
  const anchor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    anchor.current?.scrollIntoView({ block: "end" });
  }, []);

  return <div ref={anchor} />;
}
