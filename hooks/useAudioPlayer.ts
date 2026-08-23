"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Track } from "@/types/music";

type AudioPlayerOptions = {
  onEnded?: () => boolean | void;
};

export function useAudioPlayer(
  track: Track,
  shouldAutoPlay = false,
  options: AudioPlayerOptions = {},
) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const onEndedRef = useRef(options.onEnded);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(track.duration);
  const [volume, setVolumeState] = useState(0.8);

  useEffect(() => {
    onEndedRef.current = options.onEnded;
  }, [options.onEnded]);

  /*
   * Create a new audio element only when the track URL changes.
   */
  useEffect(() => {
    const audio = new Audio();

    audio.preload = "metadata";
    audio.volume = volume;
    audio.src = track.audioUrl;

    audioRef.current = audio;

    setCurrentTime(0);
    setDuration(track.duration);
    setIsPlaying(false);

    const handleLoadedMetadata = () => {
      if (
        Number.isFinite(audio.duration) &&
        audio.duration > 0
      ) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePause = () => {
      setIsPlaying(false);
    };

    const handleEnded = async () => {
      const shouldReplay =
        onEndedRef.current?.() === true;

      if (shouldReplay) {
        audio.currentTime = 0;

        try {
          await audio.play();
        } catch (error) {
          console.error(
            "Repeat playback failed:",
            error,
          );
          setIsPlaying(false);
        }

        return;
      }

      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      console.error(
        "Audio failed to load:",
        track.audioUrl,
      );
      setIsPlaying(false);
    };

    audio.addEventListener(
      "loadedmetadata",
      handleLoadedMetadata,
    );
    audio.addEventListener(
      "timeupdate",
      handleTimeUpdate,
    );
    audio.addEventListener(
      "play",
      handlePlay,
    );
    audio.addEventListener(
      "pause",
      handlePause,
    );
    audio.addEventListener(
      "ended",
      handleEnded,
    );
    audio.addEventListener(
      "error",
      handleError,
    );

    return () => {
      audio.pause();

      audio.removeEventListener(
        "loadedmetadata",
        handleLoadedMetadata,
      );
      audio.removeEventListener(
        "timeupdate",
        handleTimeUpdate,
      );
      audio.removeEventListener(
        "play",
        handlePlay,
      );
      audio.removeEventListener(
        "pause",
        handlePause,
      );
      audio.removeEventListener(
        "ended",
        handleEnded,
      );
      audio.removeEventListener(
        "error",
        handleError,
      );

      audio.src = "";

      if (audioRef.current === audio) {
        audioRef.current = null;
      }
    };
  }, [track.audioUrl]);

  /*
   * Keep duration synchronized.
   */
  useEffect(() => {
    setDuration(track.duration);
  }, [track.duration]);

  /*
   * Keep volume synchronized.
   */
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  /*
   * Play.
   */
  const play = useCallback(async () => {
    const audio = audioRef.current;

    if (!audio) {
      return false;
    }

    try {
      await audio.play();
      return true;
    } catch (error) {
      console.error(
        "Playback failed:",
        error,
      );
      setIsPlaying(false);
      return false;
    }
  }, []);

  /*
   * Pause.
   */
  const pause = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  /*
   * Toggle.
   */
  const togglePlay = useCallback(async () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    if (audio.paused) {
      await play();
    } else {
      pause();
    }
  }, [play, pause]);

  /*
   * Seek.
   */
  const seek = useCallback(
    (time: number) => {
      const audio = audioRef.current;

      if (!audio) {
        return;
      }

      const actualDuration =
        Number.isFinite(audio.duration) &&
        audio.duration > 0
          ? audio.duration
          : duration;

      const safeTime = Math.max(
        0,
        Math.min(time, actualDuration),
      );

      audio.currentTime = safeTime;
      setCurrentTime(safeTime);
    },
    [duration],
  );

  /*
   * Restart.
   */
  const restart = useCallback(async () => {
    const audio = audioRef.current;

    if (!audio) {
      return;
    }

    audio.currentTime = 0;
    setCurrentTime(0);

    try {
      await audio.play();
    } catch (error) {
      console.error(
        "Restart failed:",
        error,
      );
    }
  }, []);

  /*
   * Volume.
   */
  const setVolume = useCallback(
    (value: number) => {
      const nextVolume = Math.max(
        0,
        Math.min(1, value),
      );

      setVolumeState(nextVolume);

      if (audioRef.current) {
        audioRef.current.volume = nextVolume;
      }
    },
    [],
  );

  /*
   * Auto-play whenever a new track is selected.
   *
   * The small delay lets the new Audio element
   * finish being attached before play() is called.
   */
  useEffect(() => {
    if (!shouldAutoPlay) {
      return;
    }

    let cancelled = false;

    const startPlayback = async () => {
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => resolve());
      });

      if (cancelled) {
        return;
      }

      const audio = audioRef.current;

      if (!audio) {
        return;
      }

      try {
        await audio.play();
      } catch (error) {
        if (!cancelled) {
          console.error(
            "Auto-play failed:",
            error,
          );
          setIsPlaying(false);
        }
      }
    };

    void startPlayback();

    return () => {
      cancelled = true;
    };
  }, [track.audioUrl, shouldAutoPlay]);

  return {
    isPlaying,
    currentTime,
    duration,
    volume,
    play,
    pause,
    togglePlay,
    seek,
    restart,
    setVolume,
  };
}