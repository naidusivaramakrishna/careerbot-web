import { httpClient } from '@/lib/http';
import logger from '@/lib/logger';

// ==================== INTERFACES ====================
export interface GenerateTestRequest {
  email_id: string;
  difficulty: string;
  do_not_repeat_list?: string[];
}

export interface GenerateTestResponse {
  test_id: string;
  questions: any[];
  message?: string;
  // Add other response fields as per your API response
}

export interface StartSessionRequest {
  test_id: string;
}

export interface StartSessionResponse {
  session_id: string;
  message?: string;
  started_at?: string;
  // Add other response fields as per your API response
}

export interface CurrentQuestionResponse {
  question_id: string;
  question_text: string;
  question_type: string;
  section_name: string;
  section_id?: number;
  question_number?: number;
  total_questions?: number;
  options?: string[];
  audio_url?: string;
  time_limit?: number;
  is_last_question?: boolean;
  is_last_section?: boolean;
  story_text?: string; // For story listening section
  expected_text?: string; // Expected answer for generating MCQ options
  // Add other response fields as per your API response
}

export interface NextQuestionRequest {
  session_id: string;
  question_id: string;  // Previous question ID required by API
}

export interface NextQuestionResponse {
  question_id: string;
  question_text: string;
  question_type: string;
  section_name: string;
  section_id?: number;
  question_number?: number;
  total_questions?: number;
  options?: string[];
  audio_url?: string;
  time_limit?: number;
  is_last_question?: boolean;
  is_last_section?: boolean;
  completed?: boolean;
  message?: string;
  story_text?: string; // For story listening section
  expected_text?: string; // Expected answer for generating MCQ options
  // Add other response fields as per your API response
}

export interface VideoEvaluationRequest {
  email_id: string;
  test_id: string;
  file: File | Blob;
}

export interface VideoEvaluationResponse {
  evaluation_id: string;
  status: string;
  message?: string;
  // Add other response fields as per your API response
}

export interface FinalReportRequest {
  email_id: string;
  test_id: string;
  video_evaluation_id: string;
  audio_evaluation_id: string;
  video_evaluation?: {
    [key: string]: any;
  };
  audio_evaluation?: {
    [key: string]: any;
  };
}

export interface FinalReportResponse {
  report_id?: string;
  status: string;
  message?: string;
  // Add other response fields as per your API response
}

// ==================== COMMUNICATION API FUNCTIONS ====================

/**
 * Generate AI assessment test
 */
export const generateTest = async (data: GenerateTestRequest): Promise<GenerateTestResponse> => {
  try {
    const response = await httpClient.post<GenerateTestResponse>('/ai-assessment/generate-test', data);
    return response.data;
  } catch (error) {
    logger.error('Error generating test:', error);
    throw error;
  }
};

/**
 * Start AI assessment session
 */
export const startSession = async (data: StartSessionRequest): Promise<StartSessionResponse> => {
  try {
    logger.debug('📤 Calling startSession API with test_id:', data.test_id);
    logger.debug('📤 Full URL:', `/ai-assessment/sessions/start?test_id=${data.test_id}`);

    const response = await httpClient.post<StartSessionResponse>(
      `/ai-assessment/sessions/start?test_id=${data.test_id}`,
      {}
    );

    logger.debug('🔍 ===== RAW API RESPONSE =====');
    logger.debug('🔍 Full response object:', JSON.stringify(response, null, 2));
    logger.debug('🔍 response.status:', response.status);
    logger.debug('🔍 response.statusText:', response.statusText);
    logger.debug('🔍 response.data:', response.data);
    logger.debug('🔍 response.data (stringified):', JSON.stringify(response.data, null, 2));
    logger.debug('🔍 Response data type:', typeof response.data);
    logger.debug('🔍 Response data keys:', response.data ? Object.keys(response.data) : 'null/undefined');
    logger.debug('🔍 ===== END RAW RESPONSE =====');

    // Check for different possible response structures
    const responseData: any = response.data;

    // Try to find session_id in different possible locations
    const sessionId = responseData?.session_id ||
                    responseData?.sessionId ||
                    responseData?.session?.session_id ||  // API returns it here!
                    responseData?.session?.sessionId ||
                    responseData?.session?.id ||
                    responseData?.data?.session_id ||
                    responseData?.data?.sessionId ||
                    responseData?.id;

    logger.debug('🔍 Extracted session_id:', sessionId);
    logger.debug('🔍 All possible session_id locations checked:', {
      'responseData.session_id': responseData?.session_id,
      'responseData.sessionId': responseData?.sessionId,
      'responseData.session.session_id': responseData?.session?.session_id,
      'responseData.session.sessionId': responseData?.session?.sessionId,
      'responseData.session.id': responseData?.session?.id,
      'responseData.data.session_id': responseData?.data?.session_id,
      'responseData.data.sessionId': responseData?.data?.sessionId,
      'responseData.id': responseData?.id
    });

    if (sessionId) {
      return {
        session_id: sessionId,
        message: responseData?.message,
        started_at: responseData?.started_at || responseData?.startedAt || responseData?.session?.started_at
      };
    }

    // If still no session_id found, return the original response data
    logger.warn('⚠️ No session_id found, returning original response.data');
    return response.data;
  } catch (error) {
    logger.error('❌ Error starting session:', error);
    throw error;
  }
};

