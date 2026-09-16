type IconProps = { className?: string };

// Dolgulu (filled) aile: sarı zemin üzerinde net okunur.
const solid = {
  viewBox: "0 0 24 24",
  fill: "currentColor",
  "aria-hidden": true,
} as const;

// Doğası gereği çizgi olan ikonlar (ok, çarpı) kalın çizgiyle aynı aileye uyar.
const stroke = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export function MessageIcon({ className }: IconProps) {
  return (
    <svg {...solid} className={className}>
      <path d="M12 3C6.5 3 2.5 6.6 2.5 11c0 2.3 1.1 4.4 3 5.8l-.9 3.6a.6.6 0 0 0 .9.7l3.9-2.1c.8.2 1.7.3 2.6.3 5.5 0 9.5-3.6 9.5-8.3S17.5 3 12 3Z" />
    </svg>
  );
}

export function BellIcon({ className }: IconProps) {
  return (
    <svg {...solid} className={className}>
      <path d="M12 2.2a5.8 5.8 0 0 0-5.8 5.8c0 3.4-.7 5.3-1.6 6.5-.6.8 0 2 1 2h12.8c1 0 1.6-1.2 1-2-.9-1.2-1.6-3.1-1.6-6.5A5.8 5.8 0 0 0 12 2.2Z" />
      <path d="M9.4 18.4a2.7 2.7 0 0 0 5.2 0H9.4Z" />
    </svg>
  );
}

export function MoonIcon({ className }: IconProps) {
  return (
    <svg {...solid} className={className}>
      <path d="M21.2 13.4A9.2 9.2 0 1 1 10.6 2.8a7.3 7.3 0 0 0 10.6 10.6Z" />
    </svg>
  );
}

export function SunIcon({ className }: IconProps) {
  return (
    <svg {...solid} className={className}>
      <circle cx="12" cy="12" r="5" />
      <path d="M11 1.6h2v3.2h-2zM11 19.2h2v3.2h-2zM1.6 11h3.2v2H1.6zM19.2 11h3.2v2h-3.2zM3.9 5.3l1.4-1.4 2.3 2.3-1.4 1.4zM16.4 17.8l1.4-1.4 2.3 2.3-1.4 1.4zM6.2 16.4l1.4 1.4-2.3 2.3-1.4-1.4zM18.7 3.9l1.4 1.4-2.3 2.3-1.4-1.4z" />
    </svg>
  );
}

export function InfoIcon({ className }: IconProps) {
  return (
    <svg {...solid} className={className}>
      {/* Daire dolu, "i" harfi delik: her zemin üzerinde okunur. */}
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm-1.3 8.2h2.6v7.2h-2.6v-7.2Zm0-3.8h2.6v2.6h-2.6V6.4Z"
      />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg {...solid} className={className}>
      <circle cx="12" cy="8" r="4.3" />
      <path d="M12 13.6c-4.2 0-7.6 2.6-7.6 5.8 0 .9.7 1.6 1.6 1.6h12c.9 0 1.6-.7 1.6-1.6 0-3.2-3.4-5.8-7.6-5.8Z" />
    </svg>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <svg {...solid} className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M13.9 2.2h-3.8l-.5 2.3c-.6.2-1.2.5-1.7.9L5.7 4.6 3.8 7.9l1.8 1.5c-.1.6-.1 1.2 0 1.8L3.8 12.7l1.9 3.3 2.2-.8c.5.4 1.1.7 1.7.9l.5 2.3h3.8l.5-2.3c.6-.2 1.2-.5 1.7-.9l2.2.8 1.9-3.3-1.8-1.5c.1-.6.1-1.2 0-1.8l1.8-1.5-1.9-3.3-2.2.8c-.5-.4-1.1-.7-1.7-.9l-.5-2.3ZM12 8.6a3.4 3.4 0 1 0 0 6.8 3.4 3.4 0 0 0 0-6.8Z"
      />
    </svg>
  );
}

export function StarIcon({ className }: IconProps) {
  return (
    <svg {...solid} className={className}>
      <path d="m12 2.6 3 6.1 6.7.9-4.9 4.7 1.2 6.7L12 17.8l-6 3.2 1.2-6.7-4.9-4.7 6.7-.9 3-6.1Z" />
    </svg>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg {...solid} className={className}>
      <path d="M12 2.2 4.6 5.3v6.1c0 4.7 3.1 8.4 7.4 9.6 4.3-1.2 7.4-4.9 7.4-9.6V5.3L12 2.2Z" />
    </svg>
  );
}

export function FlagIcon({ className }: IconProps) {
  return (
    <svg {...solid} className={className}>
      <path d="M5.2 2.2c.7 0 1.2.5 1.2 1.2v17.2c0 .7-.5 1.2-1.2 1.2S4 21.3 4 20.6V3.4c0-.7.5-1.2 1.2-1.2Z" />
      <path d="M8 4h9.6c.9 0 1.4 1 .9 1.7L16.6 8.5l1.9 2.8c.5.7 0 1.7-.9 1.7H8V4Z" />
    </svg>
  );
}

export function HeartIcon({ className, filled = false }: IconProps & { filled?: boolean }) {
  if (filled) {
    return (
      <svg {...solid} className={className}>
        <path d="M12 20.6 4 12.9a4.9 4.9 0 0 1 8-5.5 4.9 4.9 0 0 1 8 5.5l-8 7.7Z" />
      </svg>
    );
  }
  return (
    <svg {...stroke} className={className}>
      <path d="M19.6 12.6 12 20l-7.6-7.4A4.7 4.7 0 0 1 12 6.1a4.7 4.7 0 0 1 7.6 6.5Z" />
    </svg>
  );
}

export function LogOutIcon({ className }: IconProps) {
  return (
    <svg {...stroke} className={className}>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="m10 17-5-5 5-5" />
      <path d="M5 12h11" />
    </svg>
  );
}

export function ChevronUpIcon({ className }: IconProps) {
  return (
    <svg {...stroke} className={className}>
      <path d="m6 15 6-6 6 6" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg {...stroke} className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function SearchIcon({ className }: IconProps) {
  return (
    <svg {...solid} className={className}>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.8 3a7.8 7.8 0 1 0 4.7 14l4.3 4.3a1.2 1.2 0 0 0 1.7-1.7L17.2 15A7.8 7.8 0 0 0 10.8 3Zm0 2.4a5.4 5.4 0 1 1 0 10.8 5.4 5.4 0 0 1 0-10.8Z"
      />
    </svg>
  );
}

export function ShareIcon({ className }: IconProps) {
  return (
    <svg {...stroke} className={className}>
      <path d="M12 15V4" />
      <path d="m8 7.5 4-3.5 4 3.5" />
      <path d="M5 12v6.5a1.5 1.5 0 0 0 1.5 1.5h11a1.5 1.5 0 0 0 1.5-1.5V12" />
    </svg>
  );
}

export function MoreIcon({ className }: IconProps) {
  return (
    <svg {...solid} className={className}>
      <circle cx="5.5" cy="12" r="1.8" />
      <circle cx="12" cy="12" r="1.8" />
      <circle cx="18.5" cy="12" r="1.8" />
    </svg>
  );
}

export function ArrowUpIcon({ className }: IconProps) {
  return (
    <svg {...stroke} className={className}>
      <path d="M12 19V5" />
      <path d="m5 12 7-7 7 7" />
    </svg>
  );
}

export function XIcon({ className }: IconProps) {
  return (
    <svg {...stroke} className={className}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
