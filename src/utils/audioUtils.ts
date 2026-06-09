/**
 * Utility functions for handling audio and video recordings
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import logger from '@/lib/logger';
// Singleton FFmpeg instance
let ffmpegInstance: FFmpeg | null = null;
let ffmpegLoading: Promise<FFmpeg> | null = null;

/**
 * Get or initialize FFmpeg instance (singleton pattern)
 */
const getFFmpeg = async (): Promise<FFmpeg> => {
  if (ffmpegInstance && ffmpegInstance.loaded) {
    return ffmpegInstance;
  }

  if (ffmpegLoading) {
    return ffmpegLoading;
  }

  ffmpegLoading = (async () => {
    // // console.log('🎬 Loading FFmpeg...');
    const ffmpeg = new FFmpeg();

    // Load FFmpeg with CORS-enabled URLs
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    // // console.log('✅ FFmpeg loaded successfully');
    ffmpegInstance = ffmpeg;
    return ffmpeg;
  })();

  return ffmpegLoading;
};


/**
 * Convert WebM video blob to MP4 format
 * Uses FFmpeg.wasm for video transcoding
 */
export const convertWebmToMp4 = async (webmBlob: Blob): Promise<Blob> => {
  try {
    // // console.log('🎬 Converting WebM video to MP4...');
    // // console.log(`📊 Input size: ${(webmBlob.size / 1024 / 1024).toFixed(2)} MB`);

    const ffmpeg = await getFFmpeg();

    // Write input file
    const inputData = await fetchFile(webmBlob);
    await ffmpeg.writeFile('input.webm', inputData);

    // Convert WebM to MP4
    // Using libx264 for video and aac for audio
    await ffmpeg.exec([
      '-i', 'input.webm',
      '-c:v', 'libx264',
      '-preset', 'fast',
      '-crf', '23',
      '-c:a', 'aac',
      '-b:a', '128k',
      '-movflags', '+faststart',
      'output.mp4'
    ]);

    // Read output file
    const outputData = await ffmpeg.readFile('output.mp4');
    // Convert to proper Uint8Array to fix TypeScript compatibility
    const uint8Data = new Uint8Array(outputData as Uint8Array);
    const mp4Blob = new Blob([uint8Data], { type: 'video/mp4' });

    // Cleanup
    await ffmpeg.deleteFile('input.webm');
    await ffmpeg.deleteFile('output.mp4');

    // // console.log(`✅ MP4 conversion complete. Output size: ${(mp4Blob.size / 1024 / 1024).toFixed(2)} MB`);
    return mp4Blob;
  } catch (error) {
    // // console.error('❌ Error converting WebM to MP4:', error);
    throw error;
  }
};

/**
 * Convert WebM audio blob to MP3 format
 * Uses FFmpeg.wasm for audio transcoding (more reliable than lamejs)
 */
export const convertWebmToMp3 = async (webmBlob: Blob): Promise<Blob> => {
  try {
    // // console.log('🔄 Converting WebM to MP3...');
    // // console.log(`📊 Input audio size: ${(webmBlob.size / 1024).toFixed(2)} KB`);

    const ffmpeg = await getFFmpeg();

    // Write input file
    const inputData = await fetchFile(webmBlob);
    await ffmpeg.writeFile('input_audio.webm', inputData);

    // Convert WebM to MP3
    await ffmpeg.exec([
      '-i', 'input_audio.webm',
      '-vn',              // No video
      '-acodec', 'libmp3lame',
      '-b:a', '128k',     // 128kbps bitrate
      '-ar', '44100',     // 44.1kHz sample rate
      'output_audio.mp3'
    ]);

    // Read output file
    const outputData = await ffmpeg.readFile('output_audio.mp3');
    // Convert to proper Uint8Array to fix TypeScript compatibility
    const uint8Data = new Uint8Array(outputData as Uint8Array);
    const mp3Blob = new Blob([uint8Data], { type: 'audio/mp3' });

    // Cleanup
    await ffmpeg.deleteFile('input_audio.webm');
    await ffmpeg.deleteFile('output_audio.mp3');

    // // console.log(`✅ MP3 conversion complete. Size: ${(mp3Blob.size / 1024).toFixed(2)} KB`);
    return mp3Blob;
  } catch (error) {
    // // console.error('❌ Error converting WebM to MP3:', error);
    throw error;
  }
};

/**
 * Convert Blob to Base64 string
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

/**
 * Convert Base64 string back to Blob
 */
export const base64ToBlob = (base64: string): Blob => {
  const parts = base64.split(';base64,');
  const contentType = parts[0].split(':')[1];
  const raw = window.atob(parts[1]);
  const rawLength = raw.length;
  const uInt8Array = new Uint8Array(rawLength);

  for (let i = 0; i < rawLength; ++i) {
    uInt8Array[i] = raw.charCodeAt(i);
  }

  return new Blob([uInt8Array], { type: contentType });
};

