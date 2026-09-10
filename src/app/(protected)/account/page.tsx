import { ApiError } from "@/lib/api";
import { profilePicSchema } from "@/lib/contracts";
import { authorizedApi, requireUser } from "@/lib/session";
import { ProfilePhotoManager } from "@/components/profile-photo-manager";
import { ShieldCheck } from "lucide-react";
export const metadata = { title: "Your account" };
export default async function Account() {
  const user = await requireUser("/account");
  let photo: string | null = null;
  // Always request the dedicated endpoint when Account renders. It is the
  // source of truth and can return a fresh signed URL for the current image.
  try {
    const response = await authorizedApi("/profile/pic");
    const profile = profilePicSchema.parse(response.data);
    if (
      profile.profile_pic_url.startsWith("http://") ||
      profile.profile_pic_url.startsWith("https://")
    ) {
      photo = profile.profile_pic_url;
    }
  } catch (error) {
    // 404 means the user has no photo yet; retain the initials fallback.
    if (!(error instanceof ApiError && error.status === 404)) throw error;
  }
  return (
    <div className="account-page">
      <span className="eyebrow">YOUR CORNER OF STILL</span>
      <h1>The essentials.</h1>
      <p className="page-subtitle">A few details that make this space yours.</p>
      <section className="profile-card">
        <div className="profile-summary">
          <ProfilePhotoManager photo={photo} name={user.name} compact />
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
