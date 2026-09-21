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
  const isDocmind = pathname.startsWith("/docmind");

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
    <div className={`app-shell ${isDocmind ? "docmind-shell" : ""}`}>
      <header className="app-header">
        <div className="app-brand-group">
          <Brand />
          {isDocmind && (
            <span className="docmind-product-label">Intelligence</span>
          )}
        </div>
        <Navigation />
        <LogoutButton />
      </header>
      <main className="app-main" id="main">
        {children}
      </main>
      <footer className="app-footer">
        <span>
          {isDocmind
            ? "Private document intelligence, shaped around your questions."
            : "A little less noise. A little more you."}
        </span>
        <span>{isDocmind ? "DOCMIND / STILL" : "STILL / TAKE YOUR TIME"}</span>
      </footer>
    </div>
  );
}
