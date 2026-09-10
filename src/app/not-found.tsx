import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main" className="center-page">
      <div className="center-card">
        <span className="eyebrow">404 / A LITTLE OFF TRACK</span>
        <h1>A quieter corner.</h1>
        <p>There’s nothing here yet. Let’s take you back.</p>
        <Link className="button primary" href="/play">
          Back to your space
        </Link>
      </div>
    </main>
  );
}
