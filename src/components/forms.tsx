"use client";
import { useActionState, useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Eye,
  EyeOff,
  LoaderCircle,
  LogOut,
  Upload,
  Chrome,
} from "lucide-react";
import {
  loginAction,
  registerAction,
  logoutAction,
  onboardingAction,
  uploadAction,
} from "@/lib/actions";
import type { FormState } from "@/lib/contracts";
function Feedback({ state }: { state: FormState }) {
  return (
    <>
      {state.error && (
        <p className="notice error" role="alert">
          {state.error}
        </p>
      )}
      {state.success && (
        <p className="notice success" role="status">
          {state.success}
        </p>
      )}
    </>
  );
}
function Field({
  label,
  name,
  type = "text",
  placeholder,
  autoComplete,
  errors,
  minLength,
  maxLength,
}: {
  label: string;
  name: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  errors?: string[];
  minLength?: number;
  maxLength?: number;
}) {
  const [visible, setVisible] = useState(false);
  const [value, setValue] = useState("");
  return (
    <div className="field">
      <label htmlFor={name}>{label}</label>
      <div className="input-wrap">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          id={name}
          name={name}
          type={type === "password" && visible ? "text" : type}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          minLength={minLength}
          maxLength={maxLength}
          aria-invalid={!!errors?.length}
          aria-describedby={errors?.length ? `${name}-error` : undefined}
        />
        {type === "password" && (
          <button
            type="button"
            className="password-toggle"
            aria-label={visible ? "Hide password" : "Show password"}
            onClick={() => setVisible(!visible)}
          >
            {visible ? <EyeOff size={17} /> : <Eye size={17} />}
          </button>
        )}
      </div>
      {errors?.length ? (
        <p className="field-error" id={`${name}-error`}>
          {errors[0]}
        </p>
      ) : null}
    </div>
  );
}
export function AuthForm({
  mode,
  next = "/play",
}: {
  mode: "login" | "register";
  next?: string;
}) {
  const isLogin = mode === "login";
  const [state, action, pending] = useActionState(
    isLogin ? loginAction : registerAction,
    {},
  );
  useEffect(() => {
    if (state.accessToken) {
      localStorage.setItem("still_access", state.accessToken);
      window.location.assign(next);
    }
  }, [state.accessToken, next]);
  return (
    <form action={action} className="auth-form">
      <input type="hidden" name="next" value={next} />
      <Feedback state={state} />
      <fieldset disabled={pending}>
        <a className="button google-button full" href="/api/auth/google">
          <Chrome size={17} />
          Continue with Google
        </a>
        <div className="form-divider">
          <span>or continue with email</span>
        </div>
        {!isLogin && (
          <Field
            label="Your name"
            name="name"
            placeholder="Alex Morgan"
            autoComplete="name"
            maxLength={100}
            errors={state.fields?.name}
          />
        )}
        <Field
          label="Email address"
          name="email"
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          errors={state.fields?.email}
        />
        <Field
          label="Password"
          name="password"
          type="password"
          placeholder={isLogin ? "Enter your password" : "Create a password"}
          autoComplete={isLogin ? "current-password" : "new-password"}
          minLength={isLogin ? 1 : 6}
          maxLength={256}
          errors={state.fields?.password}
        />
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
export function LogoutButton() {
  const [state, action, pending] = useActionState(logoutAction, {});
  return (
    <form
      action={action}
      className="logout-form"
      onSubmit={() => localStorage.removeItem("still_access")}
    >
      <button
        className="icon-button"
        disabled={pending}
        aria-label="Sign out"
        title="Sign out"
      >
        {pending ? (
          <LoaderCircle size={18} className="spin" />
        ) : (
          <LogOut size={18} />
        )}
      </button>
      {state.error && (
        <p className="logout-error" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
export function OnboardingForm() {
  const [state, action, pending] = useActionState(onboardingAction, {});
  return (
    <form action={action}>
      <Feedback state={state} />
      <fieldset disabled={pending}>
        <Field
          label="Choose a username"
          name="username"
          placeholder="alex_morgan"
          autoComplete="username"
          minLength={3}
          maxLength={24}
          errors={state.fields?.username}
        />
        <p className="field-hint">
          3–24 letters, numbers, or underscores. Make it yours.
        </p>
        <button className="button primary full">
          {pending ? "Saving…" : "Let’s begin"}
          <ArrowRight size={17} />
        </button>
      </fieldset>
    </form>
  );
}
export function PhotoForm() {
  const [state, action, pending] = useActionState(uploadAction, {});
  return (
    <form action={action} className="photo-form">
      <Feedback state={state} />
      <label htmlFor="photo">Profile photo</label>
      <p className="field-hint">JPEG, PNG, or WebP. Up to 2 MB.</p>
      <input
        id="photo"
        name="file"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        required
        disabled={pending}
      />
      <button className="button secondary" disabled={pending}>
        <Upload size={15} />
        {pending ? "Uploading…" : "Update photo"}
      </button>
    </form>
  );
}
