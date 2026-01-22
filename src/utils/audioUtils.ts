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
