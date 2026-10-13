import { describe, expect, it } from "vitest";
import { parsePlaylistUrl } from "./playlistImport";

describe("parsePlaylistUrl", () => {
  it("should parse standard YouTube playlist URL", () => {
    const parsed = parsePlaylistUrl(
      "https://www.youtube.com/playlist?list=PL4fGSIFgk54Fz4Rk8_PjB8sN5YdDk0v"
    );
    expect(parsed).not.toBeNull();
    expect(parsed?.source).toBe("youtube");
    expect(parsed?.type).toBe("playlist");
    expect(parsed?.id).toBe("PL4fGSIFgk54Fz4Rk8_PjB8sN5YdDk0v");
  });

  it("should parse YouTube Music playlist URL", () => {
    const parsed = parsePlaylistUrl(
      "https://music.youtube.com/playlist?list=RDCLAK5uy_kmPRjHDECIcuVwnKsx2Ng"
    );
    expect(parsed).not.toBeNull();
    expect(parsed?.source).toBe("youtube");
    expect(parsed?.type).toBe("playlist");
    expect(parsed?.id).toBe("RDCLAK5uy_kmPRjHDECIcuVwnKsx2Ng");
  });

  it("should parse YouTube watch URL with list param", () => {
    const parsed = parsePlaylistUrl(
      "https://www.youtube.com/watch?v=dQw4w9WgXcQ&list=PL12345"
    );
    expect(parsed).not.toBeNull();
    expect(parsed?.source).toBe("youtube");
    expect(parsed?.type).toBe("playlist");
    expect(parsed?.id).toBe("PL12345");
  });

  it("should parse single YouTube video URL", () => {
    const parsed = parsePlaylistUrl("https://youtu.be/WCTro3qabjE");
    expect(parsed).not.toBeNull();
    expect(parsed?.source).toBe("youtube");
    expect(parsed?.type).toBe("track");
    expect(parsed?.id).toBe("WCTro3qabjE");
  });

  it("should parse Spotify playlist URL", () => {
    const parsed = parsePlaylistUrl(
      "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M?si=12345"
    );
    expect(parsed).not.toBeNull();
    expect(parsed?.source).toBe("spotify");
    expect(parsed?.type).toBe("playlist");
    expect(parsed?.id).toBe("37i9dQZF1DXcBWIGoYBM5M");
  });

  it("should parse Apple Music playlist URL", () => {
    const parsed = parsePlaylistUrl(
      "https://music.apple.com/us/playlist/pure-ambient/pl.u-aZb0DXDsP8L4X"
    );
    expect(parsed).not.toBeNull();
    expect(parsed?.source).toBe("applemusic");
    expect(parsed?.type).toBe("playlist");
  });

  it("should return null for invalid URL", () => {
    const parsed = parsePlaylistUrl("https://example.com/not-music");
    expect(parsed).toBeNull();
  });
});
