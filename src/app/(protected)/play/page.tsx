import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { MemoryGame } from "@/components/memory-game";
export const metadata = { title: "A moment to play" };
export default async function Play() {
  const user = await requireUser("/play");
  if (!user.onboarding) redirect("/onboarding");
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
