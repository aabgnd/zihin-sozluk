"use client";

import { useState } from "react";
import { SearchIcon, XIcon } from "./icons";
import SearchForm from "./SearchForm";

export default function MobileSearch({ buttonClassName }: { buttonClassName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        aria-label={open ? "aramayı kapat" : "ara"}
        aria-expanded={open}
        className={buttonClassName}
      >
        {open ? <XIcon className="size-6" /> : <SearchIcon className="size-6" />}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-20 border-b border-line bg-surface px-4 py-3">
          <SearchForm inputId="q-mobil" className="flex" autoFocus />
        </div>
      )}
    </>
  );
}
