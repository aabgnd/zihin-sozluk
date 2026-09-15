import Image from "next/image";

type Props = {
  username: string;
  url: string | null;
  size?: "sm" | "md" | "lg";
};

const SIZES = {
  sm: { px: 20, className: "size-5 text-[10px]" },
  md: { px: 36, className: "size-9 text-sm" },
  lg: { px: 56, className: "size-14 text-xl" },
};

export default function Avatar({ username, url, size = "sm" }: Props) {
  const { px, className } = SIZES[size];

  if (url) {
    return (
      <Image
        src={url}
        alt=""
        width={px}
        height={px}
        className={`${className} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={`${className} grid shrink-0 place-items-center rounded-full bg-gold font-bold uppercase text-on-gold`}
    >
      {username.charAt(0)}
    </span>
  );
}
