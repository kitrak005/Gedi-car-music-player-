import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import {
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  CloudRain,
  ExternalLink,
  Heart,
  Info,
  Mic2,
  Pause,
  Play,
  Radio,
  X,
} from "lucide-react";

type Track = {
  id: string;
  year: number;
  title: string;
  film: string;
  artist: string;
  credits: string;
  officialUrl: string;
  youtubeId?: string;
  cover: string;
};

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
  cover: themes[0].image,
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
  const [tracks, setTracks] = useState<Track[]>([]);
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
  const [embedOpen, setEmbedOpen] = useState(false);
  const rainAudioRef = useRef<HTMLAudioElement>(null);
  const youtubeFrameRef = useRef<HTMLIFrameElement>(null);
  const tracksRef = useRef<Track[]>(tracks);
  tracksRef.current = tracks;
  const activeIndexRef = useRef<number>(activeIndex);
  activeIndexRef.current = activeIndex;
  const lastShuffleTimeRef = useRef<number>(0);

  const theme = themes[themeIndex];
  const activeTrack = tracks[activeIndex] ?? fallbackTrack;
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

  useEffect(() => {
    fetch("/songs.json")
      .then((response) => response.json())
      .then((data: Track[]) => setTracks(data))
      .catch(() => setTracks([fallbackTrack]));
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

  const playRandomTrack = () => {
    const currentTracks = tracksRef.current;
    const currentIdx = activeIndexRef.current;
    if (!currentTracks.length) return;

    let nextIdx = currentIdx;
    if (currentTracks.length > 1) {
      const candidates = currentTracks
        .map((_, idx) => idx)
        .filter((idx) => idx !== currentIdx);
      nextIdx = candidates[Math.floor(Math.random() * candidates.length)];
    }

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
      playRandomTrack();
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
    if (!embedOpen || !activeTrack.youtubeId) return;
    notifyIframeListening();
    const t1 = setTimeout(notifyIframeListening, 300);
    const t2 = setTimeout(notifyIframeListening, 1000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [embedOpen, activeTrack.youtubeId]);

  const togglePlay = () => {
    if (activeTrack.youtubeId) {
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
    window.open(activeTrack.officialUrl, "_blank", "noopener,noreferrer");
  };

  const goToTrack = (direction: number) => {
    const currentTracks = tracksRef.current;
    if (!currentTracks.length) return;
    const nextIdx = (activeIndexRef.current + direction + currentTracks.length) % currentTracks.length;
    setActiveIndex(nextIdx);
    setEmbedOpen(true);
    setIsPlaying(true);
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
        <span>{activeTrack.year} / {activeTrack.film}</span>
        <div className="signal-bars" aria-hidden="true"><i /><i /><i /><i /><i /></div>
      </div>

      <section className="utility-row single-action" aria-label="Station actions">
        <button className={`utility-pill ${rainOn ? "active" : ""}`} onClick={() => setRainOn((value) => !value)} aria-pressed={rainOn}>
          <CloudRain size={15} /> Baarish? <span className="utility-status">{rainOn ? "on" : "off"}</span>
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
          <div className={`album-art ${isPlaying ? "is-spinning" : ""}`} style={{ backgroundImage: `url(${activeTrack.cover || theme.image})` }} aria-hidden="true">
            <span><Radio size={18} /></span>
          </div>
          <div className="track-meta">
            <span className="track-year">{activeTrack.year} / {activeTrack.artist}</span>
            <strong>{activeTrack.title}</strong>
            <span>{activeTrack.credits}</span>
          </div>
        </div>

        <div className="player-center">
          <div className="official-source-line"><span>OFFICIAL SOURCE</span>{activeTrack.youtubeId ? <button onClick={() => { setEmbedOpen(true); setIsPlaying(true); }}>Play here <Play size={11} fill="currentColor" /></button> : <a href={activeTrack.officialUrl} target="_blank" rel="noreferrer">Listen on YouTube <ExternalLink size={12} /></a>}</div>
          <div className="player-buttons">
            <button className="icon-button" onClick={() => goToTrack(-1)} aria-label="Previous song"><ChevronLeft size={19} /></button>
            <button className="play-button" onClick={togglePlay} aria-label={isPlaying ? "Pause official song" : "Play official song inside gedi"}>{isPlaying ? <Pause size={21} fill="currentColor" /> : <Play size={21} fill="currentColor" />}</button>
            <button className="icon-button" onClick={() => goToTrack(1)} aria-label="Next song"><ChevronRight size={19} /></button>
          </div>
        </div>

        <div className="player-source-column">
          {embedOpen && activeTrack.youtubeId ? (
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
                  key={activeTrack.youtubeId}
                  ref={youtubeFrameRef}
                  id="gedi-youtube-player"
                  title={`${activeTrack.title} official video`}
                  src={`https://www.youtube.com/embed/${activeTrack.youtubeId}?${youtubeParams}`}
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
            {modal === "support" && <><span className="eyebrow"><Heart size={12} fill="currentColor" /> KEEP THE SIGNAL WARM</span><h2>Support the late-night loop.</h2><p>Send a song to a friend, or simply keep this tab open while you ride home. That is plenty.</p><a className="modal-action" href="mailto:joshikartik.1925@gmail.com">Write to the station <ArrowDown size={15} /></a></>}
          </div>
        </div>
      )}
    </main>
  );
}
