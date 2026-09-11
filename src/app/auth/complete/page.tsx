import { Suspense } from "react";
import { AuthCompleteClient } from "@/components/auth-complete-client";

export default function AuthComplete() {
  return (
    <Suspense fallback={<Fallback />}>
      <AuthCompleteClient />
    </Suspense>
  );
}

function Fallback() {
  return (
    <main id="main" className="center-page">
      <div className="center-card">
        <span className="eyebrow">PREPARING YOUR SPACE…</span>
      </div>
    </main>
  );
}
