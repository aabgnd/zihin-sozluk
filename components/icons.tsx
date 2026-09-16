type IconProps = { className?: string };

const base = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const;

export function ChevronUpIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m6 15 6-6 6 6" />
    </svg>
  );
}

export function ChevronDownIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function HeartIcon({
  className,
  filled = false,
}: IconProps & { filled?: boolean }) {
  return (
    <svg
      {...base}
      fill={filled ? "currentColor" : "none"}
      className={className}
    >
      <path d="M19.5 12.6 12 20l-7.5-7.4A4.6 4.6 0 0 1 12 6.1a4.6 4.6 0 0 1 7.5 6.5Z" />
    </svg>
  );
}

export function UserIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20a8 8 0 0 1 16 0" />
    </svg>
  );
}

export function LogOutIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3" />
      <path d="m10 17-5-5 5-5" />
      <path d="M5 12h11" />
    </svg>
  );
}

export function MessageIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M21 12a8 8 0 0 1-11.8 7L4 20l1.1-4.6A8 8 0 1 1 21 12Z" />
    </svg>
  );
}

export function BellIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.9 1.9 0 0 0 3.4 0" />
    </svg>
  );
}

export function SettingsIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19.9 14.2a1.6 1.6 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.6 1.6 0 0 0-1.8-.3 1.6 1.6 0 0 0-1 1.5v.2a2 2 0 1 1-4 0v-.1a1.6 1.6 0 0 0-1-1.5 1.6 1.6 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.6 1.6 0 0 0 .3-1.8 1.6 1.6 0 0 0-1.5-1H3.5a2 2 0 1 1 0-4h.1a1.6 1.6 0 0 0 1.5-1 1.6 1.6 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.6 1.6 0 0 0 1.8.3 1.6 1.6 0 0 0 1-1.5V3.5a2 2 0 1 1 4 0v.1a1.6 1.6 0 0 0 1 1.5 1.6 1.6 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.6 1.6 0 0 0-.3 1.8 1.6 1.6 0 0 0 1.5 1h.2a2 2 0 1 1 0 4h-.1a1.6 1.6 0 0 0-1.5 1Z" />
    </svg>
  );
}

export function InfoIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-4" />
      <path d="M12 8h.01" />
    </svg>
  );
}

export function SunIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4" />
    </svg>
  );
}

export function MoonIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

export function StarIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8l-5.8 3.1 1.1-6.5L2.6 9.8l6.5-.9L12 3Z" />
    </svg>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M12 3l7 3v6c0 4.5-3 8-7 9-4-1-7-4.5-7-9V6l7-3Z" />
    </svg>
  );
}

export function FlagIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M5 21V4" />
      <path d="M5 5h12l-2 3.5L17 12H5" />
    </svg>
  );
}

export function XIcon({ className }: IconProps) {
  return (
    <svg {...base} className={className}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}
