"use client";

import { useOptimistic, useTransition } from "react";
import { followUser, unfollowUser } from "@/app/yazar/actions";

export default function FollowButton({
  targetId,
  isFollowing,
  size = "md",
}: {
  targetId: string;
  isFollowing: boolean;
  size?: "sm" | "md";
}) {
  const [optimisticFollowing, setOptimisticFollowing] =
    useOptimistic(isFollowing);
  const [pending, startTransition] = useTransition();

  const toggle = () => {
    startTransition(async () => {
      const next = !optimisticFollowing;
      setOptimisticFollowing(next);
      if (next) await followUser(targetId);
      else await unfollowUser(targetId);
    });
  };

  const sizeClass =
    size === "sm" ? "h-9 px-3 text-[13px]" : "h-10 px-4 text-sm";

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={optimisticFollowing}
      className={`flex items-center rounded-lg font-bold disabled:opacity-70 ${sizeClass} ${
        optimisticFollowing
          ? "border border-line text-ink hover:bg-page"
          : "bg-gold text-on-gold hover:brightness-95"
      }`}
    >
      {optimisticFollowing ? "takip ediliyor" : "takip et"}
    </button>
  );
}
