import React, { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  Disc,
  Plus,
  Radio,
  Trash2,
} from "lucide-react";
import { SavedPlaylist } from "../types/track";

interface PlaylistSelectorProps {
  activePlaylistId: string;
  customPlaylists: SavedPlaylist[];
  onSelectPlaylist: (playlistId: string) => void;
  onDeletePlaylist: (playlistId: string) => void;
  onOpenImportModal: () => void;
}

export const PlaylistSelector: React.FC<PlaylistSelectorProps> = ({
  activePlaylistId,
  customPlaylists,
  onSelectPlaylist,
  onDeletePlaylist,
  onOpenImportModal,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const activePlaylist = customPlaylists.find((p) => p.id === activePlaylistId);
  const currentLabel =
    activePlaylistId === "preset"
      ? "📻 Gedi Preset: 2010–2014 Bollywood"
      : `📼 ${activePlaylist?.name || "Custom Station"}`;

  return (
    <div className="playlist-tuner-container" ref={dropdownRef} style={{ position: "relative" }}>
      {/* Selector Trigger Button */}
      <button
        type="button"
        className="playlist-tuner-trigger"
        onClick={() => setIsOpen((prev) => !prev)}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        aria-label="Select audio source or playlist"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "8px",
          minHeight: "42px",
          maxWidth: "100%",
          padding: "9px 16px",
          borderRadius: "999px",
          background: "rgba(25, 19, 16, 0.72)",
          border: "1px solid rgba(255, 248, 232, 0.22)",
          backdropFilter: "blur(12px)",
          color: "#fff8ed",
          fontSize: "12px",
          fontFamily: "'DM Mono', monospace",
          cursor: "pointer",
          transition: "all 0.2s ease",
          boxShadow: "0 4px 15px rgba(0,0,0,0.25)",
        }}
      >
        <span
          style={{
            width: "6px",
            height: "6px",
            flexShrink: 0,
            borderRadius: "50%",
            backgroundColor: "var(--accent)",
            boxShadow: "0 0 8px var(--accent)",
            display: "inline-block",
          }}
        />
        <span
          className="playlist-tuner-label"
          style={{
            color: "rgba(255, 248, 232, 0.55)",
            fontSize: "9px",
            textTransform: "uppercase",
            letterSpacing: "0.08em",
          }}
        >
          SOURCE
        </span>
        <span
          style={{
            fontWeight: 600,
            color: "#fff8ed",
            maxWidth: "min(220px, 38vw)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {currentLabel}
        </span>
        <ChevronDown
          size={13}
          style={{
            flexShrink: 0,
            color: "var(--accent)",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        />
      </button>

      {/* Retro Dropdown Menu (opens downward, left-aligned) */}
      {isOpen && (
        <div
          className="playlist-tuner-menu glass-card"
          role="menu"
          style={{
            position: "absolute",
            top: "calc(100% + 8px)",
            left: 0,
            transformOrigin: "top left",
            width: "280px",
            maxWidth: "calc(100vw - 24px)",
            maxHeight: "340px",
            borderRadius: "12px",
            padding: "8px",
            background: "rgba(22, 16, 14, 0.95)",
            border: "1px solid rgba(255, 248, 232, 0.22)",
            boxShadow: "0 18px 45px rgba(0, 0, 0, 0.6)",
            backdropFilter: "blur(20px)",
            zIndex: 100,
            overflowY: "auto",
            display: "flex",
            flexDirection: "column",
            gap: "4px",
          }}
        >
          <div
            style={{
              padding: "6px 8px 4px",
              fontSize: "9px",
              fontFamily: "'DM Mono', monospace",
              color: "rgba(255, 248, 232, 0.4)",
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              borderBottom: "1px solid rgba(255, 248, 232, 0.1)",
              marginBottom: "4px",
            }}
          >
            RADIO FREQUENCY TUNER
          </div>

          {/* Default Preset Station */}
          <button
            type="button"
            onClick={() => {
              onSelectPlaylist("preset");
              setIsOpen(false);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "8px 10px",
              borderRadius: "8px",
              background:
                activePlaylistId === "preset"
                  ? "rgba(245, 185, 65, 0.16)"
                  : "transparent",
              border:
                activePlaylistId === "preset"
                  ? "1px solid var(--accent)"
                  : "1px solid transparent",
              color: activePlaylistId === "preset" ? "var(--accent)" : "#fff8ed",
              fontSize: "11px",
              fontFamily: "'DM Mono', monospace",
              cursor: "pointer",
              textAlign: "left",
              transition: "all 0.15s ease",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Radio size={14} color="var(--accent)" />
              <div>
                <div style={{ fontWeight: 600 }}>📻 Gedi Preset</div>
                <div style={{ fontSize: "9px", color: "rgba(255, 248, 232, 0.5)" }}>
                  2010–2014 Bollywood Classics
                </div>
              </div>
            </div>
            {activePlaylistId === "preset" && (
              <span
                style={{
                  fontSize: "8px",
                  padding: "2px 6px",
                  borderRadius: "4px",
                  background: "var(--accent)",
                  color: "#1a120e",
                  fontWeight: 800,
                  textTransform: "uppercase",
                }}
              >
                LIVE
              </span>
            )}
          </button>

          {/* Custom Saved Playlists */}
          {customPlaylists.map((playlist) => {
            const isSelected = activePlaylistId === playlist.id;
            return (
              <div
                key={playlist.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "6px 8px",
                  borderRadius: "8px",
                  background: isSelected
                    ? "rgba(245, 185, 65, 0.16)"
                    : "rgba(255, 255, 255, 0.02)",
                  border: isSelected
                    ? "1px solid var(--accent)"
                    : "1px solid rgba(255, 248, 232, 0.06)",
                  transition: "all 0.15s ease",
                }}
              >
                <button
                  type="button"
                  onClick={() => {
                    onSelectPlaylist(playlist.id);
                    setIsOpen(false);
                  }}
                  style={{
                    background: "transparent",
                    color: isSelected ? "var(--accent)" : "#fff8ed",
                    fontSize: "11px",
                    fontFamily: "'DM Mono', monospace",
                    cursor: "pointer",
                    textAlign: "left",
                    flex: 1,
                    minWidth: 0,
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Disc size={13} color="var(--accent)" style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      📼 {playlist.name}
                    </div>
                    <div
                      style={{
                        fontSize: "9px",
                        color: "rgba(255, 248, 232, 0.5)",
                        textTransform: "uppercase",
                      }}
                    >
                      {playlist.tracks.length} tracks • {playlist.source}
                    </div>
                  </div>
                </button>

                {/* Delete Playlist Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      window.confirm(`Delete station "${playlist.name}"?`)
                    ) {
                      onDeletePlaylist(playlist.id);
                    }
                  }}
                  title="Remove station"
                  style={{
                    background: "transparent",
                    color: "rgba(255, 248, 232, 0.4)",
                    padding: "4px",
                    borderRadius: "4px",
                    cursor: "pointer",
                    marginLeft: "4px",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.color = "#ff6b6b")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.color = "rgba(255, 248, 232, 0.4)")
                  }
                >
                  <Trash2 size={13} />
                </button>
              </div>
            );
          })}

          {/* Add / Import Station Option */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onOpenImportModal();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
              padding: "9px",
              marginTop: "4px",
              borderRadius: "8px",
              background: "rgba(245, 185, 65, 0.12)",
              border: "1px dashed var(--accent)",
              color: "var(--accent)",
              fontSize: "11px",
              fontFamily: "'DM Mono', monospace",
              fontWeight: 600,
              cursor: "pointer",
              transition: "background 0.2s ease",
            }}
          >
            <Plus size={14} /> Tune New Link (YT / Spotify / Apple)
          </button>
        </div>
      )}
    </div>
  );
};