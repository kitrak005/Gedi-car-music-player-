import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  ArrowDown,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  CloudRain,
  Copy,
  ExternalLink,
  Heart,
  Info,
  Mic2,
  Pause,
  Play,
  Plus,
  Radio,
  X,
} from "lucide-react";
import { SavedPlaylist, Track } from "../types/track";
import {
  deleteCustomPlaylist,
  getActivePlaylistId,
  getCustomPlaylists,
  saveCustomPlaylist,
  setActivePlaylistId,
} from "../utils/storage";
import { ImportModal } from "../components/ImportModal";
import { PlaylistSelector } from "../components/PlaylistSelector";


type Theme = {
  name: string;
  eyebrow: string;
  image: string;
  accent: string;
  accentSoft: string;
  weather: string;
};

type ModalType = "about" | "faq" | "support" | null;

const imageRoot = "/themes";

const themes: Theme[] = [
  {
    name: "Open Road",
    eyebrow: "LIVE FROM THE DRIVER'S SEAT",
    image: `${imageRoot}/open-road.jpg`,
    accent: "#f5b941",
    accentSoft: "rgba(245, 185, 65, .2)",
    weather: "Warm bulbs / blue hour",
  },
  {
    name: "Chai Stop",
    eyebrow: "ONE MORE CUTTING, ONE MORE SONG",
    image: `${imageRoot}/chai-stop.jpg`,
    accent: "#e9874e",
    accentSoft: "rgba(233, 135, 78, .2)",
    weather: "Kettle steam / late night",
  },
  {
    name: "Night Drive",
    eyebrow: "YOUR OLD FM DIAL, BUT ONLINE",
    image: `${imageRoot}/night-drive.jpg`,
    accent: "#d7839c",
    accentSoft: "rgba(215, 131, 156, .2)",
    weather: "Polaroids / soft light",
  },
  {
    name: "Monsoon Route",
    eyebrow: "A SONG FOR THE LAST BUS HOME",
    image: `${imageRoot}/monsoon-route.jpg`,
    accent: "#86b6a2",
    accentSoft: "rgba(134, 182, 162, .2)",
    weather: "Monsoon / sodium glow",
  },
];

const fallbackTrack: Track = {
  id: "pee-loon",
  year: 2010,
  title: "Pee Loon",
  film: "Once Upon A Time In Mumbaai",
  artist: "Mohit Chauhan",
  credits: "T-Series Bollywood Classics",
  officialUrl: "https://www.youtube.com/watch?v=WCTro3qabjE",
  youtubeId: "WCTro3qabjE",
  streamId: "WCTro3qabjE",
  source: "preset",
  cover: themes[0].image,
  coverUrl: themes[0].image,
};

