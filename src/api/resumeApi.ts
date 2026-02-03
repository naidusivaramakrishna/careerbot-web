import { httpClient } from '@/lib/http';
import logger from '@/lib/logger';
import { getProfile } from './userApi';

export interface CategorizedSkills {
  programming_languages: string[];
  frameworks: string[];
  databases: string[];
  tools: string[];
  cloud_platforms: string[];
  soft_skills: string[];
}

export interface ResumeResponse {
  id: string;
  personalInfo?: {
    fullname?: string;
    email?: string;
    phone?: string;
    location?: string;
    linkedinUrl?: string;
    portfolioUrl?: string; // Correct spelling
    // portifolioUrl?: string; // Backward compatibility for typo
  };
  professionalSummary?: {
    summary: string;
    targetRole: string;
  } | string; // Support both old string format and new object format for backward compatibility
  education?: Array<{
    school: string;
    degree: string;
    startDate: string;
    endDate: string;
  }>;
  workExperience?: Array<{
    company: string;
    role: string;
    location: string;
    startDate: string;
    endDate: string;
    currentlyWorking: boolean;
    description: string;
  }>;
  projects?: Array<{
    title: string;
    description: string;
    technologies: string[];
    startDate: string;
    endDate: string;
    link: string;
  }>;
  skills?: string[];
  categorizedSkills?: CategorizedSkills;
  certifications?: Array<{
    name: string;
    issuedBy: string;
    year: string;
    expiryDate?: string;
    credentialId?: string;
  }>;
  achievements?: Array<{
    title: string;
    date: string;
    description: string;
  }>;
  volunteering?: Array<{
    organization: string;
    role: string;
    startDate: string;
    endDate: string;
  }>;
  internships?: Array<{
    company: string;
    role: string;
    location: string;
    startDate: string;
    endDate: string;
    currentlyWorking: boolean;
    description: string;
  }>;
  awards?: Array<{
    title: string;
    issuedBy: string;
    year: string;
  }>;
  hobbies?: Array<{
    name: string;
    description: string;
    proficiencyLevel?: string;
    achievement?: string;
  }>;
  interests?: Array<{
    name: string;
    description: string;
    category?: string;
  }>;
  languages?: Array<{
    language: string;
    proficiency: string;
  }>;
  publications?: Array<{
    title: string;
    authors: string;
    publicationName: string;
    date: string;
    url: string;
  }>;
  references?: Array<{
    name: string;
    relation: string;
    contact: string;
  }>;
  work_experience?: Array<{
    role?: string;
  }>;
  builder_score?: {
    score?: number;
  };
  updatedAt: string;
  createdAt: string;
  // customSections?: CustomSection[];
}

export interface TemplateResponse {
  _id?: string;  // ✅ MongoDB ObjectId
  id?: number | string;
  template_id?: string;
  name: string;
  subtitle?: string;
  description?: string;
  preview_url?: string;
  category?: string;
  ats_friendly?: boolean;
  layout?: {
    columns: number;
    page_size: string;
    margins: { top: number; right: number; bottom: number; left: number };
  };
  colors?: {
    primary: string;
    secondary: string;
    text: string;
    background: string;
    accent: string;
  };
  typography?: {
    font_family: string;
    heading_size: number;
    section_heading_size: number;
    body_size: number;
    line_height: number;
  };
  sections?: Record<string, any>;
  styling?: Record<string, any>;
  is_premium?: boolean;
  is_active?: boolean;
  is_default?: boolean;
}

export interface ResumeScoreResponse {
  overall_score: number;
  details?: {
    keywords_score?: number;
    grammar_score?: number;
    skills_match?: number;
    improvement_suggestions?: string[];
  } | null;
}

export interface BuilderScoreResponse {
  resume_id: string;
  score: number;
  calculated_at: string;
}


