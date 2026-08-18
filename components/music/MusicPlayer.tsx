"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Image from "next/image";

import {
  Heart,
  Home,
  Library,
  ListMusic,
  Menu,
  Music2,
  Pause,
  Play,
  Repeat,
  Search,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

import {
  genres,
  tracks,
} from "@/data/tracks";

import {
  useAudioPlayer,
} from "@/hooks/useAudioPlayer";

import type {
  Genre,
  Track,
} from "@/types/music";

function formatTime(
  seconds: number
) {
  const safeSeconds =
    Math.max(
      0,
      Math.floor(seconds || 0)
    );

  const minutes =
    Math.floor(
      safeSeconds / 60
    );

  const remaining =
    safeSeconds % 60;

  return `${minutes}:${remaining
    .toString()
    .padStart(2, "0")}`;
}

const playlistTracks = {
  "Deep Focus": [
    "slow-motion",
    "orbit",
    "midnight-drive",
  ],

  "Late Night": [
    "city-lights",
    "street-dreams",
    "afterglow",
  ],
};

type PlaylistName =
  | "Liked Songs"
  | "Deep Focus"
  | "Late Night";

const STORAGE_KEYS = {
  liked: "pulse-liked-songs",
  volume: "pulse-volume",
  shuffle: "pulse-shuffle",
  repeat: "pulse-repeat",
  currentTrack:
    "pulse-current-track",
};

export default function MusicPlayer() {
  /*
   * -----------------------------
   * BASIC STATE
   * -----------------------------
   */

  const [
    selectedGenre,
    setSelectedGenre,
  ] = useState<Genre>("All");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    currentTrack,
    setCurrentTrack,
  ] = useState<Track>(
    tracks[0]
  );

  const [
    shouldAutoPlay,
    setShouldAutoPlay,
  ] = useState(false);

  const [
    shuffle,
    setShuffle,
  ] = useState(false);

  const [
    repeat,
    setRepeat,
  ] = useState(false);

  const [
    liked,
    setLiked,
  ] = useState<string[]>([]);

  const [
    activePlaylist,
    setActivePlaylist,
  ] =
    useState<PlaylistName | null>(
      null
    );

  const [
    sidebarOpen,
    setSidebarOpen,
  ] = useState(false);

  const [
    settingsLoaded,
    setSettingsLoaded,
  ] = useState(false);

  const [
    initialVolume,
    setInitialVolume,
  ] = useState(0.8);

  /*
   * -----------------------------
   * RESTORE SETTINGS
   * -----------------------------
   */

  useEffect(() => {
    try {
      /*
       * Restore liked songs.
       */
      const savedLiked =
        localStorage.getItem(
          STORAGE_KEYS.liked
        );

      if (savedLiked) {
        const parsed =
          JSON.parse(
            savedLiked
          );

        if (
          Array.isArray(parsed)
        ) {
          setLiked(
            parsed.filter(
              (id) =>
                typeof id ===
                "string"
            )
          );
        }
      }

      /*
       * Restore volume.
       */
      const savedVolume =
        localStorage.getItem(
          STORAGE_KEYS.volume
        );

      if (savedVolume) {
        const parsed =
          Number(
            savedVolume
          );

        if (
          Number.isFinite(
            parsed
          ) &&
          parsed >= 0 &&
          parsed <= 1
        ) {
          setInitialVolume(
            parsed
          );
        }
      }

      /*
       * Restore shuffle.
       */
      const savedShuffle =
        localStorage.getItem(
          STORAGE_KEYS.shuffle
        );

      if (
        savedShuffle ===
        "true"
      ) {
        setShuffle(true);
      }

      /*
       * Restore repeat.
       */
      const savedRepeat =
        localStorage.getItem(
          STORAGE_KEYS.repeat
        );

      if (
        savedRepeat ===
        "true"
      ) {
        setRepeat(true);
      }

      /*
       * Restore current track.
       */
      const savedTrackId =
        localStorage.getItem(
          STORAGE_KEYS.currentTrack
        );

      if (savedTrackId) {
        const savedTrack =
          tracks.find(
            (track) =>
              track.id ===
              savedTrackId
          );

        if (savedTrack) {
          setCurrentTrack(
            savedTrack
          );
        } else {
          setCurrentTrack(
            tracks[0]
          );
        }
      } else {
        setCurrentTrack(
          tracks[0]
        );
      }
    } catch (error) {
      console.warn(
        "Could not restore Pulse settings.",
        error
      );

      setCurrentTrack(
        tracks[0]
      );
    } finally {
      setSettingsLoaded(true);
    }
  }, []);

 /*
 * -----------------------------
 * AUDIO ENDED HANDLER
 * -----------------------------
 */

const handleTrackEnded =
useCallback(() => {
  /*
   * Repeat current song.
   */
  if (repeat) {
    return true;
  }

  /*
   * Shuffle.
   */
  if (
    shuffle &&
    tracks.length > 1
  ) {
    const candidates =
      tracks.filter(
        (track) =>
          track.id !==
          currentTrack.id
      );

    if (
      candidates.length
    ) {
      const randomIndex =
        Math.floor(
          Math.random() *
            candidates.length
        );

      setShouldAutoPlay(true);

      setCurrentTrack(
        candidates[randomIndex]
      );

      return false;
    }
  }

  /*
   * Normal next track.
   */
  const index =
    tracks.findIndex(
      (track) =>
        track.id ===
        currentTrack.id
    );

  const nextIndex =
    index >=
    tracks.length - 1
      ? 0
      : index + 1;

  setShouldAutoPlay(true);

  setCurrentTrack(
    tracks[nextIndex]
  );

  return false;
}, [
  currentTrack.id,
  repeat,
  shuffle,
]);
  /*
   * -----------------------------
   * AUDIO PLAYER
   * -----------------------------
   */

  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    togglePlay,
    setVolume,
    seek,
    restart,
  } = useAudioPlayer(
    currentTrack,
    shouldAutoPlay,
    {
      onEnded:
        handleTrackEnded,
    }
  );

  /*
   * Apply restored volume.
   */
  useEffect(() => {
    if (
      settingsLoaded &&
      initialVolume !== 0.8
    ) {
      setVolume(
        initialVolume
      );
    }
  }, [
    settingsLoaded,
    initialVolume,
    setVolume,
  ]);

  /*
   * -----------------------------
   * SAVE SETTINGS
   * -----------------------------
   */

  useEffect(() => {
    if (!settingsLoaded) {
      return;
    }

    try {
      localStorage.setItem(
        STORAGE_KEYS.liked,
        JSON.stringify(liked)
      );
    } catch {
      // Ignore storage errors.
    }
  }, [
    liked,
    settingsLoaded,
  ]);

  useEffect(() => {
    if (!settingsLoaded) {
      return;
    }

    try {
      localStorage.setItem(
        STORAGE_KEYS.volume,
        String(volume)
      );
    } catch {
      // Ignore storage errors.
    }
  }, [
    volume,
    settingsLoaded,
  ]);

  useEffect(() => {
    if (!settingsLoaded) {
      return;
    }

    try {
      localStorage.setItem(
        STORAGE_KEYS.shuffle,
        String(shuffle)
      );
    } catch {
      // Ignore storage errors.
    }
  }, [
    shuffle,
    settingsLoaded,
  ]);

  useEffect(() => {
    if (!settingsLoaded) {
      return;
    }

    try {
      localStorage.setItem(
        STORAGE_KEYS.repeat,
        String(repeat)
      );
    } catch {
      // Ignore storage errors.
    }
  }, [
    repeat,
    settingsLoaded,
  ]);

  /*
   * Save current song only AFTER
   * settings have been restored.
   *
   * This prevents tracks[0] from
   * overwriting the saved song
   * during the initial render.
   */
  useEffect(() => {
    if (!settingsLoaded) {
      return;
    }

    try {
      localStorage.setItem(
        STORAGE_KEYS.currentTrack,
        currentTrack.id
      );
    } catch {
      // Ignore storage errors.
    }
  }, [
    currentTrack.id,
    settingsLoaded,
  ]);

  /*
   * -----------------------------
   * PLAYLIST SOURCE
   * -----------------------------
   */

  const playlistSource =
    useMemo(() => {
      if (
        activePlaylist ===
        "Liked Songs"
      ) {
        return tracks.filter(
          (track) =>
            liked.includes(
              track.id
            )
        );
      }

      if (
        activePlaylist ===
        "Deep Focus"
      ) {
        return tracks.filter(
          (track) =>
            playlistTracks[
              "Deep Focus"
            ].includes(
              track.id
            )
        );
      }

      if (
        activePlaylist ===
        "Late Night"
      ) {
        return tracks.filter(
          (track) =>
            playlistTracks[
              "Late Night"
            ].includes(
              track.id
            )
        );
      }

      return tracks;
    }, [
      activePlaylist,
      liked,
    ]);

  /*
   * -----------------------------
   * SEARCH + GENRE
   * -----------------------------
   */

  const filteredTracks =
    useMemo(() => {
      const query =
        search
          .toLowerCase()
          .trim();

      return playlistSource.filter(
        (track) => {
          const matchesGenre =
            selectedGenre ===
              "All" ||
            track.genre ===
              selectedGenre;

          const matchesSearch =
            !query ||
            track.title
              .toLowerCase()
              .includes(query) ||
            track.artist
              .toLowerCase()
              .includes(query) ||
            track.album
              .toLowerCase()
              .includes(query);

          return (
            matchesGenre &&
            matchesSearch
          );
        }
      );
    }, [
      playlistSource,
      search,
      selectedGenre,
    ]);

  /*
   * -----------------------------
   * TRACK SELECTION
   * -----------------------------
   */

  const selectTrack =
    useCallback(
      (track: Track) => {
        if (
          track.id ===
          currentTrack.id
        ) {
          togglePlay();
          return;
        }

        setShouldAutoPlay(true);

        setCurrentTrack(
          track
        );
      },
      [
        currentTrack.id,
        togglePlay,
      ]
    );

  /*
   * -----------------------------
   * LIKE
   * -----------------------------
   */

  const toggleLike =
    useCallback(
      (id: string) => {
        setLiked(
          (current) =>
            current.includes(id)
              ? current.filter(
                  (trackId) =>
                    trackId !==
                    id
                )
              : [
                  ...current,
                  id,
                ]
        );
      },
      []
    );

  /*
   * -----------------------------
   * HOME
   * -----------------------------
   */

  const goHome =
    useCallback(() => {
      setActivePlaylist(
        null
      );

      setSearch("");

      setSelectedGenre(
        "All"
      );

      setSidebarOpen(false);
    }, []);

  /*
   * -----------------------------
   * PLAYLIST
   * -----------------------------
   */

  const selectPlaylist =
    useCallback(
      (
        playlist: PlaylistName
      ) => {
        setActivePlaylist(
          (current) =>
            current ===
            playlist
              ? null
              : playlist
        );

        setSearch("");

        setSelectedGenre(
          "All"
        );

        setSidebarOpen(false);
      },
      []
    );

  /*
   * -----------------------------
   * NEXT / PREVIOUS
   * -----------------------------
   */

  const currentIndex =
    tracks.findIndex(
      (track) =>
        track.id ===
        currentTrack.id
    );

  const getRandomTrack =
    useCallback(() => {
      const candidates =
        tracks.filter(
          (track) =>
            track.id !==
            currentTrack.id
        );

      if (
        !candidates.length
      ) {
        return null;
      }

      const index =
        Math.floor(
          Math.random() *
            candidates.length
        );

      return candidates[
        index
      ];
    }, [
      currentTrack.id,
    ]);

  const playNext =
    useCallback(() => {
      if (shuffle) {
        const randomTrack =
          getRandomTrack();

        if (randomTrack) {
          setShouldAutoPlay(
            true
          );

          setCurrentTrack(
            randomTrack
          );

          return;
        }
      }

      const nextIndex =
        currentIndex >=
        tracks.length - 1
          ? 0
          : currentIndex + 1;

      setShouldAutoPlay(true);

      setCurrentTrack(
        tracks[nextIndex]
      );
    }, [
      currentIndex,
      shuffle,
      getRandomTrack,
    ]);

  const playPrevious =
    useCallback(() => {
      /*
       * If the song is more than
       * 3 seconds in, previous
       * first restarts it.
       */
      if (currentTime > 3) {
        restart();
        return;
      }

      if (shuffle) {
        const randomTrack =
          getRandomTrack();

        if (randomTrack) {
          setShouldAutoPlay(
            true
          );

          setCurrentTrack(
            randomTrack
          );

          return;
        }
      }

      const previousIndex =
        currentIndex <= 0
          ? tracks.length - 1
          : currentIndex - 1;

      setShouldAutoPlay(true);

      setCurrentTrack(
        tracks[
          previousIndex
        ]
      );
    }, [
      currentIndex,
      currentTime,
      shuffle,
      getRandomTrack,
      restart,
    ]);

  /*
   * -----------------------------
   * SEARCH
   * -----------------------------
   */

  const clearSearch =
    useCallback(() => {
      setSearch("");
    }, []);

  /*
   * -----------------------------
   * RENDER
   * -----------------------------
   */

  return (
    <main className="min-h-screen bg-[#09090b] text-white">
      <div className="flex min-h-screen">

        {sidebarOpen && (
          <button
            type="button"
            aria-label="Close navigation"
            className="fixed inset-0 z-30 bg-black/70 lg:hidden"
            onClick={() =>
              setSidebarOpen(
                false
              )
            }
          />
        )}

        {/* SIDEBAR */}

        <aside
          className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/10 bg-[#0f0f12] p-6 transition-transform lg:static lg:translate-x-0 ${
            sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full"
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-black">
              <Music2 size={21} />
            </div>

            <div>
              <h1 className="text-lg font-semibold">
                Pulse
              </h1>

              <p className="text-xs text-zinc-500">
                Music for every mood
              </p>
            </div>
          </div>

          <nav className="mt-10 space-y-2">

            <button
              type="button"
              onClick={goHome}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition ${
                !activePlaylist
                  ? "bg-white/10 text-white"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Home size={18} />
              Home
            </button>

            <button
              type="button"
              onClick={() =>
                selectPlaylist(
                  "Liked Songs"
                )
              }
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                activePlaylist ===
                "Liked Songs"
                  ? "bg-white/10 text-white"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Library size={18} />
              Your Library
            </button>

            <button
              type="button"
              onClick={() =>
                selectPlaylist(
                  "Deep Focus"
                )
              }
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm transition ${
                activePlaylist ===
                "Deep Focus"
                  ? "bg-white/10 text-white"
                  : "text-zinc-400 hover:bg-white/5 hover:text-white"
              }`}
            >
              <ListMusic size={18} />
              Playlists
            </button>

          </nav>

          <div className="mt-10">
            <p className="mb-3 px-4 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-600">
              Your playlists
            </p>

            <div className="space-y-1">

              {(
                [
                  "Liked Songs",
                  "Deep Focus",
                  "Late Night",
                ] as PlaylistName[]
              ).map(
                (playlist) => (
                  <button
                    key={playlist}
                    type="button"
                    onClick={() =>
                      selectPlaylist(
                        playlist
                      )
                    }
                    className={`w-full rounded-lg px-4 py-2 text-left text-sm transition ${
                      activePlaylist ===
                      playlist
                        ? "bg-white/10 text-white"
                        : "text-zinc-400 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    {playlist}
                  </button>
                )
              )}

            </div>
          </div>

          <div className="mt-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4">
            <p className="text-sm font-medium">
              Your listening space
            </p>

            <p className="mt-1 text-xs leading-5 text-zinc-500">
              Discover tracks,
              build playlists
              and keep your
              favorite music
              close.
            </p>
          </div>
        </aside>

        {/* MAIN */}

        <section className="flex min-w-0 flex-1 flex-col">

          {/* HEADER */}

          <header className="sticky top-0 z-20 flex items-center gap-4 border-b border-white/10 bg-[#09090b]/90 px-5 py-4 backdrop-blur-xl md:px-8">

            <button
              type="button"
              aria-label="Open navigation"
              className="rounded-lg p-2 text-zinc-400 hover:bg-white/10 hover:text-white lg:hidden"
              onClick={() =>
                setSidebarOpen(
                  true
                )
              }
            >
              <Menu size={21} />
            </button>

            <div className="relative max-w-xl flex-1">

              <Search
                size={18}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500"
              />

              <input
                value={search}
                onChange={(event) =>
                  setSearch(
                    event.target.value
                  )
                }
                placeholder="Search songs, artists or albums..."
                aria-label="Search music"
                className="w-full rounded-xl border border-white/10 bg-white/[0.04] py-3 pl-11 pr-11 text-sm outline-none placeholder:text-zinc-600 focus:border-white/20"
              />

              {search && (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={
                    clearSearch
                  }
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-zinc-500 hover:bg-white/10 hover:text-white"
                >
                  <X size={16} />
                </button>
              )}

            </div>

            <div className="hidden items-center gap-2 text-xs text-zinc-600 md:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Music library ready
            </div>

          </header>

          {/* CONTENT */}

          <div className="flex-1 overflow-y-auto px-5 pb-44 pt-8 md:px-8">

            {/* HERO */}

            <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900 via-zinc-900 to-black p-7 md:p-10">

              <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl" />

              <div className="absolute -bottom-32 left-1/3 h-72 w-72 rounded-full bg-blue-500/10 blur-3xl" />

              <div className="relative max-w-2xl">

                <p className="mb-3 text-xs font-semibold uppercase tracking-[0.25em] text-zinc-500">
                  Your sound, your way
                </p>

                <h2 className="text-4xl font-semibold tracking-tight md:text-6xl">
                  Find your next

                  <span className="block text-zinc-500">
                    favorite sound.
                  </span>
                </h2>

                <p className="mt-5 max-w-lg text-sm leading-6 text-zinc-400 md:text-base">
                  Search your library,
                  explore genres and
                  build playlists for
                  every moment.
                </p>

                <div className="mt-7 flex flex-wrap gap-3">

                  <div className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-zinc-400">
                    {tracks.length} tracks
                  </div>

                  <div className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-zinc-400">
                    {genres.length - 1} genres
                  </div>

                  <div className="rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs text-zinc-400">
                    {liked.length} liked
                  </div>

                </div>
              </div>
            </section>

            {/* GENRES */}

            <section className="mt-8">

              <div className="flex items-center justify-between">

                <h3 className="text-xl font-semibold">
                  Browse by genre
                </h3>

                <span className="text-xs text-zinc-600">
                  {filteredTracks.length} tracks
                </span>

              </div>

              <div className="mt-4 flex gap-2 overflow-x-auto pb-2">

                {genres.map(
                  (genre) => (
                    <button
                      key={genre}
                      type="button"
                      onClick={() =>
                        setSelectedGenre(
                          genre
                        )
                      }
                      className={`whitespace-nowrap rounded-full px-4 py-2 text-sm transition ${
                        selectedGenre ===
                        genre
                          ? "bg-white text-black"
                          : "border border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.08] hover:text-white"
                      }`}
                    >
                      {genre}
                    </button>
                  )
                )}

              </div>
            </section>

            {/* TRACKS */}

            <section className="mt-8">

              <div className="mb-5 flex items-end justify-between gap-4">

                <div>

                  <p className="text-xs uppercase tracking-[0.2em] text-zinc-600">
                    Library
                  </p>

                  <h3 className="mt-1 text-xl font-semibold">
                    {activePlaylist ||
                      (search
                        ? `Results for "${search}"`
                        : "Recommended for you")}
                  </h3>

                </div>

                {activePlaylist && (
                  <button
                    type="button"
                    onClick={goHome}
                    className="text-xs text-zinc-500 hover:text-white"
                  >
                    View all
                  </button>
                )}

              </div>

              {filteredTracks.length ===
              0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 py-20 text-center">

                  <Music2
                    className="mx-auto text-zinc-700"
                    size={34}
                  />

                  <p className="mt-4 font-medium">
                    {activePlaylist ===
                    "Liked Songs"
                      ? "Your liked songs are waiting."
                      : "No tracks found"}
                  </p>

                  <p className="mt-1 text-sm text-zinc-600">
                    {activePlaylist ===
                    "Liked Songs"
                      ? "Like a song to start building your collection."
                      : "Try another search or genre."}
                  </p>

                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">

                  {filteredTracks.map(
                    (track) => {
                      const isLiked =
                        liked.includes(
                          track.id
                        );

                      const isCurrent =
                        currentTrack.id ===
                        track.id;

                      return (
                        <article
                          key={track.id}
                          className={`group overflow-hidden rounded-2xl border bg-white/[0.03] transition hover:-translate-y-1 hover:bg-white/[0.06] ${
                            isCurrent
                              ? "border-white/30 shadow-lg shadow-white/5"
                              : "border-white/10"
                          }`}
                        >

                          <div className="relative aspect-square overflow-hidden">

                            <Image
                              src={
                                track.cover
                              }
                              alt={`${track.title} album artwork`}
                              fill
                              sizes="(max-width: 640px) 100vw, (max-width: 1280px) 50vw, 25vw"
                              className="object-cover transition duration-500 group-hover:scale-105"
                            />

                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                            <button
                              type="button"
                              aria-label={`Play ${track.title}`}
                              onClick={() =>
                                selectTrack(
                                  track
                                )
                              }
                              className="absolute bottom-4 right-4 flex h-11 w-11 translate-y-2 items-center justify-center rounded-full bg-white text-black opacity-0 shadow-xl transition group-hover:translate-y-0 group-hover:opacity-100 hover:scale-105"
                            >
                              {isCurrent &&
                              isPlaying ? (
                                <Pause
                                  size={17}
                                  fill="currentColor"
                                />
                              ) : (
                                <Play
                                  size={17}
                                  fill="currentColor"
                                />
                              )}
                            </button>

                            {isCurrent && (
                              <div className="absolute left-4 top-4 rounded-full bg-black/60 px-3 py-1 text-[10px] uppercase tracking-wider backdrop-blur-md">
                                {isPlaying
                                  ? "Playing"
                                  : "Selected"}
                              </div>
                            )}

                          </div>

                          <div className="p-4">

                            <div className="flex items-start justify-between gap-3">

                              <button
                                type="button"
                                onClick={() =>
                                  selectTrack(
                                    track
                                  )
                                }
                                className="min-w-0 text-left"
                              >
                                <h4 className="truncate font-medium">
                                  {track.title}
                                </h4>

                                <p className="mt-1 truncate text-sm text-zinc-500">
                                  {track.artist}
                                </p>
                              </button>

                              <button
                                type="button"
                                aria-label={
                                  isLiked
                                    ? `Unlike ${track.title}`
                                    : `Like ${track.title}`
                                }
                                onClick={() =>
                                  toggleLike(
                                    track.id
                                  )
                                }
                                className={`shrink-0 rounded-full p-2 transition ${
                                  isLiked
                                    ? "text-white"
                                    : "text-zinc-500 hover:bg-white/10 hover:text-white"
                                }`}
                              >
                                <Heart
                                  size={17}
                                  fill={
                                    isLiked
                                      ? "currentColor"
                                      : "none"
                                  }
                                />
                              </button>

                            </div>

                            <div className="mt-4 flex items-center justify-between text-xs text-zinc-600">

                              <span>
                                {track.genre}
                              </span>

                              <span>
                                {formatTime(
                                  track.duration
                                )}
                              </span>

                            </div>

                          </div>

                        </article>
                      );
                    }
                  )}

                </div>
              )}

            </section>

          </div>

    {/* SPOTIFY-STYLE BOTTOM PLAYER */}

    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 bg-[#121212]/95 px-3 py-2 backdrop-blur-xl">

<div className="mx-auto max-w-[1600px]">

  <div className="grid grid-cols-1 items-center gap-2 md:grid-cols-[1fr_auto_1fr]">

    {/* CURRENT TRACK */}

    <div className="flex min-w-0 items-center gap-3">

      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md">
        <Image
          src={currentTrack.cover}
          alt={`${currentTrack.title} cover`}
          fill
          sizes="56px"
          className="object-cover"
        />
      </div>

      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-white">
          {currentTrack.title}
        </p>

        <p className="truncate text-xs text-zinc-500">
          {currentTrack.artist}
        </p>
      </div>

      <button
        type="button"
        aria-label={
          liked.includes(currentTrack.id)
            ? "Unlike current song"
            : "Like current song"
        }
        onClick={() =>
          toggleLike(currentTrack.id)
        }
        className={`shrink-0 rounded-full p-2 transition ${
          liked.includes(currentTrack.id)
            ? "text-white"
            : "text-zinc-500 hover:text-white"
        }`}
      >
        <Heart
          size={18}
          fill={
            liked.includes(currentTrack.id)
              ? "currentColor"
              : "none"
          }
        />
      </button>

    </div>

{/* CENTER CONTROLS */}

<div className="flex w-full max-w-3xl flex-col items-center">

  <div className="flex items-center gap-7">

    {/* SHUFFLE */}

    <button
      type="button"
      aria-label="Toggle shuffle"
      onClick={() =>
        setShuffle((value) => !value)
      }
      className={`rounded-full p-2 transition ${
        shuffle
          ? "text-white"
          : "text-zinc-500 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Shuffle size={18} />
    </button>


    {/* PREVIOUS */}

    <button
      type="button"
      aria-label="Previous track"
      onClick={playPrevious}
      className="rounded-full p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
    >
      <SkipBack
        size={21}
        fill="currentColor"
      />
    </button>


    {/* PLAY / PAUSE */}

    <button
      type="button"
      aria-label={
        isPlaying
          ? "Pause"
          : "Play"
      }
      onClick={togglePlay}
      className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-black transition hover:scale-105"
    >
      {isPlaying ? (
        <Pause
          size={18}
          fill="currentColor"
        />
      ) : (
        <Play
          size={18}
          fill="currentColor"
        />
      )}
    </button>


    {/* NEXT */}

    <button
      type="button"
      aria-label="Next track"
      onClick={playNext}
      className="rounded-full p-2 text-zinc-400 transition hover:bg-white/5 hover:text-white"
    >
      <SkipForward
        size={21}
        fill="currentColor"
      />
    </button>


    {/* REPEAT */}

    <button
      type="button"
      aria-label="Toggle repeat"
      onClick={() =>
        setRepeat((value) => !value)
      }
      className={`rounded-full p-2 transition ${
        repeat
          ? "text-white"
          : "text-zinc-500 hover:bg-white/5 hover:text-white"
      }`}
    >
      <Repeat size={18} />
    </button>

  </div>


  {/* EXPANDED PROGRESS BAR */}

  <div className="mt-2 flex w-full items-center gap-3">

    <span className="w-10 text-right text-[11px] text-zinc-500">
      {formatTime(currentTime)}
    </span>

    <input
      aria-label="Track progress"
      type="range"
      min="0"
      max={
        duration > 0
          ? duration
          : currentTrack.duration
      }
      value={Math.min(
        currentTime,
        duration > 0
          ? duration
          : currentTrack.duration
      )}
      onChange={(event) =>
        seek(
          Number(event.target.value)
        )
      }
      className="h-1 flex-1 cursor-pointer accent-white"
    />

    <span className="w-10 text-[11px] text-zinc-500">
      {formatTime(
        duration > 0
          ? duration
          : currentTrack.duration
      )}
    </span>

  </div>

</div>


    {/* VOLUME */}

    <div className="hidden items-center justify-end gap-3 md:flex">

      <button
        type="button"
        aria-label={
          volume === 0
            ? "Unmute"
            : "Mute"
        }
        onClick={() =>
          setVolume(
            volume === 0
              ? 0.8
              : 0
          )
        }
        className="text-zinc-500 transition hover:text-white"
      >
        {volume === 0 ? (
          <VolumeX size={18} />
        ) : (
          <Volume2 size={18} />
        )}
      </button>

      <input
        aria-label="Volume"
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={volume}
        onChange={(event) =>
          setVolume(
            Number(
              event.target.value
            )
          )
        }
        className="h-1 w-28 cursor-pointer accent-white"
      />

    </div>

  </div>


  {/* MOBILE CONTROLS */}

  <div className="mt-2 flex items-center justify-center gap-6 md:hidden">

    <button
      type="button"
      aria-label="Toggle shuffle"
      onClick={() =>
        setShuffle(
          (value) => !value
        )
      }
      className={
        shuffle
          ? "text-white"
          : "text-zinc-600"
      }
    >
      <Shuffle size={16} />
    </button>

    <button
      type="button"
      aria-label="Toggle repeat"
      onClick={() =>
        setRepeat(
          (value) => !value
        )
      }
      className={
        repeat
          ? "text-white"
          : "text-zinc-600"
      }
    >
      <Repeat size={16} />
    </button>

    <button
      type="button"
      aria-label={
        volume === 0
          ? "Unmute"
          : "Mute"
      }
      onClick={() =>
        setVolume(
          volume === 0
            ? 0.8
            : 0
        )
      }
      className="text-zinc-600"
    >
      {volume === 0 ? (
        <VolumeX size={16} />
      ) : (
        <Volume2 size={16} />
      )}
    </button>

  </div>

  </div>
</div>

        </section>
      </div>
    </main>
  );
}

