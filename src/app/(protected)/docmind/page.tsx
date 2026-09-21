"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { DocumentLibrary } from "@/components/document-library";
import { useAppSelector } from "@/store/hooks";

export default function DocmindPage() {
  const router = useRouter();
  const user = useAppSelector((state) => state.auth.user);
  const [documentCount, setDocumentCount] = useState<number | null>(null);
  const handleCountChange = useCallback((count: number) => {
    setDocumentCount(count);
  }, []);

  useEffect(() => {
    if (user && !user.onboarding) router.replace("/onboarding");
  }, [router, user]);

  if (!user || !user.onboarding) return null;

  return (
    <div
      className={`docmind-page ${documentCount && documentCount > 0 ? "has-documents" : ""}`}
    >
      <div className="docmind-ambient" aria-hidden="true">
        <span />
        <span />
      </div>
      <div className="docmind-heading">
        <div className="docmind-hero-copy">
          <span className="docmind-kicker">
            <Sparkles size={13} /> Document intelligence
          </span>
          <h1>
            {documentCount && documentCount > 0 ? (
              <>
                Your documents.
                <span>Ready to explore.</span>
              </>
            ) : (
              <>
                Understand anything.
                <span>Simply.</span>
              </>
            )}
          </h1>
          <p>
            {documentCount && documentCount > 0
              ? `${documentCount} ${documentCount === 1 ? "document" : "documents"}, organized and ready for questions.`
              : "A quiet place to read, distill, and ask better questions of the documents that matter."}
          </p>
        </div>
        <div className="ai-orb" aria-hidden="true">
          <span className="ai-orb-core" />
          <span className="ai-orb-ring" />
        </div>
      </div>
      <DocumentLibrary onCountChange={handleCountChange} />
    </div>
  );
}
