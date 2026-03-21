'use client';

import { useState, useEffect } from 'react';
import { textToSpeech, getAvailableVoices } from '@/utils/audioUtils';
import { Play } from 'lucide-react';
import logger from '@/lib/logger';

interface TextToSpeechPlayerProps {
  text: string;
  autoPlay?: boolean;
  onAudioEnd?: () => void; // Callback when audio finishes playing
}

export default function TextToSpeechPlayer({
  text,
  onAudioEnd
}: TextToSpeechPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);

  useEffect(() => {
    // Load voices and select a foreign accent voice
    const loadVoices = async () => {
      const voices = await getAvailableVoices();

      // Filter foreign accent voices (British, Australian, Indian, Irish)
      const foreignVoices = voices.filter(voice =>
        voice.lang.includes('en-GB') || // British
        voice.lang.includes('en-AU') || // Australian
        voice.lang.includes('en-IN') || // Indian
        voice.lang.includes('en-IE') || // Irish
        voice.name.toLowerCase().includes('british') ||
        voice.name.toLowerCase().includes('indian') ||
        voice.name.toLowerCase().includes('australian')
      );

      // Select the first foreign voice or fallback to first available
      const voiceToUse = foreignVoices.length > 0 ? foreignVoices[0] : voices[0];

      if (voiceToUse) {
        setSelectedVoice(voiceToUse);
        logger.info('Selected voice:', voiceToUse.name, voiceToUse.lang);
      }
    };

    loadVoices();
  }, []);

  // Remove auto-play - user must click to play
  // useEffect(() => {
  //   // Auto-play once when text changes (only if it hasn't played yet)
  //   if (autoPlay && text && selectedVoice && !hasPlayedOnce) {
  //     handlePlay();
  //   }
  //   // eslint-disable-next-line react-hooks/exhaustive-deps
  // }, [text, selectedVoice]); // Only trigger when text or voice changes

  // Reset hasPlayedOnce when text changes (new question)
  useEffect(() => {
    setHasPlayedOnce(false);
  }, [text]);

  const handlePlay = async () => {
    if (!text || hasPlayedOnce) {
      setError('Audio can only be played once');
      return;
    }

    setError(null);
    setIsPlaying(true);

    try {
      await textToSpeech(text, {
        rate: 0.85, // Slightly slower for better clarity
        pitch: 1.0,
        volume: 1.0,
        voiceName: selectedVoice?.name,
        lang: selectedVoice?.lang || 'en-GB',
      });
      setIsPlaying(false);
      setHasPlayedOnce(true); // Mark as played after completion
      onAudioEnd?.(); // Notify parent that audio has finished
    } catch (err) {
      logger.error('TTS Error:', err);
      setError('Failed to play audio');
      setIsPlaying(false);
    }
  };

  return (
    <div className="w-full">
      {/* Audio Player Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5">
        {/* Waveform Animation (when playing) */}
        {isPlaying && (
          <div className="flex items-center justify-center gap-1 mb-4 h-8">
            {[...Array(16)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-[#2557a7] rounded-full animate-pulse"
                style={{
                  height: `${Math.random() * 24 + 8}px`,
                  animationDelay: `${i * 0.08}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handlePlay}
            disabled={!text || hasPlayedOnce || isPlaying}
            className={`flex items-center gap-2.5 px-6 py-2.5 rounded-xl font-semibold text-sm transition-colors ${
              hasPlayedOnce
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : isPlaying
                  ? 'bg-[#2557a7]/80 text-white cursor-not-allowed'
                  : 'bg-[#2557a7] hover:bg-[#1e4a94] text-white'
            } disabled:cursor-not-allowed`}
          >
            <Play className="w-4 h-4 fill-current" />
            <span>
              {hasPlayedOnce
                ? 'Audio Already Played'
                : isPlaying
                  ? 'Playing Audio…'
                  : 'Play Audio'
              }
            </span>
          </button>
        </div>

        <p className="text-xs text-gray-400 text-center mt-4">
          Click the button to play audio. It can only be played once.
        </p>

        {/* Error Message */}
        {error && (
          <div className="mt-3 px-4 py-2.5 bg-red-50 border border-red-200 rounded-xl">
            <p className="text-sm text-red-600 text-center">{error}</p>
          </div>
        )}
      </div>

      {/* Instructions */}
      {/* <div className="mt-4 p-4 bg-amber-50 border-l-4 border-amber-400 rounded">
        <p className="text-sm text-gray-700 flex items-start gap-2">
          <span className="text-amber-600">⚠️</span>
          <span className="font-semibold">
            Click &ldquo;Play Audio&rdquo; button to listen. You can play it ONLY ONCE. Listen carefully!
          </span>
        </p>
      </div> */}
    </div>
  );
}
