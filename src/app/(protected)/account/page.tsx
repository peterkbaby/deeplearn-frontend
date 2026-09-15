"use client";

import { ShieldCheck } from "lucide-react";
import { ProfilePhotoManager } from "@/components/profile-photo-manager";
import { useAppSelector } from "@/store/hooks";

export default function Account() {
  const user = useAppSelector((state) => state.auth.user);
  if (!user) return null;
  return (
    <div className="account-page">
      <span className="eyebrow">YOUR CORNER OF STILL</span>
      <h1>The essentials.</h1>
      <p className="page-subtitle">A few details that make this space yours.</p>
      <section className="profile-card">
        <div className="profile-summary">
          <ProfilePhotoManager />
          <div>
            <h2>{user.name}</h2>
            <p>{user.username ? `@${user.username}` : "Still member"}</p>
          </div>
          <span className="status-pill">
            <ShieldCheck size={13} /> Signed in
          </span>
        </div>
        <dl className="profile-details">
          <div>
            <dt>Email address</dt>
            <dd>{user.email}</dd>
          </div>
          <div>
            <dt>Member since</dt>
            <dd>
              {new Intl.DateTimeFormat("en", {
                month: "long",
                year: "numeric",
                timeZone: "UTC",
              }).format(new Date(user.created_at))}
            </dd>
          </div>
          <div>
            <dt>Sign-in method</dt>
            <dd className="capitalize">{user.provider}</dd>
          </div>
        </dl>
      </section>
      <p className="account-note">
        <ShieldCheck size={15} /> Your details are verified with the sign-in
        service.
      </p>
    </div>
  );
}
