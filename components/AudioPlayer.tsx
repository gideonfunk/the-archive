"use client";

import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { getOrCreateAnonymousUserId } from "@/lib/auth";

export type PlayerTrack = {
  id: number;
  title: string;
  personaName: string;
  personaColor: string;
  publicUrl: string;
  duration?: number | null;
  versionId?: number;
};

type PlayerState = {
  currentTrack: PlayerTrack | null;
  isPlaying: boolean;
  progress: number;
  currentTime: number;
  volume: number;
  error: string | null;
};

type PlayerContextType = PlayerState & {
  playTrack: (track: PlayerTrack) => void;
  togglePlay: () => void;
  seekPercent: (percent: number) => void;
  skipSeconds: (seconds: number) => void;
  setVolume: (volume: number) => void;
};

const AudioPlayerContext = createContext<PlayerContextType | null>(null);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const reportedVersionRef = useRef<number | null>(null);
  const [state, setState] = useState<PlayerState>({
    currentTrack: null,
    isPlaying: false,
    progress: 0,
    currentTime: 0,
    volume: 1,
    error: null,
  });

  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audioRef.current = audio;

    const updateProgress = () => {
      const duration = Number.isFinite(audio.duration) ? audio.duration : 0;
      const currentTime = audio.currentTime;
      setState((previous) => ({
        ...previous,
        currentTime,
        progress: duration > 0 ? (currentTime / duration) * 100 : 0,
      }));
    };
    const handleEnded = () => {
      updateProgress();
      setState((previous) => ({ ...previous, isPlaying: false, progress: 100 }));
    };
    const handleError = () => {
      setState((previous) => ({
        ...previous,
        isPlaying: false,
        error: "This audio file could not be played.",
      }));
    };

    audio.addEventListener("timeupdate", updateProgress);
    audio.addEventListener("durationchange", updateProgress);
    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);
    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.removeEventListener("timeupdate", updateProgress);
      audio.removeEventListener("durationchange", updateProgress);
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    const track = state.currentTrack;
    if (!audio || !track) return;

    if (audio.getAttribute("src") !== track.publicUrl) {
      audio.src = track.publicUrl;
      audio.load();
      reportedVersionRef.current = null;
    }
    if (state.isPlaying) {
      audio.play().catch(() => {
        setState((previous) => ({
          ...previous,
          isPlaying: false,
          error: "Select play again to start listening.",
        }));
      });
    } else {
      audio.pause();
    }
  }, [state.currentTrack, state.isPlaying]);

  useEffect(() => {
    const track = state.currentTrack;
    if (!track?.versionId || reportedVersionRef.current === track.versionId) return;
    const duration = track.duration ?? 0;
    const threshold = duration > 0 && duration < 60 ? duration * 0.5 : 30;
    if (state.currentTime < threshold) return;

    reportedVersionRef.current = track.versionId;
    fetch("/api/plays", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        trackVersionId: track.versionId,
        userId: getOrCreateAnonymousUserId(),
        playDuration: Math.floor(state.currentTime),
        source: "web",
      }),
    }).catch(() => {
      reportedVersionRef.current = null;
    });
  }, [state.currentTime, state.currentTrack]);

  function playTrack(track: PlayerTrack) {
    if (!track.publicUrl) {
      setState((previous) => ({
        ...previous,
        currentTrack: track,
        isPlaying: false,
        error: "Audio is not available for this track yet.",
      }));
      return;
    }
    setState((previous) => ({
      ...previous,
      currentTrack: track,
      isPlaying: true,
      progress: 0,
      currentTime: 0,
      error: null,
    }));
  }

  function togglePlay() {
    if (!state.currentTrack) return;
    setState((previous) => ({ ...previous, isPlaying: !previous.isPlaying, error: null }));
  }

  function seekPercent(percent: number) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration) || audio.duration <= 0) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, (percent / 100) * audio.duration));
  }

  function skipSeconds(seconds: number) {
    const audio = audioRef.current;
    if (!audio || !Number.isFinite(audio.duration)) return;
    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
  }

  function setVolume(volume: number) {
    const bounded = Math.max(0, Math.min(1, volume));
    if (audioRef.current) audioRef.current.volume = bounded;
    setState((previous) => ({ ...previous, volume: bounded }));
  }

  return (
    <AudioPlayerContext.Provider
      value={{ ...state, playTrack, togglePlay, seekPercent, skipSeconds, setVolume }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (!context) throw new Error("useAudioPlayer must be used within AudioPlayerProvider");
  return context;
}
