import React, { useState } from "react";
import {
  AlertCircle,
  Check,
  Loader2,
  Radio,
  Sparkles,
  X,
} from "lucide-react";
import { ImportPlaylistResult, Track } from "../types/track";
import { fetchPlaylistFromUrl, parsePlaylistUrl } from "../utils/playlistImport";

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSuccess: (name: string, tracks: Track[], source: "youtube", url: string) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportSuccess,
}) => {
  const [urlInput, setUrlInput] = useState("");
  const [customName, setCustomName] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [previewResult, setPreviewResult] = useState<ImportPlaylistResult | null>(null);

  if (!isOpen) return null;

  const handleTuneIn = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = urlInput.trim();
    if (!trimmed) {
      setError("Please paste a public YouTube playlist link to tune in.");
      return;
    }

    const parsed = parsePlaylistUrl(trimmed);
    if (!parsed) {
      setError("Unrecognized link. Please paste a YouTube or YouTube Music playlist link.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setPreviewResult(null);

    try {
      const result = await fetchPlaylistFromUrl(trimmed);
      if (!result.tracks || result.tracks.length === 0) {
        throw new Error("No playable tracks found in this playlist.");
      }
      setPreviewResult(result);
      setCustomName(result.playlistName);
    } catch (err: any) {
      setError(
        err?.message ||
        "Could not tune into this frequency. Make sure the playlist is public or unlisted."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmSave = () => {
    if (!previewResult) return;
    const finalName = customName.trim() || previewResult.playlistName || "Custom Station";
    onImportSuccess(finalName, previewResult.tracks, "youtube", previewResult.originalUrl);
    handleResetAndClose();
  };

  const handleResetAndClose = () => {
    setUrlInput("");
    setCustomName("");
    setError(null);
    setPreviewResult(null);
    setIsLoading(false);
    onClose();
  };

  const handleQuickSample = (sampleUrl: string) => {
    setUrlInput(sampleUrl);
    setError(null);
  };

  return (
    <div
      className="modal-backdrop"
      role="presentation"
      onClick={handleResetAndClose}
      style={{ zIndex: 50 }}
    >
      <div
        className="info-modal import-modal-card"
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "600px",
          width: "92vw",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          padding: "32px 28px",
          overflowY: "auto",
        }}
      >
        <button
          className="close-button modal-close"
          onClick={handleResetAndClose}
          aria-label="Close dialog"
        >
          <X size={18} />
        </button>

        <span className="eyebrow" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Radio size={14} /> FREQUENCY TUNER / SOURCE SELECT
        </span>
        <h2 style={{ margin: "10px 0 6px", fontSize: "28px" }}>Tune A Custom Station</h2>
        <p style={{ margin: "0 0 18px", fontSize: "14px", color: "rgba(255, 248, 232, 0.68)" }}>
          Paste a public <strong>YouTube</strong> or <strong>YouTube Music</strong> playlist link. The playlist must be set to <strong>Public</strong> or <strong>Unlisted</strong>. No login needed.
        </p>

        {/* Input Form */}
        <form onSubmit={handleTuneIn} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
            <input
              type="text"
              placeholder="e.g. https://www.youtube.com/playlist?list=..."
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                if (error) setError(null);
              }}
              disabled={isLoading}
              style={{
                width: "100%",
                padding: "13px 44px 13px 14px",
                background: "rgba(18, 14, 12, 0.8)",
                border: "1px solid rgba(255, 248, 232, 0.22)",
                borderRadius: "10px",
                color: "#fff8ed",
                fontSize: "13px",
                fontFamily: "'DM Mono', monospace",
                outline: "none",
                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.4)",
              }}
            />
            {urlInput && !isLoading && (
              <button
                type="button"
                onClick={() => setUrlInput("")}
                style={{
                  position: "absolute",
                  right: "12px",
                  background: "transparent",
                  color: "rgba(255, 248, 232, 0.4)",
                  cursor: "pointer",
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Quick preset example */}
          {!previewResult && !isLoading && (
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "6px", fontSize: "11px" }}>
              <span style={{ color: "rgba(255, 248, 232, 0.4)", fontFamily: "'DM Mono', monospace" }}>Try link:</span>
              <button
                type="button"
                onClick={() => handleQuickSample("https://www.youtube.com/watch?v=WCTro3qabjE")}
                style={{
                  background: "rgba(255, 255, 255, 0.05)",
                  border: "1px solid rgba(255, 248, 232, 0.12)",
                  padding: "3px 8px",
                  borderRadius: "6px",
                  color: "var(--accent)",
                  cursor: "pointer",
                  fontFamily: "'DM Mono', monospace",
                  fontSize: "10px",
                }}
              >
                Pee Loon (YouTube)
              </button>
            </div>
          )}

          {/* Error notice */}
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "10px 14px",
                borderRadius: "8px",
                background: "rgba(235, 87, 87, 0.15)",
                border: "1px solid rgba(235, 87, 87, 0.35)",
                color: "#ff8b8b",
                fontSize: "12px",
                fontFamily: "'DM Mono', monospace",
              }}
            >
              <AlertCircle size={16} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {/* Action button if no preview yet */}
          {!previewResult && (
            <button
              type="submit"
              disabled={isLoading || !urlInput.trim()}
              className="modal-action"
              style={{
                marginTop: "6px",
                justifyContent: "center",
                opacity: isLoading || !urlInput.trim() ? 0.6 : 1,
                cursor: isLoading || !urlInput.trim() ? "not-allowed" : "pointer",
              }}
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>TUNING FREQUENCY... SCANNING TRACKS</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} />
                  <span>TUNE IN & FETCH TRACKS</span>
                </>
              )}
            </button>
          )}
        </form>

        {/* Preview Section */}
        {previewResult && (
          <div
            style={{
              marginTop: "20px",
              padding: "16px",
              background: "rgba(15, 12, 10, 0.8)",
              border: "1px solid var(--accent)",
              borderRadius: "12px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    background: "var(--accent)",
                    color: "#1c1410",
                    fontWeight: 700,
                    fontSize: "10px",
                    padding: "3px 8px",
                    borderRadius: "999px",
                    textTransform: "uppercase",
                    fontFamily: "'DM Mono', monospace",
                  }}
                >
                  <Check size={12} /> Station Found
                </span>
                <span style={{ fontSize: "11px", color: "rgba(255, 248, 232, 0.5)", fontFamily: "'DM Mono', monospace" }}>
                  {previewResult.tracks.length} {previewResult.tracks.length === 1 ? "track" : "tracks"}
                </span>
              </div>
              <span
                style={{
                  fontSize: "10px",
                  color: "var(--accent)",
                  fontFamily: "'DM Mono', monospace",
                  textTransform: "uppercase",
                }}
              >
                Source: YouTube
              </span>
            </div>

            {/* Custom Station Name Input */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "10px",
                  color: "rgba(255, 248, 232, 0.6)",
                  fontFamily: "'DM Mono', monospace",
                  textTransform: "uppercase",
                  marginBottom: "4px",
                }}
              >
                Station Dial Name
              </label>
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  background: "rgba(30, 22, 18, 0.7)",
                  border: "1px solid rgba(255, 248, 232, 0.2)",
                  borderRadius: "8px",
                  color: "#fff8ed",
                  fontSize: "13px",
                  fontFamily: "'Manrope', sans-serif",
                  fontWeight: 600,
                }}
              />
            </div>

            {/* Tracks Preview List */}
            <div style={{ maxHeight: "150px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "6px" }}>
              {previewResult.tracks.map((t, idx) => (
                <div
                  key={t.id || idx}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "6px 8px",
                    background: "rgba(255, 255, 255, 0.03)",
                    borderRadius: "6px",
                  }}
                >
                  <div
                    style={{
                      width: "30px",
                      height: "30px",
                      borderRadius: "4px",
                      backgroundImage: `url(${t.coverUrl || t.cover || "/themes/open-road.jpg"})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "#fff8ed",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t.title}
                    </div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "rgba(255, 248, 232, 0.5)",
                        fontFamily: "'DM Mono', monospace",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {t.artist}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Confirmation Action */}
            <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
              <button
                type="button"
                onClick={handleConfirmSave}
                className="modal-action"
                style={{ flex: 1, marginTop: 0, justifyContent: "center" }}
              >
                <Radio size={16} /> LOAD INTO DECK & PLAY
              </button>
              <button
                type="button"
                onClick={() => setPreviewResult(null)}
                className="modal-action-copy"
                style={{ marginTop: 0 }}
              >
                Change Link
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};