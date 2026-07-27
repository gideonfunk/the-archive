'use client';

import { useAudioPlayer } from './AudioPlayer';
import { formatDuration } from '@/lib/utils';

export function PlayerBar() {
  const { currentTrack, isPlaying, progress, currentTime, error, togglePlay, seekPercent, skipSeconds } = useAudioPlayer();

  if (!currentTrack) return null;

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const percent = ((e.clientX - rect.left) / rect.width) * 100;
    seekPercent(Math.max(0, Math.min(100, percent)));
  };

  const handleTimelineKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      skipSeconds(-5);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      skipSeconds(5);
    }
  };

  return (
    <aside className="player" aria-label="Now playing">
      <button
        className="player-cover"
        type="button"
        onClick={togglePlay}
        style={{ background: currentTrack.personaColor }}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? 'Ⅱ' : '▶'}
      </button>
      <div className="player-title">
        <strong>{currentTrack.title}</strong>
        <span>{currentTrack.personaName}</span>
      </div>
      <button
        className="skip"
        type="button"
        onClick={() => skipSeconds(-10)}
        aria-label="Back ten seconds"
      >
        −10
      </button>
      <button
        className="main-play"
        type="button"
        onClick={togglePlay}
        aria-label={isPlaying ? 'Pause' : 'Play'}
      >
        {isPlaying ? 'Ⅱ' : '▶'}
      </button>
      <button
        className="skip"
        type="button"
        onClick={() => skipSeconds(10)}
        aria-label="Forward ten seconds"
      >
        +10
      </button>
      <div
        className="timeline"
        onClick={handleSeek}
        onKeyDown={handleTimelineKeyDown}
        role="slider"
        tabIndex={0}
        aria-label="Playback position"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(progress)}
      >
        <span style={{ width: `${progress}%`, background: currentTrack.personaColor }} />
      </div>
      <span className="elapsed">
        {formatDuration(currentTime)} / {currentTrack.duration ? formatDuration(currentTrack.duration) : '--:--'}
      </span>
      {error && <span className="player-error" role="status">{error}</span>}
    </aside>
  );
}
