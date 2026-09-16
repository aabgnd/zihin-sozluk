"use client";

import { useEffect, useState } from "react";
import { MoonIcon, SunIcon } from "./icons";

export default function ThemeToggle({ className }: { className: string }) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const root = document.documentElement;
    const next = !root.classList.contains("dark");
    root.classList.toggle("dark", next);
    root.style.colorScheme = next ? "dark" : "light";
    try {
      localStorage.setItem("tema", next ? "koyu" : "acik");
    } catch {
      // gizli sekmede localStorage kapalı olabilir; tema yine de bu sekmede değişir.
    }
    setIsDark(next);
  };

  const label = isDark ? "açık moda geç" : "karanlık moda geç";

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={isDark}
      aria-label={label}
      title={label}
      className={className}
    >
      {isDark ? (
        <SunIcon className="size-5" />
      ) : (
        <MoonIcon className="size-5" />
      )}
    </button>
  );
}
