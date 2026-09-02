/**
 * Type declarations for meSpeak.js
 * meSpeak is a 100% client-side text-to-speech library
 */

declare module 'mespeak' {
  interface MeSpeakOptions {
    amplitude?: number;
    pitch?: number;
    speed?: number;
    voice?: string;
    wordgap?: number;
    variant?: string;
    linebreak?: number;
    capitals?: number;
    nostop?: boolean;
    ssml?: boolean;
    utf16?: boolean;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface MeSpeakVoice {
    id: string;
    name: string;
  }

  export function loadConfig(url: string): void;
  export function loadVoice(url: string): void;
  export function speak(text: string, options?: MeSpeakOptions, callback?: () => void): void;
  export function canPlay(): boolean;
  export function isConfigLoaded(): boolean;
  export function isVoiceLoaded(): boolean;
  export function resetQueue(): void;
  export function stop(): void;
  export function getDefaultVoice(): string;
  export function setDefaultVoice(voice: string): void;
  export function getVolume(): number;
  export function setVolume(volume: number): void;

  // Most important: generates WAV audio buffer
  export function speak(
    text: string,
    options?: MeSpeakOptions & { rawdata?: 'buffer' | 'base64' | 'mime' | 'data-url' }
  ): Uint8Array | string | null;

  // Default export
  const meSpeak: {
    loadConfig: typeof loadConfig;
    loadVoice: typeof loadVoice;
    speak: typeof speak;
    canPlay: typeof canPlay;
    isConfigLoaded: typeof isConfigLoaded;
    isVoiceLoaded: typeof isVoiceLoaded;
    resetQueue: typeof resetQueue;
    stop: typeof stop;
    getDefaultVoice: typeof getDefaultVoice;
    setDefaultVoice: typeof setDefaultVoice;
    getVolume: typeof getVolume;
    setVolume: typeof setVolume;
  };

  export default meSpeak;
}
