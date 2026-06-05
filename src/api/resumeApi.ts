import { httpClient } from '@/lib/http';
import logger from '@/lib/logger';
import { getProfile } from './userApi';
import type { CustomSection, CustomField } from '@/app/(resume)/builder/creation/_context/ResumeContext';

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
    githubUrl?: string;
    portfolioUrl?: string;
  };
  professionalSummary?: {
    summary: string;
    targetRole: string;
  } | string; // Support both old string format and new object format for backward compatibility
  education?: Array<{
    id?: string;
    school: string;
    degree: string;
    startDate: string;
    endDate: string;
    scoreType?: "CGPA" | "Marks" | "GPA" | "Percentage";
    scoreValue?: string;
  }>;
  workExperience?: Array<{
    id?: string;
    company: string;
    role: string;
    location: string;
    startDate: string;
    endDate: string;
    currentlyWorking: boolean;
    description: string;
  }>;
  projects?: Array<{
    id?: string;
    title: string;
    description: string;
    technologies: string[];
    startDate: string;
    endDate: string;
    projectUrl: string;
  }>;
  skills?: string[];
  categorizedSkills?: CategorizedSkills;
  certifications?: Array<{
    id?: string;
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate?: string;
    credentialId?: string;
    credentialUrl?: string;
  }>;
  achievements?: Array<{
    id?: string;
    title: string;
    description: string;
  }>;
  volunteering?: Array<{
    id?: string;
    organization: string;
    role: string;
    startDate: string;
    endDate: string;
    description: string;
  }>;
  internships?: Array<{
    id?: string;
    company: string;
    role: string;
    location: string;
    startDate: string;
    endDate: string;
    currentlyWorking: boolean;
    description: string;
    technologies?: string[];
  }>;
  awards?: Array<{
    id?: string;
    title: string;
    issuer: string;
    date: string;
    description: string;
  }>;
  hobbies?: Array<{
    id?: string;
    name: string;
  }>;
  interests?: Array<{
    id?: string;
    name: string;
  }>;
  languages?: Array<{
    id?: string;
    name: string;
    proficiency: string;
  }>;
  publications?: Array<{
    id?: string;
    title: string;
    publisher: string;
    date: string;
    url: string;
    description: string;
  }>;
  references?: Array<{
    id?: string;
    name: string;
    position: string;
    company: string;
    email: string;
    phone: string;
  }>;
  work_experience?: Array<{
    id?: string;
    company: string;
    role: string;
    location: string;
    startDate: string;
    endDate: string;
    currentlyWorking: boolean;
    description: string;
    technologies?: string[];
  }>;
  builder_score?: {
    score?: number;
  };
  updatedAt: string;
  createdAt: string;
  customSections?: CustomSection[];
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
  sections?: Record<string, unknown>;
  styling?: Record<string, unknown>;
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

    const resumeId = response.data.id || (response.data as unknown as Record<string, unknown>)._id as string;

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

// ==================== CREATE RESUME FROM PARSED DATA ====================
// Used by Upload flow: parser output mapped → builder format → saved to MongoDB.
// POST /resumes/ only accepts personalInfo at creation time; all other sections
// are written via a PATCH immediately after so the builder opens with data pre-filled.
export const createResumeFromParsed = async (
  data: Partial<ResumeResponse>
): Promise<ResumeResponse> => {
  try {
    logger.debug("📤 Creating resume from parsed data...");

    // Step 1 — create with the minimal payload the backend accepts on POST
    const createResponse = await httpClient.post<ResumeResponse>('/resumes/', {
      personalInfo: data.personalInfo,
    });

    const resumeId =
      createResponse.data.id ||
      (createResponse.data as unknown as Record<string, unknown>)._id as string;

    if (!resumeId) throw new Error("Resume created but no ID returned");

    localStorage.setItem("current_resume_id", resumeId);
    logger.info("✅ Resume created, ID:", resumeId);

    // Step 2 — patch all parsed sections onto the new resume
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { personalInfo: _pi, ...sections } = data;
    if (Object.keys(sections).length > 0) {
      await httpClient.patch(`/resumes/${resumeId}`, sections);
      logger.info("✅ Parsed sections patched onto resume");
    }

    return { ...createResponse.data, id: resumeId };
  } catch (error) {
    logger.error("❌ Error creating resume from parsed data:", error);
    throw error;
  }
};