// ==================== CREATE RESUME ====================
export const createResumeWithAuth = async (): Promise<ResumeResponse> => {

  try {
    logger.debug("📤 Creating resume with authenticated user...");

    // ✅ Fetch user profile to populate personalInfo
    let userProfile;
    try {
      userProfile = await getProfile();
      logger.debug("✅ User profile fetched:", userProfile);
    } catch (profileError) {
      logger.warn("⚠️ Could not fetch user profile, creating resume with empty personalInfo", profileError);
    }

    // ✅ Map user profile to personalInfo
    const resumeData = {
      personalInfo: {
        fullname: userProfile?.full_name || '',
        email: userProfile?.email || '',
        phone: userProfile?.phone_number || '',
        location: userProfile?.location || '',
        linkedinUrl: userProfile?.linkedin_url || '',
        portfolioUrl: '', // User can fill this manually
      },
    };

    logger.debug("📋 Creating resume with personalInfo:", resumeData.personalInfo);

    const response = await httpClient.post<ResumeResponse>(
      '/resumes/',
      resumeData
    );

    const resumeId = response.data.id || (response.data as any)._id;

    logger.info("✅ Resume created with ID:", resumeId);

    if (resumeId) {
      localStorage.setItem("current_resume_id", resumeId);

      // ✅ NEW: Mark this resume as newly created with timestamp
      if (typeof window !== 'undefined') {
        const timestamp = Date.now();
        localStorage.setItem(`resume_created_${resumeId}`, timestamp.toString());
        logger.debug(`⏰ Marked resume as newly created`);
      }

      return {
        ...response.data,
        id: resumeId,
      };
    }

    throw new Error("Resume created but no ID returned");

  }
  catch (error) {
    logger.error("❌ Error creating resume:", error);
    throw error;
  }
};

// ==================== GET ALL RESUMES ====================
export const getAllResumes = async (): Promise<ResumeResponse[]> => {

  try {
    logger.debug("📥 Fetching resumes...");

    // ✅ httpClient automatically sends cookies (withCredentials: true)
    // ✅ If not authenticated, backend returns 401 and interceptor handles redirect

    // ✅ Add cache-busting to get fresh data (not cached)
    const response = await httpClient.get('/resumes', {
      params: {
        _t: Date.now() // Cache buster
      },
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache'
      }
    });

    logger.debug("✅ Response received:", {
      status: response.status,
      isArray: Array.isArray(response.data),
      count: Array.isArray(response.data) ? response.data.length : 0
    });

    if (Array.isArray(response.data)) {
      logger.debug("✅ Processing resumes:", { count: response.data.length });

      // ✅ Log first resume's personalInfo to debug
      if (response.data.length > 0) {
        logger.debug("🔍 First resume personalInfo:", response.data[0]?.personalInfo);
      }

      const transformedResumes = response.data.map((resume: any) => {
        const resumeId = resume.id || resume._id;

        if (!resumeId) {
          logger.warn("⚠️ Resume missing ID");
        }

        // ✅ Log each resume's personalInfo
        logger.debug(`📋 Resume ${resumeId} personalInfo:`, resume.personalInfo);

        return {
          ...resume,
          id: resumeId,
        } as ResumeResponse;
      });

      const validResumes = transformedResumes.filter(r => r.id);

      if (validResumes.length > 0 && validResumes[0].id) {
        const firstResumeId = validResumes[0].id;
        logger.debug("💾 Storing first resume ID");
        localStorage.setItem("current_resume_id", firstResumeId);
      }
      
      return validResumes;
    }
    
    if (response.data && typeof response.data === 'object') {
      const resumeId = (response.data as any).id || (response.data as any)._id;

      if (resumeId) {
        logger.info("✅ Single resume received");
        const transformedResume = {
          ...response.data,
          id: resumeId,
        } as ResumeResponse;
        localStorage.setItem("current_resume_id", resumeId);
        return [transformedResume];
      }
    }

    logger.warn("⚠️ No valid resumes found in response");
    return [];

  } catch (error) {
    logger.error("❌ Error fetching resumes:", error);
    throw error;
  }
};

// ==================== HELPER FUNCTIONS ====================
/**
 * Transform professionalSummary from object to string for backward compatibility
 * TODO: Remove this once backend is updated to handle object format
 */
const transformResumeDataForBackend = (resumeData: Partial<ResumeResponse>): Partial<ResumeResponse> => {
  const transformed = { ...resumeData };

  // If professionalSummary is an object, extract just the summary string
  if (transformed.professionalSummary && typeof transformed.professionalSummary === 'object') {
    transformed.professionalSummary = transformed.professionalSummary.summary || '';
  }

  return transformed;
};

