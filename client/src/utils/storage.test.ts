import { beforeEach, describe, expect, it } from "vitest";
import { Track } from "../types/track";
import {
  deleteCustomPlaylist,
  getActivePlaylistId,
  getCustomPlaylistById,
  getCustomPlaylists,
  saveCustomPlaylist,
  setActivePlaylistId,
} from "./storage";

describe("storage utils", () => {
  beforeEach(() => {
    // Mock localStorage
    let store: Record<string, string> = {};
    global.window = {
      localStorage: {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, val: string) => {
          store[key] = val;
        },
        removeItem: (key: string) => {
          delete store[key];
        },
        clear: () => {
          store = {};
        },
      },
    } as any;
  });

  const mockTrack: Track = {
    id: "yt-123",
    title: "Tum Se Hi",
    artist: "Mohit Chauhan",
    album: "Jab We Met",
    streamId: "mt9xg0mmt28",
    source: "youtube",
    youtubeId: "mt9xg0mmt28",
  };

  it("should save and retrieve custom playlists", () => {
    expect(getCustomPlaylists()).toEqual([]);

    const saved = saveCustomPlaylist("My Bollywood Drive", [mockTrack], "youtube");
    expect(saved.id).toBeDefined();
    expect(saved.name).toBe("My Bollywood Drive");
    expect(saved.tracks).toHaveLength(1);

    const all = getCustomPlaylists();
    expect(all).toHaveLength(1);
    expect(all[0].name).toBe("My Bollywood Drive");
  });

  it("should get custom playlist by id", () => {
    const saved = saveCustomPlaylist("Night Mix", [mockTrack], "youtube");
    const found = getCustomPlaylistById(saved.id);
    expect(found).toBeDefined();
    expect(found?.name).toBe("Night Mix");
  });

  it("should delete custom playlist and reset active playlist if matching", () => {
    const saved = saveCustomPlaylist("To Delete", [mockTrack], "youtube");
    setActivePlaylistId(saved.id);
    expect(getActivePlaylistId()).toBe(saved.id);

    deleteCustomPlaylist(saved.id);
    expect(getCustomPlaylists()).toHaveLength(0);
    expect(getActivePlaylistId()).toBe("preset");
  });
});