/**
 * Get current question for the session
 */
export const getCurrentQuestion = async (sessionId: string): Promise<CurrentQuestionResponse> => {
  try {
    const response = await httpClient.get<any>(`/ai-assessment/sessions/${sessionId}/current-question`);
    logger.debug('🔍 getCurrentQuestion response:', response.data);

    // The API returns the question nested in current_question
    const responseData: any = response.data;

    if (responseData?.current_question) {
      logger.debug('✅ Extracting current_question from response');

      // ✅ Calculate global question_number from progress.questions_completed
      const questionsCompleted = responseData?.progress?.questions_completed || 0;
      const globalQuestionNumber = questionsCompleted + 1; // Current question = completed + 1

      logger.debug(`📊 Global question number calculated: ${globalQuestionNumber} (from questions_completed: ${questionsCompleted})`);

      return {
        ...responseData.current_question,
        question_number: globalQuestionNumber, // ✅ Add global question number
        total_questions: responseData?.progress?.total_questions || responseData.current_question.total_questions,
        completed: responseData.completed,
        session_id: responseData.session_id
      };
    }

    // Fallback to returning the entire response if structure is different
    logger.warn('⚠️ current_question not found in expected location, returning full response.data');
    return response.data;
  } catch (error) {
    logger.error('Error getting current question:', error);
    throw error;
  }
};

/**
 * Complete the assessment session
 * Marks the session as complete after all questions are answered
 */
export const completeSession = async (sessionId: string): Promise<{ status: string; message?: string }> => {
  try {
    logger.debug('✅ Completing session:', sessionId);

    const response = await httpClient.post<{ status: string; message?: string }>(
      `/ai-assessment/sessions/${sessionId}/complete`,
      {}
    );

    logger.info('✅ Session completed successfully:', response.data);
    return response.data;
  } catch (error) {
    logger.error('❌ Error completing session:', error);
    throw error;
  }
};

/**
 * Get next question for the session
 */

export const getNextQuestion = async (data: NextQuestionRequest) => {
  try {
    logger.debug('📤 Calling next-question API');
    logger.debug('session_id:', data.session_id);
    logger.debug('previous question_id:', data.question_id);

    // const response = await httpClient.post<any>(
    //   `/ai-assessment/sessions/${data.session_id}/next-question?question_id=${data.question_id}`,
    //   {}  // question_id passed as query parameter
    // );
    const response = await httpClient.post<any>(
      `/ai-assessment/sessions/${data.session_id}/next-question?completed_question_id=${data.question_id}`,
      {}  // question_id passed as query parameter
    );

    logger.debug('🔍 RAW next-question response:', response.data);

    const responseData = response.data;

    // If assessment is completed, return completion status
    if (responseData.completed === true) {
      logger.info('✅ Assessment completed!');
      return {
        completed: true,
        message: responseData.message || 'All questions completed',
        progress: responseData.progress,
      } as unknown as CurrentQuestionResponse;
    }

    // Otherwise, expect current_question
    if (!responseData?.current_question) {
      throw new Error('current_question missing in next-question response');
    }

    // ✅ FLATTEN THE RESPONSE (THIS IS THE KEY FIX)
    return {
      ...responseData.current_question,
      completed: responseData.completed,
      is_last_question:
        responseData.current_question.is_last_question ??
        responseData.is_last_question,
      is_last_section:
        responseData.current_question.is_last_section ??
        responseData.is_last_section,
    };
  } catch (error) {
    logger.error('❌ getNextQuestion failed:', error);
    throw error;
  }
};



