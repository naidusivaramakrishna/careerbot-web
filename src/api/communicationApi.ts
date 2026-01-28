import { httpClient } from '@/lib/http';
import Cookies from 'js-cookie';

// Helper function to get auth token (consistent with httpClient)
const getAuthToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return Cookies.get('access_token') || localStorage.getItem('access_token');
  }
  return null;
};

// Helper function to get refresh token
const getRefreshToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return Cookies.get('refresh_token') || localStorage.getItem('refresh_token');
  }
  return null;
};

// Helper function to refresh access token
const refreshAccessToken = async (): Promise<string | null> => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      console.error('❌ No refresh token available');
      return null;
    }

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000/api/v1';
    const response = await fetch(`${baseUrl}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    if (!response.ok) {
      console.error('❌ Token refresh failed:', response.status);
      return null;
    }

    const data = await response.json();
    const { access_token, refresh_token: new_refresh_token } = data;

    // Store new tokens
    if (typeof window !== 'undefined' && access_token) {
      localStorage.setItem('access_token', access_token);
      localStorage.setItem('refresh_token', new_refresh_token);

      Cookies.set('access_token', access_token, {
        expires: 7,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      Cookies.set('refresh_token', new_refresh_token, {
        expires: 30,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      });

      console.log('✅ Token refreshed successfully');
      return access_token;
    }

    return null;
  } catch (error) {
    console.error('❌ Error refreshing token:', error);
    return null;
  }
};

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
    console.error('Error generating test:', error);
    throw error;
  }
};

/**
 * Start AI assessment session
 */
export const startSession = async (data: StartSessionRequest): Promise<StartSessionResponse> => {
  try {
    console.log('📤 Calling startSession API with test_id:', data.test_id);
    console.log('📤 Full URL:', `/ai-assessment/sessions/start?test_id=${data.test_id}`);

    const response = await httpClient.post<StartSessionResponse>(
      `/ai-assessment/sessions/start?test_id=${data.test_id}`,
      {}
    );

    console.log('🔍 ===== RAW API RESPONSE =====');
    console.log('🔍 Full response object:', JSON.stringify(response, null, 2));
    console.log('🔍 response.status:', response.status);
    console.log('🔍 response.statusText:', response.statusText);
    console.log('🔍 response.data:', response.data);
    console.log('🔍 response.data (stringified):', JSON.stringify(response.data, null, 2));
    console.log('🔍 Response data type:', typeof response.data);
    console.log('🔍 Response data keys:', response.data ? Object.keys(response.data) : 'null/undefined');
    console.log('🔍 ===== END RAW RESPONSE =====');

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

    console.log('🔍 Extracted session_id:', sessionId);
    console.log('🔍 All possible session_id locations checked:', {
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
    console.warn('⚠️ No session_id found, returning original response.data');
    return response.data;
  } catch (error) {
    console.error('❌ Error starting session:', error);
    throw error;
  }
};

/**
 * Get current question for the session
 */
export const getCurrentQuestion = async (sessionId: string): Promise<CurrentQuestionResponse> => {
  try {
    const response = await httpClient.get<any>(`/ai-assessment/sessions/${sessionId}/current-question`);
    console.log('🔍 getCurrentQuestion response:', response.data);

    // The API returns the question nested in current_question
    const responseData: any = response.data;

    if (responseData?.current_question) {
      console.log('✅ Extracting current_question from response');
      return {
        ...responseData.current_question,
        completed: responseData.completed,
        session_id: responseData.session_id
      };
    }

    // Fallback to returning the entire response if structure is different
    console.warn('⚠️ current_question not found in expected location, returning full response.data');
    return response.data;
  } catch (error) {
    console.error('Error getting current question:', error);
    throw error;
  }
};

/**
 * Get next question for the session
 */
// export const getNextQuestion = async (data: NextQuestionRequest): Promise<NextQuestionResponse> => {
//   try {
//     console.log('📤 ===== CALLING getNextQuestion =====');
//     console.log('📤 session_id:', data.session_id);
//     console.log('📤 question_id:', data.question_id);
//     console.log('📤 Trying with question_id as query parameter...');

//     // Try sending question_id as a query parameter instead of body
//     const response = await httpClient.post<any>(
//       `/ai-assessment/sessions/${data.session_id}/next-question?question_id=${data.question_id}`,
//       {}  // Empty body
//     );
//     console.log('🔍 ===== getNextQuestion RESPONSE =====');
//     console.log('🔍 Full response:', JSON.stringify(response.data, null, 2));

//     // The API returns the question nested in current_question
//     const responseData: any = response.data;

//     if (responseData?.current_question) {
//       console.log('✅ Extracting current_question from next question response');
//       console.log('🔍 Full current_question object:', responseData.current_question);
//       console.log('🔍 is_last_question from root:', responseData.is_last_question);
//       console.log('🔍 is_last_section from root:', responseData.is_last_section);

//       return {
//         ...responseData.current_question,
//         completed: responseData.completed,
//         session_id: responseData.session_id,
//         // Try both locations for is_last_question and is_last_section
//         is_last_question: responseData.current_question.is_last_question ?? responseData.is_last_question,
//         is_last_section: responseData.current_question.is_last_section ?? responseData.is_last_section
//       };
//     }

//     // Fallback to returning the entire response if structure is different
//     console.warn('⚠️ current_question not found in next question response, returning full response.data');
//     return response.data;
//   } catch (error) {
//     console.error('Error getting next question:', error);
//     throw error;
//   }
// };

export const getNextQuestion = async (data: NextQuestionRequest) => {
  try {
    console.log('📤 Calling next-question API');
    console.log('session_id:', data.session_id);
    console.log('previous question_id:', data.question_id);

    // const response = await httpClient.post<any>(
    //   `/ai-assessment/sessions/${data.session_id}/next-question?question_id=${data.question_id}`,
    //   {}  // question_id passed as query parameter
    // );
    const response = await httpClient.post<any>(
      `/ai-assessment/sessions/${data.session_id}/next-question?completed_question_id=${data.question_id}`,
      {}  // question_id passed as query parameter
    );

    console.log('🔍 RAW next-question response:', response.data);

    const responseData = response.data;

    // If assessment is completed, return completion status
    if (responseData.completed === true) {
      console.log('✅ Assessment completed!');
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
    console.error('❌ getNextQuestion failed:', error);
    throw error;
  }
};



/**
 * Submit video for evaluation
 * - email_id, test_id, and file are all sent as multipart/form-data fields
 * - video file is sent as-is (no conversion)
 */
export const submitVideoEvaluation = async (data: VideoEvaluationRequest): Promise<VideoEvaluationResponse> => {
  try {
    console.log('🎬 Processing video for submission...');
    console.log(`📊 Video size: ${(data.file.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`📊 Video type: ${data.file.type}`);
    console.log(`📊 Email ID: ${data.email_id}`);
    console.log(`📊 Test ID: ${data.test_id}`);

    const formData = new FormData();
    formData.append('email_id', data.email_id);
    formData.append('test_id', data.test_id);
    formData.append('file', data.file, 'video.webm');
    console.log('📹 FormData prepared with email_id, test_id, and file (video.webm)', `(${(data.file.size / 1024 / 1024).toFixed(2)} MB)`);

    // Send all data as FormData fields (no query parameters)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000/api/v1';
    const url = `${baseUrl}/ai-assessment/video-evaluation`;

    // Get auth token using the same method as httpClient
    const token = getAuthToken();
    console.log('🔑 Auth token present:', !!token);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData, // Browser will auto-set Content-Type with boundary
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Video evaluation API error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Video evaluation submitted successfully:', result);
    return result;
  } catch (error) {
    console.error('Error submitting video evaluation:', error);
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
    console.error('Error submitting final report:', error);
    throw error;
  }
};