/**
 * Get all audio recordings from sessionStorage
 */
export const getAllAudioRecordings = (): { [questionId: string]: string } => {
  try {
    const recordings = sessionStorage.getItem('audio_recordings');
    return recordings ? JSON.parse(recordings) : {};
  } catch {
    // // console.error('Error retrieving audio recordings:', error);
    return {};
  }
};

/**
 * Get a specific audio recording from sessionStorage
 */
export const getAudioRecording = (questionId: string): string | null => {
  try {
    const recordings = getAllAudioRecordings();
    return recordings[questionId] || null;
  } catch {
    // // console.error('Error retrieving audio recording:', error);
    return null;
  }
};

/**
 * Save audio recording to sessionStorage
 */
export const saveAudioRecording = async (
  questionId: string,
  blob: Blob
): Promise<void> => {
  try {
    const base64Audio = await blobToBase64(blob);
    const existingRecordings = getAllAudioRecordings();
    existingRecordings[questionId] = base64Audio;
    sessionStorage.setItem('audio_recordings', JSON.stringify(existingRecordings));
    // // console.log(`✅ Audio saved for question ${questionId}`);
  } catch (error) {
    // // console.error('Error saving audio recording:', error);
    throw error;
  }
};

/**
 * Upload status tracking (in-memory, not sessionStorage)
 */
const uploadStatusMap: Map<string, {
  status: 'pending' | 'uploading' | 'completed' | 'failed';
  error?: string;
  timestamp: number;
}> = new Map();

/**
 * Get upload status for a question
 */
export const getUploadStatus = (questionId: string) => {
  return uploadStatusMap.get(questionId) || { status: 'pending', timestamp: 0 };
};

/**
 * Set upload status for a question
 */
export const setUploadStatus = (
  questionId: string,
  status: 'pending' | 'uploading' | 'completed' | 'failed',
  error?: string
) => {
  uploadStatusMap.set(questionId, {
    status,
    error,
    timestamp: Date.now(),
  });
};

/**
 * Get all upload statuses
 */
export const getAllUploadStatuses = () => {
  const result: Record<string, { status: string; error?: string }> = {};
  uploadStatusMap.forEach((value, key) => {
    result[key] = { status: value.status, error: value.error };
  });
  return result;
};

/**
 * Clear all upload statuses (call when starting new session)
 */
export const clearUploadStatuses = () => {
  uploadStatusMap.clear();
};

/**
 * Count uploads by status
 */
export const getUploadCounts = () => {
  let completed = 0;
  let failed = 0;
  let uploading = 0;
  let pending = 0;

  uploadStatusMap.forEach((value) => {
    switch (value.status) {
      case 'completed': completed++; break;
      case 'failed': failed++; break;
      case 'uploading': uploading++; break;
      default: pending++; break;
    }
  });

  return { completed, failed, uploading, pending, total: uploadStatusMap.size };
};


/**
 * Convert Blob to File object (for FormData)
 */
export const blobToFile = (blob: Blob, fileName: string): File => {
  return new File([blob], fileName, { type: blob.type });
};

/**
 * Prepare audio recording for API submission
 * Returns FormData with the audio file
 */
export const prepareAudioForAPI = (
  questionId: string,
  blob: Blob,
  additionalData?: { [key: string]: unknown }
): FormData => {
  const formData = new FormData();

  // Add audio file
  const audioFile = blobToFile(blob, `audio_${questionId}.webm`);
  formData.append('audio', audioFile);

  // Add question ID
  formData.append('question_id', questionId);

  // Add any additional data
  if (additionalData) {
    Object.keys(additionalData).forEach((key) => {
      formData.append(key, String(additionalData[key]));
    });
  }

  return formData;
};

/**
 * Clear all audio recordings from sessionStorage
 */
export const clearAllAudioRecordings = (): void => {
  try {
    sessionStorage.removeItem('audio_recordings');
    // // console.log('✅ All audio recordings cleared');
  } catch {
    // // console.error('Error clearing audio recordings:', error);
  }
};

/**
 * Get audio recordings count
 */
export const getAudioRecordingsCount = (): number => {
  try {
    const recordings = getAllAudioRecordings();
    return Object.keys(recordings).length;
  } catch {
    // // console.error('Error getting audio recordings count:', error);
    return 0;
  }
};

/**
 * Check if a question has an audio recording
 */
export const hasAudioRecording = (questionId: string): boolean => {
  const recording = getAudioRecording(questionId);
  return recording !== null;
};

/**
 * Text-to-Speech: Convert text to speech with foreign accent
 * Uses Web Speech API with different voices/accents
 */
