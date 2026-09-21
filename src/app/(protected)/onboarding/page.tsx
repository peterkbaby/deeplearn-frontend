"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { OnboardingForm } from "@/components/forms";
import { useAppSelector } from "@/store/hooks";

export default function Onboarding() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  useEffect(() => {
    if (user?.onboarding) router.replace("/play");
  }, [router, user]);
  if (!user || user.onboarding) return null;
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
