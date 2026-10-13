import { ImportPlaylistResult, Track } from "../types/track";

export type PlaylistSource = "youtube";

interface ParsedUrlInfo {
  source: PlaylistSource;
  id: string;
  type: "playlist" | "track";
  originalUrl: string;
}

/**
 * Identify and parse a YouTube / YouTube Music URL (playlist or single video).
 * Returns null for anything else.
 */
export function parsePlaylistUrl(rawUrl: string): ParsedUrlInfo | null {
  const url = rawUrl.trim();
  if (!url) return null;

  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    const host = parsed.hostname.toLowerCase();
    const pathname = parsed.pathname;
    const searchParams = parsed.searchParams;

    const isYouTube =
      host === "youtu.be" ||
      host === "youtube.com" ||
      host.endsWith(".youtube.com");

    if (!isYouTube) return null;

    // Check for playlist list parameter first
    const listId = searchParams.get("list");
    if (listId && listId !== "WL" && listId !== "LL") {
      return {
        source: "youtube",
        id: listId,
        type: "playlist",
        originalUrl: url,
      };
    }

    // Check for single video watch
    if (searchParams.get("v")) {
      return {
        source: "youtube",
        id: searchParams.get("v")!,
        type: "track",
        originalUrl: url,
      };
    }

    // Short youtu.be/VIDEO_ID
    if (host === "youtu.be") {
      const videoId = pathname.replace(/^\//, "").split("/")[0];
      if (videoId) {
        return {
          source: "youtube",
          id: videoId,
          type: "track",
          originalUrl: url,
        };
      }
    }

    // Path playlist/ID
    if (pathname.includes("/playlist")) {
      const id = searchParams.get("list") || pathname.split("/").pop();
      if (id) {
        return {
          source: "youtube",
          id,
          type: "playlist",
          originalUrl: url,
        };
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Fetch YouTube tracks using the YouTube Data API (if a key is set) or public Invidious / Piped instances.
 */
async function fetchYouTubeTracks(info: ParsedUrlInfo): Promise<ImportPlaylistResult> {
  const apiKey = (import.meta as any).env?.VITE_YOUTUBE_API_KEY;

  // Case A: Single video URL
  if (info.type === "track") {
    try {
      const res = await fetch(
        `https://noembed.com/embed?url=https://www.youtube.com/watch?v=${info.id}`
      );
      if (res.ok) {
        const data = await res.json();
        const title = data.title || `YouTube Track (${info.id})`;
        const artist = data.author_name || "YouTube Artist";
        const cover =
          data.thumbnail_url || `https://img.youtube.com/vi/${info.id}/hqdefault.jpg`;

        const track: Track = {
          id: `yt-${info.id}`,
          title,
          artist,
          album: "YouTube Single",
          coverUrl: cover,
          streamId: info.id,
          source: "youtube",
          year: new Date().getFullYear(),
          film: "Online Broadcast",
          credits: `Curated from ${artist}`,
          officialUrl: `https://www.youtube.com/watch?v=${info.id}`,
          youtubeId: info.id,
          cover,
        };

        return {
          playlistName: title,
          source: "youtube",
          tracks: [track],
          originalUrl: info.originalUrl,
        };
      }
    } catch { }

    // Fallback single track
    const track: Track = {
      id: `yt-${info.id}`,
      title: `YouTube Video ${info.id}`,
      artist: "YouTube",
      album: "Single",
      coverUrl: `https://img.youtube.com/vi/${info.id}/hqdefault.jpg`,
      streamId: info.id,
      source: "youtube",
      year: new Date().getFullYear(),
      film: "Online Broadcast",
      credits: "Direct stream link",
      officialUrl: `https://www.youtube.com/watch?v=${info.id}`,
      youtubeId: info.id,
      cover: `https://img.youtube.com/vi/${info.id}/hqdefault.jpg`,
    };

    return {
      playlistName: `Station ${info.id}`,
      source: "youtube",
      tracks: [track],
      originalUrl: info.originalUrl,
    };
  }

  // Case B: YouTube Playlist with Google API key
  if (apiKey) {
    try {
      const listRes = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&maxResults=50&playlistId=${info.id}&key=${apiKey}`
      );
      if (listRes.ok) {
        const data = await listRes.json();
        let playlistName = "YouTube Playlist";

        // Try getting playlist title
        try {
          const metaRes = await fetch(
            `https://www.googleapis.com/youtube/v3/playlists?part=snippet&id=${info.id}&key=${apiKey}`
          );
          if (metaRes.ok) {
            const metaData = await metaRes.json();
            playlistName = metaData.items?.[0]?.snippet?.title || playlistName;
          }
        } catch { }

        const tracks: Track[] = (data.items || [])
          .filter((item: any) => item.snippet?.resourceId?.videoId)
          .map((item: any, idx: number) => {
            const vid = item.snippet.resourceId.videoId;
            const title = item.snippet.title || `Track ${idx + 1}`;
            const artist = item.snippet.videoOwnerChannelTitle || "Unknown Artist";
            const thumbs = item.snippet.thumbnails;
            const cover =
              thumbs?.high?.url ||
              thumbs?.medium?.url ||
              `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;

            return {
              id: `yt-${vid}-${idx}`,
              title,
              artist,
              album: playlistName,
              coverUrl: cover,
              streamId: vid,
              source: "youtube",
              year: new Date().getFullYear(),
              film: playlistName,
              credits: `Uploaded by ${artist}`,
              officialUrl: `https://www.youtube.com/watch?v=${vid}`,
              youtubeId: vid,
              cover,
            };
          });

        if (tracks.length > 0) {
          return {
            playlistName,
            source: "youtube",
            tracks,
            originalUrl: info.originalUrl,
          };
        }
      }
    } catch (err) {
      console.warn("YouTube Data API fetch failed, falling back to public endpoints:", err);
    }
  }

  // Case C: Public Invidious / Piped instances fallback
  const publicInstances = [
    `https://inv.nadeko.net/api/v1/playlists/${info.id}`,
    `https://invidious.nerdvpn.de/api/v1/playlists/${info.id}`,
    `https://vid.puffyan.us/api/v1/playlists/${info.id}`,
    `https://pipedapi.kavin.rocks/playlists/${info.id}`,
  ];

  for (const endpoint of publicInstances) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);
      const res = await fetch(endpoint, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const playlistName = data.title || data.name || "Custom YouTube Station";
        const videos = data.videos || data.relatedStreams || [];

        if (videos.length > 0) {
          const tracks: Track[] = videos.slice(0, 50).map((v: any, idx: number) => {
            const vid = v.videoId || v.url?.replace("/watch?v=", "") || "";
            const title = v.title || `Song ${idx + 1}`;
            const artist = v.author || v.uploaderName || "Unknown Artist";
            const thumbs = v.videoThumbnails || [];
            const cover =
              v.thumbnail ||
              thumbs[0]?.url ||
              `https://img.youtube.com/vi/${vid}/hqdefault.jpg`;

            return {
              id: `yt-${vid || idx}-${Date.now()}`,
              title,
              artist,
              album: playlistName,
              coverUrl: cover,
              streamId: vid,
              source: "youtube",
              year: new Date().getFullYear(),
              film: playlistName,
              credits: `From ${artist}`,
              officialUrl: `https://www.youtube.com/watch?v=${vid}`,
              youtubeId: vid,
              cover,
            };
          }).filter((t: Track) => Boolean(t.streamId));

          if (tracks.length > 0) {
            return {
              playlistName,
              source: "youtube",
              tracks,
              originalUrl: info.originalUrl,
            };
          }
        }
      }
    } catch { }
  }

  // Case D: Try oEmbed on playlist
  try {
    const oembedRes = await fetch(
      `https://noembed.com/embed?url=https://www.youtube.com/playlist?list=${info.id}`
    );
    if (oembedRes.ok) {
      const oembedData = await oembedRes.json();
      if (oembedData && oembedData.title) {
        // Create an initial station entry
        const fallbackTrack: Track = {
          id: `yt-list-${info.id}`,
          title: oembedData.title,
          artist: oembedData.author_name || "YouTube Playlist",
          album: oembedData.title,
          coverUrl: oembedData.thumbnail_url || "/themes/open-road.jpg",
          streamId: info.id,
          source: "youtube",
          year: new Date().getFullYear(),
          film: "Custom Playlist",
          credits: `Curated by ${oembedData.author_name || "Listener"}`,
          officialUrl: `https://www.youtube.com/playlist?list=${info.id}`,
          youtubeId: info.id,
          cover: oembedData.thumbnail_url || "/themes/open-road.jpg",
        };

        return {
          playlistName: oembedData.title,
          source: "youtube",
          tracks: [fallbackTrack],
          originalUrl: info.originalUrl,
        };
      }
    }
  } catch { }

  throw new Error(
    "Unable to fetch YouTube playlist tracks. Please check that the playlist is Public or Unlisted (not Private)."
  );
}

/**
 * Main parser and loader for a public YouTube / YouTube Music link.
 */
export async function fetchPlaylistFromUrl(url: string): Promise<ImportPlaylistResult> {
  const parsed = parsePlaylistUrl(url);
  if (!parsed) {
    throw new Error("Unsupported link. Please paste a public YouTube or YouTube Music playlist link.");
  }
  return fetchYouTubeTracks(parsed);
}