// ==================== UPDATE RESUME ====================
export const updateResume = async (
  resumeId: string,
  resumeData: Partial<ResumeResponse>
): Promise<ResumeResponse> => {

  try {
    logger.debug("📝 Updating resume:", { resumeId });

    const endpoint = `/resumes/${resumeId}`;

    // ✅ Transform data for backward compatibility
    const transformedData = transformResumeDataForBackend(resumeData);

    // ✅ httpClient automatically sends cookies (withCredentials: true)
    // ✅ No Authorization header needed

    const response = await httpClient.patch<ResumeResponse>(
      endpoint,
      transformedData
    );

    logger.info("✅ Resume updated successfully");
    return response.data;
    
  } catch (error) {
    logger.error("❌ Error updating resume:", error);
    throw error;
  }
};

// ==================== GET RESUME BY ID ====================
export const getResumeById = async (resumeId: string): Promise<ResumeResponse> => {

  try {
    logger.debug("📥 Fetching resume by ID:", resumeId);

    const response = await httpClient.get<ResumeResponse>(`/resumes/${resumeId}`);

    logger.info("✅ Resume fetched successfully");
    return response.data;

  } catch (error) {
    logger.error("❌ Error fetching resume:", error);
    throw error;
  }
};

// ==================== DELETE SECTION ====================
export const deleteResumeSection = async (
  resumeId: string,
  section: string
): Promise<void> => {
  
  try {
    logger.debug("🗑️ Deleting section:", section);

    await httpClient.delete(`/resumes/${resumeId}/sections/${section}`);

    logger.info("✅ Section deleted successfully");

  } catch (error) {
    logger.error("❌ Error deleting section:", error);
    throw error;
  }
};

// ==================== DELETE SECTION ITEM ====================
export const deleteResumeSectionItem = async (
  resumeId: string,
  section: string,
  itemId: string
): Promise<void> => {
  
  try {
    logger.debug("🗑️ Deleting item from section:", { section, itemId });

    await httpClient.delete(`/resumes/${resumeId}/sections/${section}/items/${itemId}`);

    logger.info("✅ Section item deleted successfully");

  } catch (error) {
    logger.error("❌ Error deleting section item:", error);
    throw error;
  }
};

// ==================== TRIGGER SCORE CALCULATION ====================
export const triggerScoreCalculation = async (resumeId: string): Promise<void> => {
  
  try {
    logger.debug("🚀 Triggering score calculation for resume:", resumeId);

    const response = await httpClient.post(`/resumes/${resumeId}/calculate-score`);

    logger.info("✅ Score calculation triggered:", response.data);

  } catch (error) {
    logger.error("❌ Error triggering score calculation:", error);
    throw error;
  }
};

// ==================== GET BUILDER SCORE ====================
export const getBuilderScore = async (resumeId: string): Promise<BuilderScoreResponse> => {
  
  try {
    logger.debug("📊 Fetching builder score for resume:", resumeId);

    const response = await httpClient.get<BuilderScoreResponse>(
      `/resumes/${resumeId}/score`
    );

    logger.info("✅ Builder score fetched:", response.data);
    return response.data;

  } catch (error) {
    logger.error("❌ Error fetching builder score:", error);
    throw error;
  }
};

// ==================== GET RESUME SCORE WITH POLLING ====================
export const getResumeScore = async (resumeId: string): Promise<ResumeScoreResponse> => {
  
  try {
    logger.debug("⭐ Starting score calculation flow for resume:", resumeId);

    await triggerScoreCalculation(resumeId);

    const maxAttempts = 10;
    const pollInterval = 2000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      logger.debug(`📊 Polling attempt ${attempt}/${maxAttempts}...`);

      await new Promise(resolve => setTimeout(resolve, pollInterval));

      try {
        const builderScore = await getBuilderScore(resumeId);

        logger.debug(`✅ Score received (attempt ${attempt}):`, builderScore.score);

        if (builderScore.score > 0) {
          logger.info("✅ Valid score received:", builderScore.score);

          return {
            overall_score: builderScore.score,
            details: {
              keywords_score: Math.floor(builderScore.score * 0.9),
              grammar_score: Math.floor(builderScore.score * 0.95),
              skills_match: Math.floor(builderScore.score * 0.85),
              improvement_suggestions: builderScore.score < 70
                ? ["Add more keywords", "Improve formatting", "Add more skills"]
                : builderScore.score < 90
                ? ["Fine-tune your summary", "Add certifications"]
                : ["Your resume looks great!"]
            }
          };
        }

        logger.debug(`⏳ Score is still 0, continuing to poll...`);

      } catch (pollError) {
        logger.warn(`⚠️ Poll attempt ${attempt} failed:`, pollError);
      }
    }

    logger.warn("⏱️ Polling timeout - returning default score");
    throw new Error("Score calculation timeout. Please try again later.");

  } catch (error) {
    logger.error("❌ Error in score calculation flow:", error);
    throw error;
  }
};

