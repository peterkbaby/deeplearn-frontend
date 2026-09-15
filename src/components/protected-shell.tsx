"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { LoaderCircle } from "lucide-react";
import { Brand } from "@/components/brand";
import { Navigation } from "@/components/navigation";
import { LogoutButton } from "@/components/forms";
import { useAppSelector } from "@/store/hooks";

export function ProtectedShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const status = useAppSelector((state) => state.auth.status);

  useEffect(() => {
    if (status === "anonymous")
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
  }, [pathname, router, status]);

  if (status !== "authenticated")
    return (
      <main className="center-page" id="main">
        <div className="center-card">
          <LoaderCircle className="spin" size={25} />
          <h1>Preparing your space.</h1>
        </div>
      </main>
    );

  return (
    <div className="app-shell">
      <header className="app-header">
        <Brand />
        <Navigation />
        <LogoutButton />
      </header>
      <main className="app-main" id="main">
        {children}
      </main>
      <footer className="app-footer">
        <span>A little less noise. A little more you.</span>
        <span>STILL / TAKE YOUR TIME</span>
      </footer>
    </div>
  );
}
