export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  coverUrl?: string;
  streamId: string; // Video ID or audio source URL
  source: 'preset' | 'youtube' | 'spotify' | 'applemusic';
  // Backwards compatibility fields for Gedi dashboard
  year?: number;
  film?: string;
  credits?: string;
  officialUrl?: string;
  youtubeId?: string;
  cover?: string;
}

export interface SavedPlaylist {
  id: string;
  name: string;
  source: 'preset' | 'youtube' | 'spotify' | 'applemusic';
  url?: string;
  tracks: Track[];
  createdAt: number;
}

export interface ImportPlaylistResult {
  playlistName: string;
  source: 'youtube' | 'spotify' | 'applemusic';
  tracks: Track[];
  originalUrl: string;
}
