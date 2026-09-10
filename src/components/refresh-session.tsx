"use client";
import { useEffect, useRef, useState } from "react";
import { LoaderCircle } from "lucide-react";
export function RefreshSession({ next }: { next: string }) {
  const [error, setError] = useState("");
  const started = useRef(false);
  async function refresh() {
    setError("");
    const run = async () => {
      try {
        const response = await fetch("/api/session/refresh", {
          method: "POST",
          signal: AbortSignal.timeout(30_000),
        });
        const data = await response.json();
        if (data.expired) {
          window.location.replace(
            `/login?expired=1&next=${encodeURIComponent(next)}`,
          );
          return;
        }
        if (!response.ok) {
          setError(data.error || "We couldn’t reconnect. Try again.");
          return;
        }
        window.location.replace(next);
      } catch {
        setError("We couldn’t reconnect. Check your connection and try again.");
      }
    };
    // Serialize rotating-cookie refreshes across tabs where the Web Locks API is available.
    if (navigator.locks)
      await navigator.locks.request("still-session-refresh", run);
    else await run();
  }
  useEffect(() => {
    if (!started.current) {
      started.current = true;
      void refresh();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="center-card">
      {error ? (
        <>
          <h1>A small interruption.</h1>
          <p role="alert">{error}</p>
          <button className="button primary" onClick={refresh}>
            Try again
          </button>
        </>
      ) : (
        <>
          <LoaderCircle className="spin" size={25} />
          <h1>Just a moment.</h1>
          <p>Reconnecting you to your space.</p>
        </>
      )}
    </div>
  );
}
