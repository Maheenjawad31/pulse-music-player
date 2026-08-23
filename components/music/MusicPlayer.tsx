"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import type {
  Playlist,
  Track,
} from "@/types/music";

import {
  tracks,
  defaultPlaylists,
  genres,
} from "@/data/tracks";

import { useAudioPlayer } from "@/hooks/useAudioPlayer";

type RepeatMode =
  | "off"
  | "all"
  | "one";

function formatTime(seconds: number) {
  if (!Number.isFinite(seconds)) {
    return "0:00";
  }

  const minutes = Math.floor(
    seconds / 60,
  );

  const remaining = Math.floor(
    seconds % 60,
  );

  return `${minutes}:${remaining
    .toString()
    .padStart(2, "0")}`;
}

function makeId() {
  return `playlist-${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 8)}`;
}

export default function MusicPlayer() {
  const [selectedTrackId, setSelectedTrackId] =
    useState(tracks[0]?.id ?? "");

  const [shouldAutoPlay, setShouldAutoPlay] =
    useState(false);

  const [query, setQuery] =
    useState("");

  const [selectedGenre, setSelectedGenre] =
    useState<(typeof genres)[number]>("All");

    const [playlists, setPlaylists] =
    useState<Playlist[]>(defaultPlaylists);
  
  const [activePlaylistId, setActivePlaylistId] =
    useState<string | null>(null);
  
  const [likedIds, setLikedIds] =
    useState<string[]>([]);
  
  const [storageLoaded, setStorageLoaded] =
    useState(false);

  const [shuffle, setShuffle] =
    useState(false);

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

  const upNextTracks = useMemo(() => {
    if (!currentTrack) {
      return [];
    }
  
    const currentIndex = tracks.findIndex(
      (track) => track.id === currentTrack.id,
    );
  
    if (shuffle) {
      return tracks
        .filter((track) => track.id !== currentTrack.id)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
    }
  
    const upcoming: Track[] = [];
  
    for (let i = 1; i <= tracks.length; i++) {
      const nextIndex = currentIndex + i;
  
      if (nextIndex < tracks.length) {
        upcoming.push(tracks[nextIndex]);
      } else if (repeat === "all") {
        upcoming.push(
          tracks[nextIndex % tracks.length],
        );
      }
    }
  
    return upcoming.slice(0, 3);
  }, [currentTrack, shuffle, repeat]);
  /*
 * Load saved playlists and liked songs once.
 */
  useEffect(() => {
    try {
      const savedPlaylists = localStorage.getItem(
        "pulse-playlists"
      );
  
      const savedLikes = localStorage.getItem(
        "pulse-liked"
      );
  
      if (savedPlaylists) {
        const parsedPlaylists = JSON.parse(
          savedPlaylists
        );
  
        if (Array.isArray(parsedPlaylists)) {
          setPlaylists(parsedPlaylists);
        }
      }
  
      if (savedLikes) {
        const parsedLikes = JSON.parse(
          savedLikes
        );
  
        if (Array.isArray(parsedLikes)) {
          setLikedIds(parsedLikes);
        }
      }
    } catch (error) {
      console.error(
        "Failed to load saved music data:",
        error
      );
    } finally {
      setStorageLoaded(true);
    }
  }, []);

/*
 * Save playlists only after localStorage
 * has finished loading.
 */
useEffect(() => {
  if (!storageLoaded) return;

  try {
    localStorage.setItem(
      "pulse-playlists",
      JSON.stringify(playlists)
    );
  } catch (error) {
    console.error(
      "Failed to save playlists:",
      error
    );
  }
}, [playlists, storageLoaded]);

/*
 * Save liked songs only after localStorage
 * has finished loading.
 */
useEffect(() => {
  if (!storageLoaded) return;

  try {
    localStorage.setItem(
      "pulse-liked",
      JSON.stringify(likedIds)
    );
  } catch (error) {
    console.error(
      "Failed to save likes:",
      error
    );
  }
}, [likedIds, storageLoaded]);
 

  /*
   * What should happen when a song ends?
   */
  const handleTrackEnded =
    useCallback(() => {
      if (!currentTrack) {
        return false;
      }

      if (repeat === "one") {
        return true;
      }

      const currentIndex =
        tracks.findIndex(
          (track) =>
            track.id === currentTrack.id,
        );

      let nextIndex: number;

      if (shuffle) {
        const possible =
          tracks.filter(
            (track) =>
              track.id !==
              currentTrack.id,
          );

        if (possible.length === 0) {
          return repeat === "all";
        }

        const randomIndex =
          Math.floor(
            Math.random() *
              possible.length,
          );

        setSelectedTrackId(
          possible[randomIndex].id,
        );

        setShouldAutoPlay(true);

        return false;
      }

      nextIndex = currentIndex + 1;

      if (
        nextIndex >= tracks.length
      ) {
        if (repeat === "all") {
          nextIndex = 0;
        } else {
          return false;
        }
      }

      setSelectedTrackId(
        tracks[nextIndex].id,
      );

      setShouldAutoPlay(true);

      return false;
    }, [
      currentTrack,
      repeat,
      shuffle,
    ]);

  const player =
    useAudioPlayer(
      currentTrack,
      shouldAutoPlay,
      {
        onEnded: handleTrackEnded,
      },
    );

    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement | null;
    
        // Don't control music while typing.
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
            Math.max(0, player.currentTime - 5),
          );
          return;
        }
    
        if (event.key === "ArrowRight") {
          event.preventDefault();
          player.seek(
            Math.min(
              player.duration,
              player.currentTime + 5,
            ),
          );
          return;
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
    }, [player]);
  /*
   * Auto-play is only needed for the transition.
   */
  useEffect(() => {
    if (!shouldAutoPlay) {
      return;
    }

    setShouldAutoPlay(false);
  }, [
    shouldAutoPlay,
    selectedTrackId,
  ]);

  /*
   * Current playlist.
   */
  const activePlaylist =
    playlists.find(
      (playlist) =>
        playlist.id ===
        activePlaylistId,
    ) ?? null;

  /*
   * Songs shown on screen.
   */
  const visibleTracks =
    useMemo(() => {
      let result = tracks;

      if (activePlaylist) {
        result = result.filter(
          (track) =>
            activePlaylist.trackIds.includes(
              track.id,
            ),
        );
      }

      if (selectedGenre !== "All") {
        result = result.filter(
          (track) =>
            track.genre ===
            selectedGenre,
        );
      }

      const normalizedQuery =
        query.trim().toLowerCase();

      if (normalizedQuery) {
        result = result.filter(
          (track) =>
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
              .includes(normalizedQuery),
        );
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
      if (
        track.id === selectedTrackId
      ) {
        void player.togglePlay();
        return;
      }

      setSelectedTrackId(track.id);
      setShouldAutoPlay(true);
    },
    [
      player,
      selectedTrackId,
    ],
  );

  /*
   * Next track.
   */
  const nextTrack = useCallback(() => {
    if (!currentTrack) {
      return;
    }

    if (shuffle) {
      const candidates =
        tracks.filter(
          (track) =>
            track.id !==
            currentTrack.id,
        );

      if (candidates.length) {
        const random =
          candidates[
            Math.floor(
              Math.random() *
                candidates.length,
            )
          ];

        setSelectedTrackId(random.id);
        setShouldAutoPlay(true);
      }

      return;
    }

    const index =
      tracks.findIndex(
        (track) =>
          track.id ===
          currentTrack.id,
      );

    let nextIndex = index + 1;

    if (
      nextIndex >= tracks.length
    ) {
      nextIndex =
        repeat === "all"
          ? 0
          : tracks.length - 1;
    }

    setSelectedTrackId(
      tracks[nextIndex].id,
    );

    setShouldAutoPlay(true);
  }, [
    currentTrack,
    shuffle,
    repeat,
  ]);

  /*
   * Previous track.
   */
  const previousTrack =
    useCallback(() => {
      if (!currentTrack) {
        return;
      }

      if (
        player.currentTime > 3
      ) {
        player.seek(0);
        return;
      }

      const index =
        tracks.findIndex(
          (track) =>
            track.id ===
            currentTrack.id,
        );

      let previousIndex =
        index - 1;

      if (previousIndex < 0) {
        previousIndex =
          repeat === "all"
            ? tracks.length - 1
            : 0;
      }

      setSelectedTrackId(
        tracks[previousIndex].id,
      );

      setShouldAutoPlay(true);
    }, [
      currentTrack,
      player,
      repeat,
    ]);

  /*
   * Like / unlike.
   */
  const toggleLike = useCallback(
    (trackId: string) => {
      setLikedIds((current) =>
        current.includes(trackId)
          ? current.filter(
              (id) => id !== trackId,
            )
          : [...current, trackId],
      );

      /*
       * Keep "Liked Songs" playlist
       * synchronized.
       */
      setPlaylists((current) =>
        current.map((playlist) => {
          if (
            playlist.id !== "liked"
          ) {
            return playlist;
          }

          const alreadyLiked =
            playlist.trackIds.includes(
              trackId,
            );

          return {
            ...playlist,
            trackIds:
              alreadyLiked
                ? playlist.trackIds.filter(
                    (id) =>
                      id !== trackId,
                  )
                : [
                    ...playlist.trackIds,
                    trackId,
                  ],
          };
        }),
      );
    },
    [],
  );

  /*
   * Create playlist.
   */
  const createPlaylist =
    useCallback(() => {
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
      setActivePlaylistId(
        playlist.id,
      );
    }, [
      newPlaylistName,
    ]);

  /*
   * Delete playlist.
   */
  const deletePlaylist =
    useCallback(
      (playlistId: string) => {
        if (
          playlistId === "liked"
        ) {
          return;
        }

        setPlaylists((current) =>
          current.filter(
            (playlist) =>
              playlist.id !==
              playlistId,
          ),
        );

        if (
          activePlaylistId ===
          playlistId
        ) {
          setActivePlaylistId(null);
        }
      },
      [activePlaylistId],
    );

  /*
   * Add a track to playlist.
   */
  const addToPlaylist =
    useCallback(
      (
        playlistId: string,
        trackId: string,
      ) => {
        setPlaylists((current) =>
          current.map((playlist) => {
            if (
              playlist.id !==
              playlistId
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
   * Remove a track from playlist.
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
              playlist.id !==
              playlistId
            ) {
              return playlist;
            }

            return {
              ...playlist,
              trackIds:
                playlist.trackIds.filter(
                  (id) =>
                    id !== trackId,
                ),
            };
          }),
        );
      },
      [],
    );

  /*
   * Cycle repeat.
   */
  const cycleRepeat = useCallback(
    () => {
      setRepeat((current) => {
        if (current === "off") {
          return "all";
        }

        if (current === "all") {
          return "one";
        }

        return "off";
      });
    },
    [],
  );

  /*
   * Switch playlist.
   */
  const selectPlaylist =
    useCallback(
      (playlistId: string | null) => {
        setActivePlaylistId(
          playlistId,
        );

        setSelectedGenre("All");
        setQuery("");
        setIsSidebarOpen(false);
      },
      [],
    );

  if (!currentTrack) {
    return null;
  }

  return (
    <div className="pulse-app">
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
          ×
        </button>

        <nav className="pulse-nav">
          <div className="pulse-nav-label">
            Library
          </div>

          <button
            className={`pulse-nav-item ${
              activePlaylistId ===
              null
                ? "active"
                : ""
            }`}
            onClick={() =>
              selectPlaylist(null)
            }
          >
            <span>⌂</span>
            Home
          </button>

          <button
            className={`pulse-nav-item ${
              activePlaylistId ===
              "liked"
                ? "active"
                : ""
            }`}
            onClick={() =>
              selectPlaylist("liked")
            }
          >
            <span className="pulse-heart">
              ♥
            </span>
            Liked Songs
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
                playlist.id !==
                "liked",
            )
            .map((playlist) => (
              <button
                key={playlist.id}
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
              >
                <span>♫</span>

                <span
                  style={{
                    overflow:
                      "hidden",
                    textOverflow:
                      "ellipsis",
                    whiteSpace:
                      "nowrap",
                  }}
                >
                  {playlist.name}
                </span>

                <span className="pulse-count">
                  {
                    playlist.trackIds
                      .length
                  }
                </span>
              </button>
            ))}

          <button
            className="pulse-nav-item"
            onClick={() =>
              setIsPlaylistModalOpen(
                true,
              )
            }
          >
            <span>＋</span>
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

      <main className="pulse-main">
        <header className="pulse-header">
          <button
            className="pulse-menu-button"
            onClick={() =>
              setIsSidebarOpen(true)
            }
            aria-label="Open menu"
          >
            ☰
          </button>

          <div className="pulse-search">
            <span
              style={{
                position:
                  "absolute",
                left: 15,
                top: "50%",
                transform:
                  "translateY(-50%)",
                color:
                  "var(--pulse-dim)",
              }}
            >
              ⌕
            </span>

            <input
              value={query}
              onChange={(event) =>
                setQuery(
                  event.target.value,
                )
              }
              placeholder="Search songs, artists, albums..."
            />

            {query && (
              <button
                className="pulse-search-clear"
                onClick={() =>
                  setQuery("")
                }
                aria-label="Clear search"
              >
                ×
              </button>
            )}
          </div>

          <div className="pulse-header-status">
            <span className="pulse-status-dot" />
            Music ready
          </div>
        </header>

        <div className="pulse-content">
          {!activePlaylist && (
            <section className="pulse-hero">
              <div className="pulse-hero-copy">
                <span className="pulse-eyebrow">
                  YOUR PERSONAL SOUNDTRACK
                </span>

                <h1>
                  Feel the{" "}
                  <span>
                    Pulse.
                  </span>
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
                    playTrack(
                      tracks[0],
                    )
                  }
                >
                  ▶ Play Music
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
                  }}
                />

                <div className="pulse-hero-overlay">
                  <span>
                    NOW PLAYING
                  </span>

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
                {visibleTracks.length}{" "}
                songs
              </span>
            </div>

            <div className="pulse-chips">
              {genres.map((genre) => (
                <button
                  key={genre}
                  className={`pulse-chip ${
                    selectedGenre ===
                    genre
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

            {visibleTracks.length ===
            0 ? (
              <div className="pulse-empty">
                <div className="pulse-empty-icon">
                  ♫
                </div>

                <h3>
                  No songs found
                </h3>

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
                  (
                    track,
                    index,
                  ) => {
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
                            playTrack(
                              track,
                            )
                          }
                        >
                          <div className="pulse-cover">
                            <img
                              src={
                                track.cover
                              }
                              alt=""
                              className="pulse-cover-image"
                              style={{
                                width:
                                  "100%",
                                height:
                                  "100%",
                              }}
                            />

                            <div className="pulse-cover-play">
                              {isCurrent &&
                              player.isPlaying
                                ? "❚❚"
                                : "▶"}
                            </div>
                          </div>

                          <div className="pulse-track-info">
                            <strong>
                              {
                                track.title
                              }
                            </strong>

                            <span>
                              {
                                track.artist
                              }
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
                            display:
                              "flex",
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
                            aria-label="Like"
                          >
                            {liked
                              ? "♥"
                              : "♡"}
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
                            ＋
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

      {isSidebarOpen && (
        <button
          className="pulse-backdrop"
          onClick={() =>
            setIsSidebarOpen(false)
          }
          aria-label="Close menu"
        />
      )}

      /*
       * Bottom player.
       */
      <div className="pulse-player">
        <button
          className="pulse-player-track"
          onClick={() =>
            setIsFullPlayerOpen(true)
          }
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
            likedIds.includes(
              currentTrack.id,
            )
              ? "liked"
              : ""
          }`}
          onClick={() =>
            toggleLike(
              currentTrack.id,
            )
          }
        >
          {likedIds.includes(
            currentTrack.id,
          )
            ? "♥"
            : "♡"}
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
            >
              ⤨
            </button>

            <button
              onClick={previousTrack}
              title="Previous"
            >
              |◀
            </button>

            <button
              className="pulse-play-button"
              onClick={() =>
                void player.togglePlay()
              }
            >
              {player.isPlaying
                ? "❚❚"
                : "▶"}
            </button>

            <button
              onClick={nextTrack}
              title="Next"
            >
              ▶|
            </button>

            <button
              className={
                repeat !== "off"
                  ? "active"
                  : ""
              }
              onClick={cycleRepeat}
              title={`Repeat: ${repeat}`}
            >
              {repeat === "one"
                ? "1↻"
                : "↻"}
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
              max={
                player.duration || 1
              }
              step="0.1"
              value={Math.min(
                player.currentTime,
                player.duration || 1,
              )}
              onChange={(event) =>
                player.seek(
                  Number(
                    event.target.value,
                  ),
                )
              }
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
            aria-label="Mute"
          >
            {player.volume === 0
              ? "🔇"
              : "🔊"}
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
          />
        </div>
      </div>

      /*
       * Full player.
       */
      <div
  className={`pulse-full-player${
    isFullPlayerOpen ? " open" : ""
  }`}

      >
        <div className="pulse-full-top">
          <button
            onClick={() =>
              setIsFullPlayerOpen(
                false,
              )
            }
          >
            ↓
          </button>

          <span>
            NOW PLAYING
          </span>

          <button
            className={
              likedIds.includes(
                currentTrack.id,
              )
                ? "liked"
                : ""
            }
            onClick={() =>
              toggleLike(
                currentTrack.id,
              )
            }
          >
            {likedIds.includes(
              currentTrack.id,
            )
              ? "♥"
              : "♡"}
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
            max={
              player.duration || 1
            }
            step="0.1"
            value={Math.min(
              player.currentTime,
              player.duration || 1,
            )}
            onChange={(event) =>
              player.seek(
                Number(
                  event.target.value,
                ),
              )
            }
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
          >
            ⤨
          </button>

          <button
            onClick={previousTrack}
          >
            |◀
          </button>

          <button
            className="pulse-full-play"
            onClick={() =>
              void player.togglePlay()
            }
          >
            {player.isPlaying
              ? "❚❚"
              : "▶"}
          </button>

          <button
            onClick={nextTrack}
          >
            ▶|
          </button>

          <button
            className={
              repeat !== "off"
                ? "active"
                : ""
            }
            onClick={cycleRepeat}
          >
            {repeat === "one"
              ? "1↻"
              : "↻"}
          </button>
        </div>

        <div className="pulse-up-next">
          <div className="pulse-up-next-title">
            <span>
              UP NEXT
            </span>

            <small>
              {shuffle
                ? "Shuffle"
                : repeat ===
                    "all"
                  ? "Repeat all"
                  : "Queue"}
            </small>
          </div>

          <div className="pulse-up-next-list">
          {upNextTracks.map((track) => (
                <button
                  key={track.id}
                  onClick={() =>
                    playTrack(
                      track,
                    )
                  }
                >
                  <div className="pulse-mini-cover">
                    <img
                      src={
                        track.cover
                      }
                      alt=""
                      style={{
                        width:
                          "100%",
                        height:
                          "100%",
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
              ))}
          </div>
        </div>
      </div>

      /*
       * Create playlist modal.
       */
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
        >
          <div
            style={{
              width: "min(400px, 100%)",
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
                margin:
                  "0 0 18px",
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
                  createPlaylist();
                }
              }}
              placeholder="My playlist"
              style={{
                width: "100%",
                height: 44,
                padding:
                  "0 13px",
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
                onClick={() =>
                  setIsPlaylistModalOpen(
                    false,
                  )
                }
                style={{
                  padding:
                    "9px 14px",
                  border: 0,
                  borderRadius: 9,
                  color:
                    "var(--pulse-muted)",
                  background:
                    "var(--pulse-panel)",
                }}
              >
                Cancel
              </button>

              <button
                className="pulse-primary-button"
                onClick={
                  createPlaylist
                }
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      /*
       * Add to playlist modal.
       */
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
        >
          <div
            style={{
              width: "min(430px, 100%)",
              maxHeight:
                "70vh",
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
                alignItems:
                  "center",
                marginBottom: 16,
              }}
            >
              <div>
                <h2
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
                style={{
                  width: 34,
                  height: 34,
                  border: 0,
                  borderRadius: 9,
                  color:
                    "var(--pulse-muted)",
                  background:
                    "var(--pulse-panel)",
                }}
              >
                ×
              </button>
            </div>

            {playlists
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
                      if (
                        hasTrack
                      ) {
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
                      width:
                        "100%",
                      display:
                        "flex",
                      alignItems:
                        "center",
                      justifyContent:
                        "space-between",
                      padding:
                        "12px 10px",
                      marginBottom:
                        5,
                      border: 0,
                      borderRadius:
                        10,
                      color:
                        "var(--pulse-text)",
                      background:
                        "transparent",
                      textAlign:
                        "left",
                    }}
                  >
                    <span>
                      ♫{" "}
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
                        ? "Added"
                        : "Add"}
                    </span>
                  </button>
                );
              })}

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
                setIsPlaylistModalOpen(
                  true,
                );
              }}
            >
              ＋ Create New Playlist
            </button>
          </div>
        </div>
      )}
    </div>
  );
}