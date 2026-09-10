"use client";
import Link from "next/link";
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main id="main" className="center-page">
      <div className="center-card">
        <span className="eyebrow">A SMALL INTERRUPTION</span>
        <h1>Let’s try that again.</h1>
        <p>We couldn’t load your space. Give it another moment.</p>
        <button className="button primary" onClick={reset}>
          Try again
        </button>
        <Link className="text-button" href="/login">
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
