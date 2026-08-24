
"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type { Playlist, Track } from "@/types/music";
import { defaultPlaylists, genres, tracks } from "@/data/tracks";
import { useAudioPlayer } from "@/hooks/useAudioPlayer";

import {
  ChevronDown,
  Heart,
  Home,
  ListMusic,
  Menu,
  Pause,
  Play,
  Plus,
  Repeat,
  Repeat1,
  Search,
  Shuffle,
  SkipBack,
  SkipForward,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

type RepeatMode = "off" | "all" | "one";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);

  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

function makeId() {
  return `playlist-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

function isPlaylist(value: unknown): value is Playlist {
  if (!value || typeof value !== "object") {
    return false;
  }

  const playlist = value as Partial<Playlist>;

  return (
    typeof playlist.id === "string" &&
    typeof playlist.name === "string" &&
    Array.isArray(playlist.trackIds) &&
    playlist.trackIds.every(
      (id) => typeof id === "string",
    )
  );
}

function sanitizePlaylists(value: unknown): Playlist[] {
  if (!Array.isArray(value)) {
    return defaultPlaylists;
  }

  const valid = value.filter(isPlaylist);

  return valid.length > 0 ? valid : defaultPlaylists;
}

function sanitizeLikes(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return [
    ...new Set(
      value.filter(
        (id): id is string => typeof id === "string",
      ),
    ),
  ];
}

export default function MusicPlayer() {
  const [selectedTrackId, setSelectedTrackId] = useState(
    tracks[0]?.id ?? "",
  );

  const [shouldAutoPlay, setShouldAutoPlay] = useState(false);
  const [query, setQuery] = useState("");

  const [selectedGenre, setSelectedGenre] =
    useState<(typeof genres)[number]>("All");

  const [playlists, setPlaylists] =
    useState<Playlist[]>(defaultPlaylists);

  const [activePlaylistId, setActivePlaylistId] =
    useState<string | null>(null);

  const [likedIds, setLikedIds] = useState<string[]>([]);
  const [storageLoaded, setStorageLoaded] = useState(false);

  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] =
    useState<RepeatMode>("off");

  const [isFullPlayerOpen, setIsFullPlayerOpen] =
    useState(false);

  const [isSidebarOpen, setIsSidebarOpen] =
    useState(false);

  const [isPlaylistModalOpen, setIsPlaylistModalOpen] =
    useState(false);

  const [newPlaylistName, setNewPlaylistName] =
    useState("");

  const [playlistForTrack, setPlaylistForTrack] =
    useState<string | null>(null);

  const currentTrack =
    tracks.find(
      (track) => track.id === selectedTrackId,
    ) ?? tracks[0];

  const activePlaylist = useMemo(
    () =>
      playlists.find(
        (playlist) =>
          playlist.id === activePlaylistId,
      ) ?? null,
    [playlists, activePlaylistId],
  );

  /*
   * Load saved playlists and liked songs once.
   */
  useEffect(() => {
    try {
      const savedPlaylists =
        window.localStorage.getItem(
          "pulse-playlists",
        );

      const savedLikes =
        window.localStorage.getItem(
          "pulse-liked",
        );

      if (savedPlaylists) {
        try {
          const parsed = JSON.parse(savedPlaylists);
          setPlaylists(sanitizePlaylists(parsed));
        } catch {
          setPlaylists(defaultPlaylists);
        }
      }

      if (savedLikes) {
        try {
          const parsed = JSON.parse(savedLikes);
          setLikedIds(sanitizeLikes(parsed));
        } catch {
          setLikedIds([]);
        }
      }
    } catch (error) {
      console.error(
        "Failed to load saved music data:",
        error,
      );
    } finally {
      setStorageLoaded(true);
    }
  }, []);

  /*
   * Save playlists after localStorage has loaded.
   */
  useEffect(() => {
    if (!storageLoaded) {
      return;
    }

    try {
      window.localStorage.setItem(
        "pulse-playlists",
        JSON.stringify(playlists),
      );
    } catch (error) {
      console.error(
        "Failed to save playlists:",
        error,
      );
    }
  }, [playlists, storageLoaded]);

  /*
   * Save liked songs after localStorage has loaded.
   */
  useEffect(() => {
    if (!storageLoaded) {
      return;
    }

    try {
      window.localStorage.setItem(
        "pulse-liked",
        JSON.stringify(likedIds),
      );
    } catch (error) {
      console.error(
        "Failed to save likes:",
        error,
      );
    }
  }, [likedIds, storageLoaded]);

  /*
   * What should happen when a song ends?
   */
  const handleTrackEnded = useCallback(() => {
    if (!currentTrack) {
      return false;
    }

    if (repeat === "one") {
      return true;
    }

    if (tracks.length <= 1) {
      return repeat === "all";
    }

    if (shuffle) {
      const candidates = tracks.filter(
        (track) => track.id !== currentTrack.id,
      );

      if (candidates.length === 0) {
        return repeat === "all";
      }

      const randomIndex = Math.floor(
        Math.random() * candidates.length,
      );

      setSelectedTrackId(
        candidates[randomIndex].id,
      );
      setShouldAutoPlay(true);

      return false;
    }

    const currentIndex = tracks.findIndex(
      (track) => track.id === currentTrack.id,
    );

    if (currentIndex === -1) {
      return false;
    }

    let nextIndex = currentIndex + 1;

    if (nextIndex >= tracks.length) {
      if (repeat === "all") {
        nextIndex = 0;
      } else {
        return false;
      }
    }

    setSelectedTrackId(tracks[nextIndex].id);
    setShouldAutoPlay(true);

    return false;
  }, [currentTrack, repeat, shuffle]);

  const player = useAudioPlayer(
    currentTrack,
    shouldAutoPlay,
    {
      onEnded: handleTrackEnded,
    },
  );

  /*
   * Keyboard controls.
   */
  useEffect(() => {
    const handleKeyDown = (
      event: KeyboardEvent,
    ) => {
      const target =
        event.target as HTMLElement | null;

      if (
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.isContentEditable
      ) {
        return;
      }

      if (event.code === "Space") {
        event.preventDefault();
        void player.togglePlay();
        return;
      }

      if (event.key === "ArrowLeft") {
        event.preventDefault();

        player.seek(
          Math.max(
            0,
            player.currentTime - 5,
          ),
        );

        return;
      }

      if (event.key === "ArrowRight") {
        event.preventDefault();

        player.seek(
          Math.min(
            player.duration || 0,
            player.currentTime + 5,
          ),
        );
      }
    };

    document.addEventListener(
      "keydown",
      handleKeyDown,
      true,
    );

    return () => {
      document.removeEventListener(
        "keydown",
        handleKeyDown,
        true,
      );
    };
  }, [
    player.currentTime,
    player.duration,
    player.togglePlay,
    player.seek,
  ]);

  /*
   * Auto-play is only needed for track transitions.
   */
  useEffect(() => {
    if (!shouldAutoPlay) {
      return;
    }

    setShouldAutoPlay(false);
  }, [shouldAutoPlay, selectedTrackId]);

  /*
   * Tracks shown on screen.
   */
  const visibleTracks = useMemo(() => {
    let result = tracks;

    if (activePlaylist) {
      result = result.filter((track) =>
        activePlaylist.trackIds.includes(track.id),
      );
    }

    if (selectedGenre !== "All") {
      result = result.filter(
        (track) =>
          track.genre === selectedGenre,
      );
    }

    const normalizedQuery =
      query.trim().toLowerCase();

    if (normalizedQuery) {
      result = result.filter((track) => {
        return (
          track.title
            .toLowerCase()
            .includes(normalizedQuery) ||
          track.artist
            .toLowerCase()
            .includes(normalizedQuery) ||
          track.album
            .toLowerCase()
            .includes(normalizedQuery) ||
          track.genre
            .toLowerCase()
            .includes(normalizedQuery)
        );
      });
    }

    return result;
  }, [
    activePlaylist,
    selectedGenre,
    query,
  ]);

  /*
   * Select and play a track.
   */
  const playTrack = useCallback(
    (track: Track) => {
      if (track.id === selectedTrackId) {
        void player.togglePlay();
        return;
      }

      setSelectedTrackId(track.id);
      setShouldAutoPlay(true);
    },
    [
      player.togglePlay,
      selectedTrackId,
    ],
  );

  /*
   * Next track.
   */
  const nextTrack = useCallback(() => {
    if (!currentTrack || tracks.length === 0) {
      return;
    }

    if (shuffle) {
      const candidates = tracks.filter(
        (track) =>
          track.id !== currentTrack.id,
      );

      if (candidates.length === 0) {
        return;
      }

      const randomIndex = Math.floor(
        Math.random() * candidates.length,
      );

      setSelectedTrackId(
        candidates[randomIndex].id,
      );
      setShouldAutoPlay(true);

      return;
    }

    const index = tracks.findIndex(
      (track) =>
        track.id === currentTrack.id,
    );

    if (index === -1) {
      return;
    }

    let nextIndex = index + 1;

    if (nextIndex >= tracks.length) {
      nextIndex =
        repeat === "all"
          ? 0
          : tracks.length - 1;
    }

    if (nextIndex === index) {
      return;
    }

    setSelectedTrackId(
      tracks[nextIndex].id,
    );
    setShouldAutoPlay(true);
  }, [currentTrack, shuffle, repeat]);

  /*
   * Previous track.
   */
  const previousTrack = useCallback(() => {
    if (!currentTrack) {
      return;
    }

    if (player.currentTime > 3) {
      player.seek(0);
      return;
    }

    const index = tracks.findIndex(
      (track) =>
        track.id === currentTrack.id,
    );

    if (index === -1) {
      return;
    }

    let previousIndex = index - 1;

    if (previousIndex < 0) {
      previousIndex =
        repeat === "all"
          ? tracks.length - 1
          : 0;
    }

    if (previousIndex === index) {
      return;
    }

    setSelectedTrackId(
      tracks[previousIndex].id,
    );
    setShouldAutoPlay(true);
  }, [
    currentTrack,
    player.currentTime,
    player.seek,
    repeat,
  ]);

  /*
   * Like / unlike.
   *
   * Also keeps the special "Liked Songs"
   * playlist synchronized.
   */
  const toggleLike = useCallback(
    (trackId: string) => {
      const currentlyLiked =
        likedIds.includes(trackId);

      setLikedIds((current) =>
        currentlyLiked
          ? current.filter(
              (id) => id !== trackId,
            )
          : [...current, trackId],
      );

      setPlaylists((current) => {
        const likedPlaylist =
          current.find(
            (playlist) =>
              playlist.id === "liked",
          );

        if (!likedPlaylist) {
          if (currentlyLiked) {
            return current;
          }

          return [
            {
              id: "liked",
              name: "Liked Songs",
              trackIds: [trackId],
            },
            ...current,
          ];
        }

        return current.map((playlist) => {
          if (playlist.id !== "liked") {
            return playlist;
          }

          const alreadyLiked =
            playlist.trackIds.includes(
              trackId,
            );

          return {
            ...playlist,
            trackIds: alreadyLiked
              ? playlist.trackIds.filter(
                  (id) => id !== trackId,
                )
              : [
                  ...playlist.trackIds,
                  trackId,
                ],
          };
        });
      });
    },
    [likedIds],
  );

  /*
   * Create playlist.
   */
  const createPlaylist = useCallback(() => {
    const name =
      newPlaylistName.trim();

    if (!name) {
      return;
    }

    const playlist: Playlist = {
      id: makeId(),
      name,
      trackIds: [],
    };

    setPlaylists((current) => [
      ...current,
      playlist,
    ]);

    setNewPlaylistName("");
    setIsPlaylistModalOpen(false);
    setActivePlaylistId(playlist.id);
    setSelectedGenre("All");
    setQuery("");
  }, [newPlaylistName]);

  /*
   * Delete playlist.
   */
  const deletePlaylist = useCallback(
    (playlistId: string) => {
      if (playlistId === "liked") {
        return;
      }

      setPlaylists((current) =>
        current.filter(
          (playlist) =>
            playlist.id !== playlistId,
        ),
      );

      if (
        activePlaylistId === playlistId
      ) {
        setActivePlaylistId(null);
      }

      setIsSidebarOpen(false);
    },
    [activePlaylistId],
  );

  /*
   * Add a track to a playlist.
   */
  const addToPlaylist = useCallback(
    (
      playlistId: string,
      trackId: string,
    ) => {
      setPlaylists((current) =>
        current.map((playlist) => {
          if (
            playlist.id !== playlistId
          ) {
            return playlist;
          }

          if (
            playlist.trackIds.includes(
              trackId,
            )
          ) {
            return playlist;
          }

          return {
            ...playlist,
            trackIds: [
              ...playlist.trackIds,
              trackId,
            ],
          };
        }),
      );

      setPlaylistForTrack(null);
    },
    [],
  );

  /*
   * Remove a track from a playlist.
   */
  const removeFromPlaylist =
    useCallback(
      (
        playlistId: string,
        trackId: string,
      ) => {
        setPlaylists((current) =>
          current.map((playlist) => {
            if (
              playlist.id !== playlistId
            ) {
              return playlist;
            }

            return {
              ...playlist,
              trackIds:
                playlist.trackIds.filter(
                  (id) => id !== trackId,
                ),
            };
          }),
        );
      },
      [],
    );

  /*
   * Cycle repeat:
   *
   * off -> all -> one -> off
   */
  const cycleRepeat = useCallback(() => {
    setRepeat((current) => {
      if (current === "off") {
        return "all";
      }

      if (current === "all") {
        return "one";
      }

      return "off";
    });
  }, []);

  /*
   * Switch playlist.
   */
  const selectPlaylist = useCallback(
    (playlistId: string | null) => {
      setActivePlaylistId(playlistId);
      setSelectedGenre("All");
      setQuery("");
      setIsSidebarOpen(false);
    },
    [],
  );

  /*
   * Up-next queue.
   */
  const upNextTracks = useMemo(() => {
    if (!currentTrack) {
      return [];
    }

    if (shuffle) {
      return tracks
        .filter(
          (track) =>
            track.id !== currentTrack.id,
        )
        .sort(
          () => Math.random() - 0.5,
        )
        .slice(0, 3);
    }

    const currentIndex =
      tracks.findIndex(
        (track) =>
          track.id === currentTrack.id,
      );

    if (currentIndex === -1) {
      return [];
    }

    const upcoming: Track[] = [];

    for (
      let offset = 1;
      offset <= tracks.length;
      offset++
    ) {
      const nextIndex =
        currentIndex + offset;

      if (nextIndex < tracks.length) {
        upcoming.push(
          tracks[nextIndex],
        );
      } else if (repeat === "all") {
        upcoming.push(
          tracks[
            nextIndex % tracks.length
          ],
        );
      }
    }

    return upcoming.slice(0, 3);
  }, [
    currentTrack,
    shuffle,
    repeat,
  ]);

  if (!currentTrack) {
    return null;
  }

  const isCurrentLiked =
    likedIds.includes(currentTrack.id);

  const progressMax =
    player.duration > 0
      ? player.duration
      : 1;

  const progressValue = Math.min(
    player.currentTime,
    progressMax,
  );

  return (
    <div className="pulse-app">
      {/* Sidebar */}
      <aside
        className={`pulse-sidebar ${
          isSidebarOpen
            ? "pulse-sidebar-open"
            : ""
        }`}
      >
        <div className="pulse-brand">
          <div className="pulse-logo">
            ♪
          </div>

          <div>
            <div className="pulse-brand-name">
              Pulse
            </div>

            <div className="pulse-brand-sub">
              MUSIC PLAYER
            </div>
          </div>
        </div>

        <button
          className="pulse-mobile-close"
          onClick={() =>
            setIsSidebarOpen(false)
          }
          aria-label="Close menu"
        >
          <X size={20} />
        </button>

        <nav className="pulse-nav">
          <div className="pulse-nav-label">
            Library
          </div>

          <button
            className={`pulse-nav-item ${
              activePlaylistId === null
                ? "active"
                : ""
            }`}
            onClick={() =>
              selectPlaylist(null)
            }
          >
            <Home size={16} />
            Home
          </button>

          <button
            className={`pulse-nav-item ${
              activePlaylistId === "liked"
                ? "active"
                : ""
            }`}
            onClick={() =>
              selectPlaylist("liked")
            }
          >
            <Heart
              size={16}
              className="pulse-heart"
              fill="currentColor"
            />

            <span>Liked Songs</span>

            <span className="pulse-count">
              {likedIds.length}
            </span>
          </button>

          <div className="pulse-nav-label">
            Playlists
          </div>

          {playlists
            .filter(
              (playlist) =>
                playlist.id !== "liked",
            )
            .map((playlist) => (
              <div
                key={playlist.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <button
                  className={`pulse-nav-item ${
                    activePlaylistId ===
                    playlist.id
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    selectPlaylist(
                      playlist.id,
                    )
                  }
                  style={{
                    minWidth: 0,
                    flex: 1,
                  }}
                >
                  <ListMusic size={16} />

                  <span
                    style={{
                      overflow: "hidden",
                      textOverflow:
                        "ellipsis",
                      whiteSpace:
                        "nowrap",
                    }}
                  >
                    {playlist.name}
                  </span>

                  <span className="pulse-count">
                    {playlist.trackIds.length}
                  </span>
                </button>

                <button
                  type="button"
                  aria-label={`Delete ${playlist.name}`}
                  title={`Delete ${playlist.name}`}
                  onClick={() =>
                    deletePlaylist(
                      playlist.id,
                    )
                  }
                  style={{
                    width: 32,
                    height: 32,
                    flexShrink: 0,
                    display: "grid",
                    placeItems: "center",
                    border: 0,
                    borderRadius: 8,
                    background:
                      "transparent",
                    color:
                      "var(--pulse-dim)",
                    cursor: "pointer",
                  }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

          <button
            className="pulse-nav-item"
            onClick={() =>
              setIsPlaylistModalOpen(true)
            }
          >
            <Plus size={16} />
            Create Playlist
          </button>
        </nav>

        <div className="pulse-sidebar-card">
          <div className="pulse-sidebar-card-icon">
            ♫
          </div>

          <div>
            <strong>
              Your music space
            </strong>

            <p>
              Create playlists and
              organize your favorite
              tracks.
            </p>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="pulse-main">
        <header className="pulse-header">
          <button
            className="pulse-menu-button"
            onClick={() =>
              setIsSidebarOpen(true)
            }
            aria-label="Open menu"
          >
            <Menu size={21} />
          </button>

          <div className="pulse-search">
            <Search
              size={17}
              style={{
                position: "absolute",
                left: 15,
                top: "50%",
                transform:
                  "translateY(-50%)",
                color:
                  "var(--pulse-dim)",
              }}
            />

            <input
              value={query}
              onChange={(event) =>
                setQuery(event.target.value)
              }
              placeholder="Search songs, artists, albums..."
              aria-label="Search music"
            />

            {query && (
              <button
                className="pulse-search-clear"
                onClick={() =>
                  setQuery("")
                }
                aria-label="Clear search"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="pulse-header-status">
            <span className="pulse-status-dot" />
            Music ready
          </div>
        </header>

        <div className="pulse-content">
          {/* Hero */}
          {!activePlaylist && (
            <section className="pulse-hero">
              <div className="pulse-hero-copy">
                <span className="pulse-eyebrow">
                  YOUR PERSONAL SOUNDTRACK
                </span>

                <h1>
                  Feel the{" "}
                  <span>Pulse.</span>
                </h1>

                <p>
                  Discover your music,
                  build playlists, and
                  keep the perfect track
                  playing through every
                  moment.
                </p>

                <button
                  className="pulse-primary-button"
                  onClick={() =>
                    playTrack(tracks[0])
                  }
                >
                  <Play size={16} fill="currentColor" />
                  Play Music
                </button>
              </div>

              <div className="pulse-hero-art">
                <div className="pulse-hero-glow" />

                <img
                  className="pulse-hero-image"
                  src={tracks[0].cover}
                  alt={tracks[0].title}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />

                <div className="pulse-hero-overlay">
                  <span>NOW PLAYING</span>

                  <strong>
                    {currentTrack.title}
                  </strong>

                  <small>
                    {currentTrack.artist}
                  </small>
                </div>
              </div>
            </section>
          )}

          {/* Track library */}
          <section>
            <div className="pulse-section-heading">
              <div>
                <span className="pulse-section-kicker">
                  {activePlaylist
                    ? "PLAYLIST"
                    : "LIBRARY"}
                </span>

                <h2>
                  {activePlaylist
                    ? activePlaylist.name
                    : query
                      ? "Search results"
                      : "Your Music"}
                </h2>
              </div>

              <span className="pulse-song-count">
                {visibleTracks.length} songs
              </span>
            </div>

            <div className="pulse-chips">
              {genres.map((genre) => (
                <button
                  key={genre}
                  className={`pulse-chip ${
                    selectedGenre === genre
                      ? "active"
                      : ""
                  }`}
                  onClick={() =>
                    setSelectedGenre(
                      genre,
                    )
                  }
                >
                  {genre}
                </button>
              ))}
            </div>

            {visibleTracks.length === 0 ? (
              <div className="pulse-empty">
                <div className="pulse-empty-icon">
                  ♫
                </div>

                <h3>No songs found</h3>

                <p>
                  Try another search or
                  playlist.
                </p>

                <button
                  onClick={() => {
                    setQuery("");
                    setSelectedGenre(
                      "All",
                    );
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="pulse-track-list">
                <div className="pulse-track-header">
                  <span>#</span>
                  <span>TRACK</span>
                  <span>ALBUM</span>
                  <span>GENRE</span>
                  <span>TIME</span>
                  <span />
                </div>

                {visibleTracks.map(
                  (track, index) => {
                    const isCurrent =
                      track.id ===
                      currentTrack.id;

                    const liked =
                      likedIds.includes(
                        track.id,
                      );

                    return (
                      <div
                        className={`pulse-track-row ${
                          isCurrent &&
                          player.isPlaying
                            ? "playing"
                            : ""
                        }`}
                        key={track.id}
                      >
                        <div className="pulse-track-number">
                          {isCurrent &&
                          player.isPlaying ? (
                            <span className="pulse-equalizer">
                              <i />
                              <i />
                              <i />
                            </span>
                          ) : (
                            index + 1
                          )}
                        </div>

                        <button
                          className="pulse-track-main"
                          onClick={() =>
                            playTrack(track)
                          }
                        >
                          <div className="pulse-cover">
                            <img
                              src={track.cover}
                              alt=""
                              className="pulse-cover-image"
                              style={{
                                width:
                                  "100%",
                                height:
                                  "100%",
                                objectFit:
                                  "cover",
                              }}
                            />

                            <div className="pulse-cover-play">
                              {isCurrent &&
                              player.isPlaying ? (
                                <Pause
                                  size={15}
                                  fill="currentColor"
                                />
                              ) : (
                                <Play
                                  size={15}
                                  fill="currentColor"
                                />
                              )}
                            </div>
                          </div>

                          <div className="pulse-track-info">
                            <strong>
                              {track.title}
                            </strong>

                            <span>
                              {track.artist}
                            </span>
                          </div>
                        </button>

                        <div className="pulse-album">
                          {track.album}
                        </div>

                        <div>
                          <span className="pulse-genre">
                            {track.genre}
                          </span>
                        </div>

                        <div className="pulse-duration">
                          {formatTime(
                            track.duration,
                          )}
                        </div>

                        <div
                          style={{
                            display: "flex",
                            gap: 2,
                          }}
                        >
                          <button
                            className={`pulse-like ${
                              liked
                                ? "liked"
                                : ""
                            }`}
                            onClick={() =>
                              toggleLike(
                                track.id,
                              )
                            }
                            aria-label={
                              liked
                                ? "Unlike"
                                : "Like"
                            }
                            title={
                              liked
                                ? "Unlike"
                                : "Like"
                            }
                          >
                            <Heart
                              size={18}
                              fill={
                                liked
                                  ? "currentColor"
                                  : "none"
                              }
                              strokeWidth={2}
                            />
                          </button>

                          <button
                            className="pulse-like"
                            onClick={() =>
                              setPlaylistForTrack(
                                track.id,
                              )
                            }
                            aria-label="Add to playlist"
                            title="Add to playlist"
                          >
                            <Plus size={18} />
                          </button>
                        </div>
                      </div>
                    );
                  },
                )}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <button
          className="pulse-backdrop"
          onClick={() =>
            setIsSidebarOpen(false)
          }
          aria-label="Close menu"
        />
      )}

      {/* Bottom player */}
      <div className="pulse-player">
        <button
          className="pulse-player-track"
          onClick={() =>
            setIsFullPlayerOpen(true)
          }
          aria-label="Open full player"
        >
          <div className="pulse-player-cover">
            <img
              src={currentTrack.cover}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />
          </div>

          <div className="pulse-player-info">
            <strong>
              {currentTrack.title}
            </strong>

            <span>
              {currentTrack.artist}
            </span>
          </div>
        </button>

        <button
          className={`pulse-player-like ${
            isCurrentLiked
              ? "liked"
              : ""
          }`}
          onClick={() =>
            toggleLike(
              currentTrack.id,
            )
          }
          aria-label={
            isCurrentLiked
              ? "Unlike"
              : "Like"
          }
        >
          <Heart
            size={19}
            fill={
              isCurrentLiked
                ? "currentColor"
                : "none"
            }
          />
        </button>

        <div className="pulse-controls">
          <div className="pulse-control-buttons">
            <button
              className={
                shuffle
                  ? "active"
                  : ""
              }
              onClick={() =>
                setShuffle(
                  (value) => !value,
                )
              }
              title="Shuffle"
              aria-label="Shuffle"
            >
              <Shuffle
                size={18}
                strokeWidth={2}
              />
            </button>

            <button
              onClick={previousTrack}
              title="Previous"
              aria-label="Previous track"
            >
              <SkipBack
                size={19}
                strokeWidth={2}
              />
            </button>

            <button
              className="pulse-play-button"
              onClick={() =>
                void player.togglePlay()
              }
              aria-label={
                player.isPlaying
                  ? "Pause"
                  : "Play"
              }
            >
              {player.isPlaying ? (
                <Pause
                  size={18}
                  strokeWidth={2.5}
                />
              ) : (
                <Play
                  size={18}
                  strokeWidth={2.5}
                />
              )}
            </button>

            <button
              onClick={nextTrack}
              title="Next"
              aria-label="Next track"
            >
              <SkipForward
                size={19}
                strokeWidth={2}
              />
            </button>

            <button
              className={
                repeat !== "off"
                  ? "active"
                  : ""
              }
              onClick={cycleRepeat}
              title={`Repeat: ${repeat}`}
              aria-label={`Repeat: ${repeat}`}
            >
              {repeat === "one" ? (
                <Repeat1
                  size={18}
                  strokeWidth={2}
                />
              ) : (
                <Repeat
                  size={18}
                  strokeWidth={2}
                />
              )}
            </button>
          </div>

          <div className="pulse-progress">
            <span>
              {formatTime(
                player.currentTime,
              )}
            </span>

            <input
              type="range"
              min="0"
              max={progressMax}
              step="0.1"
              value={progressValue}
              onChange={(event) =>
                player.seek(
                  Number(
                    event.target.value,
                  ),
                )
              }
              aria-label="Track progress"
            />

            <span>
              {formatTime(
                player.duration,
              )}
            </span>
          </div>
        </div>

        <div className="pulse-volume">
          <button
            onClick={() =>
              player.setVolume(
                player.volume > 0
                  ? 0
                  : 0.8,
              )
            }
            aria-label={
              player.volume === 0
                ? "Unmute"
                : "Mute"
            }
          >
            {player.volume === 0 ? (
              <VolumeX size={18} />
            ) : (
              <Volume2 size={18} />
            )}
          </button>

          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={player.volume}
            onChange={(event) =>
              player.setVolume(
                Number(
                  event.target.value,
                ),
              )
            }
            aria-label="Volume"
          />
        </div>
      </div>

      {/* Full player */}
      <div
        className={`pulse-full-player ${
          isFullPlayerOpen
            ? "open"
            : ""
        }`}
      >
        <div className="pulse-full-top">
          <button
            onClick={() =>
              setIsFullPlayerOpen(false)
            }
            aria-label="Close full player"
          >
            <ChevronDown size={24} />
          </button>

          <span>NOW PLAYING</span>

          <button
            className={
              isCurrentLiked
                ? "liked"
                : ""
            }
            onClick={() =>
              toggleLike(
                currentTrack.id,
              )
            }
            aria-label={
              isCurrentLiked
                ? "Unlike"
                : "Like"
            }
          >
            <Heart
              size={19}
              fill={
                isCurrentLiked
                  ? "currentColor"
                  : "none"
              }
              strokeWidth={2}
            />
          </button>
        </div>

        <div className="pulse-full-art">
          <div className="pulse-full-art-glow" />

          <img
            className={`pulse-full-image ${
              player.isPlaying
                ? "spinning"
                : ""
            }`}
            src={currentTrack.cover}
            alt={currentTrack.title}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />
        </div>

        <div className="pulse-full-details">
          <span>
            {currentTrack.genre}
          </span>

          <h2>
            {currentTrack.title}
          </h2>

          <p>
            {currentTrack.artist} ·{" "}
            {currentTrack.album}
          </p>
        </div>

        <div className="pulse-full-progress">
          <input
            type="range"
            min="0"
            max={progressMax}
            step="0.1"
            value={progressValue}
            onChange={(event) =>
              player.seek(
                Number(
                  event.target.value,
                ),
              )
            }
            aria-label="Track progress"
          />

          <div>
            <span>
              {formatTime(
                player.currentTime,
              )}
            </span>

            <span>
              {formatTime(
                player.duration,
              )}
            </span>
          </div>
        </div>

        <div className="pulse-full-controls">
          <button
            className={
              shuffle
                ? "active"
                : ""
            }
            onClick={() =>
              setShuffle(
                (value) => !value,
              )
            }
            aria-label="Shuffle"
          >
            <Shuffle size={21} />
          </button>

          <button
            onClick={previousTrack}
            aria-label="Previous track"
          >
            <SkipBack size={24} />
          </button>

          <button
            className="pulse-full-play"
            onClick={() =>
              void player.togglePlay()
            }
            aria-label={
              player.isPlaying
                ? "Pause"
                : "Play"
            }
          >
            {player.isPlaying ? (
              <Pause
                size={24}
                fill="currentColor"
              />
            ) : (
              <Play
                size={24}
                fill="currentColor"
              />
            )}
          </button>

          <button
            onClick={nextTrack}
            aria-label="Next track"
          >
            <SkipForward size={24} />
          </button>

          <button
            className={
              repeat !== "off"
                ? "active"
                : ""
            }
            onClick={cycleRepeat}
            aria-label={`Repeat: ${repeat}`}
          >
            {repeat === "one" ? (
              <Repeat1 size={21} />
            ) : (
              <Repeat size={21} />
            )}
          </button>
        </div>

        <div className="pulse-up-next">
          <div className="pulse-up-next-title">
            <span>UP NEXT</span>

            <small>
              {shuffle
                ? "Shuffle"
                : repeat === "all"
                  ? "Repeat all"
                  : "Queue"}
            </small>
          </div>

          <div className="pulse-up-next-list">
            {upNextTracks.map(
              (track) => (
                <button
                  key={track.id}
                  onClick={() =>
                    playTrack(track)
                  }
                >
                  <div className="pulse-mini-cover">
                    <img
                      src={track.cover}
                      alt=""
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit:
                          "cover",
                      }}
                    />
                  </div>

                  <div>
                    <strong>
                      {track.title}
                    </strong>

                    <span>
                      {track.artist}
                    </span>
                  </div>
                </button>
              ),
            )}
          </div>
        </div>
      </div>

      {/* Create playlist modal */}
      {isPlaylistModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            background:
              "rgba(0,0,0,.65)",
            backdropFilter:
              "blur(8px)",
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-playlist-title"
        >
          <div
            style={{
              width:
                "min(400px, 100%)",
              padding: 24,
              border:
                "1px solid var(--pulse-border)",
              borderRadius: 20,
              background:
                "var(--pulse-bg-2)",
              boxShadow:
                "0 30px 80px rgba(0,0,0,.5)",
            }}
          >
            <h2
              id="create-playlist-title"
              style={{
                margin: "0 0 7px",
                fontFamily:
                  "Space Grotesk, sans-serif",
              }}
            >
              Create playlist
            </h2>

            <p
              style={{
                margin: "0 0 18px",
                color:
                  "var(--pulse-muted)",
                fontSize: 12,
              }}
            >
              Give your new playlist
              a name.
            </p>

            <input
              autoFocus
              value={newPlaylistName}
              onChange={(event) =>
                setNewPlaylistName(
                  event.target.value,
                )
              }
              onKeyDown={(event) => {
                if (
                  event.key ===
                  "Enter"
                ) {
                  event.preventDefault();
                  createPlaylist();
                }

                if (
                  event.key ===
                  "Escape"
                ) {
                  setIsPlaylistModalOpen(
                    false,
                  );
                }
              }}
              placeholder="My playlist"
              aria-label="Playlist name"
              style={{
                width: "100%",
                height: 44,
                padding: "0 13px",
                border:
                  "1px solid var(--pulse-border)",
                borderRadius: 11,
                outline: "none",
                color:
                  "var(--pulse-text)",
                background:
                  "var(--pulse-panel)",
              }}
            />

            <div
              style={{
                display: "flex",
                justifyContent:
                  "flex-end",
                gap: 8,
                marginTop: 15,
              }}
            >
              <button
                onClick={() => {
                  setNewPlaylistName(
                    "",
                  );
                  setIsPlaylistModalOpen(
                    false,
                  );
                }}
                style={{
                  padding:
                    "9px 14px",
                  border: 0,
                  borderRadius: 9,
                  color:
                    "var(--pulse-muted)",
                  background:
                    "var(--pulse-panel)",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>

              <button
                className="pulse-primary-button"
                onClick={createPlaylist}
                disabled={
                  !newPlaylistName.trim()
                }
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add to playlist modal */}
      {playlistForTrack && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 200,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
            background:
              "rgba(0,0,0,.65)",
            backdropFilter:
              "blur(8px)",
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="add-playlist-title"
        >
          <div
            style={{
              width:
                "min(430px, 100%)",
              maxHeight: "70vh",
              overflowY: "auto",
              padding: 24,
              border:
                "1px solid var(--pulse-border)",
              borderRadius: 20,
              background:
                "var(--pulse-bg-2)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent:
                  "space-between",
                alignItems: "center",
                marginBottom: 16,
              }}
            >
              <div>
                <h2
                  id="add-playlist-title"
                  style={{
                    margin: 0,
                    fontFamily:
                      "Space Grotesk, sans-serif",
                  }}
                >
                  Add to playlist
                </h2>

                <p
                  style={{
                    margin:
                      "5px 0 0",
                    color:
                      "var(--pulse-muted)",
                    fontSize: 11,
                  }}
                >
                  Choose where to
                  save this song.
                </p>
              </div>

              <button
                onClick={() =>
                  setPlaylistForTrack(
                    null,
                  )
                }
                aria-label="Close"
                style={{
                  width: 34,
                  height: 34,
                  border: 0,
                  borderRadius: 9,
                  color:
                    "var(--pulse-muted)",
                  background:
                    "var(--pulse-panel)",
                  cursor: "pointer",
                }}
              >
                <X size={17} />
              </button>
            </div>

            {playlists.filter(
              (playlist) =>
                playlist.id !== "liked",
            ).length === 0 ? (
              <div
                style={{
                  padding:
                    "20px 10px",
                  textAlign:
                    "center",
                  color:
                    "var(--pulse-muted)",
                  fontSize: 13,
                }}
              >
                You don't have any
                playlists yet.
              </div>
            ) : (
              playlists
                .filter(
                  (playlist) =>
                    playlist.id !==
                    "liked",
                )
                .map((playlist) => {
                  const hasTrack =
                    playlist.trackIds.includes(
                      playlistForTrack,
                    );

                  return (
                    <button
                      key={playlist.id}
                      onClick={() => {
                        if (hasTrack) {
                          removeFromPlaylist(
                            playlist.id,
                            playlistForTrack,
                          );
                          setPlaylistForTrack(
                            null,
                          );
                        } else {
                          addToPlaylist(
                            playlist.id,
                            playlistForTrack,
                          );
                        }
                      }}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems:
                          "center",
                        justifyContent:
                          "space-between",
                        padding:
                          "12px 10px",
                        marginBottom: 5,
                        border: 0,
                        borderRadius: 10,
                        color:
                          "var(--pulse-text)",
                        background:
                          "transparent",
                        textAlign: "left",
                        cursor:
                          "pointer",
                      }}
                    >
                      <span
                        style={{
                          display:
                            "flex",
                          alignItems:
                            "center",
                          gap: 8,
                        }}
                      >
                        <ListMusic
                          size={16}
                        />

                        {playlist.name}
                      </span>

                      <span
                        style={{
                          color:
                            hasTrack
                              ? "var(--pulse-pink)"
                              : "var(--pulse-dim)",
                          fontSize: 11,
                        }}
                      >
                        {hasTrack
                          ? "Remove"
                          : "Add"}
                      </span>
                    </button>
                  );
                })
            )}

            <button
              className="pulse-primary-button"
              style={{
                marginTop: 10,
                width: "100%",
                justifyContent:
                  "center",
              }}
              onClick={() => {
                setPlaylistForTrack(
                  null,
                );
                setNewPlaylistName("");
                setIsPlaylistModalOpen(
                  true,
                );
              }}
            >
              <Plus size={16} />
              Create New Playlist
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
