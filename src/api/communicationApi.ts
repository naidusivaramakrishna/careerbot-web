import { httpClient } from '@/lib/http';

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
  // Add other response fields as per your API response
}

export interface VideoEvaluationRequest {
  email_id: string;
  test_id: string;
  video: File | Blob;
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
    let sessionId = responseData?.session_id ||
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

    const response = await httpClient.post<any>(
      `/ai-assessment/sessions/${data.session_id}/next-question`,
      {
        question_id: data.question_id, // ✅ backend requires this
      }
    );

    console.log('🔍 RAW next-question response:', response.data);

    const responseData = response.data;

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
 */
export const submitVideoEvaluation = async (data: VideoEvaluationRequest): Promise<VideoEvaluationResponse> => {
  try {
    const formData = new FormData();
    formData.append('email_id', data.email_id);
    formData.append('test_id', data.test_id);
    formData.append('video', data.video);

    const response = await httpClient.post<VideoEvaluationResponse>('/ai-assessment/video-evaluation', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
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
