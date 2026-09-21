"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
export function Navigation() {
  const path = usePathname();
  return (
    <nav aria-label="Main navigation">
      <Link
        prefetch={false}
        href="/play"
        className={path === "/play" ? "active" : ""}
        aria-current={path === "/play" ? "page" : undefined}
      >
        Play
      </Link>
      <Link
        prefetch={false}
        href="/docmind"
        className={path.startsWith("/docmind") ? "active" : ""}
        aria-current={path.startsWith("/docmind") ? "page" : undefined}
      >
        DocMind
      </Link>
      <Link
        prefetch={false}
        href="/account"
        className={path === "/account" ? "active" : ""}
        aria-current={path === "/account" ? "page" : undefined}
      >
        Account
      </Link>
    </nav>
  );
}
