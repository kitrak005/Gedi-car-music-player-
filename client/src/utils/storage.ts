import { SavedPlaylist, Track } from "../types/track";

const STORAGE_KEY = "gedi_custom_playlists_v1";
const ACTIVE_PLAYLIST_KEY = "gedi_active_playlist_id";

/**
 * Retrieve all custom playlists stored in localStorage.
 */
export function getCustomPlaylists(): SavedPlaylist[] {
  if (typeof window === "undefined" || !window.localStorage) {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return [];
  } catch (error) {
    console.error("Failed to load custom playlists from localStorage:", error);
    return [];
  }
}

/**
 * Save or update a custom playlist.
 */
export function saveCustomPlaylist(
  name: string,
  tracks: Track[],
  source: "youtube" | "spotify" | "applemusic" = "youtube",
  url?: string
): SavedPlaylist {
  const existing = getCustomPlaylists();
  const id = `playlist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  
  const newPlaylist: SavedPlaylist = {
    id,
    name: name.trim() || `Station ${existing.length + 1}`,
    source,
    url,
    tracks,
    createdAt: Date.now(),
  };

  try {
    const updated = [newPlaylist, ...existing];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error("Failed to save playlist to localStorage:", error);
  }

  return newPlaylist;
}

/**
 * Delete a custom playlist by ID.
 */
export function deleteCustomPlaylist(id: string): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const existing = getCustomPlaylists();
    const filtered = existing.filter((p) => p.id !== id);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));

    // If deleting the active playlist, reset to preset
    if (getActivePlaylistId() === id) {
      setActivePlaylistId("preset");
    }
  } catch (error) {
    console.error("Failed to delete playlist from localStorage:", error);
  }
}

/**
 * Get a specific custom playlist by ID.
 */
export function getCustomPlaylistById(id: string): SavedPlaylist | undefined {
  const playlists = getCustomPlaylists();
  return playlists.find((p) => p.id === id);
}

/**
 * Get currently selected playlist ID ("preset" or custom playlist ID).
 */
export function getActivePlaylistId(): string {
  if (typeof window === "undefined" || !window.localStorage) return "preset";
  try {
    return window.localStorage.getItem(ACTIVE_PLAYLIST_KEY) || "preset";
  } catch {
    return "preset";
  }
}

/**
 * Persist currently selected playlist ID.
 */
export function setActivePlaylistId(id: string): void {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    window.localStorage.setItem(ACTIVE_PLAYLIST_KEY, id);
  } catch (error) {
    console.error("Failed to set active playlist in localStorage:", error);
  }
}
