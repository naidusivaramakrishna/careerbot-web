/**
 * Utility functions for handling audio recordings
 */

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
 * Convert text to speech and capture as audio blob
 * This function speaks the text and records it as an audio file
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
  return new Promise(async (resolve, reject) => {
    try {
      // Check if speech synthesis is supported
      if (!window.speechSynthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Get available voices
      const voices = await getAvailableVoices();

      // Find a foreign accent voice
      const foreignVoice = voices.find(voice =>
        voice.lang.includes('en-GB') || // British
        voice.lang.includes('en-AU') || // Australian
        voice.lang.includes('en-IN') || // Indian
        voice.lang.includes('en-IE') || // Irish
        voice.name.toLowerCase().includes('british') ||
        voice.name.toLowerCase().includes('indian') ||
        voice.name.toLowerCase().includes('australian')
      );

      // Create audio context for recording
      const audioContext = new AudioContext();
      const destination = audioContext.createMediaStreamDestination();

      // Create utterance
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = options?.rate ?? 0.85;
      utterance.pitch = options?.pitch ?? 1.0;
      utterance.volume = options?.volume ?? 1.0;
      utterance.lang = options?.lang ?? 'en-GB';

      if (foreignVoice) {
        utterance.voice = foreignVoice;
        console.log('🔊 Recording with voice:', foreignVoice.name);
      }

      // Start recording
      const mediaRecorder = new MediaRecorder(destination.stream);
      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        audioContext.close();
        console.log('✅ Audio recording completed, blob size:', audioBlob.size);
        resolve(audioBlob);
      };

      // Handle speech synthesis events
      utterance.onend = () => {
        setTimeout(() => {
          mediaRecorder.stop();
        }, 100); // Small delay to ensure all audio is captured
      };

      utterance.onerror = (error) => {
        mediaRecorder.stop();
        audioContext.close();
        reject(error);
      };

      // Start recording and speaking
      mediaRecorder.start();
      window.speechSynthesis.speak(utterance);

    } catch (error) {
      console.error('Error in textToSpeechAndRecord:', error);
      reject(error);
    }
  });
};
