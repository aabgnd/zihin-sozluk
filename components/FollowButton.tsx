"use client";

import { useOptimistic, useTransition } from "react";
import { followUser, unfollowUser } from "@/app/yazar/actions";

export default function FollowButton({
  targetId,
  isFollowing,
}: {
  targetId: string;
  isFollowing: boolean;
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

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={pending}
      aria-pressed={optimisticFollowing}
      className={`flex h-10 items-center rounded-lg px-4 text-sm font-bold disabled:opacity-70 ${
        optimisticFollowing
          ? "border border-line text-ink hover:bg-page"
          : "bg-gold text-on-gold hover:brightness-95"
      }`}
    >
      {optimisticFollowing ? "takipten çık" : "takip et"}
    </button>
  );
}
