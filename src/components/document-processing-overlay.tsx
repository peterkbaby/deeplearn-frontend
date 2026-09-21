"use client";

import { useEffect, useState } from "react";
import { FileText, Sparkles } from "lucide-react";

const stages = [
  ["Securing upload", "Preparing the document for analysis"],
  ["Reading pages", "Detecting structure, sections, and layout"],
  ["Extracting text", "Turning every page into searchable content"],
  ["Mapping concepts", "Finding themes, entities, and relationships"],
  ["Building intelligence", "Creating semantic document memory"],
  ["Writing summary", "Distilling the ideas that matter"],
] as const;

export function DocumentProcessingOverlay({ filename }: { filename: string }) {
  const [activeStage, setActiveStage] = useState(0);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const timer = window.setInterval(() => {
      setActiveStage((current) => Math.min(current + 1, stages.length - 1));
    }, 2600);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.clearInterval(timer);
    };
  }, []);

  return (
    <div
      className="processing-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="processing-title"
      aria-describedby="processing-description"
    >
      <div className="processing-panel">
        <div className="processing-visual" aria-hidden="true">
          <span className="processing-orb">
            <Sparkles size={18} />
          </span>
          <span className="processing-wave wave-one" />
          <span className="processing-wave wave-two" />
          <span className="processing-wave wave-three" />
        </div>
        <span className="processing-kicker">DocMind is reading</span>
        <h2 id="processing-title">Turning pages into understanding.</h2>
        <p id="processing-description">
          Keep this page open while the document is uploaded, parsed, and
          prepared for questions.
        </p>
        <div className="processing-file">
          <FileText size={16} /> <span>{filename}</span>
        </div>
        <div className="processing-stages" aria-live="polite">
          {stages.map(([label, detail], index) => {
            const state =
              index < activeStage
                ? "complete"
                : index === activeStage
                  ? "active"
                  : "waiting";
            return (
              <div className={`processing-stage ${state}`} key={label}>
                <span className="processing-stage-mark" aria-hidden="true" />
                <div>
                  <strong>{label}</strong>
                  <small>{detail}</small>
                </div>
                <span className="processing-stage-status">
                  {state === "complete"
                    ? "Done"
                    : state === "active"
                      ? "Working"
                      : "Waiting"}
                </span>
              </div>
            );
          })}
        </div>
        <p className="processing-note">
          Please don’t close or navigate away from this page.
        </p>
      </div>
    </div>
  );
}
