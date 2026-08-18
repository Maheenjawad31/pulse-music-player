export type Genre =
  | "All"
  | "Electronic"
  | "Pop"
  | "Hip-Hop"
  | "Ambient"
  | "Rock";

export type Track = {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: Exclude<Genre, "All">;
  duration: number;
  cover: string;
  audioUrl: string;
};

export type Playlist = {
  id: string;
  name: string;
  trackIds: string[];
};