/**
 * Submit video for evaluation
 * - email_id, test_id, and file are all sent as multipart/form-data fields
 * - video file is sent as-is (no conversion)
 * - Uses httpClient for automatic correlation ID tracking
 */
export const submitVideoEvaluation = async (data: VideoEvaluationRequest): Promise<VideoEvaluationResponse> => {
  try {
    logger.debug('🎬 Processing video for submission...');
    logger.debug(`📊 Video size: ${(data.file.size / 1024 / 1024).toFixed(2)} MB`);
    logger.debug(`📊 Video type: ${data.file.type}`);
    logger.debug(`📊 Email ID: ${data.email_id}`);
    logger.debug(`📊 Test ID: ${data.test_id}`);

    const formData = new FormData();
    formData.append('email_id', data.email_id);
    formData.append('test_id', data.test_id);
    formData.append('file', data.file, 'video.webm');
    logger.debug('📹 FormData prepared with email_id, test_id, and file (video.webm)', `(${(data.file.size / 1024 / 1024).toFixed(2)} MB)`);

    // Use httpClient for automatic correlation ID and cookie handling
    // Note: Must explicitly set Content-Type to undefined to let axios handle FormData
    const response = await httpClient.post<VideoEvaluationResponse>(
      '/ai-assessment/video-evaluation',
      formData as unknown as Record<string, unknown>,
      {
        headers: {
          'Content-Type': undefined
        }
      }
    );

    logger.info('✅ Video evaluation submitted successfully:', response.data);
    return response.data;
  } catch (error) {
    logger.error('Error submitting video evaluation:', error);
    throw error;
  }
};

/**
 * Submit final report with evaluations
 */
export const submitFinalReport = async (data: FinalReportRequest): Promise<FinalReportResponse> => {
  try {
    const response = await httpClient.post<FinalReportResponse>('/ai-assessment/final-report', data);
    return response.data;
  } catch (error) {
    logger.error('Error submitting final report:', error);
    throw error;
  }
};

// ==================== PROGRESSIVE AUDIO UPLOAD API ====================

/**
 * Helper function to extract simple question ID format from full question ID
 * Converts "SEC-2DE0-SAR-20260128174856-Q01" to "Q1"
 */
const extractSimpleQuestionId = (fullQuestionId: string): string => {
  // Extract the last part after the last hyphen
  const parts = fullQuestionId.split('-');
  const lastPart = parts[parts.length - 1]; // "Q01"

  // If it starts with Q, remove leading zeros from the number part
  if (lastPart.startsWith('Q')) {
    const numberPart = lastPart.substring(1); // "01"
    const normalizedNumber = parseInt(numberPart, 10); // 1
    return `Q${normalizedNumber}`; // "Q1"
  }

  // If format doesn't match expected pattern, return as-is
  return lastPart;
};

export interface AudioUploadRequest {
  session_id: string;
  question_id: string;
  test_id: string;
  audio_file: File | Blob;
  return_next_question?: boolean; // If true, backend returns next question in response
  question_number?: number; // Global question number (Q1, Q2, ..., Q44)
}

export interface AudioUploadResponse {
  success: boolean;
  session_id: string;
  question_id: string;
  full_question_id?: string;
  status: string;
  message: string;
  converted: boolean;
  upload_id?: string;
  response_time_seconds?: string;
  next_question?: {
    question: {
      question_id: string;
      section_id: string;
      section_name: string;
      question_text: string;
      question_type?: string;
      expected_text?: string;
      difficulty?: string;
      time_limit?: number;
      requires_audio?: boolean;
      requires_video?: boolean;
      options?: string[];
      audio_url?: string;
      story_text?: string;
      is_last_question?: boolean;
      is_last_section?: boolean;
    };
    section: {
      section_id: string;
      section_name: string;
      instructions?: string;
      total_questions?: number;
      time_limit?: number;
    };
  };
}

/**
 * Upload audio file progressively for a specific question
 * Called after user records audio and clicks "Next Question"
 * Audio is uploaded before fetching the next question
 * Uses httpClient for automatic correlation ID tracking and cookie handling
 */
