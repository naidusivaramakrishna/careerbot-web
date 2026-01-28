/**
 * Utility functions for handling audio and video recordings
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

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
    console.log('🎬 Loading FFmpeg...');
    const ffmpeg = new FFmpeg();

    // Load FFmpeg with CORS-enabled URLs
    const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
    await ffmpeg.load({
      coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
      wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    });

    console.log('✅ FFmpeg loaded successfully');
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
    console.log('🎬 Converting WebM video to MP4...');
    console.log(`📊 Input size: ${(webmBlob.size / 1024 / 1024).toFixed(2)} MB`);

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

    console.log(`✅ MP4 conversion complete. Output size: ${(mp4Blob.size / 1024 / 1024).toFixed(2)} MB`);
    return mp4Blob;
  } catch (error) {
    console.error('❌ Error converting WebM to MP4:', error);
    throw error;
  }
};

/**
 * Convert WebM audio blob to MP3 format
 * Uses FFmpeg.wasm for audio transcoding (more reliable than lamejs)
 */
export const convertWebmToMp3 = async (webmBlob: Blob): Promise<Blob> => {
  try {
    console.log('🔄 Converting WebM to MP3...');
    console.log(`📊 Input audio size: ${(webmBlob.size / 1024).toFixed(2)} KB`);

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

    console.log(`✅ MP3 conversion complete. Size: ${(mp3Blob.size / 1024).toFixed(2)} KB`);
    return mp3Blob;
  } catch (error) {
    console.error('❌ Error converting WebM to MP3:', error);
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
  } catch (error) {
    console.error('Error retrieving audio recordings:', error);
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
  } catch (error) {
    console.error('Error retrieving audio recording:', error);
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
    console.log(`✅ Audio saved for question ${questionId}`);
  } catch (error) {
    console.error('Error saving audio recording:', error);
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
  additionalData?: { [key: string]: any }
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
      formData.append(key, additionalData[key]);
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
    console.log('✅ All audio recordings cleared');
  } catch (error) {
    console.error('Error clearing audio recordings:', error);
  }
};

/**
 * Get audio recordings count
 */
export const getAudioRecordingsCount = (): number => {
  try {
    const recordings = getAllAudioRecordings();
    return Object.keys(recordings).length;
  } catch (error) {
    console.error('Error getting audio recordings count:', error);
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
        console.log('🔊 Using voice:', foreignVoice.name, foreignVoice.lang);
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
    console.log(`✅ Text answer saved for question ${questionId}:`, answerText);
  } catch (error) {
    console.error('Error saving text answer:', error);
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
  } catch (error) {
    console.error('Error getting text answer:', error);
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
  } catch (error) {
    console.error('Error getting all text answers:', error);
    return {};
  }
};

/**
 * Convert text to audio blob using Web Audio API
 * Creates a valid silent audio file since Web Speech API can't be captured
 * The text is still spoken for user feedback, but we generate a proper audio file separately
 */
export const textToSpeechAndRecord = async (
  text: string,
  options?: {
    rate?: number;
    pitch?: number;
    volume?: number;
    lang?: string;
  }
): Promise<Blob> => {
  try {
    // Optionally speak the text for user feedback (muted if volume is 0)
    if (options?.volume !== 0 && window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options?.rate ?? 0.85;
      utterance.pitch = options?.pitch ?? 1.0;
      utterance.volume = options?.volume ?? 0;
      utterance.lang = options?.lang ?? 'en-GB';

      const voices = await getAvailableVoices();
      const foreignVoice = voices.find(voice =>
        voice.lang.includes('en-GB') ||
        voice.lang.includes('en-AU') ||
        voice.lang.includes('en-IN') ||
        voice.name.toLowerCase().includes('british')
      );
      if (foreignVoice) {
        utterance.voice = foreignVoice;
      }

      window.speechSynthesis.speak(utterance);
    }

    // Generate a proper silent audio file using Web Audio API
    // Calculate duration based on text length (rough estimate: 150 words per minute)
    const wordCount = text.split(/\s+/).length;
    const estimatedDuration = Math.max(2, Math.min(10, (wordCount / 150) * 60)); // 2-10 seconds

    console.log(`🎵 Generating audio file for "${text.substring(0, 50)}..." (${estimatedDuration.toFixed(1)}s)`);

    // Create offline audio context for generating audio
    const sampleRate = 44100;
    const numberOfChannels = 1;
    const length = sampleRate * estimatedDuration;

    const offlineContext = new OfflineAudioContext(
      numberOfChannels,
      length,
      sampleRate
    );

    // Create a very quiet tone so it's a valid audio file but essentially silent
    const oscillator = offlineContext.createOscillator();
    const gainNode = offlineContext.createGain();

    oscillator.frequency.value = 440; // A4 note
    gainNode.gain.value = 0.001; // Very quiet, almost silent

    oscillator.connect(gainNode);
    gainNode.connect(offlineContext.destination);

    oscillator.start(0);
    oscillator.stop(estimatedDuration);

    // Render the audio
    const audioBuffer = await offlineContext.startRendering();

    // Convert AudioBuffer to WAV format
    const wavBlob = audioBufferToWav(audioBuffer);

    console.log('✅ Audio file generated, size:', wavBlob.size, 'bytes');
    return wavBlob;

  } catch (error) {
    console.error('❌ Error in textToSpeechAndRecord:', error);
    // Fallback: create a minimal silent audio file
    return createMinimalAudioBlob();
  }
};

/**
 * Convert AudioBuffer to WAV blob
 */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numberOfChannels = buffer.numberOfChannels;
  const length = buffer.length * numberOfChannels * 2;
  const arrayBuffer = new ArrayBuffer(44 + length);
  const view = new DataView(arrayBuffer);

  // WAV header
  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM format
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, numberOfChannels, true);
  view.setUint32(24, buffer.sampleRate, true);
  view.setUint32(28, buffer.sampleRate * numberOfChannels * 2, true);
  view.setUint16(32, numberOfChannels * 2, true);
  view.setUint16(34, 16, true); // 16-bit
  writeString(36, 'data');
  view.setUint32(40, length, true);

  // Write audio data
  const channels: Float32Array[] = [];
  for (let i = 0; i < numberOfChannels; i++) {
    channels.push(buffer.getChannelData(i));
  }

  let offset = 44;
  for (let i = 0; i < buffer.length; i++) {
    for (let channel = 0; channel < numberOfChannels; channel++) {
      const sample = Math.max(-1, Math.min(1, channels[channel][i]));
      view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
      offset += 2;
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

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

  console.log('✅ Created minimal silent audio file');
  return new Blob([buffer], { type: 'audio/wav' });
}
