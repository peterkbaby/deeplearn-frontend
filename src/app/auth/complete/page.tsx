"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { LoaderCircle } from "lucide-react";

export default function AuthComplete() {
  const params = useSearchParams();
  useEffect(() => {
    const token = params.get("access_token");
    if (!token) {
      window.location.replace("/login?oauth_error=1");
      return;
    }
    localStorage.setItem("still_access", token);
    window.history.replaceState({}, "", "/auth/complete");
    window.location.replace("/play");
  }, [params]);
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