export const uploadAudio = async (data: AudioUploadRequest): Promise<AudioUploadResponse> => {
  try {
    logger.debug('🎙️ Uploading audio for question:', data.question_id);
    logger.debug(`📊 Audio file size: ${(data.audio_file.size / 1024).toFixed(2)} KB`);
    logger.debug(`📝 Audio file type: ${data.audio_file.type}`);
    if (data.return_next_question) {
      logger.debug('📋 return_next_question: true - Next question will be included in response');
    }

    // Use global question_number if provided, otherwise extract from question_id
    const simpleQuestionId = data.question_number
      ? `Q${data.question_number}`
      : extractSimpleQuestionId(data.question_id);

    if (data.question_number) {
      logger.debug(`📋 Using global question_number: ${data.question_number} → "${simpleQuestionId}"`);
    } else {
      logger.debug(`📋 Converting question_id: "${data.question_id}" → "${simpleQuestionId}"`);
    }

    // Determine filename extension based on blob type
    let filename = 'audio.webm';
    if (data.audio_file.type.includes('wav')) {
      filename = 'audio.wav';
    } else if (data.audio_file.type.includes('mp3')) {
      filename = 'audio.mp3';
    } else if (data.audio_file.type.includes('webm')) {
      filename = 'audio.webm';
    }

    const formData = new FormData();
    formData.append('session_id', data.session_id);
    formData.append('question_id', simpleQuestionId); // Use simple format
    formData.append('test_id', data.test_id);
    formData.append('audio_file', data.audio_file, filename);

    // Add return_next_question parameter if provided
    if (data.return_next_question !== undefined) {
      formData.append('return_next_question', String(data.return_next_question));
    }

    logger.debug(`📋 Form data prepared with session_id, question_id (${simpleQuestionId}), test_id, audio_file (${filename})${data.return_next_question ? ', and return_next_question' : ''}`);

    // Use httpClient for automatic correlation ID and cookie handling
    // Note: Must explicitly set Content-Type to undefined to let axios handle FormData
    const response = await httpClient.post<AudioUploadResponse>(
      '/ai-assessment/audio/upload-progressive',
      formData as unknown as Record<string, unknown>,
      {
        headers: {
          'Content-Type': undefined
        }
      }
    );

    logger.info('✅ Audio uploaded successfully:', response.data);

    // Log if next question was included in response
    if (response.data.next_question) {
      logger.debug('📬 Next question received in response:', response.data.next_question.question.question_id);
    }

    return response.data;
  } catch (error) {
    logger.error('❌ Error uploading audio:', error);
    throw error;
  }
};

// ==================== AUDIO EVALUATION API ====================

export interface AudioEvaluationRequest {
  session_id: string;
  email_id: string;
  test_id: string;
  allow_partial?: boolean; // Allow partial evaluation even if some audio files are missing
}

export interface AudioEvaluationResponse {
  status: string;
  message?: string;
  evaluation?: {
    [key: string]: unknown;
  };
  missing_sections?: string[];
}

/**
 * Evaluate audio for a session
 * Called after uploading audio to evaluate transcripts from cache
 * Passes session_id, email_id, test_id in request body
 * Uses httpClient for automatic correlation ID tracking and cookie handling
 */
export const evaluateAudio = async (data: AudioEvaluationRequest): Promise<AudioEvaluationResponse> => {
  try {
    logger.debug('📊 Evaluating audio for session:', data.session_id);
    logger.debug('📊 Email ID:', data.email_id);
    logger.debug('📊 Test ID:', data.test_id);

    // Use httpClient for automatic correlation ID and cookie handling
    const response = await httpClient.post<AudioEvaluationResponse>(
      '/ai-assessment/audio/evaluate',
      {
        session_id: data.session_id,
        email_id: data.email_id,
        test_id: data.test_id,
        allow_partial: data.allow_partial ?? true, // Default to true to allow partial evaluation
      }
    );

    logger.info('✅ Audio evaluation completed:', response.data);
    return response.data;
  } catch (error) {
    logger.error('❌ Error evaluating audio:', error);
    throw error;
  }
};

// ==================== DOWNLOAD PDF REPORT API ====================

/**
 * Download assessment report as PDF
 * @param testId - The test ID to download the report for
 * @returns Blob of the PDF file
 */
export const downloadReportPdf = async (testId: string): Promise<Blob> => {
  try {
    logger.debug('📥 Downloading PDF report for test_id:', testId);

    const response = await httpClient.get(`/ai-assessment/reports/${testId}/download-pdf`, {
      responseType: 'blob',
    });

    logger.info('✅ PDF download successful');
    return response.data;
  } catch (error) {
    logger.error('❌ Error downloading PDF report:', error);
    throw error;
  }
};
