import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { OnboardingForm } from "@/components/forms";
import { Sparkles } from "lucide-react";
export const metadata = { title: "Make it yours" };
export default async function Onboarding() {
  const user = await requireUser("/onboarding");
  if (user.onboarding) redirect("/play");
  return (
    <section className="onboarding-card">
      <div className="welcome-icon">
        <Sparkles size={26} />
      </div>
      <span className="eyebrow">ONE LAST LITTLE THING</span>
      <h1>Make it yours, {user.name.split(" ")[0]}.</h1>
      <p>Pick a name for your corner of Still.</p>
      <OnboardingForm />
    </section>
  );
}