// ==================== PROGRESSIVE AUDIO UPLOAD API ====================

export interface AudioUploadRequest {
  session_id: string;
  question_id: string;
  test_id: string;
  audio_file: File | Blob;
}

export interface AudioUploadResponse {
  success: boolean;
  session_id: string;
  question_id: string;
  status: string;
  message: string;
  converted: boolean;
  upload_id?: string;
}

/**
 * Upload audio file progressively for a specific question
 * Called after user records audio and clicks "Next Question"
 * Audio is uploaded before fetching the next question
 * Automatically retries with refreshed token if 401 error occurs
 */
export const uploadAudio = async (data: AudioUploadRequest, retryCount = 0): Promise<AudioUploadResponse> => {
  try {
    console.log('🎙️ Uploading audio for question:', data.question_id);
    console.log(`📊 Audio file size: ${(data.audio_file.size / 1024).toFixed(2)} KB`);
    console.log(`📝 Audio file type: ${data.audio_file.type}`);

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
    formData.append('question_id', data.question_id);
    formData.append('test_id', data.test_id);
    formData.append('audio_file', data.audio_file, filename);

    console.log(`📋 Form data prepared with session_id, question_id, test_id, and audio_file (${filename})`);

    // Get auth token using the same method as httpClient
    const token = getAuthToken();
    console.log('🔑 Auth token present:', !!token);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000/api/v1';
    const url = `${baseUrl}/ai-assessment/audio/upload-progressive`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: formData, // Browser will auto-set Content-Type with boundary
    });

    // Handle 401 - try to refresh token and retry once
    if (response.status === 401 && retryCount === 0) {
      console.warn('⚠️ Got 401, attempting to refresh token...');

      const newToken = await refreshAccessToken();

      if (newToken) {
        console.log('✅ Token refreshed, retrying upload...');
        // Retry the upload with new token
        return uploadAudio(data, retryCount + 1);
      } else {
        console.error('❌ Token refresh failed, redirecting to login...');
        // Clear tokens and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          Cookies.remove('access_token');
          Cookies.remove('refresh_token');
          alert('Your session has expired. Please log in again.');
          window.location.href = '/auth/login';
        }
        throw new Error('Session expired. Please log in again.');
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Audio upload API error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Audio uploaded successfully:', result);
    return result;
  } catch (error) {
    console.error('❌ Error uploading audio:', error);
    throw error;
  }
};

// ==================== AUDIO EVALUATION API ====================

export interface AudioEvaluationRequest {
  session_id: string;
  email_id: string;
  test_id: string;
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
 */
export const evaluateAudio = async (data: AudioEvaluationRequest): Promise<AudioEvaluationResponse> => {
  try {
    console.log('📊 Evaluating audio for session:', data.session_id);
    console.log('📊 Email ID:', data.email_id);
    console.log('📊 Test ID:', data.test_id);

    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:8000/api/v1';
    const url = `${baseUrl}/ai-assessment/audio/evaluate`;

    // Get auth token using the same method as httpClient
    const token = getAuthToken();
    console.log('🔑 Auth token present:', !!token);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        session_id: data.session_id,
        email_id: data.email_id,
        test_id: data.test_id,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Audio evaluation API error:', response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('✅ Audio evaluation completed:', result);
    return result;
  } catch (error) {
    console.error('❌ Error evaluating audio:', error);
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
    console.log('📥 Downloading PDF report for test_id:', testId);

    const response = await httpClient.get(`/ai-assessment/reports/${testId}/download-pdf`, {
      responseType: 'blob',
    });

    console.log('✅ PDF download successful');
    return response.data;
  } catch (error) {
    console.error('❌ Error downloading PDF report:', error);
    throw error;
  }
};
