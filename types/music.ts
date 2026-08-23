export type Track = {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: number;
  cover: string;
  audioUrl: string;
};

export type Playlist = {
  id: string;
  name: string;
  trackIds: string[];
};