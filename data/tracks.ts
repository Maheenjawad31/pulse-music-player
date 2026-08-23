import type { Playlist, Track } from "@/types/music";

export const tracks: Track[] = [
  {
    id: "midnight-drive",
    title: "Midnight Drive",
    artist: "Neon Echo",
    album: "After Hours",
    genre: "Electronic",
    duration: 214,
    cover: "/covers/midnight-drive.jpg",
    audioUrl: "/audio/midnight-drive.mp3",
  },
  {
    id: "city-lights",
    title: "City Lights",
    artist: "Nova Lane",
    album: "Night Signals",
    genre: "Pop",
    duration: 198,
    cover: "/covers/city-lights.jpg",
    audioUrl: "/audio/city-lights.mp3",
  },
  {
    id: "slow-motion",
    title: "Slow Motion",
    artist: "Velvet Sky",
    album: "Soft Focus",
    genre: "Ambient",
    duration: 241,
    cover: "/covers/slow-motion.jpg",
    audioUrl: "/audio/slow-motion.mp3",
  },
  {
    id: "electric-soul",
    title: "Electric Soul",
    artist: "Parallel",
    album: "Voltage",
    genre: "Electronic",
    duration: 225,
    cover: "/covers/electric-soul.jpg",
    audioUrl: "/audio/electric-soul.mp3",
  },
  {
    id: "golden-hour",
    title: "Golden Hour",
    artist: "Maya Rivers",
    album: "Sunset Stories",
    genre: "Pop",
    duration: 187,
    cover: "/covers/golden-hour.jpg",
    audioUrl: "/audio/golden-hour.mp3",
  },
  {
    id: "street-dreams",
    title: "Street Dreams",
    artist: "Northside",
    album: "Concrete Skies",
    genre: "Hip-Hop",
    duration: 203,
    cover: "/covers/street-dreams.jpg",
    audioUrl: "/audio/street-dreams.mp3",
  },
  {
    id: "afterglow",
    title: "Afterglow",
    artist: "Static Bloom",
    album: "Signals",
    genre: "Rock",
    duration: 231,
    cover: "/covers/afterglow.jpg",
    audioUrl: "/audio/afterglow.mp3",
  },
  {
    id: "orbit",
    title: "Orbit",
    artist: "Lunar Phase",
    album: "Gravity",
    genre: "Ambient",
    duration: 256,
    cover: "/covers/orbit.jpg",
    audioUrl: "/audio/orbit.mp3",
  },
];

export const defaultPlaylists: Playlist[] = [
  {
    id: "liked",
    name: "Liked Songs",
    trackIds: [],
  },
  {
    id: "focus",
    name: "Deep Focus",
    trackIds: [
      "slow-motion",
      "orbit",
      "midnight-drive",
    ],
  },
  {
    id: "night",
    name: "Late Night",
    trackIds: [
      "city-lights",
      "street-dreams",
      "afterglow",
    ],
  },
];

export const genres = [
  "All",
  "Electronic",
  "Pop",
  "Hip-Hop",
  "Ambient",
  "Rock",
] as const;