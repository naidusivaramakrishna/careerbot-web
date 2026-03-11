'use client';

import { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Loader } from 'lucide-react';

export interface TTSAudioPlayerProps {
  audioBase64?: string; // Base64 encoded MP3 audio
  text?: string; // Original text for label
  onPlayStart?: () => void;
  onPlayEnd?: () => void;
  isLoading?: boolean;
}

/**
 * TTS Audio Player Component
 *
 * Plays TTS-generated audio from backend
 * - Playback controls (play/pause)
 * - Playback rate control (0.5x - 2x)
 * - Real-time playback progress
 * - Mobile fallback support
 */
export function TTSAudioPlayer({
  audioBase64,
  text,
  onPlayStart,
  onPlayEnd,
  isLoading = false,
}: TTSAudioPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Convert base64 to audio URL
  useEffect(() => {
    if (audioBase64 && audioRef.current) {
      try {
        const binaryString = atob(audioBase64);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);
        audioRef.current.src = url;

        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (err) {
        console.error('Failed to parse audio data', err);
      }
    }
  }, [audioBase64]);

  // Handle playback rate change
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const handlePlay = async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        onPlayStart?.();
      } catch (err) {
        console.error('Failed to play audio', err);
      }
    }
  };

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleToggle = () => {
    if (isPlaying) {
      handlePause();
    } else {
      handlePlay();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  const hasAudio = !!audioBase64;

  return (
    <div className="space-y-3">
      {/* Title */}
      {text && (
        <div className="text-sm font-medium text-gray-700">
          🎤 Question Audio
        </div>
      )}

      {/* Player Controls */}
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        {/* Play Button */}
        <button
          onClick={handleToggle}
          disabled={!hasAudio || isLoading}
          className={`h-10 w-10 rounded-lg flex items-center justify-center transition-all ${
            !hasAudio || isLoading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isLoading ? (
            <Loader className="h-5 w-5 animate-spin" />
          ) : isPlaying ? (
            <Pause className="h-5 w-5" />
          ) : (
            <Play className="h-5 w-5" />
          )}
        </button>

        {/* Progress Bar */}
        <div className="flex-1">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={(e) => {
              if (audioRef.current) {
                audioRef.current.currentTime = parseFloat(e.target.value);
                setCurrentTime(parseFloat(e.target.value));
              }
            }}
            className="w-full h-2 bg-gray-300 rounded-lg appearance-none cursor-pointer"
            style={{
              background: `linear-gradient(to right, #2563eb 0%, #2563eb ${
                duration ? (currentTime / duration) * 100 : 0
              }%, #d1d5db ${duration ? (currentTime / duration) * 100 : 0}%, #d1d5db 100%)`,
            }}
          />
        </div>

        {/* Time Display */}
        <div className="text-xs text-gray-600 whitespace-nowrap min-w-max">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>

        {/* Playback Rate */}
        <select
          value={playbackRate}
          onChange={(e) => setPlaybackRate(parseFloat(e.target.value))}
          className="h-8 px-2 text-xs border border-gray-300 rounded bg-white text-gray-700 hover:border-gray-400"
          disabled={!hasAudio}
        >
          <option value={0.5}>0.5x</option>
          <option value={1}>1x</option>
          <option value={1.5}>1.5x</option>
          <option value={2}>2x</option>
        </select>
      </div>

      {/* Hidden Audio Element */}
      <audio
        ref={audioRef}
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
          }
        }}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          onPlayEnd?.();
        }}
        onError={(e) => {
          console.error('Audio playback error:', e);
        }}
      />

      {/* Loading State */}
      {isLoading && (
        <p className="text-xs text-gray-600">🎵 Generating question audio...</p>
      )}

      {!hasAudio && !isLoading && (
        <p className="text-xs text-gray-500">No audio available</p>
      )}
    </div>
  );
}