// ==================== DELETE RESUME ====================
export const deleteResume = async (resumeId: string): Promise<void> => {
  
  try {
    logger.debug("🗑️ Deleting resume:", resumeId);

    await httpClient.delete(`/resumes/${resumeId}`);

    logger.info("✅ Resume deleted");
    localStorage.removeItem("current_resume_id");

  } catch (error) {
    logger.error('❌ Error deleting resume:', error);
    throw error;
  }
};

// ==================== AUTO-SAVE RESUME ====================
export const autoSaveResume = async (
  resumeId: string,
  resumeData: Partial<ResumeResponse>
): Promise<ResumeResponse> => {

  try {
    logger.debug("💾 Auto-saving resume:", resumeId);

    // ✅ Transform data for backward compatibility
    const transformedData = transformResumeDataForBackend(resumeData);

    const response = await httpClient.patch<ResumeResponse>(
      `/resumes/${resumeId}/autosave`,
      transformedData
    );

    logger.info("✅ Auto-save successful");
    return response.data;

  } catch (error) {
    logger.error("❌ Auto-save failed:", error);
    throw error;
  }
};

// ==================== GET DRAFT RESUMES ====================
export const getDraftResumes = async (): Promise<ResumeResponse[]> => {
  
  try {
    logger.debug("📥 Fetching draft resumes...");

    const response = await httpClient.get<ResumeResponse[]>('/resumes/status/drafts');

    logger.info("✅ Draft resumes fetched:", response.data.length);
    return response.data;

  } catch (error) {
    logger.error("❌ Error fetching drafts:", error);
    throw error;
  }
};

// ==================== GET COMPLETED RESUMES ====================
export const getCompletedResumes = async (): Promise<ResumeResponse[]> => {
  
  try {
    logger.debug("📥 Fetching completed resumes...");

    const response = await httpClient.get<ResumeResponse[]>('/resumes/status/completed');

    logger.info("✅ Completed resumes fetched:", response.data.length);
    return response.data;

  } catch (error) {
    logger.error("❌ Error fetching completed resumes:", error);
    throw error;
  }
};

// ==================== PUBLISH RESUME ====================
export const publishResume = async (resumeId: string): Promise<void> => {
  
  try {
    logger.debug("📤 Publishing resume:", resumeId);

    // Use httpClient for automatic correlation ID and cookie handling
    const response = await httpClient.post(`/resumes/${resumeId}/publish`);

    logger.info("✅ Resume published successfully:", response.data);
  } catch (error) {
    logger.error("❌ Publish API error:", error);
    throw error;
  }
};

// ==================== DOWNLOAD RESUME ====================
export const downloadResume = async (
  resumeId: string,
  format: 'pdf' | 'doc' | 'docx'
): Promise<Blob> => {
  
  try {
    logger.debug("⬇️ Downloading resume:", resumeId, "Format:", format);

    const backendFormat = format === 'doc' ? 'docx' : format;

    logger.debug("🔍 Download URL:", `${httpClient.defaults.baseURL}/resumes/${resumeId}/download?format=${backendFormat}`);

    const response = await httpClient.get(
      `/resumes/${resumeId}/download?format=${backendFormat}`,
      {
        responseType: 'blob',
      }
    );

    logger.info("✅ Download response received:", {
      status: response.status,
      contentType: response.headers['content-type'],
      size: response.data.size
    });

    return response.data;

  } catch (error) {
    logger.error('❌ Error downloading:', error);
    throw error;
  }
};

