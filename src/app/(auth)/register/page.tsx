import type { Metadata } from "next";
import { LockKeyhole } from "lucide-react";
import { AuthForm } from "@/components/auth-form";
export const metadata: Metadata = { title: "Create your account" };
export default function Register() {
  return (
    <div className="auth-content">
      <span className="section-number">01 / A FRESH START</span>
      <div className="heading-group">
        <h1>A space of your own.</h1>
        <p>Start with the essentials. The rest can wait.</p>
      </div>
      <AuthForm mode="register" />
      <div className="secure-note">
        <LockKeyhole size={13} />
        <span>Your space, securely yours.</span>
      </div>
    </div>
  );
}