export const textToSpeech = (text: string, options?: {
  rate?: number;
  pitch?: number;
  volume?: number;
  voiceName?: string;
  lang?: string;
}): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!window.speechSynthesis) {
      reject(new Error('Speech synthesis not supported'));
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);

    // Set voice properties
    utterance.rate = options?.rate ?? 0.9; // Slightly slower for clarity
    utterance.pitch = options?.pitch ?? 1.0;
    utterance.volume = options?.volume ?? 1.0;
    utterance.lang = options?.lang ?? 'en-GB'; // British English for foreign accent

    // Try to use a specific voice if available
    const voices = window.speechSynthesis.getVoices();

    if (voices.length > 0) {
      // Try to find a foreign accent voice (British, Australian, Indian, etc.)
      const foreignVoice = voices.find(voice =>
        voice.lang.includes('en-GB') || // British
        voice.lang.includes('en-AU') || // Australian
        voice.lang.includes('en-IN') || // Indian
        voice.lang.includes('en-IE') || // Irish
        voice.name.toLowerCase().includes('british') ||
        voice.name.toLowerCase().includes('indian') ||
        voice.name.toLowerCase().includes('australian')
      );

      if (foreignVoice) {
        utterance.voice = foreignVoice;
        // // console.log('🔊 Using voice:', foreignVoice.name, foreignVoice.lang);
      } else if (options?.voiceName) {
        const selectedVoice = voices.find(v => v.name === options.voiceName);
        if (selectedVoice) utterance.voice = selectedVoice;
      }
    }

    utterance.onend = () => resolve();
    utterance.onerror = (error) => reject(error);

    window.speechSynthesis.speak(utterance);
  });
};

/**
 * Get available voices for text-to-speech
 */
export const getAvailableVoices = (): Promise<SpeechSynthesisVoice[]> => {
  return new Promise((resolve) => {
    if (!window.speechSynthesis) {
      resolve([]);
      return;
    }

    let voices = window.speechSynthesis.getVoices();

    if (voices.length > 0) {
      resolve(voices);
    } else {
      // Voices might load asynchronously
      window.speechSynthesis.onvoiceschanged = () => {
        voices = window.speechSynthesis.getVoices();
        resolve(voices);
      };
    }
  });
};

/**
 * Stop any ongoing speech synthesis
 */
