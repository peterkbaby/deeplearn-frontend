"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { MemoryGame } from "@/components/memory-game";
import { useAppSelector } from "@/store/hooks";

export default function Play() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  useEffect(() => {
    if (user && !user.onboarding) router.replace("/onboarding");
  }, [router, user]);
  if (!user || !user.onboarding) return null;
  return (
    <>
      <div className="play-heading">
        <div>
          <span className="eyebrow">
            <span className="tiny-dot" /> YOUR DAILY EXHALE
          </span>
          <h1>A moment to play.</h1>
          <p>Welcome, {user.name.split(" ")[0]}. Leave the busy behind.</p>
        </div>
        <span className="edition">
          THE PLAY COLLECTION <span>—</span> NO. 001
        </span>
      </div>
      <MemoryGame userId={user.id} />
    </>
  );
}
