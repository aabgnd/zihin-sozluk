import type { InputHTMLAttributes } from "react";

type Props = {
  label: string;
  name: string;
} & InputHTMLAttributes<HTMLInputElement>;

export default function Field({ label, name, ...inputProps }: Props) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="block text-sm font-semibold">
        {label}
      </label>
      <input
        id={name}
        name={name}
        {...inputProps}
        className="block h-11 w-full rounded-sm border border-line bg-surface px-3 text-base focus:border-gold focus:outline-none"
      />
    </div>
  );
}