export const stopSpeech = (): void => {
  if (window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Check if speech synthesis is supported
 */
export const isSpeechSynthesisSupported = (): boolean => {
  return 'speechSynthesis' in window;
};

/**
 * Save text answer to sessionStorage (for MCQ sections like jumbled sentences)
 */
export const saveTextAnswer = (questionId: string, answerText: string): void => {
  try {
    const existingAnswers = sessionStorage.getItem('text_answers');
    const answers = existingAnswers ? JSON.parse(existingAnswers) : {};
    answers[questionId] = answerText;
    sessionStorage.setItem('text_answers', JSON.stringify(answers));
    // // console.log(`✅ Text answer saved for question ${questionId}:`, answerText);
  } catch {
    // // console.error('Error saving text answer:', error);
  }
};

/**
 * Get text answer from sessionStorage
 */
export const getTextAnswer = (questionId: string): string | null => {
  try {
    const answers = sessionStorage.getItem('text_answers');
    if (!answers) return null;
    const parsedAnswers = JSON.parse(answers);
    return parsedAnswers[questionId] || null;
  } catch {
    // // console.error('Error getting text answer:', error);
    return null;
  }
};

/**
 * Get all text answers from sessionStorage
 */
export const getAllTextAnswers = (): { [questionId: string]: string } => {
  try {
    const answers = sessionStorage.getItem('text_answers');
    return answers ? JSON.parse(answers) : {};
  } catch {
    // // console.error('Error getting all text answers:', error);
    return {};
  }
};


/**
 * Create a minimal silent audio blob as fallback
 */
function createMinimalAudioBlob(): Blob {
  // Create a minimal WAV file (1 second of silence at 44.1kHz, mono, 16-bit)
  const sampleRate = 44100;
  const numChannels = 1;
  const bitsPerSample = 16;
  const numSamples = sampleRate; // 1 second
  const dataSize = numSamples * numChannels * (bitsPerSample / 8);

  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * numChannels * (bitsPerSample / 8), true);
  view.setUint16(32, numChannels * (bitsPerSample / 8), true);
  view.setUint16(34, bitsPerSample, true);
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Data is already zeros (silence)

  // // console.log('✅ Created minimal silent audio file');
  return new Blob([buffer], { type: 'audio/wav' });
}

/**
 * Audio validation utilities for communication assessment
 */

export interface AudioValidationResult {
  isValid: boolean;
  duration: number;
  hasSound: boolean;
  error?: string;
  warning?: string;
}

/**
 * Validates an audio blob for quality and duration
 */
export async function validateAudioBlob(
  blob: Blob
): Promise<AudioValidationResult> {
  try {
    // Check if blob exists and has content
    if (!blob || blob.size === 0) {
      return {
        isValid: false,
        duration: 0,
        hasSound: false,
        error: 'No audio data found',
      };
    }

    // Check minimum file size (very small files are likely silent)
    const minSizeKB = 2; // At least 2KB for valid audio
    const sizeKB = blob.size / 1024;
    if (sizeKB < minSizeKB) {
      return {
        isValid: false,
        duration: 0,
        hasSound: false,
        error: `Audio file too small (${sizeKB.toFixed(1)}KB). Please record again with clear speech.`,
      };
    }

    // Get audio duration and check for sound
    const audioData = await analyzeAudioBlob(blob);

    // Check minimum duration (at least 0.5 seconds)
    if (audioData.duration < 0.5) {
      return {
        isValid: false,
        duration: audioData.duration,
        hasSound: audioData.hasSound,
        error: `Recording too short (${audioData.duration.toFixed(1)}s). Please speak for at least 1 second.`,
      };
    }

    // Check if audio contains actual sound
    if (!audioData.hasSound) {
      return {
        isValid: false,
        duration: audioData.duration,
        hasSound: false,
        error: 'No speech detected. Please ensure your microphone is working and speak clearly.',
      };
    }

    // Warn if audio is very short (but still valid)
    if (audioData.duration < 1.5) {
      return {
        isValid: true,
        duration: audioData.duration,
        hasSound: true,
        warning: `Recording is quite short (${audioData.duration.toFixed(1)}s). Make sure you spoke your full answer.`,
      };
    }

    // Valid audio
    return {
      isValid: true,
      duration: audioData.duration,
      hasSound: true,
    };
  } catch (error) {
    console.error('Error validating audio:', error);
    return {
      isValid: false,
      duration: 0,
      hasSound: false,
      error: 'Failed to validate audio. Please try recording again.',
    };
  }
}

/**
 * Analyzes audio blob to get duration and detect sound
 */
async function analyzeAudioBlob(
  blob: Blob
): Promise<{ duration: number; hasSound: boolean }> {
  return new Promise((resolve, reject) => {
    try {
      const audioContext = new AudioContext();
      const fileReader = new FileReader();

      fileReader.onload = async (event) => {
        try {
          const arrayBuffer = event.target?.result as ArrayBuffer;
          const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

          const duration = audioBuffer.duration;
          const hasSound = detectSound(audioBuffer);

          audioContext.close();
          resolve({ duration, hasSound });
        } catch (error) {
          console.error('Error decoding audio:', error);
          // If we can't decode, assume it might be valid (don't fail unnecessarily)
          resolve({ duration: 1.0, hasSound: true });
        }
      };

      fileReader.onerror = () => {
        reject(new Error('Failed to read audio file'));
      };

      fileReader.readAsArrayBuffer(blob);
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Detects if audio buffer contains actual sound (not silence)
 */
function detectSound(audioBuffer: AudioBuffer): boolean {
  const channelData = audioBuffer.getChannelData(0); // Get first channel
  const threshold = 0.01; // Minimum amplitude to consider as sound

  // Check multiple points throughout the audio
  const checkPoints = 10;
  const segmentLength = Math.floor(channelData.length / checkPoints);
  let soundDetectedCount = 0;

  for (let i = 0; i < checkPoints; i++) {
    const startIdx = i * segmentLength;
    const endIdx = Math.min(startIdx + segmentLength, channelData.length);

    // Calculate RMS (root mean square) for this segment
    let sumSquares = 0;
    for (let j = startIdx; j < endIdx; j++) {
      sumSquares += channelData[j] * channelData[j];
    }
    const rms = Math.sqrt(sumSquares / (endIdx - startIdx));

    // If RMS is above threshold, sound was detected in this segment
    if (rms > threshold) {
      soundDetectedCount++;
    }
  }

  // Consider audio to have sound if at least 20% of segments have sound
  const soundRatio = soundDetectedCount / checkPoints;
  return soundRatio >= 0.2;
}

/**
 * Formats audio duration for display
 */
export function formatDuration(seconds: number): string {
  if (seconds < 1) {
    return `${(seconds * 1000).toFixed(0)}ms`;
  }
  return `${seconds.toFixed(1)}s`;
}

/**
 * Formats audio file size for display
 */
export function formatFileSize(bytes: number): string {
  const kb = bytes / 1024;
  if (kb < 1024) {
    return `${kb.toFixed(1)} KB`;
  }
  const mb = kb / 1024;
  return `${mb.toFixed(2)} MB`;
}