// Keep your existing getTemplatesByCategory function
export const getTemplatesByCategory = async (category?: string): Promise<TemplateResponse[]> => {
  
  try {
    logger.debug("📋 Fetching templates by category:", category);

    const url = category && category !== 'All'
      ? `/templates/?category=${encodeURIComponent(category.toLowerCase())}`
      : '/templates/';

    logger.debug("🔍 Request URL:", `${httpClient.defaults.baseURL}${url}`);
    logger.debug("📌 Category parameter being sent:", category);

    const response = await httpClient.get<unknown>(url);

    logger.debug("📦 Raw response data:", response.data);

    // Handle different response formats
    let templates: TemplateResponse[] = [];

    if (Array.isArray(response.data)) {
      // Response is an array directly
      templates = response.data;
    } else if (response.data && typeof response.data === 'object') {
      const responseObj = response.data as Record<string, unknown>;

      // Check for 'templates' key (main response format)
      if ('templates' in responseObj && Array.isArray(responseObj.templates)) {
        templates = responseObj.templates;
      }
      // Check for 'data' key (alternative wrapper format)
      else if ('data' in responseObj && Array.isArray(responseObj.data)) {
        templates = responseObj.data;
      }
    }

    logger.info("✅ Templates fetched:", templates.length, templates);
    return templates;
  } catch (error) {
    logger.error("❌ Error fetching templates by category:", error);
    throw error;
  }
};


export const applyTemplateToResume = async (
  resumeId: string,
  templateId: string // Template ID from the templates list API response (the 'id' field)
): Promise<{ message: string; resume_id: string; template_id: string }> => {

  // ✅ Validate inputs
  if (!resumeId) {
    throw new Error("Resume ID is required");
  }
  if (!templateId) {
    throw new Error("Template ID is required");
  }

  try {
    logger.debug("🎨 Applying template to resume:", { resumeId, templateId });

    // ✅ CORRECTED: Use /templates/{resume_id}/apply endpoint
    const endpoint = `/templates/${resumeId}/apply`;
    const payload = {
      template_id: templateId // Pass template_id from list response in request body
    };

    logger.debug("🔍 POST URL:", endpoint);
    logger.debug("🔍 Request payload:", JSON.stringify(payload));

    const response = await httpClient.post(endpoint, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    logger.info("✅ Template applied successfully:", response.data);
    return response.data;

  } catch (error) {
    logger.error("❌ Error applying template:", error);
    throw error;
  }
};

/**
 * Get all template categories
 */
export const getTemplateCategories = async (): Promise<string[]> => {
  
  try {
    logger.debug("📋 Fetching template categories");

    const response = await httpClient.get<unknown>(
      `/templates/categories`
    );
    // Handle different response formats
    const data = response.data as unknown;
    if (Array.isArray(data)) {
      return data as string[];
    }
    if (data && typeof data === 'object' && 'data' in data) {
      const arrayData = (data as Record<string, unknown>).data;
      if (Array.isArray(arrayData)) {
        return arrayData as string[];
      }
    }
    return [];
  } catch (error) {
    logger.error("❌ Error getting template categories:", error);
    throw error;
  }
};

/**
 * Get the default template
 */
export const getDefaultTemplate = async (): Promise<unknown> => {
  
  try {
    logger.debug("📋 Fetching default template");

    const response = await httpClient.get(
      `/templates/default`
    );

    logger.info("✅ Default template fetched:", response.data);
    return response.data;
  } catch (error) {
    logger.error("❌ Error getting default template:", error);
    throw error;
  }
};

/**
 * Set a template as default
 */
export const setDefaultTemplate = async (templateId: string | number): Promise<unknown> => {
  
  try {
    logger.debug("📋 Setting default template:", templateId);

    const response = await httpClient.post(
      `/templates/${templateId}/set-default`,
      {},
      {
        params: {
          template_id: templateId
        }
      }
    );

    logger.info("✅ Default template set successfully:", response.data);
    return response.data;
  } catch (error) {
    logger.error("❌ Error setting default template:", error);
    throw error;
  }
};