const formatTime = (value: number) => {
  if (!Number.isFinite(value) || value <= 0) return "0:00";
  const minutes = Math.floor(value / 60);
  const seconds = Math.floor(value % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
};

declare global {
  interface Window {
    YT?: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

export default function Home() {
  const [presetTracks, setPresetTracks] = useState<Track[]>([]);
  const [customPlaylists, setCustomPlaylists] = useState<SavedPlaylist[]>([]);
  const [activePlaylistId, setActivePlaylistIdState] = useState<string>("preset");
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [themeIndex, setThemeIndex] = useState(0);
  const [rainOn, setRainOn] = useState(false);
  const [rainVolume, setRainVolume] = useState(0.22);
  const [volume, setVolume] = useState(0.75);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [modal, setModal] = useState<ModalType>(null);
  const [copiedEmail, setCopiedEmail] = useState(false);
  const [embedOpen, setEmbedOpen] = useState(false);
  const rainAudioRef = useRef<HTMLAudioElement>(null);
  const youtubeFrameRef = useRef<HTMLIFrameElement>(null);

  // Active playlist resolution
  const activeCustomPlaylist = useMemo(
    () => customPlaylists.find((p) => p.id === activePlaylistId),
    [customPlaylists, activePlaylistId]
  );

  const tracks = useMemo(() => {
    if (activePlaylistId === "preset" || !activeCustomPlaylist) {
      return presetTracks.length > 0 ? presetTracks : [fallbackTrack];
    }
    return activeCustomPlaylist.tracks.length > 0
      ? activeCustomPlaylist.tracks
      : [fallbackTrack];
  }, [activePlaylistId, activeCustomPlaylist, presetTracks]);

  const tracksRef = useRef<Track[]>(tracks);
  tracksRef.current = tracks;
  const activeIndexRef = useRef<number>(activeIndex);
  activeIndexRef.current = activeIndex;
  const lastShuffleTimeRef = useRef<number>(0);

  const theme = themes[themeIndex];
  const activeTrack = tracks[activeIndex] ?? fallbackTrack;
  const streamVideoId =
    activeTrack.youtubeId ||
    (activeTrack.source === "youtube" ? activeTrack.streamId : fallbackTrack.youtubeId);

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  const youtubeParams = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    return new URLSearchParams({
      autoplay: "1",
      controls: "0",
      disablekb: "1",
      modestbranding: "1",
      rel: "0",
      playsinline: "1",
      iv_load_policy: "3",
      fs: "0",
      enablejsapi: "1",
      origin: origin,
      widget_referrer: origin,
    }).toString();
  }, []);

  // Initialize preset tracks from songs.json
  useEffect(() => {
    fetch("/songs.json")
      .then((response) => response.json())
      .then((data: Track[]) => {
        const formatted = data.map((d) => ({
          ...d,
          streamId: d.youtubeId || d.id,
          source: "preset" as const,
          coverUrl: d.cover,
        }));
        setPresetTracks(formatted);
      })
      .catch(() => setPresetTracks([fallbackTrack]));
  }, []);

  // Initialize saved playlists from localStorage
  useEffect(() => {
    const saved = getCustomPlaylists();
    setCustomPlaylists(saved);
    const savedActiveId = getActivePlaylistId();
    if (savedActiveId === "preset" || saved.some((p) => p.id === savedActiveId)) {
      setActivePlaylistIdState(savedActiveId);
    } else {
      setActivePlaylistIdState("preset");
      setActivePlaylistId("preset");
    }
  }, []);

  useEffect(() => {
    const rainAudio = rainAudioRef.current;
    if (!rainAudio) return;
    rainAudio.volume = rainVolume;
    rainAudio.loop = true;
    if (rainOn) {
      rainAudio.play().catch(() => undefined);
    } else {
      rainAudio.pause();
    }
  }, [rainOn, rainVolume]);

  const changeTheme = () => setThemeIndex((value) => (value + 1) % themes.length);

  const copyStationEmail = () => {
    navigator.clipboard?.writeText("joshikartik.1925@gmail.com").then(() => {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }).catch(() => {});
  };

  const sendYoutubeCommand = (func: "playVideo" | "pauseVideo") => {
    try {
      youtubeFrameRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "command", func, args: [] }),
        "*"
      );
    } catch {}
  };

  const notifyIframeListening = () => {
    try {
      youtubeFrameRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: "listening", id: 1 }),
        "*"
      );
    } catch {}
  };

  // Continuous auto-advance: (currentTrackIndex + 1) % activePlaylist.length
  const advanceToNextTrack = () => {
    const currentTracks = tracksRef.current;
    if (!currentTracks.length) return;
    const nextIdx = (activeIndexRef.current + 1) % currentTracks.length;
    setActiveIndex(nextIdx);
    setEmbedOpen(true);
    setIsPlaying(true);
  };

  const handlePlayerStateChange = (eventData: number) => {
    const YT_ENDED = window.YT?.PlayerState ? window.YT.PlayerState.ENDED : 0;
    const YT_PLAYING = window.YT?.PlayerState ? window.YT.PlayerState.PLAYING : 1;
    const YT_PAUSED = window.YT?.PlayerState ? window.YT.PlayerState.PAUSED : 2;

    if (eventData === YT_ENDED || eventData === 0) {
      const now = Date.now();
      if (now - lastShuffleTimeRef.current < 2000) return;
      lastShuffleTimeRef.current = now;
      advanceToNextTrack();
    } else if (eventData === YT_PLAYING || eventData === 1) {
      setIsPlaying(true);
    } else if (eventData === YT_PAUSED || eventData === 2) {
      setIsPlaying(false);
    }
  };

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      try {
        const data = typeof e.data === "string" ? JSON.parse(e.data) : e.data;
        if (!data) return;

        if (data.event === "onStateChange") {
          const state = typeof data.info === "number" ? data.info : data.data;
          if (typeof state === "number") {
            handlePlayerStateChange(state);
          }
        } else if (data.event === "infoDelivery" && data.info) {
          const state = data.info.playerState;
          if (typeof state === "number") {
            handlePlayerStateChange(state);
          }
        }
      } catch {}
    };

    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    if (!embedOpen || !streamVideoId) return;
    notifyIframeListening();
    const t1 = setTimeout(notifyIframeListening, 300);
    const t2 = setTimeout(notifyIframeListening, 1000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [embedOpen, streamVideoId]);

  const togglePlay = () => {
    if (streamVideoId) {
      if (embedOpen && isPlaying) {
        sendYoutubeCommand("pauseVideo");
        setIsPlaying(false);
        return;
      }
      setEmbedOpen(true);
      setIsPlaying(true);
      window.setTimeout(() => sendYoutubeCommand("playVideo"), 120);
      return;
    }
    if (activeTrack.officialUrl) {
      window.open(activeTrack.officialUrl, "_blank", "noopener,noreferrer");
    }
  };

  const goToTrack = (direction: number) => {
    const currentTracks = tracksRef.current;
    if (!currentTracks.length) return;
    const nextIdx = (activeIndexRef.current + direction + currentTracks.length) % currentTracks.length;
    setActiveIndex(nextIdx);
    setEmbedOpen(true);
    setIsPlaying(true);
  };

  const handleSelectPlaylist = (playlistId: string) => {
    setActivePlaylistIdState(playlistId);
    setActivePlaylistId(playlistId);
    setActiveIndex(0);
    setEmbedOpen(true);
    setIsPlaying(true);
    window.setTimeout(() => sendYoutubeCommand("playVideo"), 200);
  };

  const handleDeletePlaylist = (playlistId: string) => {
    deleteCustomPlaylist(playlistId);
    const updated = getCustomPlaylists();
    setCustomPlaylists(updated);
    if (activePlaylistId === playlistId) {
      setActivePlaylistIdState("preset");
      setActivePlaylistId("preset");
      setActiveIndex(0);
    }
  };

  const handleImportSuccess = (
    name: string,
    importedTracks: Track[],
    source: "youtube" | "spotify" | "applemusic",
    url: string
  ) => {
    const saved = saveCustomPlaylist(name, importedTracks, source, url);
    const updated = getCustomPlaylists();
    setCustomPlaylists(updated);
    setActivePlaylistIdState(saved.id);
    setActivePlaylistId(saved.id);
    setActiveIndex(0);
    setEmbedOpen(true);
    setIsPlaying(true);
    window.setTimeout(() => sendYoutubeCommand("playVideo"), 200);
  };

  const playerStyle = useMemo(
    () =>
      ({
        "--accent": theme.accent,
        "--accent-soft": theme.accentSoft,
        "--progress": `${progress}%`,
      }) as CSSProperties,
    [progress, theme],
  );

  return (
    <main className={`radio-app ${rainOn ? "is-raining" : ""}`} style={playerStyle}>
      <audio ref={rainAudioRef} preload="none" src="https://cdn.pixabay.com/download/audio/2022/03/10/audio_74747d9fe0.mp3?filename=rain-ambient-110397.mp3" />
      <div className="hero-art" style={{ backgroundImage: `url(${theme.image})` }} aria-hidden="true" />
      <div className="hero-vignette" aria-hidden="true" />
      <div className="grain" aria-hidden="true" />
      {rainOn && <div className="rain-overlay" aria-hidden="true" />}

      <header className="topbar">
        <div className="listener-pill glass-pill" aria-label="gedi demo radio signal">
          <strong className="brand-word">गेड़ी</strong>
          <span className="top-divider" />
          <span className="live-dot" />
          <span className="muted-label">demo signal</span>
        </div>

        <button className="theme-pill glass-pill" onClick={changeTheme} aria-label={`Change theme, current ${theme.name}`}>
          <span className="theme-swatch" style={{ background: theme.accent }} />
          <span>Change Theme</span>
          <span className="theme-current">{theme.name}</span>
          <ChevronRight size={15} />
        </button>

        <nav className="nav-pill glass-pill" aria-label="Main navigation">
          <button onClick={() => setModal("about")}>About</button>
          <span className="nav-divider" />
          <button onClick={() => setModal("faq")}>FAQ</button>
          <button className="support-link" onClick={() => setModal("support")}><Heart size={14} fill="currentColor" /> Support Us</button>
        </nav>
      </header>

      <section className="hero-copy" aria-labelledby="station-title">
        <div className="station-label"><span /> {theme.eyebrow} <span /></div>
        <h1 id="station-title">कार <em>रेडियो</em></h1>
        <p>सड़क से सीधे, एक गीत और.</p>
        <div className="hero-rule"><span /> <Radio size={15} /> <span /></div>
      </section>

      <div className="floating-note glass-card">
        <div className="note-kicker"><Mic2 size={13} /> NOW BROADCASTING</div>
        <strong>{activeTrack.title}</strong>
        <span>{activeTrack.year ? `${activeTrack.year} / ` : ""}{activeTrack.film || activeTrack.album || "Airwaves"}</span>
        <div className="signal-bars" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      </div>

      <section className="utility-row" aria-label="Station actions">
        <PlaylistSelector
          activePlaylistId={activePlaylistId}
          customPlaylists={customPlaylists}
          onSelectPlaylist={handleSelectPlaylist}
          onDeletePlaylist={handleDeletePlaylist}
          onOpenImportModal={() => setIsImportModalOpen(true)}
        />
        <button className={`utility-pill ${rainOn ? "active" : ""}`} onClick={() => setRainOn((value) => !value)} aria-pressed={rainOn}>
          <CloudRain size={15} /> Baarish? <span className="utility-status">{rainOn ? "on" : "off"}</span>
        </button>
        <button
          className="utility-pill"
          onClick={() => setIsImportModalOpen(true)}
          aria-label="Tune custom playlist link"
        >
          <Plus size={13} /> Tune Link
        </button>
      </section>

      {rainOn && (
        <div className="rain-control glass-card">
          <div><CloudRain size={14} /><span>Rain ambience</span></div>
          <input aria-label="Rain ambience volume" type="range" min="0" max="1" step="0.01" value={rainVolume} onChange={(event) => setRainVolume(Number(event.target.value))} />
          <span>{Math.round(rainVolume * 100)}%</span>
        </div>
      )}

      <section className="player-shell glass-card" aria-label="Audio player">
        <div className="track-block">
          <div className={`album-art ${isPlaying ? "is-spinning" : ""}`} style={{ backgroundImage: `url(${activeTrack.cover || activeTrack.coverUrl || theme.image})` }} aria-hidden="true">
            <span><Radio size={18} /></span>
          </div>
          <div className="track-meta">
            <span className="track-year">{activeTrack.year ? `${activeTrack.year} / ` : ""}{activeTrack.artist}</span>
            <strong>{activeTrack.title}</strong>
            <span>{activeTrack.credits || activeTrack.album || "Direct Broadcast"}</span>
          </div>
        </div>

        <div className="player-center">
          <div className="official-source-line">
            <span>{activePlaylistId === "preset" ? "📻 GEDI PRESET" : `📼 ${activeCustomPlaylist?.name?.toUpperCase() || "CUSTOM STATION"}`}</span>
            {streamVideoId ? (
              <button onClick={() => { setEmbedOpen(true); setIsPlaying(true); }}>
                Play here <Play size={11} fill="currentColor" />
              </button>
            ) : (
              <a href={activeTrack.officialUrl} target="_blank" rel="noreferrer">
                Listen on Source <ExternalLink size={12} />
              </a>
            )}
          </div>
          <div className="player-buttons">
            <button className="icon-button" onClick={() => goToTrack(-1)} aria-label="Previous song"><ChevronLeft size={19} /></button>
            <button className="play-button" onClick={togglePlay} aria-label={isPlaying ? "Pause official song" : "Play official song inside gedi"}>{isPlaying ? <Pause size={21} fill="currentColor" /> : <Play size={21} fill="currentColor" />}</button>
            <button className="icon-button" onClick={() => goToTrack(1)} aria-label="Next song"><ChevronRight size={19} /></button>
          </div>
        </div>

        <div className="player-source-column">
          {embedOpen && streamVideoId ? (
            <div className="youtube-inline">
              <div className="youtube-inline-head">
                <span>{isPlaying ? "PLAYING IN GEDI" : "PAUSED"}</span>
                <button
                  className="inline-close"
                  onClick={() => {
                    sendYoutubeCommand("pauseVideo");
                    setEmbedOpen(false);
                    setIsPlaying(false);
                  }}
                  aria-label="Close embedded player"
                >
                  <X size={12} />
                </button>
              </div>
              <div className="youtube-media-wrapper">
                <iframe
                  key={streamVideoId}
                  ref={youtubeFrameRef}
                  id="gedi-youtube-player"
                  title={`${activeTrack.title} official video`}
                  src={`https://www.youtube.com/embed/${streamVideoId}?${youtubeParams}`}
                  referrerPolicy="origin"
                  allow="autoplay; encrypted-media; picture-in-picture"
                  allowFullScreen
                  onLoad={notifyIframeListening}
                />
                <div className="youtube-touch-shield" aria-hidden="true" />
              </div>
            </div>
          ) : (
            <button className="official-link" onClick={togglePlay}>
              <Play size={16} fill="currentColor" /> Play here
            </button>
          )}
        </div>
      </section>

      {modal && (
        <div className="modal-backdrop" role="presentation" onClick={() => setModal(null)}>
          <div className="info-modal" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <button className="close-button modal-close" onClick={() => setModal(null)} aria-label="Close dialog"><X size={18} /></button>
            {modal === "about" && <><span className="eyebrow"><Info size={12} /> ABOUT GEDI</span><h2>Some songs never really leave.</h2><p>gedi is a small online radio for the songs that played through dashboard speakers, laptop speakers, and cracked phone screens between 2010 and 2014.</p><p>No algorithmic panic. Just a warm loop of Bollywood pop, old road textures, and one more song before you reach home.</p><div className="modal-signoff">— transmitting from the driver's seat, always</div></>}
            {modal === "faq" && <><span className="eyebrow"><CircleHelp size={12} /> FREQUENTLY ASKED</span><h2>Good questions, late answers.</h2><div className="faq-item"><strong>Is this a real stream?</strong><p>It is a playful demo station with official song sources and a curated 2010–14 playlist.</p></div><div className="faq-item"><strong>What does Baarish? do?</strong><p>It adds a soft ambient rain layer over the music, with its own volume control.</p></div></>}
            {modal === "support" && (
              <>
                <span className="eyebrow"><Heart size={12} fill="currentColor" /> KEEP THE SIGNAL WARM</span>
                <h2>Support the late-night loop.</h2>
                <p>
                  Send a song to a friend, or send your favourite tracks to{" "}
                  <strong style={{ color: "var(--accent)" }}>joshikartik.1925@gmail.com</strong> to get them added to the playlist.
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center", marginTop: "24px" }}>
                  <a
                    className="modal-action"
                    style={{ marginTop: 0 }}
                    href={`https://mail.google.com/mail/?view=cm&fs=1&to=joshikartik.1925@gmail.com&su=${encodeURIComponent("Song Suggestion for Gedi Playlist")}&body=${encodeURIComponent("Hi Kartik,\n\nI would love to suggest this song for the Gedi playlist:\n\n- Song Title: \n- Artist / Film: \n- Year: \n- YouTube Link: \n\nThanks!")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Send to joshikartik.1925@gmail.com <ExternalLink size={14} />
                  </a>
                  <button
                    type="button"
                    onClick={copyStationEmail}
                    className="modal-action-copy"
                    aria-label="Copy email address"
                  >
                    {copiedEmail ? <Check size={14} color="var(--accent)" /> : <Copy size={14} />}
                    <span>{copiedEmail ? "Copied!" : "Copy Email"}</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImportSuccess={handleImportSuccess}
      />
    </main>
  );
}
