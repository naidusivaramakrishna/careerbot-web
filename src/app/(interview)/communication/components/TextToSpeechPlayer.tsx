'use client';

import { useState, useEffect } from 'react';
import { textToSpeech, stopSpeech, getAvailableVoices } from '@/utils/audioUtils';
import { Play, Square, Volume2 } from 'lucide-react';

interface TextToSpeechPlayerProps {
  text: string;
  autoPlay?: boolean;
}

export default function TextToSpeechPlayer({
  text,
  autoPlay = false
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
        console.log('🔊 Selected voice:', voiceToUse.name, voiceToUse.lang);
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
    } catch (err) {
      console.error('TTS Error:', err);
      setError('Failed to play audio');
      setIsPlaying(false);
    }
  };

  const handleStop = () => {
    stopSpeech();
    setIsPlaying(false);
    setHasPlayedOnce(true); // Mark as played even if stopped mid-way
  };

  return (
    <div className="w-full">
      {/* Audio Player Card */}
      <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 rounded-2xl p-6 border border-indigo-100 shadow-sm">
        {/* Waveform Animation (when playing) */}
        {isPlaying && (
          <div className="flex items-center justify-center gap-1 mb-4">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="w-1 bg-indigo-500 rounded-full animate-pulse"
                style={{
                  height: `${Math.random() * 40 + 10}px`,
                  animationDelay: `${i * 0.1}s`,
                }}
              />
            ))}
          </div>
        )}

        {/* Control Buttons */}
        <div className="flex items-center justify-center gap-4">
          {!isPlaying ? (
            <button
              onClick={handlePlay}
              disabled={!text || hasPlayedOnce}
              className={`group flex items-center gap-3 px-6 py-3 rounded-full font-semibold shadow-md transition-all ${
                hasPlayedOnce
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
                  : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-lg'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <Play className="w-5 h-5 fill-white" />
              <span>{hasPlayedOnce ? 'Audio Already Played' : 'Play Audio'}</span>
            </button>
          ) : (
            <button
              onClick={handleStop}
              className="group flex items-center gap-3 px-6 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold shadow-md hover:shadow-lg transition-all animate-pulse"
            >
              <Square className="w-5 h-5 fill-white" />
              <span>Stop</span>
            </button>
          )}

          {/* Volume Indicator */}
          {/* <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-full shadow-sm">
            <Volume2 className="w-5 h-5 text-indigo-600" />
            <span className="text-sm font-medium text-gray-700">
              {selectedVoice ? selectedVoice.name.split(' ')[0] : 'Default'}
            </span>
          </div> */}
        </div>

        {/* Voice Info */}
        {/* {selectedVoice && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Voice: {selectedVoice.name} ({selectedVoice.lang})
            </p>
          </div>
        )} */}
        <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Click the button to play audio. It can only be played once.
            </p>
          </div>

        {/* Error Message */}
        {error && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
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
