"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Chrome, Eye, EyeOff, LoaderCircle } from "lucide-react";
import { setSession } from "@/store/auth-slice";
import { useAppDispatch } from "@/store/hooks";
import { clientApi, ClientApiError } from "@/lib/client-api";
import { userSchema } from "@/lib/contracts";

type AuthMode = "login" | "register";

export function AuthForm({
  mode,
  next = "/play",
}: {
  mode: AuthMode;
  next?: string;
}) {
  const router = useRouter();
  const dispatch = useAppDispatch();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const isLogin = mode === "login";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    const form = new FormData(event.currentTarget);
    const payload = Object.fromEntries(form);

    try {
      if (isLogin) {
        const response = await clientApi.post("/login", payload);
        const token = response.data.access_token;
        if (typeof token !== "string")
          throw new Error(
            "The sign-in service returned an incomplete session.",
          );
        localStorage.setItem("still_access", token);
        const profile = await clientApi.get("/me");
        dispatch(
          setSession({
            accessToken: token,
            user: userSchema.parse(profile.data),
          }),
        );
        router.replace(next);
        return;
      }
      await clientApi.post("/register", payload);
      router.replace("/login?registered=1");
    } catch (error) {
      setError(
        error instanceof ClientApiError || error instanceof Error
          ? error.message
          : "We couldn’t complete that request. Please try again.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <form className="auth-form" onSubmit={submit}>
      {error && (
        <p className="notice error" role="alert">
          {error}
        </p>
      )}
      <fieldset disabled={pending}>
        <a className="button google-button full" href="/auth/google">
          <Chrome size={17} /> Continue with Google
        </a>
        <div className="form-divider">
          <span>or continue with email</span>
        </div>
        {!isLogin && (
          <label className="field">
            <span>Your name</span>
            <input
              name="name"
              placeholder="Alex Morgan"
              autoComplete="name"
              required
              maxLength={100}
            />
          </label>
        )}
        <label className="field">
          <span>Email address</span>
          <input
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
            maxLength={256}
          />
        </label>
        <label className="field">
          <span>Password</span>
          <span className="input-wrap">
            <input
              name="password"
              type={passwordVisible ? "text" : "password"}
              placeholder={
                isLogin ? "Enter your password" : "Create a password"
              }
              autoComplete={isLogin ? "current-password" : "new-password"}
              required
              minLength={isLogin ? 1 : 6}
              maxLength={256}
            />
            <button
              type="button"
              className="password-toggle"
              aria-label={passwordVisible ? "Hide password" : "Show password"}
              onClick={() => setPasswordVisible((visible) => !visible)}
            >
              {passwordVisible ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </span>
        </label>
        {!isLogin && (
          <p className="field-hint">
            6+ characters with uppercase, lowercase, and a number.
          </p>
        )}
        <button className="button primary full" type="submit">
          {pending ? (
            <>
              <LoaderCircle className="spin" size={17} />
              {isLogin ? "Signing in…" : "Creating your account…"}
            </>
          ) : (
            <>
              {isLogin ? "Sign in" : "Create account"}
              <ArrowRight size={17} />
            </>
          )}
        </button>
      </fieldset>
      <p className="form-switch">
        {isLogin ? "New here?" : "Already have an account?"}{" "}
        <Link href={isLogin ? "/register" : "/login"}>
          {isLogin ? "Create an account" : "Sign in"}
          <ArrowRight size={13} />
        </Link>
      </p>
    </form>
  );
}
