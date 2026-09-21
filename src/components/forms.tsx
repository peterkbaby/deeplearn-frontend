"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, LoaderCircle, LogOut } from "lucide-react";
import { setUser } from "@/store/auth-slice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { clientApi, ClientApiError } from "@/lib/client-api";

export function LogoutButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function logout() {
    setPending(true);
    setError("");
    try {
      await clientApi.post("/logout");
      localStorage.removeItem("still_access");
      window.location.replace("/login?loggedOut=1");
    } catch (error) {
      setError(
        error instanceof ClientApiError
          ? error.message
          : "We couldn’t sign you out. Please try again.",
      );
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
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const [username, setUsername] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    try {
      await clientApi.post("/onboarding", { username });
      if (user) dispatch(setUser({ ...user, username, onboarding: true }));
      router.replace("/play");
      router.refresh();
    } catch (error) {
      setError(
        error instanceof ClientApiError
          ? error.message
          : "We couldn’t save that name. Please try again.",
      );
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
