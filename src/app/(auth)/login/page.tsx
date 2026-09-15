import type { Metadata } from "next";
import { LockKeyhole } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
import { safeDestination } from "@/lib/contracts";
export const metadata: Metadata = { title: "Welcome back" };
export default async function Login({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  return (
    <div className="auth-content">
      <span className="section-number">01 / YOUR SPACE</span>
      <div className="heading-group">
        <h1>Welcome back.</h1>
        <p>Good to see you. Make yourself at home.</p>
      </div>
      {params.registered === "1" && (
        <p className="notice success" role="status">
          Your account is ready. Sign in to make it yours.
        </p>
      )}
      {params.expired === "1" && (
        <p className="notice" role="status">
          Your session has ended. Sign in to continue.
        </p>
      )}
      {params.loggedOut === "1" && (
        <p className="notice success" role="status">
          You’ve signed out. See you again soon.
        </p>
      )}
      {params.oauth_error === "1" && (
        <p className="notice error" role="alert">
          Google sign-in couldn’t be completed. Please try again.
        </p>
      )}
      <AuthForm mode="login" next={safeDestination(params.next)} />
      <div className="secure-note">
        <LockKeyhole size={13} />
        <span>Your space, securely yours.</span>
      </div>
    </div>
  );
}