// ==================== GET ALL RESUMES (UNIFIED) ====================
export const getAllResumesUnified = async (
  options: { skipAuthRedirect?: boolean } = {}
): Promise<import('@/types/api.types').AllResumesResponse> => {
  const response = await httpClient.get<import('@/types/api.types').AllResumesResponse>(
    '/resumes/all',
    options.skipAuthRedirect
      ? {
          headers: {
            'X-Skip-Auth-Redirect': 'true',
          },
        }
      : undefined
  );
  return response.data;
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

      const transformedResumes = response.data.map((resume: ResumeResponse & { _id?: string }) => {
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
      const resumeId = (response.data as ResumeResponse & { _id?: string }).id || (response.data as ResumeResponse & { _id?: string })._id;

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

// Type for backend custom section item
interface BackendCustomSectionItem {
  title?: string;
  subtitle?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  url?: string;
  tags?: string[];
  location?: string;
  [key: string]: string | string[] | undefined;
}

// Type for backend custom section
interface BackendCustomSection {
  id?: string;
  sectionName: string;
  icon: string;
  items: BackendCustomSectionItem[];
}

/**
 * Transform frontend customSections (fields-based) to backend format (items-based)
 */
const transformCustomSectionsForBackend = (customSections: CustomSection[]): BackendCustomSection[] => {
  return customSections
    .filter(section => {
      // Skip sections with no fields — they have no content to render
      if (!section.fields || section.fields.length === 0) return false;
      // Skip sections where every field is empty
      return section.fields.some(f => {
        const v = f.value;
        if (typeof v === 'string') return v.trim() !== '';
        if (Array.isArray(v)) return v.length > 0;
        return !!v;
      });
    })
    .map((section) => {
    // Create an item from the fields
    const item: BackendCustomSectionItem = {
      title: '',
      subtitle: '',
      description: '',
      startDate: '',
      endDate: '',
      url: '',
      tags: [],
      location: '',
    };

    // Map fields to backend structure
    section.fields?.forEach((field) => {
      const fieldValue = field.value;

      // Smart mapping based on field name and type
      if (field.fieldType === 'text') {
        // First text field → title, others → subtitle or custom fields
        if (!item.title && (field.fieldName.toLowerCase().includes('title') || field.fieldName.toLowerCase().includes('name'))) {
          item.title = fieldValue as string;
        } else if (!item.subtitle && field.fieldName.toLowerCase().includes('subtitle')) {
          item.subtitle = fieldValue as string;
        } else if (!item.location && field.fieldName.toLowerCase().includes('location')) {
          item.location = fieldValue as string;
        } else if (!item.title) {
          item.title = fieldValue as string;
        } else if (!item.subtitle) {
          item.subtitle = fieldValue as string;
        }
      } else if (field.fieldType === 'textarea') {
        // Textarea → description
        item.description = fieldValue as string;
      } else if (field.fieldType === 'date') {
        // Date fields
        if (field.fieldName.toLowerCase().includes('start')) {
          item.startDate = fieldValue as string;
        } else if (field.fieldName.toLowerCase().includes('end')) {
          item.endDate = fieldValue as string;
        } else if (!item.startDate) {
          item.startDate = fieldValue as string;
        }
      } else if (field.fieldType === 'url') {
        // URL field
        item.url = fieldValue as string;
      } else if (field.fieldType === 'list') {
        // List → tags
        item.tags = (fieldValue as string[]).filter(v => v.trim() !== '');
      }
    });

    // ✅ FIXED: Remove empty fields to avoid backend validation errors
    // Only include fields that have actual values
    const cleanedItem: BackendCustomSectionItem = {};
    Object.keys(item).forEach((key) => {
      const value = item[key];
      // Include field if it has a non-empty value
      if (value !== '' && !(Array.isArray(value) && value.length === 0)) {
        cleanedItem[key] = value;
      }
    });

    return {
      // Include backend ID when it's a real UUID (not a frontend-generated `custom_*` id)
      // This allows the backend to UPDATE the existing record instead of INSERTing a new one
      ...(section.id && !section.id.startsWith('custom_') ? { id: section.id } : {}),
      sectionName: section.sectionName,
      icon: 'custom', // Default icon
      items: [cleanedItem], // Single item per section for now
    };
  }); // end .map
};

/**
 * Transform backend customSections (items-based) to frontend format (fields-based)
 */
const transformCustomSectionsFromBackend = (backendSections: BackendCustomSection[]): CustomSection[] => {
  if (!backendSections || backendSections.length === 0) return [];

  return backendSections.map((section, sectionIndex) => {
    const fields: CustomField[] = [];

    // If section has items, convert first item to fields
    if (section.items && section.items.length > 0) {
      const item = section.items[0]; // Take first item

      // Map backend item fields to frontend fields
      if (item.title) {
        fields.push({
          id: `field_title_${sectionIndex}`,
          fieldName: 'Title',
          fieldType: 'text',
          value: item.title,
        });
      }

      if (item.subtitle) {
        fields.push({
          id: `field_subtitle_${sectionIndex}`,
          fieldName: 'Subtitle',
          fieldType: 'text',
          value: item.subtitle,
        });
      }

      if (item.description) {
        fields.push({
          id: `field_description_${sectionIndex}`,
          fieldName: 'Description',
          fieldType: 'textarea',
          value: item.description,
        });
      }

      if (item.startDate) {
        fields.push({
          id: `field_startDate_${sectionIndex}`,
          fieldName: 'Start Date',
          fieldType: 'date',
          value: item.startDate,
        });
      }

      if (item.endDate) {
        fields.push({
          id: `field_endDate_${sectionIndex}`,
          fieldName: 'End Date',
          fieldType: 'date',
          value: item.endDate,
        });
      }

      if (item.url) {
        fields.push({
          id: `field_url_${sectionIndex}`,
          fieldName: 'URL',
          fieldType: 'url',
          value: item.url,
        });
      }

      if (item.location) {
        fields.push({
          id: `field_location_${sectionIndex}`,
          fieldName: 'Location',
          fieldType: 'text',
          value: item.location,
        });
      }

      if (item.tags && item.tags.length > 0) {
        fields.push({
          id: `field_tags_${sectionIndex}`,
          fieldName: 'Tags',
          fieldType: 'list',
          value: item.tags,
        });
      }
    }

    return {
      id: section.id || `custom_${Date.now()}_${sectionIndex}`,
      sectionName: section.sectionName,
      fields,
    };
  });
};

/**
 * Transform professionalSummary to include both summary and targetRole
 * ✅ Backend now accepts object format with summary and targetRole
 */
const transformResumeDataForBackend = (resumeData: Partial<ResumeResponse>): Partial<ResumeResponse> => {
  const transformed = { ...resumeData };

  // Skills are managed exclusively via individual skill endpoints (POST/DELETE).
  // Sending them through PATCH causes a backend error, so strip them here.
  delete transformed.skills;
  delete transformed.categorizedSkills;

  // ✅ Send full professionalSummary object (summary + targetRole) to backend
  if (transformed.professionalSummary && typeof transformed.professionalSummary === 'object') {
    transformed.professionalSummary = {
      summary: transformed.professionalSummary.summary || '',
      targetRole: transformed.professionalSummary.targetRole || ''
    };
  }

  // Ensure personalInfo is sent under both snake_case and camelCase keys so the
  // backend PDF generator finds it regardless of which convention it uses.
  const raw = transformed as Record<string, unknown>;
  if (raw['personal_info']) {
    raw['personalInfo'] = raw['personal_info'];
  } else if (transformed.personalInfo) {
    raw['personal_info'] = transformed.personalInfo;
  }

  // Transform customSections from fields-based to items-based structure
  if (transformed.customSections && Array.isArray(transformed.customSections) && transformed.customSections.length > 0) {
    logger.info("🔄 Transforming customSections from fields to items format...");
    const backendFormatted = transformCustomSectionsForBackend(transformed.customSections);
    transformed.customSections = backendFormatted as unknown as CustomSection[];
    // Also populate snake_case field — backend PDF generator reads custom_sections
    (transformed as Record<string, unknown>).custom_sections = backendFormatted;
    logger.info("✅ Transformed customSections:", transformed.customSections);
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

    // Transform response customSections back to frontend format (same as getResumeById)
    // so callers can sync the real backend UUIDs back into React context
    if (response.data.customSections && Array.isArray(response.data.customSections) && response.data.customSections.length > 0) {
      response.data.customSections = transformCustomSectionsFromBackend(response.data.customSections as unknown as BackendCustomSection[]);
    }

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

    // Transform backend customSections (items) to frontend format (fields)
    if (response.data.customSections && Array.isArray(response.data.customSections) && response.data.customSections.length > 0) {
      logger.info("🔄 Transforming backend customSections to frontend format...");
      response.data.customSections = transformCustomSectionsFromBackend(response.data.customSections as unknown as BackendCustomSection[]);
      logger.info("✅ Transformed customSections:", response.data.customSections);
    }

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

// ==================== ADD SKILL TO CATEGORY ====================
export const addSkillToCategory = async (
  resumeId: string,
  category: string,
  skillName: string
): Promise<{ id?: string }> => {
  try {
    logger.debug("➕ Adding skill to category:", { category, skillName });
    const response = await httpClient.post<{ id?: string; _id?: string }>(
      `/resumes/${resumeId}/skills/${category}`,
      { name: skillName }
    );
    const id = response.data?.id ?? response.data?._id;
    logger.info("✅ Skill added successfully, id:", id);
    return { id };
  } catch (error) {
    logger.error("❌ Error adding skill:", error);
    throw error;
  }
};

// ==================== DELETE SKILL BY ID ====================
export const deleteSkillById = async (
  resumeId: string,
  category: string,
  skillId: string
): Promise<void> => {
  try {
    logger.debug("🗑️ Deleting skill:", { category, skillId });
    await httpClient.delete(`/resumes/${resumeId}/skills/${category}/${encodeURIComponent(skillId)}`);
    logger.info("✅ Skill deleted successfully");
  } catch (error) {
    logger.error("❌ Error deleting skill:", error);
    throw error;
  }
};

// ==================== DELETE SKILL CATEGORY ====================
export const deleteSkillCategory = async (
  resumeId: string,
  category: string
): Promise<void> => {
  try {
    logger.debug("🗑️ Deleting skill category:", category);
    await httpClient.delete(`/resumes/${resumeId}/skills/categories/${category}`);
    logger.info("✅ Skill category deleted successfully");
  } catch (error) {
    logger.error("❌ Error deleting skill category:", error);
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

// ==================== GET RESUME SCORE WITH POLLING (DEPRECATED) ====================
// @deprecated Use triggerScoreCalculation + getBuilderScore directly instead.
// Do not use this function - it fabricates fake metrics.
export const getResumeScore = async (
  resumeId: string,
  onProgress?: (attempt: number, max: number) => void
): Promise<ResumeScoreResponse> => {

  try {
    logger.debug("⭐ Starting score calculation flow for resume:", resumeId);

    await triggerScoreCalculation(resumeId);

    const maxAttempts = 10;
    const pollInterval = 2000;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      logger.debug(`📊 Polling attempt ${attempt}/${maxAttempts}...`);
      onProgress?.(attempt, maxAttempts);

      await new Promise(resolve => setTimeout(resolve, pollInterval));

      try {
        const builderScore = await getBuilderScore(resumeId);

        logger.debug(`✅ Score received (attempt ${attempt}):`, builderScore.score);

        if (builderScore.score > 0) {
          logger.info("✅ Valid score received:", builderScore.score);

          return {
            overall_score: builderScore.score,
            details: {
              keywords_score: 0,
              grammar_score: 0,
              skills_match: 0,
              improvement_suggestions: []
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
): Promise<ResumeResponse | null> => {

  try {
    logger.debug("💾 Auto-saving resume:", resumeId);

    // ✅ Transform data for backward compatibility
    const transformedData = transformResumeDataForBackend(resumeData);

    const response = await httpClient.patch<ResumeResponse>(
      `/resumes/${resumeId}`,
      transformedData,
      {
        headers: {
          'X-Save-Mode': 'autosave',
        },
      }
    );

    // 204 No Content = clean autosave, no body returned
    if (response.status === 204) {
      logger.info("✅ Auto-save successful (no content)");
      return null;
    }

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

    const response = await httpClient.get<Blob>(
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

    const response = await httpClient.post<{ message: string; resume_id: string; template_id: string }>(endpoint, payload, {
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
export const getDefaultTemplate = async (): Promise<{ template_id?: string; id?: string }> => {
  
  try {
    logger.debug("📋 Fetching default template");

    const response = await httpClient.get<{ template_id?: string; id?: string }>(
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

