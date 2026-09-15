"use client";

import { useEffect } from "react";
import { LoaderCircle } from "lucide-react";
import { setSession } from "@/store/auth-slice";
import { useAppDispatch } from "@/store/hooks";
import { clientApi } from "@/lib/client-api";
import { userSchema } from "@/lib/contracts";
import { useRouter } from "next/navigation";

export function AuthCompleteClient() {
  const dispatch = useAppDispatch();
  const router = useRouter();
  useEffect(() => {
    const tokenFromFragment = new URLSearchParams(
      window.location.hash.slice(1),
    ).get("access_token");
    if (!tokenFromFragment) {
      router.replace("/login?oauth_error=1");
      return;
    }
    const token = tokenFromFragment;
    async function finish() {
      try {
        localStorage.setItem("still_access", token);
        const profile = await clientApi.get("/me");
        dispatch(
          setSession({
            accessToken: token,
            user: userSchema.parse(profile.data),
          }),
        );
        window.history.replaceState({}, "", "/auth/complete");
        router.replace("/play");
      } catch {
        localStorage.removeItem("still_access");
        router.replace("/login?oauth_error=1");
      }
    }
    void finish();
  }, [dispatch, router]);
  return (
    <main id="main" className="center-page">
      <div className="center-card">
        <LoaderCircle className="spin" size={25} />
        <h1>Just a moment.</h1>
        <p>Preparing your space.</p>
      </div>
    </main>
  );
}
