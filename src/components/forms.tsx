"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle, LogOut } from "lucide-react";
import { clearAuth } from "@/store/auth-slice";
import { useAppDispatch } from "@/store/hooks";

export function LogoutButton() {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    setPending(true);
    setError("");
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      localStorage.removeItem("still_access");
      dispatch(clearAuth());
      router.replace("/login?loggedOut=1");
      router.refresh();
    } catch {
      setError("We couldn’t sign you out. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="logout-form">
      <button
        className="icon-button"
        type="button"
        disabled={pending}
        aria-label="Sign out"
        title="Sign out"
        onClick={logout}
      >
        {pending ? (
          <LoaderCircle size={18} className="spin" />
        ) : (
          <LogOut size={18} />
        )}
      </button>
      {error && (
        <p className="logout-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function OnboardingForm() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      const response = await fetch("/api/user/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error || "We couldn’t save that name.");
        return;
      }
      router.replace("/play");
      router.refresh();
    } catch {
      setError("We couldn’t save that name. Please try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit}>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <fieldset disabled={pending}>
        <label className="field" htmlFor="username">
          Choose a username
          <input
            id="username"
            name="username"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            placeholder="alex_morgan"
            autoComplete="username"
            minLength={3}
            maxLength={24}
            required
          />
        </label>
        <p className="field-hint">3–24 letters, numbers, or underscores.</p>
        <button className="button primary full" type="submit">
          {pending ? (
            <>
              <LoaderCircle className="spin" size={17} />
              Saving…
            </>
          ) : (
            <>
              Let’s begin
              <ArrowRight size={17} />
            </>
          )}
        </button>
      </fieldset>
    </form>
  );
}
