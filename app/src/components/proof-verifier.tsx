"use client";

import { useCallback, useRef, useState } from "react";
import type { VerifyResult } from "@/app/api/verify-proof/route";

type Props = {
  poolTitle: string;
  category: number;
  onConfirmed: (uri: string) => void;
  submitting: boolean;
};

type Phase = "idle" | "verifying" | "uploading" | "done";
type InputMode = "file" | "url";

/** Compress an image file via canvas, returning a base64 JPEG (no data: prefix) and data URL. */
function compressImage(
  file: File,
  maxPx = 1600,
  quality = 0.82
): Promise<{ base64: string; dataUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const ratio = Math.min(1, maxPx / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", quality);
      const base64 = dataUrl.replace(/^data:image\/jpeg;base64,/, "");
      resolve({ base64, dataUrl });
    };
    img.onerror = reject;
    img.src = objectUrl;
  });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function ProofVerifier({ poolTitle, category, onConfirmed, submitting }: Props) {
  const [inputMode, setInputMode] = useState<InputMode>("file");
  const [urlInput, setUrlInput] = useState("");

  // File state
  const [file, setFile] = useState<File | null>(null);
  const [fileDataUrl, setFileDataUrl] = useState(""); // for preview
  const [fileBase64, setFileBase64] = useState(""); // for upload
  const [dragging, setDragging] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  // Verification state
  const [phase, setPhase] = useState<Phase>("idle");
  const [result, setResult] = useState<VerifyResult | null>(null);
  const [verifyError, setVerifyError] = useState("");
  const [uploadError, setUploadError] = useState("");

  // The URI used for AI verify — base64 data URL (file) or plain URL
  const activeUri = inputMode === "file" ? fileDataUrl : urlInput.trim();
  const canVerify = phase === "idle" && !!activeUri;

  // --- File handling ---

  const processFile = useCallback(async (f: File) => {
    if (!f.type.startsWith("image/")) {
      setVerifyError("Please upload an image file (PNG, JPG, WEBP, etc.)");
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setVerifyError("File must be under 10 MB.");
      return;
    }
    setVerifyError("");
    setResult(null);
    setPhase("idle");
    setCompressing(true);
    try {
      const { base64, dataUrl } = await compressImage(f);
      setFile(f);
      setFileDataUrl(dataUrl);
      setFileBase64(base64);
    } catch {
      setVerifyError("Could not read image. Try a different file.");
    } finally {
      setCompressing(false);
    }
  }, []);

  function handleFileInput(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (f) processFile(f);
    e.target.value = "";
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files?.[0];
    if (f) processFile(f);
  }

  function clearFile() {
    setFile(null);
    setFileDataUrl("");
    setFileBase64("");
    setResult(null);
    setVerifyError("");
    setPhase("idle");
  }

  // --- Verification ---

  async function verify() {
    if (!activeUri) return;
    setPhase("verifying");
    setResult(null);
    setVerifyError("");

    try {
      const res = await fetch("/api/verify-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ proofUrl: activeUri, poolTitle, category }),
      });
      if (!res.ok) {
        const j = await res.json();
        setVerifyError(j.error ?? "Verification failed");
        setPhase("idle");
        return;
      }
      const data: VerifyResult = await res.json();
      setResult(data);
      setPhase("done");
    } catch {
      setVerifyError("Could not reach verification service.");
      setPhase("idle");
    }
  }

  // --- On-chain submission ---

  async function handleConfirm() {
    setUploadError("");

    if (inputMode === "url") {
      // Plain URL — use directly
      onConfirmed(urlInput.trim());
      return;
    }

    // File — upload to get a permanent public URL first
    setPhase("uploading");
    try {
      const res = await fetch("/api/upload-proof", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: fileBase64,
          name: `poolly-proof-${Date.now()}`,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.url) {
        // If upload service unavailable, fall back to a descriptive URI
        const fallback = `verified-upload-${Date.now()}`;
        console.warn("Upload failed, using fallback URI:", json.error);
        setUploadError("Image hosting unavailable — submitting with a reference ID instead.");
        onConfirmed(fallback);
        return;
      }
      onConfirmed(json.url);
    } catch {
      const fallback = `verified-upload-${Date.now()}`;
      setUploadError("Image hosting unavailable — submitting with a reference ID instead.");
      onConfirmed(fallback);
    }
  }

  // --- Styles ---

  const confidenceColor =
    !result ? "var(--b-paper-40)"
    : result.confidence >= 75 ? "var(--b-emerald)"
    : result.confidence >= 45 ? "var(--b-gold)"
    : "var(--b-rust)";

  const isUploading = phase === "uploading";
  const isVerifying = phase === "verifying";
  const busy = isVerifying || isUploading || submitting || compressing;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>

      {/* Mode toggle */}
      <div style={{ display: "flex", gap: 0, border: "1px solid var(--b-rule)" }}>
        {(["file", "url"] as InputMode[]).map((mode) => (
          <button
            key={mode}
            onClick={() => {
              setInputMode(mode);
              setResult(null);
              setVerifyError("");
              setPhase("idle");
            }}
            disabled={busy}
            style={{
              flex: 1,
              padding: "7px 12px",
              background: inputMode === mode ? "var(--b-ink-2)" : "transparent",
              border: "none",
              borderRight: mode === "file" ? "1px solid var(--b-rule)" : "none",
              color: inputMode === mode ? "var(--b-paper)" : "var(--b-paper-40)",
              fontFamily: "var(--font-geist-mono), monospace",
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: busy ? "not-allowed" : "pointer",
              transition: "all 0.15s",
            }}
          >
            {mode === "file" ? "📎 Upload File" : "🔗 Paste URL"}
          </button>
        ))}
      </div>

      {/* FILE MODE */}
      {inputMode === "file" && (
        <>
          {!file ? (
            /* Drop zone */
            <div
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={handleDrop}
              onClick={() => fileRef.current?.click()}
              style={{
                border: `2px dashed ${dragging ? "var(--b-gold)" : "var(--b-rule)"}`,
                background: dragging ? "rgba(201,162,79,0.04)" : "var(--b-ink-2)",
                padding: "32px 20px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                cursor: compressing ? "wait" : "pointer",
                transition: "all 0.15s",
                userSelect: "none",
              }}
            >
              <span style={{ fontSize: 28, opacity: 0.7 }}>
                {compressing ? "⏳" : "📷"}
              </span>
              <p style={{
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                color: "var(--b-paper-60)",
                textAlign: "center",
              }}>
                {compressing ? "Processing…" : "Drop screenshot here"}
              </p>
              {!compressing && (
                <p style={{
                  fontFamily: "var(--font-geist), sans-serif",
                  fontSize: 11,
                  color: "var(--b-paper-40)",
                  textAlign: "center",
                }}>
                  or click to browse · PNG, JPG, WEBP up to 10 MB
                </p>
              )}
            </div>
          ) : (
            /* Preview card */
            <div style={{
              border: "1px solid var(--b-rule)",
              background: "var(--b-ink-2)",
              display: "flex",
              gap: 12,
              padding: "10px",
              alignItems: "flex-start",
            }}>
              {/* Thumbnail */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={fileDataUrl}
                alt="proof preview"
                style={{
                  width: 72,
                  height: 72,
                  objectFit: "cover",
                  flexShrink: 0,
                  border: "1px solid var(--b-rule)",
                }}
              />
              <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 4 }}>
                <p style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  color: "var(--b-paper)",
                  letterSpacing: "0.06em",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}>
                  {file.name}
                </p>
                <p style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 10,
                  color: "var(--b-paper-40)",
                  letterSpacing: "0.06em",
                }}>
                  {formatBytes(file.size)} · ready for AI review
                </p>
                <button
                  onClick={clearFile}
                  disabled={busy}
                  style={{
                    alignSelf: "flex-start",
                    marginTop: 2,
                    background: "transparent",
                    border: "none",
                    color: "var(--b-rust)",
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    cursor: busy ? "not-allowed" : "pointer",
                    padding: 0,
                    opacity: busy ? 0.4 : 1,
                  }}
                >
                  × Remove
                </button>
              </div>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handleFileInput}
          />
        </>
      )}

      {/* URL MODE */}
      {inputMode === "url" && (
        <input
          type="url"
          placeholder="https://i.imgur.com/…  or any public image URL"
          value={urlInput}
          onChange={(e) => { setUrlInput(e.target.value); setPhase("idle"); setResult(null); }}
          disabled={busy}
          style={{
            background: "var(--b-ink-2)",
            border: "1px solid var(--b-rule)",
            color: "var(--b-paper)",
            fontFamily: "var(--font-geist), sans-serif",
            fontSize: 13,
            padding: "9px 12px",
            outline: "none",
            width: "100%",
            boxSizing: "border-box",
          }}
        />
      )}

      {/* AI Verify button */}
      <button
        onClick={verify}
        disabled={!canVerify || busy}
        style={{
          padding: "11px 16px",
          background: canVerify && !busy ? "var(--b-gold)" : "transparent",
          border: `1px solid ${canVerify && !busy ? "var(--b-gold)" : "var(--b-rule)"}`,
          color: canVerify && !busy ? "var(--b-ink)" : "var(--b-paper-40)",
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          cursor: canVerify && !busy ? "pointer" : "not-allowed",
          opacity: busy ? 0.6 : 1,
          transition: "all 0.15s",
        }}
      >
        {isVerifying ? "Analyzing with AI…" : isUploading ? "Uploading image…" : "AI Verify →"}
      </button>

      {/* Errors */}
      {verifyError && (
        <p style={{
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 11,
          color: "var(--b-rust)",
          letterSpacing: "0.06em",
          padding: "8px 12px",
          border: "1px solid rgba(181,86,62,0.3)",
          background: "rgba(181,86,62,0.06)",
        }}>
          {verifyError}
        </p>
      )}

      {uploadError && (
        <p style={{
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 10,
          color: "var(--b-gold)",
          letterSpacing: "0.06em",
          padding: "8px 12px",
          border: "1px solid rgba(201,162,79,0.3)",
          background: "rgba(201,162,79,0.06)",
        }}>
          ⚠ {uploadError}
        </p>
      )}

      {/* AI result card */}
      {result && (
        <div style={{
          border: `1px solid ${result.verified ? "rgba(92,135,112,0.4)" : "rgba(181,86,62,0.4)"}`,
          background: result.verified ? "rgba(92,135,112,0.06)" : "rgba(181,86,62,0.06)",
          padding: "16px",
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}>
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span style={{ fontSize: 16 }}>{result.verified ? "✅" : "⚠️"}</span>
              <p style={{
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.14em",
                textTransform: "uppercase",
                color: result.verified ? "var(--b-emerald)" : "var(--b-rust)",
              }}>
                {result.verified ? "PROOF VERIFIED" : "VERIFICATION FAILED"}
              </p>
            </div>
            {/* Confidence bar */}
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 56, height: 4, background: "var(--b-paper-08)", overflow: "hidden" }}>
                <div style={{
                  height: "100%",
                  width: `${result.confidence}%`,
                  background: confidenceColor,
                  transition: "width 0.5s ease",
                }} />
              </div>
              <p style={{
                fontFamily: "var(--font-geist-mono), monospace",
                fontSize: 10,
                fontWeight: 700,
                color: confidenceColor,
                letterSpacing: "0.08em",
              }}>
                {result.confidence}%
              </p>
            </div>
          </div>

          <p style={{ fontFamily: "var(--font-geist), sans-serif", fontSize: 12, color: "var(--b-paper-60)", lineHeight: 1.55 }}>
            {result.explanation}
          </p>

          {result.issues.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {result.issues.map((issue, i) => (
                <p key={i} style={{ fontFamily: "var(--font-geist), sans-serif", fontSize: 11, color: "var(--b-rust)", lineHeight: 1.4 }}>
                  · {issue}
                </p>
              ))}
            </div>
          )}

          {result.suggestions.length > 0 && (
            <div style={{
              padding: "10px 12px",
              border: "1px solid var(--b-rule)",
              background: "var(--b-ink-3)",
              display: "flex",
              flexDirection: "column",
              gap: 4,
            }}>
              <p className="b-eyebrow" style={{ fontSize: 9, marginBottom: 4 }}>
                Better proof would include
              </p>
              {result.suggestions.map((s, i) => (
                <p key={i} style={{ fontFamily: "var(--font-geist), sans-serif", fontSize: 11, color: "var(--b-paper-40)" }}>
                  → {s}
                </p>
              ))}
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
            {result.verified ? (
              <button
                onClick={handleConfirm}
                disabled={submitting || isUploading}
                style={{
                  flex: 1,
                  background: "var(--b-emerald)",
                  border: "none",
                  color: "white",
                  padding: "11px 16px",
                  fontFamily: "var(--font-geist-mono), monospace",
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                  cursor: submitting || isUploading ? "wait" : "pointer",
                  opacity: submitting || isUploading ? 0.5 : 1,
                  transition: "opacity 0.15s",
                }}
              >
                {isUploading ? "UPLOADING IMAGE…" : submitting ? "SUBMITTING ON-CHAIN…" : "SUBMIT PROOF ON-CHAIN ✓"}
              </button>
            ) : (
              <>
                <button
                  onClick={() => { setPhase("idle"); setResult(null); }}
                  style={{
                    flex: 1,
                    background: "transparent",
                    border: "1px solid var(--b-rule)",
                    color: "var(--b-paper-60)",
                    padding: "9px 12px",
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: 11,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    cursor: "pointer",
                  }}
                >
                  TRY AGAIN
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={submitting || isUploading}
                  title="Submit anyway, overriding AI verdict"
                  style={{
                    padding: "9px 14px",
                    background: "transparent",
                    border: "1px solid var(--b-rule)",
                    color: "var(--b-paper-40)",
                    fontFamily: "var(--font-geist-mono), monospace",
                    fontSize: 10,
                    letterSpacing: "0.10em",
                    textTransform: "uppercase",
                    cursor: submitting || isUploading ? "wait" : "pointer",
                    opacity: submitting || isUploading ? 0.5 : 1,
                  }}
                >
                  {isUploading ? "UPLOADING…" : submitting ? "SUBMITTING…" : "OVERRIDE →"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {phase === "idle" && !result && !file && inputMode === "file" && (
        <p style={{
          fontFamily: "var(--font-geist-mono), monospace",
          fontSize: 10,
          color: "var(--b-paper-40)",
          letterSpacing: "0.08em",
        }}>
          Upload a screenshot — AI verifies it before committing on-chain.
        </p>
      )}
    </div>
  );
}
