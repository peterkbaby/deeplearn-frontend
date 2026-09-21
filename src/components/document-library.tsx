"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, FileText, LoaderCircle, Upload } from "lucide-react";
import { DocumentProcessingOverlay } from "@/components/document-processing-overlay";
import { useToast } from "@/components/toast";
import { ClientApiError, docmindApi } from "@/lib/client-api";
import {
  type DocmindDocument,
  documentListSchema,
  documentUploadSchema,
} from "@/lib/docmind-contracts";

const MAX_FILE_SIZE = 50 * 1024 * 1024;

function messageFor(error: unknown) {
  if (!(error instanceof ClientApiError))
    return "We couldn’t load your documents.";
  if (error.status === 413)
    return "The upload was rejected by the server before DocMind could read it. The proxy upload limit must be at least 50 MB.";
  if (error.status === 422) return error.message;
  if (error.status === 429)
    return "You’ve reached the document limit. Please wait and try again.";
  return error.message;
}

export function DocumentLibrary({
  onCountChange,
}: {
  onCountChange?: (count: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const [documents, setDocuments] = useState<DocmindDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processingFilename, setProcessingFilename] = useState("");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  async function loadDocuments() {
    setLoading(true);
    setError("");
    try {
      const response = await docmindApi.get("/docmind/documents");
      const result = documentListSchema.parse(response.data);
      setDocuments(result.documents);
      onCountChange?.(result.documents.length);
    } catch (loadError) {
      const message = messageFor(loadError);
      setError(message);
      showToast(message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let active = true;
    docmindApi
      .get("/docmind/documents")
      .then((response) => {
        if (active) {
          const result = documentListSchema.parse(response.data);
          setDocuments(result.documents);
          onCountChange?.(result.documents.length);
        }
      })
      .catch((loadError) => {
        if (active) {
          const message = messageFor(loadError);
          setError(message);
          showToast(message);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [onCountChange, showToast]);

  useEffect(() => {
    if (!uploading) return;
    function warnBeforeLeaving(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = true;
    }
    window.addEventListener("beforeunload", warnBeforeLeaving);
    return () => window.removeEventListener("beforeunload", warnBeforeLeaving);
  }, [uploading]);

  async function uploadFile(file?: File) {
    if (!file || uploading) return;
    if (
      file.type !== "application/pdf" &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      const message = "Choose a PDF file to continue.";
      setError(message);
      showToast(message);
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      const message = "That PDF is larger than the 50 MB limit.";
      setError(message);
      showToast(message);
      return;
    }

    setProcessingFilename(file.name);
    setUploading(true);
    setError("");
    const form = new FormData();
    form.append("file", file);
    try {
      const response = await docmindApi.post("/docmind/documents/upload", form);
      const result = documentUploadSchema.parse(response.data);
      if (result.summary)
        sessionStorage.setItem(
          `docmind:summary:${result.data.id}`,
          JSON.stringify(result.summary),
        );
      const alreadyListed = documents.some(
        (document) => document.id === result.data.id,
      );
      setDocuments((current) => [
        result.data,
        ...current.filter((document) => document.id !== result.data.id),
      ]);
      onCountChange?.(documents.length + (alreadyListed ? 0 : 1));
      showToast("Document is ready to explore.", "success");
      if (inputRef.current) inputRef.current.value = "";
    } catch (uploadError) {
      const message = messageFor(uploadError);
      setError(message);
      showToast(message);
    } finally {
      setUploading(false);
      setProcessingFilename("");
    }
  }

  return (
    <>
      {uploading && processingFilename && (
        <DocumentProcessingOverlay filename={processingFilename} />
      )}
      <section
        className={`document-library ${documents.length > 0 ? "has-documents" : ""}`}
        aria-labelledby="documents-heading"
      >
        <div
          className={`document-upload ${dragging ? "dragging" : ""}`}
          onDragEnter={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            void uploadFile(event.dataTransfer.files[0]);
          }}
        >
          <div className="upload-copy">
            <span className="upload-icon">
              <Upload size={20} />
            </span>
            <div>
              <strong>Add a document</strong>
              <p>
                Drop a PDF here or choose one from your device. Up to 50 MB.
              </p>
            </div>
          </div>
          <input
            ref={inputRef}
            id="document-upload"
            type="file"
            accept="application/pdf,.pdf"
            disabled={uploading}
            onChange={(event) => void uploadFile(event.target.files?.[0])}
          />
          <label className="button primary" htmlFor="document-upload">
            {uploading ? (
              <LoaderCircle className="spin" size={16} />
            ) : (
              <Upload size={16} />
            )}
            {uploading ? "Reading your PDF…" : "Choose PDF"}
          </label>
        </div>

        {error && !uploading && (
          <div className="notice error document-notice" role="alert">
            <span>{error}</span>
            {!uploading && (
              <button
                className="text-button"
                onClick={() => void loadDocuments()}
              >
                Try again
              </button>
            )}
          </div>
        )}

        <div className="library-heading">
          <div>
            <span className="eyebrow">
              <span className="tiny-dot" /> YOUR LIBRARY
            </span>
            <h2 id="documents-heading">Documents</h2>
          </div>
          <span>
            {documents.length}{" "}
            {documents.length === 1 ? "document" : "documents"}
          </span>
        </div>

        {loading ? (
          <div className="document-loading" role="status">
            <LoaderCircle className="spin" size={22} /> Loading your library…
          </div>
        ) : documents.length === 0 ? (
          <div className="document-empty">
            <FileText size={26} />
            <h3>Your library is quiet.</h3>
            <p>Upload a PDF to create a summary and start asking questions.</p>
          </div>
        ) : (
          <div className="document-rows">
            {documents.map((document) => (
              <Link
                className="document-row"
                href={`/docmind/${document.id}`}
                key={document.id}
              >
                <span className="document-file-icon">
                  <FileText size={17} />
                </span>
                <span className="document-name">
                  <strong>{document.title}</strong>
                  <small>{document.filename}</small>
                </span>
                <span className={`document-status ${document.status}`}>
                  {document.status}
                </span>
                <span className="document-pages">
                  {document.page_count} pages
                </span>
                <time dateTime={document.created_at}>
                  {new Intl.DateTimeFormat(undefined, {
                    dateStyle: "medium",
                  }).format(new Date(document.created_at))}
                </time>
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
