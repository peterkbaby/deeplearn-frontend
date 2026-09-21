"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  FileText,
  LoaderCircle,
  Maximize2,
  MessageSquare,
  RotateCcw,
  Send,
  Trash2,
} from "lucide-react";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { useToast } from "@/components/toast";
import { ClientApiError, docmindApi } from "@/lib/client-api";
import {
  type ChatResponse,
  type DocmindDocument,
  type DocumentSummary,
  chatResponseSchema,
  documentListSchema,
  documentSchema,
  summarySchema,
} from "@/lib/docmind-contracts";

const suggestedQuestions = [
  "What is the main idea?",
  "Summarize the key arguments.",
  "What should I remember?",
];

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: number[];
  chunks?: number;
};

function errorMessage(error: unknown, fallback: string) {
  if (!(error instanceof ClientApiError)) return fallback;
  if (error.status === 429)
    return "Too many requests. Take a moment and try again.";
  return error.message;
}

function MarkdownContent({ children }: { children: string }) {
  return (
    <div className="markdown-content">
      <ReactMarkdown
        components={{
          a: ({ children: linkText, ...props }) => (
            <a {...props} target="_blank" rel="noreferrer">
              {linkText}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}

function Sources({ pages }: { pages: number[] }) {
  if (pages.length === 0) return null;
  return (
    <div className="source-pages" aria-label="Source pages">
      {pages.map((page) => (
        <span key={page}>Page {page}</span>
      ))}
    </div>
  );
}

export function DocumentWorkspace({ documentId }: { documentId: string }) {
  const router = useRouter();
  const { showToast } = useToast();
  const [document, setDocument] = useState<DocmindDocument | null>(null);
  const [documents, setDocuments] = useState<DocmindDocument[]>([]);
  const [summary, setSummary] = useState<DocumentSummary | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewLoading, setPreviewLoading] = useState(true);
  const [previewError, setPreviewError] = useState("");
  const [loading, setLoading] = useState(true);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [error, setError] = useState("");
  const [summaryError, setSummaryError] = useState("");
  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatting, setChatting] = useState(false);
  const [chatError, setChatError] = useState("");

  const loadSummary = useCallback(async () => {
    setSummaryLoading(true);
    setSummaryError("");
    try {
      const response = await docmindApi.post(
        `/summaries/documents/${documentId}/summary`,
      );
      setSummary(summarySchema.parse(response.data));
    } catch (loadError) {
      const message = errorMessage(
        loadError,
        "We couldn’t create this summary.",
      );
      setSummaryError(message);
      showToast(message);
    } finally {
      setSummaryLoading(false);
    }
  }, [documentId, showToast]);

  useEffect(() => {
    let active = true;
    let objectUrl = "";
    docmindApi
      .get(`/docmind/documents/${documentId}/content`, {
        responseType: "blob",
      })
      .then((response) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(
          new Blob([response.data], { type: "application/pdf" }),
        );
        setPreviewUrl(objectUrl);
      })
      .catch((previewLoadError) => {
        if (!active) return;
        setPreviewError(
          errorMessage(previewLoadError, "PDF preview is unavailable."),
        );
      })
      .finally(() => {
        if (active) setPreviewLoading(false);
      });
    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [documentId]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError("");
      try {
        const [detailResponse, listResponse] = await Promise.all([
          docmindApi.get(`/docmind/documents/${documentId}`),
          docmindApi.get("/docmind/documents"),
        ]);
        if (!active) return;
        const nextDocument = documentSchema.parse(detailResponse.data);
        setDocument(nextDocument);
        setDocuments(documentListSchema.parse(listResponse.data).documents);
        const cached = sessionStorage.getItem(`docmind:summary:${documentId}`);
        if (cached) {
          setSummary(summarySchema.parse(JSON.parse(cached)));
          sessionStorage.removeItem(`docmind:summary:${documentId}`);
        } else if (nextDocument.status === "ready") {
          void loadSummary();
        }
      } catch (loadError) {
        if (active) {
          const message = errorMessage(
            loadError,
            "We couldn’t open this document.",
          );
          setError(message);
          showToast(message);
        }
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [documentId, loadSummary, showToast]);

  async function deleteDocument() {
    if (!document) return;
    setDeleting(true);
    setError("");
    try {
      await docmindApi.delete(`/docmind/documents/${document.id}`);
      setConfirmingDelete(false);
      showToast("Document deleted.", "success");
      router.replace("/docmind");
    } catch (deleteError) {
      const message = errorMessage(
        deleteError,
        "We couldn’t delete this document.",
      );
      setError(message);
      showToast(message);
      setDeleting(false);
    }
  }

  async function sendQuestion(value: string) {
    const content = value.trim();
    if (!content || !document || chatting || document.status !== "ready")
      return;
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content,
    };
    setMessages((current) => [...current, userMessage]);
    setQuestion("");
    setChatting(true);
    setChatError("");
    try {
      const response = await docmindApi.post("/docmind/chat", {
        document_id: document.id,
        question: content,
      });
      const result: ChatResponse = chatResponseSchema.parse(response.data);
      setMessages((current) => [
        ...current,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: result.answer,
          sources: result.source_pages,
          chunks: result.chunks_used,
        },
      ]);
    } catch (askError) {
      const message = errorMessage(
        askError,
        "We couldn’t answer that question.",
      );
      setChatError(message);
      showToast(message);
    } finally {
      setChatting(false);
    }
  }

  function askQuestion(event: FormEvent) {
    event.preventDefault();
    void sendQuestion(question);
  }

  if (loading)
    return (
      <div className="workspace-state" role="status">
        <LoaderCircle className="spin" /> Opening your document…
      </div>
    );
  if (error && !document)
    return (
      <div className="workspace-state error-state" role="alert">
        <FileText size={28} />
        <h1>Document unavailable.</h1>
        <p>{error}</p>
        <Link className="button secondary" href="/docmind">
          <ArrowLeft size={15} /> Back to documents
        </Link>
      </div>
    );
  if (!document) return null;

  return (
    <>
      <div className="document-workspace">
        <aside className="workspace-library" aria-label="Document library">
          <Link className="workspace-back" href="/docmind">
            <ArrowLeft size={14} /> All documents
          </Link>
          <h2>Your library</h2>
          <div className="workspace-document-links">
            {documents.map((item) => (
              <Link
                className={item.id === document.id ? "active" : ""}
                href={`/docmind/${item.id}`}
                key={item.id}
              >
                <FileText size={14} />
                <span>{item.title}</span>
              </Link>
            ))}
          </div>
        </aside>

        <main className="document-reader">
          {error && (
            <div className="notice error" role="alert">
              {error}
            </div>
          )}
          <div className="document-title-row">
            <div>
              <span className={`document-status ${document.status}`}>
                {document.status}
              </span>
              <h1>{document.title}</h1>
              <p>
                {document.page_count} pages · Added{" "}
                {new Intl.DateTimeFormat(undefined, {
                  dateStyle: "medium",
                }).format(new Date(document.created_at))}
              </p>
            </div>
            <button
              className="icon-button danger-button"
              aria-label="Delete document"
              disabled={deleting}
              onClick={() => setConfirmingDelete(true)}
            >
              {deleting ? (
                <LoaderCircle className="spin" size={17} />
              ) : (
                <Trash2 size={17} />
              )}
            </button>
          </div>

          <section
            className="document-preview"
            aria-labelledby="preview-heading"
          >
            <div className="preview-toolbar">
              <div>
                <span className="preview-live-dot" aria-hidden="true" />
                <h2 id="preview-heading">Document preview</h2>
              </div>
              {previewUrl && (
                <a
                  className="preview-expand"
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Open PDF in a new tab"
                >
                  <Maximize2 size={14} /> Open
                </a>
              )}
            </div>
            <div className="preview-canvas">
              {previewLoading ? (
                <div className="preview-state" role="status">
                  <LoaderCircle className="spin" size={20} /> Loading PDF…
                </div>
              ) : previewUrl ? (
                <iframe
                  src={previewUrl}
                  title={`Preview of ${document.title}`}
                />
              ) : (
                <div className="preview-state preview-error" role="alert">
                  <FileText size={24} />
                  <span>{previewError || "PDF preview is unavailable."}</span>
                </div>
              )}
            </div>
          </section>

          <section className="summary-card" aria-labelledby="summary-heading">
            <div className="summary-heading">
              <div>
                <span className="eyebrow">
                  <span className="tiny-dot" /> KEY IDEAS
                </span>
                <h2 id="summary-heading">Summary</h2>
              </div>
              {!summaryLoading && document.status === "ready" && (
                <button
                  className="text-button"
                  onClick={() => void loadSummary()}
                >
                  {summary ? "Refresh summary" : "Generate summary"}
                </button>
              )}
            </div>
            {document.status !== "ready" ? (
              <p className="summary-muted">
                This document is {document.status}. Summary and chat become
                available when processing is complete.
              </p>
            ) : summaryLoading ? (
              <div className="summary-loading" role="status">
                <LoaderCircle className="spin" size={18} /> Reading the
                document…
              </div>
            ) : summary ? (
              <>
                <div className="summary-text">
                  <MarkdownContent>{summary.summary}</MarkdownContent>
                </div>
                <Sources pages={summary.source_pages} />
              </>
            ) : (
              <div className="notice error" role="alert">
                {summaryError || "No summary is available."}
              </div>
            )}
          </section>
        </main>

        <aside className="document-chat" aria-labelledby="chat-heading">
          <div className="chat-heading">
            <span className="chat-icon">
              <MessageSquare size={17} />
            </span>
            <div>
              <h2 id="chat-heading">Ask DocMind</h2>
              <p>
                <span className="chat-online-dot" /> Ready for this document
              </p>
            </div>
            {messages.length > 0 && (
              <button
                className="chat-reset"
                type="button"
                aria-label="Start a new chat session"
                onClick={() => {
                  setMessages([]);
                  setChatError("");
                }}
              >
                <RotateCcw size={14} />
              </button>
            )}
          </div>
          <div className="chat-log" role="log" aria-live="polite">
            {messages.length === 0 && (
              <div className="chat-empty">
                <span className="chat-welcome-mark">
                  <MessageSquare size={19} />
                </span>
                <h3>Explore this document.</h3>
                <p>
                  I’ll answer from its pages and show where each idea came from.
                </p>
                <div className="chat-suggestions">
                  {suggestedQuestions.map((suggestion) => (
                    <button
                      type="button"
                      key={suggestion}
                      disabled={document.status !== "ready" || chatting}
                      onClick={() => void sendQuestion(suggestion)}
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((message) => (
              <div className={`chat-message ${message.role}`} key={message.id}>
                <span>{message.role === "user" ? "You" : "DocMind"}</span>
                {message.role === "assistant" ? (
                  <MarkdownContent>{message.content}</MarkdownContent>
                ) : (
                  <p>{message.content}</p>
                )}
                {message.sources && <Sources pages={message.sources} />}
                {message.chunks !== undefined && (
                  <small>{message.chunks} passages considered</small>
                )}
              </div>
            ))}
            {chatting && (
              <div className="chat-thinking" role="status">
                <LoaderCircle className="spin" size={15} /> Finding an answer…
              </div>
            )}
          </div>
          {chatError && (
            <div className="chat-error" role="alert">
              {chatError}
            </div>
          )}
          <form className="chat-form" onSubmit={askQuestion}>
            <label htmlFor="docmind-question">Ask about this document</label>
            <div>
              <textarea
                id="docmind-question"
                maxLength={2000}
                placeholder={
                  document.status === "ready"
                    ? "What would you like to understand?"
                    : "Chat is available when processing finishes."
                }
                value={question}
                disabled={document.status !== "ready" || chatting}
                onChange={(event) => setQuestion(event.target.value)}
              />
              <button
                aria-label="Send question"
                disabled={
                  !question.trim() || chatting || document.status !== "ready"
                }
                type="submit"
              >
                <Send size={17} />
              </button>
            </div>
            <small>{question.length}/2000</small>
          </form>
        </aside>
      </div>
      <ConfirmDialog
        open={confirmingDelete}
        title="Delete this document?"
        description={`“${document.title}” and its document intelligence will be permanently removed. This action cannot be undone.`}
        confirmLabel="Delete document"
        pending={deleting}
        onCancel={() => setConfirmingDelete(false)}
        onConfirm={() => void deleteDocument()}
      />
    </>
  );
}
