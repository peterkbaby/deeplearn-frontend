"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { DocumentWorkspace } from "@/components/document-workspace";
import { useAppSelector } from "@/store/hooks";

const uuid =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function DocumentPage() {
  const params = useParams<{ documentId: string }>();
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const documentId = params.documentId;

  useEffect(() => {
    if (user && !user.onboarding) router.replace("/onboarding");
  }, [router, user]);

  if (!user || !user.onboarding) return null;
  if (!uuid.test(documentId))
    return (
      <div className="workspace-state error-state">
        <h1>That document link isn’t valid.</h1>
        <Link className="button secondary" href="/docmind">
          Back to documents
        </Link>
      </div>
    );

  return <DocumentWorkspace documentId={documentId} />;
}
