// import { httpClient } from '@/lib/http';

// export interface ResumeResponse {
//   id: string;
//   personalInfo?: {
//     name?: string;
//   };
//   work_experience?: Array<{
//     role?: string;
//   }>;
//   builder_score?: {
//     score?: number;
//   };
//   updatedAt: string;
//   createdAt: string;
// }

// export interface ApiResponse<T> {
//   data?: T;
//   message?: string;
//   status?: number;
// }

// /**
//  * Fetch all resumes for the authenticated user
//  */
// export const getAllResumes = async (): Promise<ResumeResponse[]> => {
//   try {
//     const response = await httpClient.get<ApiResponse<ResumeResponse[]>>('/resumes/');
    
//     // response.data is the ApiResponse<ResumeResponse[]>
//     if (response.data.data) {
//       return response.data.data || [];
//     }
    
//     // If response.data itself is an array
//     if (Array.isArray(response.data)) {
//       return response.data;
//     }
    
//     return [];
//   } catch (error: any) {
//     console.error('Error fetching resumes:', error);
//     throw error;
//   }
// };

// /**
//  * Get a single resume by ID
//  */
// export const getResumeById = async (resumeId: string): Promise<ResumeResponse> => {
//   try {
//     const response = await httpClient.get<ApiResponse<ResumeResponse>>(`/resumes/${resumeId}`);
//     return (response.data.data || response.data) as ResumeResponse;
//   } catch (error: any) {
//     console.error('Error fetching resume:', error);
//     throw error;
//   }
// };

// /**
//  * Delete a resume by ID
//  */
// export const deleteResume = async (resumeId: string): Promise<void> => {
//   try {
//     await httpClient.delete(`/resumes/${resumeId}`);
//   } catch (error: any) {
//     console.error('Error deleting resume:', error);
//     throw error;
//   }
// };

// /**
//  * Download resume in specified format
//  */
// export const downloadResume = async (
//   resumeId: string, 
//   format: 'pdf' | 'docx'
// ): Promise<Blob> => {
//   try {
//     const response = await httpClient.get<Blob>(`/resumes/${resumeId}/download`, {
//       params: { format },
//       responseType: 'blob',
//     });
//     return response.data;
//   } catch (error: any) {
//     console.error('Error downloading resume:', error);
//     throw error;
//   }
// };

// /**
//  * Create a new resume
//  */
// export const createResume = async (resumeData: any): Promise<ResumeResponse> => {
//   try {
//     const response = await httpClient.post<ApiResponse<ResumeResponse>>('/resumes/', resumeData);
//     return (response.data.data || response.data) as ResumeResponse;
//   } catch (error: any) {
//     console.error('Error creating resume:', error);
//     throw error;
//   }
// };

// /**
//  * Update an existing resume
//  */
// export const updateResume = async (
//   resumeId: string, 
//   resumeData: any
// ): Promise<ResumeResponse> => {
//   try {
//     const response = await httpClient.put<ApiResponse<ResumeResponse>>(
//       `/resumes/${resumeId}`, 
//       resumeData
//     );
//     return (response.data.data || response.data) as ResumeResponse;
//   } catch (error: any) {
//     console.error('Error updating resume:', error);
//     throw error;
//   }
// };



// import axios from 'axios';
// import { httpClient } from '@/lib/http';

// export interface ResumeResponse {
//   id: string;
//   personalInfo?: {
//     name?: string;
//     email?: string;
//   };
//   work_experience?: Array<{
//     role?: string;
//   }>;
//   builder_score?: {
//     score?: number;
//   };
//   updatedAt: string;
//   createdAt: string;
// }

// // ==================== CREATE RESUME WITH AUTHENTICATED USER ====================
// export const createResumeWithAuth = async (): Promise<ResumeResponse> => {
//   try {
//     console.log("📤 Creating resume with authenticated user...");
    
//     // Get user data from localStorage (stored during signup/signin)
//     const email = localStorage.getItem("user_email") || "user@example.com";
//     const username = localStorage.getItem("username") || "User";
    
//     // Prepare minimal data with user's actual info
//     const resumeData = {
//       personalInfo: {
//         name: username,
//         email: email,
//       },
//     };

//     console.log("📋 Creating resume for:", { name: username, email });
    
//     // Use httpClient which already has auth token and withCredentials
//     const response = await httpClient.post<ResumeResponse>(
//       '/resumes',
//       resumeData
//     );
    
//     console.log("✅ Resume created with ID:", response.data.id);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error creating resume:", error);
    
//     if (axios.isAxiosError(error)) {
//       if (error.response?.status === 401) {
//         throw new Error("Please sign in again");
//       }
//       throw new Error(error.response?.data?.detail || "Failed to create resume");
//     }
    
//     throw error;
//   }
// };

// // ==================== UPDATE RESUME (PATCH) ====================
// export const updateResume = async (
//   resumeId: string, 
//   resumeData: Partial<ResumeResponse>
// ): Promise<ResumeResponse> => {
//   try {
//     console.log("📝 Updating resume:", resumeId);
    
//     const response = await httpClient.patch<ResumeResponse>(
//       `/resumes/${resumeId}`,
//       resumeData
//     );
    
//     console.log("✅ Resume updated");
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error updating resume:", error);
//     throw error;
//   }
// };

// // ==================== GET RESUME SCORE ====================
// export const getResumeScore = async (resumeId: string): Promise<{ score: number }> => {
//   try {
//     console.log("⭐ Fetching score for:", resumeId);
    
//     const response = await httpClient.get<{ score: number }>(
//       `/resumes/${resumeId}/score`
//     );
    
//     console.log("✅ Score:", response.data.score);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error fetching score:", error);
//     throw error;
//   }
// };

// // ==================== GET ALL RESUMES ====================
// export const getAllResumes = async (): Promise<ResumeResponse[]> => {
//   try {
//     console.log("📥 Fetching resumes...");
    
//     const response = await httpClient.get<ResumeResponse[]>('/resumes');
    
//     console.log("✅ Fetched", response.data.length, "resumes");
//     return response.data;
    
//   } catch (error) {
//     console.error('❌ Error fetching resumes:', error);
//     throw error;
//   }
// };

// // ==================== DELETE RESUME ====================
// export const deleteResume = async (resumeId: string): Promise<void> => {
//   try {
//     console.log("🗑️ Deleting resume:", resumeId);
    
//     await httpClient.delete(`/resumes/${resumeId}`);
    
//     console.log("✅ Resume deleted");
    
//   } catch (error) {
//     console.error('❌ Error deleting resume:', error);
//     throw error;
//   }
// };

// // ==================== DOWNLOAD RESUME ====================
// export const downloadResume = async (resumeId: string, format: 'pdf' | 'doc'): Promise<void> => {
//   try {
//     console.log("⬇️ Downloading resume:", resumeId);
    
//     const response = await httpClient.get(
//       `/resumes/${resumeId}/download?format=${format}`,
//       {
//         responseType: 'blob',
//       }
//     );

//     const url = window.URL.createObjectURL(new Blob([response.data]));
//     const link = document.createElement('a');
//     link.href = url;
//     link.setAttribute('download', `resume.${format}`);
//     document.body.appendChild(link);
//     link.click();
//     link.remove();
//     window.URL.revokeObjectURL(url);
    
//     console.log("✅ Downloaded");
    
//   } catch (error) {
//     console.error('❌ Error downloading:', error);
//     throw error;
//   }
// };


// import axios from 'axios';
// import { httpClient } from '@/lib/http';

// export interface ResumeResponse {
//   id: string;
//   personalInfo?: {
//     name?: string;
//     email?: string;
//   };
//   work_experience?: Array<{
//     role?: string;
//   }>;
//   builder_score?: {
//     score?: number;
//   };
//   updatedAt: string;
//   createdAt: string;
// }

// // ==================== SCORE RESPONSE INTERFACE ====================
// export interface ResumeScoreResponse {
//   overall_score: number;
//   details: {
//     keywords_score: number;
//     grammar_score: number;
//     skills_match: number;
//     improvement_suggestions: string[];
//   };
// }

// // ==================== CREATE RESUME WITH AUTHENTICATED USER ====================
// export const createResumeWithAuth = async (): Promise<ResumeResponse> => {
//   try {
//     console.log("📤 Creating resume with authenticated user...");
    
//     const email = localStorage.getItem("user_email") || "user@example.com";
//     const username = localStorage.getItem("username") || "User";
    
//     const resumeData = {
//       personalInfo: {
//         name: username,
//         email: email,
//       },
//     };

//     console.log("📋 Creating resume for:", { name: username, email });
    
//     const response = await httpClient.post<ResumeResponse>(
//       '/resumes',
//       resumeData
//     );
    
//     console.log("✅ Resume created with ID:", response.data.id);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error creating resume:", error);
    
//     if (axios.isAxiosError(error)) {
//       if (error.response?.status === 401) {
//         throw new Error("Please sign in again");
//       }
//       throw new Error(error.response?.data?.detail || "Failed to create resume");
//     }
    
//     throw error;
//   }
// };

// // ==================== UPDATE RESUME (PATCH) ====================
// export const updateResume = async (
//   resumeId: string, 
//   resumeData: Partial<ResumeResponse>
// ): Promise<ResumeResponse> => {
//   try {
//     console.log("📝 Updating resume:", resumeId);
    
//     const response = await httpClient.patch<ResumeResponse>(
//       `/resumes/${resumeId}`,
//       resumeData
//     );
    
//     console.log("✅ Resume updated");
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error updating resume:", error);
//     throw error;
//   }
// };

// // ==================== DELETE ENTIRE SECTION ====================
// export const deleteResumeSection = async (
//   resumeId: string,
//   section: string
// ): Promise<void> => {
//   try {
//     console.log("🗑️ Deleting section:", section);
    
//     await httpClient.delete(`/resumes/${resumeId}/sections/${section}`);
    
//     console.log("✅ Section deleted successfully");
    
//   } catch (error) {
//     console.error("❌ Error deleting section:", error);
//     throw error;
//   }
// };

// // ==================== DELETE SECTION ENTRY/ITEM ====================
// export const deleteResumeSectionItem = async (
//   resumeId: string,
//   section: string,
//   itemId: string
// ): Promise<void> => {
//   try {
//     console.log("🗑️ Deleting item from section:", { section, itemId });
    
//     await httpClient.delete(`/resumes/${resumeId}/sections/${section}/items/${itemId}`);
    
//     console.log("✅ Section item deleted successfully");
    
//   } catch (error) {
//     console.error("❌ Error deleting section item:", error);
//     throw error;
//   }
// };

// // ==================== GET RESUME SCORE ====================
// export const getResumeScore = async (resumeId: string): Promise<ResumeScoreResponse> => {
//   try {
//     console.log("⭐ Fetching score for resume:", resumeId);
    
//     const response = await httpClient.get<ResumeScoreResponse>(
//       `/resumes/${resumeId}/score`
//     );
    
//     console.log("✅ Score fetched:", response.data);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error fetching score:", error);
//     throw error;
//   }
// };

// // ==================== GET ALL RESUMES ====================
// export const getAllResumes = async (): Promise<ResumeResponse[]> => {
//   try {
//     console.log("📥 Fetching resumes...");
    
//     const response = await httpClient.get<ResumeResponse[]>('/resumes');
    
//     console.log("✅ Fetched", response.data.length, "resumes");
//     return response.data;
    
//   } catch (error) {
//     console.error('❌ Error fetching resumes:', error);
//     throw error;
//   }
// };

// // ==================== DELETE ENTIRE RESUME ====================
// export const deleteResume = async (resumeId: string): Promise<void> => {
//   try {
//     console.log("🗑️ Deleting resume:", resumeId);
    
//     await httpClient.delete(`/resumes/${resumeId}`);
    
//     console.log("✅ Resume deleted");
    
//   } catch (error) {
//     console.error('❌ Error deleting resume:', error);
//     throw error;
//   }
// };

// // ==================== DOWNLOAD RESUME ====================
// export const downloadResume = async (resumeId: string, format: 'pdf' | 'doc'): Promise<void> => {
//   try {
//     console.log("⬇️ Downloading resume:", resumeId);
    
//     const response = await httpClient.get(
//       `/resumes/${resumeId}/download?format=${format}`,
//       {
//         responseType: 'blob',
//       }
//     );

//     const url = window.URL.createObjectURL(new Blob([response.data]));
//     const link = document.createElement('a');
//     link.href = url;
//     link.setAttribute('download', `resume.${format}`);
//     document.body.appendChild(link);
//     link.click();
//     link.remove();
//     window.URL.revokeObjectURL(url);
    
//     console.log("✅ Downloaded");
    
//   } catch (error) {
//     console.error('❌ Error downloading:', error);
//     throw error;
//   }
// };


// import axios from 'axios';
// import { httpClient } from '@/lib/http';

// export interface ResumeResponse {
//   id: string;
//   personalInfo?: {
//     name?: string;
//     email?: string;
//   };
//   work_experience?: Array<{
//     role?: string;
//   }>;
//   builder_score?: {
//     score?: number;
//   };
//   updatedAt: string;
//   createdAt: string;
// }

// // ==================== SCORE RESPONSE INTERFACE ====================
// export interface ResumeScoreResponse {
//   overall_score: number;
//   details: {
//     keywords_score: number;
//     grammar_score: number;
//     skills_match: number;
//     improvement_suggestions: string[];
//   };
// }

// // ==================== TEMPLATE INTERFACE ====================
// export interface DefaultTemplateResponse {
//   id: number;
//   name: string;
//   description?: string;
//   preview_url?: string;
// }

// export interface TemplateResponse {
//   id: number;
//   name: string;
//   subtitle?: string;
//   description?: string;
//   preview_url?: string;
//   ats_friendly?: boolean;
//   category?: string;
// }

// // ==================== CREATE RESUME WITH AUTHENTICATED USER ====================
// // export const createResumeWithAuth = async (): Promise<ResumeResponse> => {
// //   try {
// //     console.log("📤 Creating resume with authenticated user...");
    
// //     const email = localStorage.getItem("user_email") || "user@example.com";
// //     const username = localStorage.getItem("username") || "User";
    
// //     const resumeData = {
// //       personalInfo: {
// //         name: username,
// //         email: email,
// //       },
// //     };

// //     console.log("📋 Creating resume for:", { name: username, email });
    
// //     const response = await httpClient.post<ResumeResponse>(
// //       '/resumes',
// //       resumeData
// //     );
    
// //     console.log("✅ Resume created with ID:", response.data.id);
// //     return response.data;
    
// //   } catch (error) {
// //     console.error("❌ Error creating resume:", error);
    
// //     if (axios.isAxiosError(error)) {
// //       if (error.response?.status === 401) {
// //         throw new Error("Please sign in again");
// //       }
// //       throw new Error(error.response?.data?.detail || "Failed to create resume");
// //     }
    
// //     throw error;
// //   }
// // };
// // export const createResumeWithAuth = async (): Promise<ResumeResponse> => {
// //   try {
// //     console.log("📤 Creating resume with authenticated user...");
    
// //     const email = localStorage.getItem("user_email") || "user@example.com";
// //     const username = localStorage.getItem("username") || "User";
    
// //     const resumeData = {
// //       personalInfo: {
// //         name: username,
// //         email: email,
// //       },
// //     };

// //     console.log("📋 Creating resume for:", { name: username, email });
    
// //     const response = await httpClient.post<ResumeResponse>(
// //       '/builder/resumes/resumes',
// //       resumeData
// //     );
    
// //     console.log("✅ Resume created with ID:", response.data.id);
// //     return response.data;
    
// //   } catch (error) {
// //     console.error("❌ Error creating resume:", error);
    
// //     if (axios.isAxiosError(error)) {
// //       if (error.response?.status === 401) {
// //         throw new Error("Please sign in again");
// //       }
// //       throw new Error(error.response?.data?.detail || "Failed to create resume");
// //     }
    
// //     throw error;
// //   }
// // };
// export const createResumeWithAuth = async (): Promise<ResumeResponse> => {
//   try {
//     console.log("📤 Creating resume with authenticated user...");
    
//     const email = localStorage.getItem("user_email");
//     const username = localStorage.getItem("username");
    
//     if (!email || !email.includes("@")) {
//       throw new Error("Invalid email. Please sign in again.");
//     }
    
//     const resumeData = {
//       personalInfo: {
//         name: username || email.split('@')[0],
//         email: email,
//       },
//     };

//     console.log("📋 Creating resume for:", resumeData);
    
//     // ✅ Use the correct endpoint (remove duplicate /resumes)
//     const response = await httpClient.post<ResumeResponse>(
//       '/builder/resumes',  // Changed from '/builder/resumes/resumes'
//       resumeData
//     );
    
//     console.log("✅ Resume created with ID:", response.data.id);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error creating resume:", error);
    
//     if (axios.isAxiosError(error)) {
//       const status = error.response?.status;
//       const detail = error.response?.data?.detail;
      
//       console.error("🔥 Error details:", {
//         status,
//         detail,
//         data: error.response?.data
//       });
      
//       if (status === 401) {
//         throw new Error("Please sign in again");
//       }
      
//       if (status === 409) {
//         // Resume already exists - fetch existing resume instead
//         console.log("⚠️ Resume already exists, fetching existing resume...");
//         try {
//           const resumes = await getAllResumes();
//           if (resumes && resumes.length > 0) {
//             const existingResume = resumes[0]; // Get the first/latest resume
//             console.log("✅ Using existing resume:", existingResume.id);
//             return existingResume;
//           }
//         } catch (fetchError) {
//           console.error("Failed to fetch existing resume:", fetchError);
//         }
//         throw new Error("Resume already exists. Please use the existing resume.");
//       }
      
//       if (status === 422) {
//         throw new Error(detail || "Invalid resume data");
//       }
      
//       throw new Error(detail || "Failed to create resume");
//     }
    
//     throw error;
//   }
// };


// // ==================== UPDATE RESUME (PATCH) ====================
// export const updateResume = async (
//   resumeId: string, 
//   resumeData: Partial<ResumeResponse>
// ): Promise<ResumeResponse> => {
//   try {
//     console.log("📝 Updating resume:", resumeId);
    
//     const response = await httpClient.patch<ResumeResponse>(
//       `builder/resumes/resumes/${resumeId}`,
//       resumeData
//     );
    
//     console.log("✅ Resume updated");
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error updating resume:", error);
//     throw error;
//   }
// };

// // ==================== DELETE ENTIRE SECTION ====================
// export const deleteResumeSection = async (
//   resumeId: string,
//   section: string
// ): Promise<void> => {
//   try {
//     console.log("🗑️ Deleting section:", section);
    
//     await httpClient.delete(`builder/resumes/resumes/${resumeId}/sections/${section}`);
    
//     console.log("✅ Section deleted successfully");
    
//   } catch (error) {
//     console.error("❌ Error deleting section:", error);
//     throw error;
//   }
// };

// // ==================== DELETE SECTION ENTRY/ITEM ====================
// export const deleteResumeSectionItem = async (
//   resumeId: string,
//   section: string,
//   itemId: string
// ): Promise<void> => {
//   try {
//     console.log("🗑️ Deleting item from section:", { section, itemId });
    
//     await httpClient.delete(`builder/resumes/resumes/${resumeId}/sections/${section}/items/${itemId}`);
    
//     console.log("✅ Section item deleted successfully");
    
//   } catch (error) {
//     console.error("❌ Error deleting section item:", error);
//     throw error;
//   }
// };

// // ==================== GET DEFAULT TEMPLATE ====================
// export const getDefaultTemplate = async (): Promise<DefaultTemplateResponse> => {
//   try {
//     console.log("🎨 Fetching default template...");
    
//     const response = await httpClient.get<DefaultTemplateResponse>(
//       'builder/resumes/templates/default'
//     );
    
//     console.log("✅ Default template fetched:", response.data);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error fetching default template:", error);
//     throw error;
//   }
// };

// // ==================== GET TEMPLATE BY ID ====================
// export const getTemplateById = async (templateId: number): Promise<TemplateResponse> => {
//   try {
//     console.log("🎨 Fetching template:", templateId);
    
//     const response = await httpClient.get<TemplateResponse>(
//       `builder/resumes/templates/${templateId}`
//     );
    
//     console.log("✅ Template fetched:", response.data);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error fetching template:", error);
//     throw error;
//   }
// };

// // ==================== GET RESUME SCORE ====================
// export const getResumeScore = async (resumeId: string): Promise<ResumeScoreResponse> => {
//   try {
//     console.log("⭐ Fetching score for resume:", resumeId);
    
//     const response = await httpClient.get<ResumeScoreResponse>(
//       `builder/resumes/resumes/${resumeId}/score`
//     );
    
//     console.log("✅ Score fetched:", response.data);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error fetching score:", error);
//     throw error;
//   }
// };

// // ==================== GET ALL RESUMES ====================
// export const getAllResumes = async (): Promise<ResumeResponse[]> => {
//   try {
//     console.log("📥 Fetching resumes...");
    
//     const response = await httpClient.get<ResumeResponse[]>('builder/resumes/resumes');
    
//     console.log("✅ Fetched", response.data.length, "resumes");
//     return response.data;
    
//   } catch (error) {
//     console.error('❌ Error fetching resumes:', error);
//     throw error;
//   }
// };

// // ==================== DELETE ENTIRE RESUME ====================
// export const deleteResume = async (resumeId: string): Promise<void> => {
//   try {
//     console.log("🗑️ Deleting resume:", resumeId);
    
//     await httpClient.delete(`builder//resumesresumes/${resumeId}`);
    
//     console.log("✅ Resume deleted");
    
//   } catch (error) {
//     console.error('❌ Error deleting resume:', error);
//     throw error;
//   }
// };

// // ==================== DOWNLOAD RESUME ====================
// export const downloadResume = async (resumeId: string, format: 'pdf' | 'doc'): Promise<void> => {
//   try {
//     console.log("⬇️ Downloading resume:", resumeId, "Format:", format);
    
//     const response = await httpClient.get(
//       `builder/resumes/resumes/${resumeId}/download?format=${format}`,
//       {
//         responseType: 'blob',
//       }
//     );

//     const blob = new Blob([response.data], { 
//       type: format === 'pdf' ? 'application/pdf' : 'application/msword' 
//     });
    
//     const url = window.URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.href = url;
//     link.setAttribute('download', `resume.${format}`);
//     document.body.appendChild(link);
//     link.click();
//     link.remove();
//     window.URL.revokeObjectURL(url);
    
//     console.log("✅ Downloaded successfully");
    
//   } catch (error) {
//     console.error('❌ Error downloading:', error);
//     throw error;
//   }
// };




// import axios from 'axios';
// import { httpClient } from '@/lib/http';

// export interface ResumeResponse {
//   id: string;
//   personalInfo?: {
//     name?: string;
//     email?: string;
//   };
//   work_experience?: Array<{
//     role?: string;
//   }>;
//   builder_score?: {
//     score?: number;
//   };
//   updatedAt: string;
//   createdAt: string;
// }

// export interface ResumeScoreResponse {
//   overall_score: number;
//   details: {
//     keywords_score: number;
//     grammar_score: number;
//     skills_match: number;
//     improvement_suggestions: string[];
//   };
// }

// export interface DefaultTemplateResponse {
//   id: number;
//   name: string;
//   description?: string;
//   preview_url?: string;
// }

// export interface TemplateResponse {
//   id: number;
//   name: string;
//   subtitle?: string;
//   description?: string;
//   preview_url?: string;
//   ats_friendly?: boolean;
//   category?: string;
// }

// // ==================== CREATE RESUME ====================
// export const createResumeWithAuth = async (): Promise<ResumeResponse> => {
//   try {
//     console.log("📤 Creating resume with authenticated user...");
    
//     const email = localStorage.getItem("user_email");
//     const username = localStorage.getItem("username");
    
//     if (!email || !email.includes("@")) {
//       throw new Error("Invalid email. Please sign in again.");
//     }
    
//     const resumeData = {
//       personalInfo: {
//         name: username || email.split('@')[0],
//         email: email,
//       },
//     };

//     console.log("📋 Creating resume for:", resumeData);
    
//     // ✅ CORRECT: /builder/resumes/resumes
//     const response = await httpClient.post<ResumeResponse>(
//       '/builder/resumes/resumes',
//       resumeData
//     );
    
//     console.log("✅ Resume created with ID:", response.data.id);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error creating resume:", error);
    
//     if (axios.isAxiosError(error)) {
//       const status = error.response?.status;
//       const detail = error.response?.data?.detail;
      
//       console.error("🔥 Error details:", {
//         status,
//         detail,
//         fullURL: `${error.config?.baseURL}${error.config?.url}`,
//         data: error.response?.data
//       });
      
//       if (status === 401) {
//         throw new Error("Please sign in again");
//       }
      
//       if (status === 409) {
//         // Resume already exists - fetch existing resume
//         console.log("⚠️ Resume already exists, fetching existing resume...");
//         try {
//           const resumes = await getAllResumes();
//           if (resumes && resumes.length > 0) {
//             const existingResume = resumes[0];
//             console.log("✅ Using existing resume:", existingResume.id);
//             localStorage.setItem("current_resume_id", existingResume.id);
//             return existingResume;
//           }
//         } catch (fetchError) {
//           console.error("Failed to fetch existing resume:", fetchError);
//         }
//         throw new Error("Resume already exists.");
//       }
      
//       if (status === 422) {
//         const validationDetail = detail?.detail || detail;
//         if (Array.isArray(validationDetail)) {
//           const errors = validationDetail.map((err: any) => 
//             `${err.loc?.join('.')} - ${err.msg}`
//           ).join(', ');
//           throw new Error(`Validation error: ${errors}`);
//         }
//         throw new Error(validationDetail?.message || validationDetail || "Invalid resume data");
//       }
      
//       throw new Error(detail || "Failed to create resume");
//     }
    
//     throw error;
//   }
// };

// // ==================== GET ALL RESUMES ====================
// // export const getAllResumes = async (): Promise<ResumeResponse[]> => {
// //   try {
// //     console.log("📥 Fetching resumes...");
// //     console.log("🔍 Full URL:", `${httpClient.defaults.baseURL}/builder/resumes/resumes`);
    
// //     // ✅ CORRECT: /builder/resumes/resumes
// //     const response = await httpClient.get<ResumeResponse[]>('/builder/resumes/resumes');
    
// //     console.log("✅ Fetched", response.data.length, "resumes");
// //     return response.data;
    
// //   } catch (error) {
// //     console.error('❌ Error fetching resumes:', error);
    
// //     if (axios.isAxiosError(error)) {
// //       console.error("🔥 Error details:", {
// //         status: error.response?.status,
// //         url: error.config?.url,
// //         baseURL: error.config?.baseURL,
// //         fullURL: `${error.config?.baseURL}${error.config?.url}`,
// //       });
// //     }
    
// //     throw error;
// //   }
// // };
// // ==================== GET ALL RESUMES ====================
// export const getAllResumes = async (): Promise<ResumeResponse[]> => {
//   try {
//     console.log("📥 Fetching resumes...");
    
//     // ✅ Check current user
//     const token = localStorage.getItem("access_token");
//     const email = localStorage.getItem("user_email");
//     const username = localStorage.getItem("username");
    
//     console.log("👤 Current user:", { email, username, hasToken: !!token });
    
//     const response = await httpClient.get('/builder/resumes/resumes');
    
//     console.log("✅ Response status:", response.status);
//     console.log("✅ Response data:", response.data);
//     console.log("✅ Is array?:", Array.isArray(response.data));
//     console.log("✅ Array length:", response.data?.length);
    
//     if (Array.isArray(response.data)) {
//       console.log("✅ Fetched", response.data.length, "resume(s)");
//       return response.data;
//     }
    
//     return [];
    
//   } catch (error) {
//     console.error('❌ Error fetching resumes:', error);
    
//     if (axios.isAxiosError(error)) {
//       console.error("🔥 Error details:", {
//         status: error.response?.status,
//         data: error.response?.data,
//       });
      
//       if (error.response?.status === 404) {
//         return [];
//       }
//     }
    
//     throw error;
//   }
// };


// // ==================== UPDATE RESUME ====================
// // export const updateResume = async (
// //   resumeId: string, 
// //   resumeData: Partial<ResumeResponse>
// // ): Promise<ResumeResponse> => {
// //   try {
// //     console.log("📝 Updating resume:", resumeId);
    
// //     // ✅ CORRECT: /builder/resumes/resumes/{id}
// //     const response = await httpClient.patch<ResumeResponse>(
// //       `/builder/resumes/resumes/${resumeId}`,
// //       resumeData
// //     );
    
// //     console.log("✅ Resume updated");
// //     return response.data;
    
// //   } catch (error) {
// //     console.error("❌ Error updating resume:", error);
// //     throw error;
// //   }
// // };
// // ==================== UPDATE RESUME ====================
// export const updateResume = async (
//   resumeId: string, 
//   resumeData: Partial<ResumeResponse>
// ): Promise<ResumeResponse> => {
//   try {
//     console.log("📝 Updating resume:", resumeId);
//     console.log("📋 Update data:", JSON.stringify(resumeData, null, 2));
//     console.log("🔍 Full URL:", `${httpClient.defaults?.baseURL}/builder/resumes/resumes/${resumeId}`);
    
//     // ✅ CORRECT: /builder/resumes/resumes/{id}
//     const response = await httpClient.patch<ResumeResponse>(
//       `/builder/resumes/resumes/${resumeId}`,
//       resumeData
//     );
    
//     console.log("✅ Resume updated successfully:", response.data);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error updating resume:", error);
    
//     if (axios.isAxiosError(error)) {
//       console.error("🔥 Update error details:", {
//         status: error.response?.status,
//         statusText: error.response?.statusText,
//         data: error.response?.data,
//         url: error.config?.url,
//         resumeId: resumeId,
//         fullURL: `${error.config?.baseURL}${error.config?.url}`,
//       });
      
//       if (error.response?.status === 404) {
//         throw new Error(`Resume with ID ${resumeId} not found. Please create a new resume.`);
//       }
      
//       if (error.response?.status === 422) {
//         throw new Error("Invalid data format. Please check your inputs.");
//       }
      
//       if (error.response?.status === 401) {
//         throw new Error("Session expired. Please log in again.");
//       }
//     }
    
//     throw error;
//   }
// };


// // ==================== DELETE SECTION ====================
// export const deleteResumeSection = async (
//   resumeId: string,
//   section: string
// ): Promise<void> => {
//   try {
//     console.log("🗑️ Deleting section:", section);
    
//     await httpClient.delete(`/builder/resumes/resumes/${resumeId}/sections/${section}`);
    
//     console.log("✅ Section deleted successfully");
    
//   } catch (error) {
//     console.error("❌ Error deleting section:", error);
//     throw error;
//   }
// };

// // ==================== DELETE SECTION ITEM ====================
// export const deleteResumeSectionItem = async (
//   resumeId: string,
//   section: string,
//   itemId: string
// ): Promise<void> => {
//   try {
//     console.log("🗑️ Deleting item from section:", { section, itemId });
    
//     await httpClient.delete(`/builder/resumes/resumes/${resumeId}/sections/${section}/items/${itemId}`);
    
//     console.log("✅ Section item deleted successfully");
    
//   } catch (error) {
//     console.error("❌ Error deleting section item:", error);
//     throw error;
//   }
// };

// // ==================== GET DEFAULT TEMPLATE ====================
// // export const getDefaultTemplate = async (): Promise<DefaultTemplateResponse> => {
// //   try {
// //     console.log("🎨 Fetching default template...");
    
// //     const response = await httpClient.get<DefaultTemplateResponse>(
// //       '/builder/templates/default'
// //     );
    
// //     console.log("✅ Default template fetched:", response.data);
// //     return response.data;
    
// //   } catch (error) {
// //     console.error("❌ Error fetching default template:", error);
// //     throw error;
// //   }
// // };

// // ==================== GET TEMPLATE BY ID ====================
// // export const getTemplateById = async (templateId: number): Promise<TemplateResponse> => {
// //   try {
// //     console.log("🎨 Fetching template:", templateId);
    
// //     const response = await httpClient.get<TemplateResponse>(
// //       `/builder/templates/${templateId}`
// //     );
    
// //     console.log("✅ Template fetched:", response.data);
// //     return response.data;
    
// //   } catch (error) {
// //     console.error("❌ Error fetching template:", error);
// //     throw error;
// //   }
// // };

// // ==================== GET RESUME SCORE ====================
// export const getResumeScore = async (resumeId: string): Promise<ResumeScoreResponse> => {
//   try {
//     console.log("⭐ Fetching score for resume:", resumeId);
    
//     const response = await httpClient.get<ResumeScoreResponse>(
//       `/builder/resumes/resumes/${resumeId}/score`
//     );
    
//     console.log("✅ Score fetched:", response.data);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error fetching score:", error);
//     throw error;
//   }
// };

// // ==================== DELETE RESUME ====================
// export const deleteResume = async (resumeId: string): Promise<void> => {
//   try {
//     console.log("🗑️ Deleting resume:", resumeId);
    
//     await httpClient.delete(`/builder/resumes/resumes/${resumeId}`);
    
//     console.log("✅ Resume deleted");
    
//   } catch (error) {
//     console.error('❌ Error deleting resume:', error);
//     throw error;
//   }
// };

// // ==================== DOWNLOAD RESUME ====================
// export const downloadResume = async (resumeId: string, format: 'pdf' | 'doc'): Promise<void> => {
//   try {
//     console.log("⬇️ Downloading resume:", resumeId, "Format:", format);
    
//     const response = await httpClient.get(
//       `/builder/resumes/resumes/${resumeId}/download?format=${format}`,
//       {
//         responseType: 'blob',
//       }
//     );

//     const blob = new Blob([response.data], { 
//       type: format === 'pdf' ? 'application/pdf' : 'application/msword' 
//     });
    
//     const url = window.URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.href = url;
//     link.setAttribute('download', `resume.${format}`);
//     document.body.appendChild(link);
//     link.click();
//     link.remove();
//     window.URL.revokeObjectURL(url);
    
//     console.log("✅ Downloaded successfully");
    
//   } catch (error) {
//     console.error('❌ Error downloading:', error);
//     throw error;
//   }
// };


// import axios from 'axios';
// import { httpClient } from '@/lib/http';

// export interface ResumeResponse {
//   id: string;
//   personalInfo?: {
//     name?: string;
//     email?: string;
//   };
//   work_experience?: Array<{
//     role?: string;
//   }>;
//   builder_score?: {
//     score?: number;
//   };
//   updatedAt: string;
//   createdAt: string;
// }

// export interface ResumeScoreResponse {
//   overall_score: number;
//   details: {
//     keywords_score: number;
//     grammar_score: number;
//     skills_match: number;
//     improvement_suggestions: string[];
//   };
// }

// export interface DefaultTemplateResponse {
//   id: number;
//   name: string;
//   description?: string;
//   preview_url?: string;
// }

// export interface TemplateResponse {
//   id: number;
//   name: string;
//   subtitle?: string;
//   description?: string;
//   preview_url?: string;
//   ats_friendly?: boolean;
//   category?: string;
// }

// // ==================== CREATE RESUME ====================
// // export const createResumeWithAuth = async (): Promise<ResumeResponse> => {
// //   try {
// //     console.log("📤 Creating resume with authenticated user...");
    
// //     const email = localStorage.getItem("user_email");
// //     const username = localStorage.getItem("username");
    
// //     if (!email || !email.includes("@")) {
// //       throw new Error("Invalid email. Please sign in again.");
// //     }
    
// //     const resumeData = {
// //       personalInfo: {
// //         name: username || email.split('@')[0],
// //         email: email,
// //       },
// //     };

// //     console.log("📋 Creating resume for:", resumeData);
    
// //     const response = await httpClient.post<ResumeResponse>(
// //       '/builder/resumes/resumes',
// //       resumeData
// //     );
    
// //     console.log("✅ Resume created with ID:", response.data.id);
// //     localStorage.setItem("current_resume_id", response.data.id);
// //     return response.data;
    
// //   } catch (error) {
// //     console.error("❌ Error creating resume:", error);
    
// //     if (axios.isAxiosError(error)) {
// //       const status = error.response?.status;
// //       const detail = error.response?.data?.detail;
      
// //       console.error("🔥 Create resume error details:", {
// //         status,
// //         detail,
// //         fullURL: `${error.config?.baseURL}${error.config?.url}`,
// //         data: error.response?.data
// //       });
      
// //       if (status === 401) {
// //         throw new Error("Authentication failed. Please sign in again.");
// //       }
      
// //       if (status === 409) {
// //         console.log("⚠️ Resume already exists (409 conflict)");
// //         throw new Error("RESUME_EXISTS");
// //       }
      
// //       if (status === 422) {
// //         const validationDetail = detail?.detail || detail;
// //         if (Array.isArray(validationDetail)) {
// //           const errors = validationDetail.map((err: any) => 
// //             `${err.loc?.join('.')} - ${err.msg}`
// //           ).join(', ');
// //           throw new Error(`Validation error: ${errors}`);
// //         }
// //         throw new Error(validationDetail?.message || validationDetail || "Invalid resume data");
// //       }
      
// //       throw new Error(detail || "Failed to create resume");
// //     }
    
// //     throw error;
// //   }
// // };
// export const createResumeWithAuth = async (): Promise<ResumeResponse> => {
//   try {
//     console.log("📤 Creating resume with authenticated user...");
    
//     const email = localStorage.getItem("user_email");
//     const username = localStorage.getItem("username");
    
//     if (!email || !email.includes("@")) {
//       throw new Error("Invalid email. Please sign in again.");
//     }
    
//     const resumeData = {
//       personalInfo: {
//         name: username || email.split('@')[0],
//         email: email,
//       },
//     };

//     console.log("📋 Creating resume for:", resumeData);
    
//     const response = await httpClient.post<ResumeResponse>(
//       '/resumes',
//       resumeData
//     );
    
//     // ✅ Handle both id and _id in response
//     const resumeId = response.data.id || (response.data as any)._id;
    
//     console.log("✅ Resume created with ID:", resumeId);
    
//     if (resumeId) {
//       localStorage.setItem("current_resume_id", resumeId);
//       return {
//         ...response.data,
//         id: resumeId, // ✅ Ensure id field exists
//       };
//     }
    
//     throw new Error("Resume created but no ID returned");
    
//   } catch (error) {
//     console.error("❌ Error creating resume:", error);
    
//     if (axios.isAxiosError(error)) {
//       const status = error.response?.status;
//       const detail = error.response?.data?.detail;
      
//       console.error("🔥 Create resume error details:", {
//         status,
//         detail,
//         fullURL: `${error.config?.baseURL}${error.config?.url}`,
//         data: error.response?.data
//       });
      
//       if (status === 401) {
//         throw new Error("Authentication failed. Please sign in again.");
//       }
      
//       if (status === 409) {
//         console.log("⚠️ Resume already exists (409 conflict)");
//         throw new Error("RESUME_EXISTS");
//       }
      
//       if (status === 422) {
//         const validationDetail = detail?.detail || detail;
//         if (Array.isArray(validationDetail)) {
//           const errors = validationDetail.map((err: any) => 
//             `${err.loc?.join('.')} - ${err.msg}`
//           ).join(', ');
//           throw new Error(`Validation error: ${errors}`);
//         }
//         throw new Error(validationDetail?.message || validationDetail || "Invalid resume data");
//       }
      
//       throw new Error(detail || "Failed to create resume");
//     }
    
//     throw error;
//   }
// };


// // ==================== GET ALL RESUMES ====================
// // export const getAllResumes = async (): Promise<ResumeResponse[]> => {
// //   try {
// //     console.log("📥 Fetching resumes...");
// //     console.log("🔍 Request URL:", `${httpClient.defaults.baseURL}/builder/resumes/resumes`);
    
// //     const token = localStorage.getItem("access_token");
// //     const email = localStorage.getItem("user_email");
    
// //     console.log("👤 Auth check:", { 
// //       email, 
// //       hasToken: !!token,
// //       tokenPreview: token ? token.substring(0, 20) + "..." : "none"
// //     });
    
// //     const response = await httpClient.get('/builder/resumes/resumes');
    
// //     console.log("✅ Response received:", {
// //       status: response.status,
// //       dataType: typeof response.data,
// //       isArray: Array.isArray(response.data),
// //       dataLength: response.data?.length,
// //       rawData: response.data
// //     });
    
// //     // ✅ Handle different response formats
// //     if (Array.isArray(response.data)) {
// //       console.log("✅ Fetched", response.data.length, "resume(s)");
      
// //       // ✅ Store the first resume ID if available
// //       if (response.data.length > 0 && response.data[0].id) {
// //         const firstResumeId = response.data[0].id;
// //         console.log("💾 Storing resume ID:", firstResumeId);
// //         localStorage.setItem("current_resume_id", firstResumeId);
// //       }
      
// //       return response.data;
// //     }
    
// //     // ✅ Handle single resume object response
// //     if (response.data && typeof response.data === 'object' && response.data.id) {
// //       console.log("✅ Single resume received, converting to array");
// //       localStorage.setItem("current_resume_id", response.data.id);
// //       return [response.data];
// //     }
    
// //     console.log("⚠️ No resumes found in response");
// //     return [];
    
// //   } catch (error) {
// //     console.error('❌ Error fetching resumes:', error);
    
// //     if (axios.isAxiosError(error)) {
// //       console.error("🔥 Fetch error details:", {
// //         status: error.response?.status,
// //         statusText: error.response?.statusText,
// //         data: error.response?.data,
// //         url: error.config?.url,
// //         baseURL: error.config?.baseURL,
// //         fullURL: `${error.config?.baseURL}${error.config?.url}`,
// //       });
      
// //       // ✅ Return empty array for 404, don't throw
// //       if (error.response?.status === 404) {
// //         console.log("⚠️ 404 received - no resumes found");
// //         return [];
// //       }
      
// //       // ✅ Handle 401 Unauthorized
// //       if (error.response?.status === 401) {
// //         console.error("🔐 Authentication failed - token may be expired");
// //         throw new Error("Please sign in again");
// //       }
// //     }
    
// //     // Return empty array instead of throwing for other errors
// //     console.log("⚠️ Returning empty array due to error");
// //     return [];
// //   }
// // };
// // ==================== GET ALL RESUMES ====================
// // export const getAllResumes = async (): Promise<ResumeResponse[]> => {
// //   try {
// //     console.log("📥 Fetching resumes...");
// //     console.log("🔍 Request URL:", `${httpClient.defaults.baseURL}/resumes`);
    
// //     const token = localStorage.getItem("access_token");
// //     const email = localStorage.getItem("user_email");
    
// //     console.log("👤 Auth check:", { 
// //       email, 
// //       hasToken: !!token,
// //     });
    
// //     const response = await httpClient.get('/resumes');
    
// //     console.log("✅ Response received:", {
// //       status: response.status,
// //       dataType: typeof response.data,
// //       isArray: Array.isArray(response.data),
// //       dataLength: response.data?.length,
// //       rawData: response.data
// //     });
    
// //     // ✅ Handle different response formats
// //     if (Array.isArray(response.data)) {
// //       console.log("✅ Processing", response.data.length, "resume(s)");
      
// //       // ✅ TRANSFORM: Convert _id to id if needed
// //       const transformedResumes = response.data.map((resume: any) => {
// //         const resumeId = resume.id || resume._id;
        
// //         console.log("🔄 Transforming resume:", { 
// //           original_id: resume.id, 
// //           original_underscore_id: resume._id,
// //           final_id: resumeId 
// //         });
        
// //         return {
// //           ...resume,
// //           id: resumeId, // ✅ Ensure 'id' field exists
// //         };
// //       });
      
// //       // ✅ Store the first resume ID if available
// //       if (transformedResumes.length > 0 && transformedResumes[0].id) {
// //         const firstResumeId = transformedResumes[0].id;
// //         console.log("💾 Storing resume ID:", firstResumeId);
// //         localStorage.setItem("current_resume_id", firstResumeId);
// //       }
      
// //       return transformedResumes;
// //     }
    
// //     // ✅ Handle single resume object response
// //     if (response.data && typeof response.data === 'object') {
// //       const resumeId = response.data.id || response.data._id;
      
// //       if (resumeId) {
// //         console.log("✅ Single resume received, ID:", resumeId);
// //         const transformedResume = {
// //           ...response.data,
// //           id: resumeId,
// //         };
// //         localStorage.setItem("current_resume_id", resumeId);
// //         return [transformedResume];
// //       }
// //     }
    
// //     console.log("⚠️ No resumes found in response");
// //     return [];
    
// //   } catch (error) {
// //     console.error('❌ Error fetching resumes:', error);
    
// //     if (axios.isAxiosError(error)) {
// //       console.error("🔥 Fetch error details:", {
// //         status: error.response?.status,
// //         statusText: error.response?.statusText,
// //         data: error.response?.data,
// //         url: error.config?.url,
// //       });
      
// //       if (error.response?.status === 404) {
// //         console.log("⚠️ 404 received - no resumes found");
// //         return [];
// //       }
      
// //       if (error.response?.status === 401) {
// //         console.error("🔐 Authentication failed");
// //         throw new Error("Please sign in again");
// //       }
// //     }
    
// //     return [];
// //   }
// // };
// export const getAllResumes = async (): Promise<ResumeResponse[]> => {
//   try {
//     console.log("📥 Fetching resumes...");
//     const fullURL = `${httpClient.defaults.baseURL}/resumes`;
//     console.log("🔍 Full Request URL:", fullURL);
    
//     const token = localStorage.getItem("access_token");
//     const email = localStorage.getItem("user_email");
    
//     if (!token) {
//       throw new Error("No authentication token found");
//     }
    
//     console.log("👤 Auth check:", { email, hasToken: !!token });
    
//     const response = await httpClient.get('/resumes');
    
//     console.log("✅ Response received:", {
//       status: response.status,
//       dataType: typeof response.data,
//       isArray: Array.isArray(response.data),
//       dataLength: response.data?.length,
//       rawData: response.data
//     });
    
//     // ✅ Handle array response
//     if (Array.isArray(response.data)) {
//       console.log("✅ Processing", response.data.length, "resume(s)");
      
//       const transformedResumes = response.data.map((resume: any) => {
//         // ✅ Handle both 'id' and '_id' from backend
//         const resumeId = resume.id || resume._id;
        
//         if (!resumeId) {
//           console.error("⚠️ Resume missing ID:", resume);
//         }
        
//         console.log("🔄 Transforming resume:", { 
//           original_id: resume.id, 
//           original_underscore_id: resume._id,
//           final_id: resumeId 
//         });
        
//         return {
//           ...resume,
//           id: resumeId,
//         };
//       });
      
//       // Filter out any resumes without IDs
//       const validResumes = transformedResumes.filter(r => r.id);
      
//       if (validResumes.length > 0 && validResumes[0].id) {
//         const firstResumeId = validResumes[0].id;
//         console.log("💾 Storing first resume ID:", firstResumeId);
//         localStorage.setItem("current_resume_id", firstResumeId);
//       }
      
//       return validResumes;
//     }
    
//     // ✅ Handle single object response
//     if (response.data && typeof response.data === 'object') {
//       const resumeId = response.data.id || response.data._id;
      
//       if (resumeId) {
//         console.log("✅ Single resume received, ID:", resumeId);
//         const transformedResume = {
//           ...response.data,
//           id: resumeId,
//         };
//         localStorage.setItem("current_resume_id", resumeId);
//         return [transformedResume];
//       }
//     }
    
//     console.log("⚠️ No valid resumes found in response");
//     return [];
    
//   } catch (error) {
//     console.error('❌ Error fetching resumes:', error);
    
//     if (axios.isAxiosError(error)) {
//       console.error("🔥 Fetch error details:", {
//         status: error.response?.status,
//         statusText: error.response?.statusText,
//         data: error.response?.data,
//         url: error.config?.url,
//         baseURL: error.config?.baseURL,
//         fullURL: `${error.config?.baseURL}${error.config?.url}`,
//       });
      
//       // ✅ DON'T silently return empty array on 404
//       if (error.response?.status === 404) {
//         console.error("⚠️ 404 - Endpoint not found. Check your API route!");
//         throw new Error("Resume endpoint not found. Please check API configuration.");
//       }
      
//       if (error.response?.status === 401) {
//         console.error("🔐 Authentication failed");
//         throw new Error("Please sign in again");
//       }
//     }
    
//     // ✅ Throw error instead of returning empty array
//     throw error;
//   }
// };


// // ==================== UPDATE RESUME ====================
// // export const updateResume = async (
// //   resumeId: string, 
// //   resumeData: Partial<ResumeResponse>
// // ): Promise<ResumeResponse> => {
// //   try {
// //     console.log("📝 Updating resume:", resumeId);
// //     console.log("📋 Update payload:", JSON.stringify(resumeData, null, 2));
// //     console.log("🔍 Full URL:", `${httpClient.defaults?.baseURL}/resumes/${resumeId}`);
    
// //     const response = await httpClient.patch<ResumeResponse>(
// //       `/resumes/${resumeId}`,
// //       resumeData
// //     );
    
// //     console.log("✅ Resume updated successfully:", response.data);
// //     return response.data;
    
// //   } catch (error) {
// //     console.error("❌ Error updating resume:", error);
    
// //     if (axios.isAxiosError(error)) {
// //       console.error("🔥 Update error details:", {
// //         status: error.response?.status,
// //         statusText: error.response?.statusText,
// //         data: error.response?.data,
// //         url: error.config?.url,
// //         resumeId: resumeId,
// //         fullURL: `${error.config?.baseURL}${error.config?.url}`,
// //       });
      
// //       if (error.response?.status === 404) {
// //         throw new Error(`Resume with ID ${resumeId} not found. Please refresh the page.`);
// //       }
      
// //       if (error.response?.status === 422) {
// //         const detail = error.response?.data?.detail;
// //         if (Array.isArray(detail)) {
// //           const errors = detail.map((err: any) => 
// //             `${err.loc?.join('.')} - ${err.msg}`
// //           ).join(', ');
// //           throw new Error(`Validation error: ${errors}`);
// //         }
// //         throw new Error("Invalid data format. Please check your inputs.");
// //       }
      
// //       if (error.response?.status === 401) {
// //         throw new Error("Session expired. Please log in again.");
// //       }
// //     }
    
// //     throw error;
// //   }
// // };
// // ==================== UPDATE RESUME ====================
// export const updateResume = async (
//   resumeId: string, 
//   resumeData: Partial<ResumeResponse>
// ): Promise<ResumeResponse> => {
//   try {
//     console.log("📝 Updating resume:", resumeId);
//     console.log("📋 Update payload:", JSON.stringify(resumeData, null, 2));
    
//     // ✅ Add detailed logging
//     const baseURL = httpClient.defaults.baseURL;
//     const fullURL = `${baseURL}/resumes/${resumeId}`;
//     console.log("🔍 Full URL:", fullURL);
//     console.log("🔍 BaseURL:", baseURL);
//     console.log("🔍 Resume ID:", resumeId);
//     console.log("🔍 Resume ID length:", resumeId.length);
//     console.log("🔍 Resume ID type:", typeof resumeId);
    
//     // ✅ Verify token exists
//     const token = localStorage.getItem("access_token");
//     console.log("🔐 Has token:", !!token);
    
//     const response = await httpClient.patch<ResumeResponse>(
//       `/resumes/${resumeId}`,
//       resumeData
//     );
    
//     console.log("✅ Resume updated successfully:", response.data);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error updating resume:", error);
    
//     if (axios.isAxiosError(error)) {
//       console.error("🔥 Update error details:", {
//         status: error.response?.status,
//         statusText: error.response?.statusText,
//         data: error.response?.data,
//         url: error.config?.url,
//         method: error.config?.method,
//         resumeId: resumeId,
//         fullURL: `${error.config?.baseURL}${error.config?.url}`,
//         headers: error.config?.headers,
//       });
      
//       if (error.response?.status === 404) {
//         // ✅ Add more context to the error
//         const errorMsg = `Resume with ID ${resumeId} not found at ${error.config?.baseURL}${error.config?.url}. Please refresh the page.`;
//         console.error("❌ 404 Error:", errorMsg);
//         throw new Error(errorMsg);
//       }
      
//       if (error.response?.status === 422) {
//         const detail = error.response?.data?.detail;
//         if (Array.isArray(detail)) {
//           const errors = detail.map((err: any) => 
//             `${err.loc?.join('.')} - ${err.msg}`
//           ).join(', ');
//           throw new Error(`Validation error: ${errors}`);
//         }
//         throw new Error("Invalid data format. Please check your inputs.");
//       }
      
//       if (error.response?.status === 401) {
//         throw new Error("Session expired. Please log in again.");
//       }
      
//       // ✅ Throw the actual backend error message
//       const backendError = error.response?.data?.detail || error.response?.data?.message;
//       throw new Error(backendError || "Failed to update resume");
//     }
    
//     throw error;
//   }
// };


// // ==================== DELETE SECTION ====================
// export const deleteResumeSection = async (
//   resumeId: string,
//   section: string
// ): Promise<void> => {
//   try {
//     console.log("🗑️ Deleting section:", section);
    
//     await httpClient.delete(`/resumes/${resumeId}/sections/${section}`);
    
//     console.log("✅ Section deleted successfully");
    
//   } catch (error) {
//     console.error("❌ Error deleting section:", error);
//     throw error;
//   }
// };

// // ==================== DELETE SECTION ITEM ====================
// export const deleteResumeSectionItem = async (
//   resumeId: string,
//   section: string,
//   itemId: string
// ): Promise<void> => {
//   try {
//     console.log("🗑️ Deleting item from section:", { section, itemId });
    
//     await httpClient.delete(`/resumes/${resumeId}/sections/${section}/items/${itemId}`);
    
//     console.log("✅ Section item deleted successfully");
    
//   } catch (error) {
//     console.error("❌ Error deleting section item:", error);
//     throw error;
//   }
// };

// // ==================== GET RESUME SCORE ====================
// export const getResumeScore = async (resumeId: string): Promise<ResumeScoreResponse> => {
//   try {
//     console.log("⭐ Fetching score for resume:", resumeId);
    
//     const response = await httpClient.get<ResumeScoreResponse>(
//       `/resumes/${resumeId}/score`
//     );
    
//     console.log("✅ Score fetched:", response.data);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error fetching score:", error);
//     throw error;
//   }
// };

// // ==================== DELETE RESUME ====================
// export const deleteResume = async (resumeId: string): Promise<void> => {
//   try {
//     console.log("🗑️ Deleting resume:", resumeId);
    
//     await httpClient.delete(`/resumes/${resumeId}`);
    
//     console.log("✅ Resume deleted");
//     localStorage.removeItem("current_resume_id");
    
//   } catch (error) {
//     console.error('❌ Error deleting resume:', error);
//     throw error;
//   }
// };

// // ==================== DOWNLOAD RESUME ====================
// export const downloadResume = async (resumeId: string, format: 'pdf' | 'doc'): Promise<void> => {
//   try {
//     console.log("⬇️ Downloading resume:", resumeId, "Format:", format);
    
//     const response = await httpClient.get(
//       `/resumes/${resumeId}/download?format=${format}`,
//       {
//         responseType: 'blob',
//       }
//     );

//     const blob = new Blob([response.data], { 
//       type: format === 'pdf' ? 'application/pdf' : 'application/msword' 
//     });
    
//     const url = window.URL.createObjectURL(blob);
//     const link = document.createElement('a');
//     link.href = url;
//     link.setAttribute('download', `resume.${format}`);
//     document.body.appendChild(link);
//     link.click();
//     link.remove();
//     window.URL.revokeObjectURL(url);
    
//     console.log("✅ Downloaded successfully");
    
//   } catch (error) {
//     console.error('❌ Error downloading:', error);
//     throw error;
//   }
// };


// import axios from 'axios';
// import { httpClient } from '@/lib/http';

// export interface ResumeResponse {
//   id: string;
//   personalInfo?: {
//     name?: string;
//     email?: string;
//   };
//   work_experience?: Array<{
//     role?: string;
//   }>;
//   builder_score?: {
//     score?: number;
//   };
//   updatedAt: string;
//   createdAt: string;
// }

// export interface ResumeScoreResponse {
//   overall_score: number;
//   details: {
//     keywords_score: number;
//     grammar_score: number;
//     skills_match: number;
//     improvement_suggestions: string[];
//   };
// }

// export interface DefaultTemplateResponse {
//   id: number;
//   name: string;
//   description?: string;
//   preview_url?: string;
// }

// export interface TemplateResponse {
//   id: number;
//   name: string;
//   subtitle?: string;
//   description?: string;
//   preview_url?: string;
//   ats_friendly?: boolean;
//   category?: string;
// }

// // ==================== CREATE RESUME ====================
// export const createResumeWithAuth = async (): Promise<ResumeResponse> => {
//   try {
//     console.log("📤 Creating resume with authenticated user...");
    
//     const email = localStorage.getItem("user_email");
//     const username = localStorage.getItem("username");
    
//     if (!email || !email.includes("@")) {
//       throw new Error("Invalid email. Please sign in again.");
//     }
    
//     const resumeData = {
//       personalInfo: {
//         name: username || email.split('@')[0],
//         email: email,
//       },
//     };

//     console.log("📋 Creating resume for:", resumeData);
//     console.log("🔍 POST URL:", `${httpClient.defaults.baseURL}/resumes`);
    
//     // ✅ CORRECT: No /builder prefix
//     const response = await httpClient.post<ResumeResponse>(
//       '/resumes',
//       resumeData
//     );
    
//     // ✅ Handle both id and _id in response
//     const resumeId = response.data.id || (response.data as any)._id;
    
//     console.log("✅ Resume created with ID:", resumeId);
    
//     if (resumeId) {
//       localStorage.setItem("current_resume_id", resumeId);
//       return {
//         ...response.data,
//         id: resumeId,
//       };
//     }
    
//     throw new Error("Resume created but no ID returned");
    
//   } catch (error) {
//     console.error("❌ Error creating resume:", error);
    
//     if (axios.isAxiosError(error)) {
//       const status = error.response?.status;
//       const detail = error.response?.data?.detail;
      
//       console.error("🔥 Create resume error details:", {
//         status,
//         detail,
//         fullURL: `${error.config?.baseURL}${error.config?.url}`,
//         data: error.response?.data
//       });
      
//       if (status === 401) {
//         throw new Error("Authentication failed. Please sign in again.");
//       }
      
//       if (status === 409) {
//         console.log("⚠️ Resume already exists (409 conflict)");
//         throw new Error("RESUME_EXISTS");
//       }
      
//       if (status === 422) {
//         const validationDetail = detail?.detail || detail;
//         if (Array.isArray(validationDetail)) {
//           const errors = validationDetail.map((err: any) => 
//             `${err.loc?.join('.')} - ${err.msg}`
//           ).join(', ');
//           throw new Error(`Validation error: ${errors}`);
//         }
//         throw new Error(validationDetail?.message || validationDetail || "Invalid resume data");
//       }
      
//       throw new Error(detail || "Failed to create resume");
//     }
    
//     throw error;
//   }
// };

// // ==================== GET ALL RESUMES ====================
// export const getAllResumes = async (): Promise<ResumeResponse[]> => {
//   try {
//     console.log("📥 Fetching resumes...");
//     const fullURL = `${httpClient.defaults.baseURL}/resumes`;
//     console.log("🔍 GET Full Request URL:", fullURL);
    
//     const token = localStorage.getItem("access_token");
//     const email = localStorage.getItem("user_email");
    
//     if (!token) {
//       throw new Error("No authentication token found");
//     }
    
//     console.log("👤 Auth check:", { email, hasToken: !!token });
    
//     // ✅ CORRECT: No /builder prefix
//     const response = await httpClient.get('/resumes');
    
//     console.log("✅ Response received:", {
//       status: response.status,
//       dataType: typeof response.data,
//       isArray: Array.isArray(response.data),
//       dataLength: response.data?.length,
//       rawData: response.data
//     });
    
//     // ✅ Handle array response
//     if (Array.isArray(response.data)) {
//       console.log("✅ Processing", response.data.length, "resume(s)");
      
//       const transformedResumes = response.data.map((resume: any) => {
//         const resumeId = resume.id || resume._id;
        
//         if (!resumeId) {
//           console.error("⚠️ Resume missing ID:", resume);
//         }
        
//         console.log("🔄 Transforming resume:", { 
//           original_id: resume.id, 
//           original_underscore_id: resume._id,
//           final_id: resumeId 
//         });
        
//         return {
//           ...resume,
//           id: resumeId,
//         };
//       });
      
//       const validResumes = transformedResumes.filter(r => r.id);
      
//       if (validResumes.length > 0 && validResumes[0].id) {
//         const firstResumeId = validResumes[0].id;
//         console.log("💾 Storing first resume ID:", firstResumeId);
//         localStorage.setItem("current_resume_id", firstResumeId);
//       }
      
//       return validResumes;
//     }
    
//     // ✅ Handle single object response
//     if (response.data && typeof response.data === 'object') {
//       const resumeId = response.data.id || response.data._id;
      
//       if (resumeId) {
//         console.log("✅ Single resume received, ID:", resumeId);
//         const transformedResume = {
//           ...response.data,
//           id: resumeId,
//         };
//         localStorage.setItem("current_resume_id", resumeId);
//         return [transformedResume];
//       }
//     }
    
//     console.log("⚠️ No valid resumes found in response");
//     return [];
    
//   } catch (error) {
//     console.error('❌ Error fetching resumes:', error);
    
//     if (axios.isAxiosError(error)) {
//       console.error("🔥 Fetch error details:", {
//         status: error.response?.status,
//         statusText: error.response?.statusText,
//         data: error.response?.data,
//         url: error.config?.url,
//         baseURL: error.config?.baseURL,
//         fullURL: `${error.config?.baseURL}${error.config?.url}`,
//       });
      
//       if (error.response?.status === 404) {
//         console.error("⚠️ 404 - Endpoint not found. Check your API route!");
//         throw new Error("Resume endpoint not found. Please check API configuration.");
//       }
      
//       if (error.response?.status === 401) {
//         console.error("🔐 Authentication failed");
//         throw new Error("Please sign in again");
//       }
//     }
    
//     throw error;
//   }
// };

// // ==================== UPDATE RESUME ====================
// export const updateResume = async (
//   resumeId: string, 
//   resumeData: Partial<ResumeResponse>
// ): Promise<ResumeResponse> => {
//   try {
//     console.log("📝 Updating resume:", resumeId);
//     console.log("📋 Update payload:", JSON.stringify(resumeData, null, 2));
    
//     // ✅ Add detailed logging
//     const baseURL = httpClient.defaults.baseURL;
//     const endpoint = `/resumes/${resumeId}`; // ✅ CORRECT: No /builder prefix
//     const fullURL = `${baseURL}${endpoint}`;
    
//     console.log("🔍 Full URL:", fullURL);
//     console.log("🔍 BaseURL:", baseURL);
//     console.log("🔍 Endpoint:", endpoint);
//     console.log("🔍 Resume ID:", resumeId);
//     console.log("🔍 Resume ID length:", resumeId.length);
//     console.log("🔍 Resume ID type:", typeof resumeId);
    
//     // ✅ Verify token exists
//     const token = localStorage.getItem("access_token");
//     console.log("🔐 Has token:", !!token);
    
//     const response = await httpClient.patch<ResumeResponse>(
//       endpoint,
//       resumeData
//     );
    
//     console.log("✅ Resume updated successfully:", response.data);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error updating resume:", error);
    
//     if (axios.isAxiosError(error)) {
//       console.error("🔥 Update error details:", {
//         status: error.response?.status,
//         statusText: error.response?.statusText,
//         data: error.response?.data,
//         url: error.config?.url,
//         method: error.config?.method,
//         resumeId: resumeId,
//         fullURL: `${error.config?.baseURL}${error.config?.url}`,
//         headers: error.config?.headers,
//       });
      
//       if (error.response?.status === 404) {
//         const errorMsg = `Resume with ID ${resumeId} not found at ${error.config?.baseURL}${error.config?.url}. Please refresh the page.`;
//         console.error("❌ 404 Error:", errorMsg);
//         throw new Error(errorMsg);
//       }
      
//       if (error.response?.status === 422) {
//         const detail = error.response?.data?.detail;
//         if (Array.isArray(detail)) {
//           const errors = detail.map((err: any) => 
//             `${err.loc?.join('.')} - ${err.msg}`
//           ).join(', ');
//           throw new Error(`Validation error: ${errors}`);
//         }
//         throw new Error("Invalid data format. Please check your inputs.");
//       }
      
//       if (error.response?.status === 401) {
//         throw new Error("Session expired. Please log in again.");
//       }
      
//       // ✅ Throw the actual backend error message
//       const backendError = error.response?.data?.detail || error.response?.data?.message;
//       throw new Error(backendError || "Failed to update resume");
//     }
    
//     throw error;
//   }
// };

// // ==================== DELETE SECTION ====================
// export const deleteResumeSection = async (
//   resumeId: string,
//   section: string
// ): Promise<void> => {
//   try {
//     console.log("🗑️ Deleting section:", section);
    
//     // ✅ CORRECT: No /builder prefix
//     await httpClient.delete(`/resumes/${resumeId}/sections/${section}`);
    
//     console.log("✅ Section deleted successfully");
    
//   } catch (error) {
//     console.error("❌ Error deleting section:", error);
//     throw error;
//   }
// };

// // ==================== DELETE SECTION ITEM ====================
// export const deleteResumeSectionItem = async (
//   resumeId: string,
//   section: string,
//   itemId: string
// ): Promise<void> => {
//   try {
//     console.log("🗑️ Deleting item from section:", { section, itemId });
    
//     // ✅ CORRECT: No /builder prefix
//     await httpClient.delete(`/resumes/${resumeId}/sections/${section}/items/${itemId}`);
    
//     console.log("✅ Section item deleted successfully");
    
//   } catch (error) {
//     console.error("❌ Error deleting section item:", error);
//     throw error;
//   }
// };

// // ==================== GET RESUME SCORE ====================
// export const getResumeScore = async (resumeId: string): Promise<ResumeScoreResponse> => {
//   try {
//     console.log("⭐ Fetching score for resume:", resumeId);
    
//     // ✅ According to your API docs: POST /api/v1/resumes/{resume_id}/calculate-score
//     const response = await httpClient.post<ResumeScoreResponse>(
//       `/resumes/${resumeId}/calculate-score`
//     );
    
//     console.log("✅ Score fetched:", response.data);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error fetching score:", error);
//     throw error;
//   }
// };

// // ==================== DELETE RESUME ====================
// export const deleteResume = async (resumeId: string): Promise<void> => {
//   try {
//     console.log("🗑️ Deleting resume:", resumeId);
    
//     // ✅ CORRECT: No /builder prefix
//     await httpClient.delete(`/resumes/${resumeId}`);
    
//     console.log("✅ Resume deleted");
//     localStorage.removeItem("current_resume_id");
    
//   } catch (error) {
//     console.error('❌ Error deleting resume:', error);
//     throw error;
//   }
// };

// // ==================== DOWNLOAD RESUME (if you have this endpoint) ====================
// export const downloadResume = async (resumeId: string, format: 'pdf' | 'doc'): Promise<Blob> => {
//   try {
//     console.log("⬇️ Downloading resume:", resumeId, "Format:", format);
    
//     // Note: I don't see a download endpoint in your API docs
//     // You might need to check with your backend team
//     const response = await httpClient.get(
//       `/resumes/${resumeId}/download?format=${format}`,
//       {
//         responseType: 'blob',
//       }
//     );

//     return response.data;
    
//   } catch (error) {
//     console.error('❌ Error downloading:', error);
//     throw error;
//   }
// }; before all fine and ats changes



// import axios from 'axios';
// import { httpClient } from '@/lib/http';

// // export interface ResumeResponse {
// //   id: string;
// //   personalInfo?: {
// //     name?: string;
// //     email?: string;
// //   };
// //   work_experience?: Array<{
// //     role?: string;
// //   }>;
// //   builder_score?: {
// //     score?: number;
// //   };
// //   updatedAt: string;
// //   createdAt: string;
// // }
// export interface ResumeResponse {
//   id: string;
//   personalInfo?: {
//     name?: string;
//     email?: string;
//     phone?: string;        // ✅ Add these
//     location?: string;      // ✅ Add these
//     linkedinurl?: string;   // ✅ Add these
//     portifoliourl?: string; // ✅ Add these
//   };
//   professionalSummary?: string;           // ✅ Add this
//   education?: Array<{                     // ✅ Add this
//     school: string;
//     degree: string;
//     startDate: string;
//     endDate: string;
//   }>;
//   workExperience?: Array<{                // ✅ Add this (note: workExperience, not work_experience)
//     company: string;
//     role: string;
//     location: string;
//     startDate: string;
//     endDate: string;
//     currentlyWorking: boolean;
//     description: string;
//   }>;
//   projects?: Array<{                      // ✅ Add this
//     title: string;
//     description: string;
//     technologies: string[];
//     startDate: string;
//     endDate: string;
//     link: string;
//   }>;
//   skills?: string[];                      // ✅ Add this
//   certifications?: Array<{                // ✅ Add this
//     name: string;
//     issuedBy: string;
//     year: string;
//   }>;
//   achievements?: Array<{                  // ✅ Add this
//     title: string;
//     date: string;
//     description: string;
//   }>;
//   volunteering?: Array<{                  // ✅ Add this
//     organization: string;
//     role: string;
//     startDate: string;
//     endDate: string;
//   }>;
//   internships?: Array<{                   // ✅ Add this
//     company: string;
//     role: string;
//     location: string;
//     startDate: string;
//     endDate: string;
//     currentlyWorking: boolean;
//     description: string;
//   }>;
//   awards?: Array<{                        // ✅ Add this
//     title: string;
//     issuedBy: string;
//     year: string;
//   }>;
//   hobbies?: Array<{                       // ✅ Add this
//     name: string;
//     description: string;
//     proficiencyLevel?: string;
//     achievement?: string;
//   }>;
//   interests?: Array<{                     // ✅ Add this
//     name: string;
//     description: string;
//     category?: string;
//   }>;
//   languages?: Array<{                     // ✅ Add this
//     language: string;
//     proficiency: string;
//   }>;
//   publications?: Array<{                  // ✅ Add this
//     title: string;
//     authors: string;
//     publicationName: string;
//     date: string;
//     url: string;
//   }>;
//   references?: Array<{                    // ✅ Add this
//     name: string;
//     relation: string;
//     contact: string;
//   }>;
//   work_experience?: Array<{               // Keep this for backward compatibility
//     role?: string;
//   }>;
//   builder_score?: {
//     score?: number;
//   };
//   updatedAt: string;
//   createdAt: string;
// }


// // ✅ Updated interface to match backend response
// export interface ResumeScoreResponse {
//   overall_score: number;
//   details?: {
//     keywords_score?: number;
//     grammar_score?: number;
//     skills_match?: number;
//     improvement_suggestions?: string[];
//   } | null;
// }

// // ✅ Builder Score Response (from GET endpoint)
// export interface BuilderScoreResponse {
//   resume_id: string;
//   score: number;
//   calculated_at: string;
// }

// export interface DefaultTemplateResponse {
//   id: number;
//   name: string;
//   description?: string;
//   preview_url?: string;
// }

// export interface TemplateResponse {
//   id: number;
//   name: string;
//   subtitle?: string;
//   description?: string;
//   preview_url?: string;
//   ats_friendly?: boolean;
//   category?: string;
// }

// // ==================== CREATE RESUME ====================
// export const createResumeWithAuth = async (): Promise<ResumeResponse> => {
//   try {
//     console.log("📤 Creating resume with authenticated user...");
    
//     const token = localStorage.getItem("access_token");
//     const email = localStorage.getItem("user_email");
//     const username = localStorage.getItem("username");
    
//     if (!email || !email.includes("@")) {
//       throw new Error("Invalid email. Please sign in again.");
//     }
    
//     const resumeData = {
//       title: "Untitled Resume",
//       personalInfo: {
//         name: username || email.split('@')[0],
//         email: email,
//       },
//     };

//     console.log("📋 Creating resume for:", resumeData);
//     console.log("🔍 POST URL:", `${httpClient.defaults.baseURL}/resumes/`);
//     console.log("Access Token:", localStorage.getItem("access_token"));

    
//     const response = await httpClient.post<ResumeResponse>(
//       '/resumes/',
//       resumeData,
//        {
//         headers: {
//           Authorization: `Bearer ${token}`, // ✅ important
//         },
//       }
//     );
    
//     const resumeId = response.data.id || (response.data as any)._id;
    
//     console.log("✅ Resume created with ID:", resumeId);
    
//     if (resumeId) {
//       localStorage.setItem("current_resume_id", resumeId);
//       return {
//         ...response.data,
//         id: resumeId,
//       };
//     }
    
//     throw new Error("Resume created but no ID returned");
    
//   } catch (error) {
//     console.error("❌ Error creating resume:", error);
    
//     if (axios.isAxiosError(error)) {
//       const status = error.response?.status;
//       const detail = error.response?.data?.detail;
      
//       console.error("🔥 Create resume error details:", {
//         status,
//         detail,
//         fullURL: `${error.config?.baseURL}${error.config?.url}`,
//         data: error.response?.data
//       });
      
//       if (status === 401) {
//         throw new Error("Authentication failed. Please sign in again.");
//       }
      
//       if (status === 409) {
//         console.log("⚠️ Resume already exists (409 conflict)");
//         throw new Error("RESUME_EXISTS");
//       }
      
//       if (status === 422) {
//         const validationDetail = detail?.detail || detail;
//         if (Array.isArray(validationDetail)) {
//           const errors = validationDetail.map((err: any) => 
//             `${err.loc?.join('.')} - ${err.msg}`
//           ).join(', ');
//           throw new Error(`Validation error: ${errors}`);
//         }
//         throw new Error(validationDetail?.message || validationDetail || "Invalid resume data");
//       }
      
//       throw new Error(detail || "Failed to create resume");
//     }
    
//     throw error;
//   }
// };

// // ==================== GET ALL RESUMES ====================
// export const getAllResumes = async (): Promise<ResumeResponse[]> => {
//   try {
//     console.log("📥 Fetching resumes...");
//     const fullURL = `${httpClient.defaults.baseURL}/resumes`;
//     console.log("🔍 GET Full Request URL:", fullURL);
    
//     const token = localStorage.getItem("access_token");
//     const email = localStorage.getItem("user_email");
    
//     if (!token) {
//       throw new Error("No authentication token found");
//     }
    
//     console.log("👤 Auth check:", { email, hasToken: !!token });
    
//     const response = await httpClient.get('/resumes');
    
//     console.log("✅ Response received:", {
//       status: response.status,
//       dataType: typeof response.data,
//       isArray: Array.isArray(response.data),
//       dataLength: response.data?.length,
//       rawData: response.data
//     });
    
//     if (Array.isArray(response.data)) {
//       console.log("✅ Processing", response.data.length, "resume(s)");
      
//       const transformedResumes = response.data.map((resume: any) => {
//         const resumeId = resume.id || resume._id;
        
//         if (!resumeId) {
//           console.error("⚠️ Resume missing ID:", resume);
//         }
        
//         console.log("🔄 Transforming resume:", { 
//           original_id: resume.id, 
//           original_underscore_id: resume._id,
//           final_id: resumeId 
//         });
        
//         return {
//           ...resume,
//           id: resumeId,
//         };
//       });
      
//       const validResumes = transformedResumes.filter(r => r.id);
      
//       if (validResumes.length > 0 && validResumes[0].id) {
//         const firstResumeId = validResumes[0].id;
//         console.log("💾 Storing first resume ID:", firstResumeId);
//         localStorage.setItem("current_resume_id", firstResumeId);
//       }
      
//       return validResumes;
//     }
    
//     if (response.data && typeof response.data === 'object') {
//       const resumeId = response.data.id || response.data._id;
      
//       if (resumeId) {
//         console.log("✅ Single resume received, ID:", resumeId);
//         const transformedResume = {
//           ...response.data,
//           id: resumeId,
//         };
//         localStorage.setItem("current_resume_id", resumeId);
//         return [transformedResume];
//       }
//     }
    
//     console.log("⚠️ No valid resumes found in response");
//     return [];
    
//   } catch (error) {
//     console.error('❌ Error fetching resumes:', error);
    
//     if (axios.isAxiosError(error)) {
//       console.error("🔥 Fetch error details:", {
//         status: error.response?.status,
//         statusText: error.response?.statusText,
//         data: error.response?.data,
//         url: error.config?.url,
//         baseURL: error.config?.baseURL,
//         fullURL: `${error.config?.baseURL}${error.config?.url}`,
//       });
      
//       if (error.response?.status === 404) {
//         console.error("⚠️ 404 - Endpoint not found. Check your API route!");
//         throw new Error("Resume endpoint not found. Please check API configuration.");
//       }
      
//       if (error.response?.status === 401) {
//         console.error("🔐 Authentication failed");
//         throw new Error("Please sign in again");
//       }
//     }
    
//     throw error;
//   }
// };

// // ==================== UPDATE RESUME ====================
// export const updateResume = async (
//   resumeId: string, 
//   resumeData: Partial<ResumeResponse>
// ): Promise<ResumeResponse> => {
//   try {
//     console.log("📝 Updating resume:", resumeId);
//     console.log("📋 Update payload:", JSON.stringify(resumeData, null, 2));
    
//     const baseURL = httpClient.defaults.baseURL;
//     const endpoint = `/resumes/${resumeId}`;
//     const fullURL = `${baseURL}${endpoint}`;
    
//     console.log("🔍 Full URL:", fullURL);
//     console.log("🔍 BaseURL:", baseURL);
//     console.log("🔍 Endpoint:", endpoint);
//     console.log("🔍 Resume ID:", resumeId);
//     console.log("🔍 Resume ID length:", resumeId.length);
//     console.log("🔍 Resume ID type:", typeof resumeId);
    
//     const token = localStorage.getItem("access_token");
//     console.log("🔐 Has token:", !!token);
    
//     const response = await httpClient.patch<ResumeResponse>(
//       endpoint,
//       resumeData
//     );
    
//     console.log("✅ Resume updated successfully:", response.data);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error updating resume:", error);
    
//     if (axios.isAxiosError(error)) {
//       console.error("🔥 Update error details:", {
//         status: error.response?.status,
//         statusText: error.response?.statusText,
//         data: error.response?.data,
//         url: error.config?.url,
//         method: error.config?.method,
//         resumeId: resumeId,
//         fullURL: `${error.config?.baseURL}${error.config?.url}`,
//         headers: error.config?.headers,
//       });
      
//       if (error.response?.status === 404) {
//         const errorMsg = `Resume with ID ${resumeId} not found at ${error.config?.baseURL}${error.config?.url}. Please refresh the page.`;
//         console.error("❌ 404 Error:", errorMsg);
//         throw new Error(errorMsg);
//       }
      
//       if (error.response?.status === 422) {
//         const detail = error.response?.data?.detail;
//         if (Array.isArray(detail)) {
//           const errors = detail.map((err: any) => 
//             `${err.loc?.join('.')} - ${err.msg}`
//           ).join(', ');
//           throw new Error(`Validation error: ${errors}`);
//         }
//         throw new Error("Invalid data format. Please check your inputs.");
//       }
      
//       if (error.response?.status === 401) {
//         throw new Error("Session expired. Please log in again.");
//       }
      
//       const backendError = error.response?.data?.detail || error.response?.data?.message;
//       throw new Error(backendError || "Failed to update resume");
//     }
    
//     throw error;
//   }
// };


// // ==================== GET RESUME BY ID ====================
// export const getResumeById = async (resumeId: string): Promise<ResumeResponse> => {
//   try {
//     console.log("📥 Fetching resume by ID:", resumeId);
    
//     const response = await httpClient.get<ResumeResponse>(`/resumes/${resumeId}`);
    
//     console.log("✅ Resume fetched successfully:", response.data);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error fetching resume:", error);
    
//     if (axios.isAxiosError(error)) {
//       if (error.response?.status === 404) {
//         throw new Error("Resume not found");
//       }
//       if (error.response?.status === 401) {
//         throw new Error("Please sign in again");
//       }
//     }
    
//     throw error;
//   }
// };


// // ==================== DELETE SECTION ====================
// export const deleteResumeSection = async (
//   resumeId: string,
//   section: string
// ): Promise<void> => {
//   try {
//     console.log("🗑️ Deleting section:", section);
    
//     await httpClient.delete(`/resumes/${resumeId}/sections/${section}`);
    
//     console.log("✅ Section deleted successfully");
    
//   } catch (error) {
//     console.error("❌ Error deleting section:", error);
//     throw error;
//   }
// };

// // ==================== DELETE SECTION ITEM ====================
// export const deleteResumeSectionItem = async (
//   resumeId: string,
//   section: string,
//   itemId: string
// ): Promise<void> => {
//   try {
//     console.log("🗑️ Deleting item from section:", { section, itemId });
    
//     await httpClient.delete(`/resumes/${resumeId}/sections/${section}/items/${itemId}`);
    
//     console.log("✅ Section item deleted successfully");
    
//   } catch (error) {
//     console.error("❌ Error deleting section item:", error);
//     throw error;
//   }
// };

// // ==================== TRIGGER SCORE CALCULATION ====================
// // ✅ FIXED: Use correct endpoint from API docs
// export const triggerScoreCalculation = async (resumeId: string): Promise<void> => {
//   try {
//     console.log("🚀 Triggering score calculation for resume:", resumeId);
    
//     // ✅ CORRECT: POST /api/v1/resumes/{resume_id}/calculate-score
//     const response = await httpClient.post(`/resumes/${resumeId}/calculate-score`);
    
//     console.log("✅ Score calculation triggered:", response.data);
    
//   } catch (error) {
//     console.error("❌ Error triggering score calculation:", error);
//     throw error;
//   }
// };

// // ==================== GET BUILDER SCORE ====================
// // ✅ FIXED: Use correct endpoint from API docs
// export const getBuilderScore = async (resumeId: string): Promise<BuilderScoreResponse> => {
//   try {
//     console.log("📊 Fetching builder score for resume:", resumeId);
    
//     // ✅ CORRECT: GET /api/v1/resumes/{resume_id}/score
//     const response = await httpClient.get<BuilderScoreResponse>(
//       `/resumes/${resumeId}/score`
//     );
    
//     console.log("✅ Builder score fetched:", response.data);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error fetching builder score:", error);
//     throw error;
//   }
// };

// // ==================== GET RESUME SCORE WITH POLLING ====================
// // ✅ This stays the same - uses the corrected functions above
// export const getResumeScore = async (resumeId: string): Promise<ResumeScoreResponse> => {
//   try {
//     console.log("⭐ Starting score calculation flow for resume:", resumeId);
    
//     // Step 1: Trigger calculation
//     await triggerScoreCalculation(resumeId);
    
//     // Step 2: Poll for result
//     const maxAttempts = 10;
//     const pollInterval = 2000; // 2 seconds
    
//     for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//       console.log(`📊 Polling attempt ${attempt}/${maxAttempts}...`);
      
//       // Wait before polling
//       await new Promise(resolve => setTimeout(resolve, pollInterval));
      
//       try {
//         const builderScore = await getBuilderScore(resumeId);
        
//         console.log(`✅ Score received (attempt ${attempt}):`, builderScore.score);
        
//         // If score is greater than 0, return it
//         if (builderScore.score > 0) {
//           console.log("✅ Valid score received:", builderScore.score);
          
//           // Return in the expected format
//           return {
//             overall_score: builderScore.score,
//             details: {
//               keywords_score: Math.floor(builderScore.score * 0.9), // Approximate
//               grammar_score: Math.floor(builderScore.score * 0.95), // Approximate
//               skills_match: Math.floor(builderScore.score * 0.85), // Approximate
//               improvement_suggestions: builderScore.score < 70 
//                 ? ["Add more keywords", "Improve formatting", "Add more skills"]
//                 : builderScore.score < 90
//                 ? ["Fine-tune your summary", "Add certifications"]
//                 : ["Your resume looks great!"]
//             }
//           };
//         }
        
//         console.log(`⏳ Score is still 0, continuing to poll...`);
        
//       } catch (pollError) {
//         console.warn(`⚠️ Poll attempt ${attempt} failed:`, pollError);
//         // Continue polling on error
//       }
//     }
    
//     // If we get here, polling timed out
//     console.warn("⏱️ Polling timeout - returning default score");
//     throw new Error("Score calculation timeout. Please try again later.");
    
//   } catch (error) {
//     console.error("❌ Error in score calculation flow:", error);
//     throw error;
//   }
// };


// // ==================== DELETE RESUME ====================
// export const deleteResume = async (resumeId: string): Promise<void> => {
//   try {
//     console.log("🗑️ Deleting resume:", resumeId);
    
//     await httpClient.delete(`/resumes/${resumeId}`);
    
//     console.log("✅ Resume deleted");
//     localStorage.removeItem("current_resume_id");
    
//   } catch (error) {
//     console.error('❌ Error deleting resume:', error);
//     throw error;
//   }
// };


// // ==================== AUTO-SAVE RESUME ====================
// export const autoSaveResume = async (
//   resumeId: string, 
//   resumeData: Partial<ResumeResponse>
// ): Promise<ResumeResponse> => {
//   try {
//     console.log("💾 Auto-saving resume:", resumeId);
    
//     const response = await httpClient.patch<ResumeResponse>(
//       `/resumes/${resumeId}/autosave`,
//       resumeData
//     );
    
//     console.log("✅ Auto-save successful");
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Auto-save failed:", error);
//     throw error;
//   }
// };

// // ==================== GET DRAFT RESUMES ====================
// export const getDraftResumes = async (): Promise<ResumeResponse[]> => {
//   try {
//     console.log("📥 Fetching draft resumes...");
    
//     const response = await httpClient.get<ResumeResponse[]>('/resumes/status/drafts');
    
//     console.log("✅ Draft resumes fetched:", response.data.length);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error fetching drafts:", error);
//     throw error;
//   }
// };

// // ==================== GET COMPLETED RESUMES ====================
// export const getCompletedResumes = async (): Promise<ResumeResponse[]> => {
//   try {
//     console.log("📥 Fetching completed resumes...");
    
//     const response = await httpClient.get<ResumeResponse[]>('/resumes/status/completed');
    
//     console.log("✅ Completed resumes fetched:", response.data.length);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error fetching completed resumes:", error);
//     throw error;
//   }
// };

// // Add this to your resumeApi.ts file

// export const publishResume = async (resumeId: string): Promise<void> => {
//   try {
//     const response = await fetch(`resumes/${resumeId}/publish`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         // Add auth headers if needed
//       },
//     });

//     if (!response.ok) {
//       throw new Error(`Publish failed: ${response.statusText}`);
//     }

//     console.log("✅ Resume published successfully");
//   } catch (error) {
//     console.error("❌ Publish API error:", error);
//     throw error;
//   }
// };

// // // ==================== DOWNLOAD RESUME ====================
// // export const downloadResume = async (resumeId: string, format: 'pdf' | 'doc'): Promise<Blob> => {
// //   try {
// //     console.log("⬇️ Downloading resume:", resumeId, "Format:", format);
    
// //     const response = await httpClient.get(
// //       `/resumes/${resumeId}/download?format=${format}`,
// //       {
// //         responseType: 'blob',
// //       }
// //     );

// //     return response.data;
    
// //   } catch (error) {
// //     console.error('❌ Error downloading:', error);
// //     throw error;
// //   }
// // };
// // ==================== DOWNLOAD RESUME ====================
// // export const downloadResume = async (resumeId: string, format: 'pdf' | 'doc'): Promise<Blob> => {
// //   try {
// //     console.log("⬇️ Downloading resume:", resumeId, "Format:", format);
// //     console.log("🔍 Download URL:", `${httpClient.defaults.baseURL}/resumes/${resumeId}/download?format=${format}`);
    
// //     const response = await httpClient.get(
// //       `/resumes/${resumeId}/download?format=${format}`,
// //       {
// //         responseType: 'blob',
// //       }
// //     );

// //     console.log("✅ Download response received:", {
// //       status: response.status,
// //       contentType: response.headers['content-type'],
// //       size: response.data.size
// //     });

// //     return response.data;
    
// //   } catch (error) {
// //     console.error('❌ Error downloading:', error);
    
// //     if (axios.isAxiosError(error)) {
// //       console.error("🔥 Download error details:", {
// //         status: error.response?.status,
// //         statusText: error.response?.statusText,
// //         data: error.response?.data,
// //         url: error.config?.url,
// //         fullURL: `${error.config?.baseURL}${error.config?.url}`,
// //       });
      
// //       if (error.response?.status === 400) {
// //         throw new Error("Invalid request. Please check the resume ID and format.");
// //       }
      
// //       if (error.response?.status === 404) {
// //         throw new Error("Download endpoint not found. This feature may not be available yet.");
// //       }
      
// //       if (error.response?.status === 500) {
// //         throw new Error("Server error while generating file. Please try again later.");
// //       }
// //     }
    
// //     throw error;
// //   }
// // };




// // ==================== DOWNLOAD RESUME ====================
// export const downloadResume = async (
//   resumeId: string, 
//   format: 'pdf' | 'doc' | 'docx' // ✅ Add docx option
// ): Promise<Blob> => {
//   try {
//     console.log("⬇️ Downloading resume:", resumeId, "Format:", format);
    
//     // ✅ Backend might expect 'docx' instead of 'doc'
//     const backendFormat = format === 'doc' ? 'docx' : format;
    
//     console.log("🔍 Download URL:", `${httpClient.defaults.baseURL}/resumes/${resumeId}/download?format=${backendFormat}`);
    
//     const response = await httpClient.get(
//       `/resumes/${resumeId}/download?format=${backendFormat}`,
//       {
//         responseType: 'blob',
//       }
//     );

//     console.log("✅ Download response received:", {
//       status: response.status,
//       contentType: response.headers['content-type'],
//       size: response.data.size
//     });

//     return response.data;
    
//   } catch (error) {
//     console.error('❌ Error downloading:', error);
    
//     if (axios.isAxiosError(error)) {
//       console.error("🔥 Download error details:", {
//         status: error.response?.status,
//         statusText: error.response?.statusText,
//         data: error.response?.data,
//         url: error.config?.url,
//         fullURL: `${error.config?.baseURL}${error.config?.url}`,
//       });
      
//       if (error.response?.status === 422) {
//         // ✅ Try to parse validation error
//         const detail = error.response?.data?.detail;
        
//         if (Array.isArray(detail)) {
//           const errors = detail.map((err: any) => 
//             `${err.loc?.join('.')} - ${err.msg}`
//           ).join(', ');
//           throw new Error(`Validation error: ${errors}`);
//         }
        
//         throw new Error("Invalid format or resume data. Make sure your resume has all required fields filled.");
//       }
      
//       if (error.response?.status === 400) {
//         throw new Error("Invalid request. Please check the resume ID and format.");
//       }
      
//       if (error.response?.status === 404) {
//         throw new Error("Download endpoint not found. This feature may not be available yet.");
//       }
      
//       if (error.response?.status === 500) {
//         throw new Error("Server error while generating file. Please try again later.");
//       }
//     }
    
//     throw error;
//   }
// }; before templates api added


// import axios from 'axios';
// import { httpClient } from '@/lib/http';

// // export interface ResumeResponse {
// //   id: string;
// //   personalInfo?: {
// //     name?: string;
// //     email?: string;
// //   };
// //   work_experience?: Array<{
// //     role?: string;
// //   }>;
// //   builder_score?: {
// //     score?: number;
// //   };
// //   updatedAt: string;
// //   createdAt: string;
// // }
// export interface ResumeResponse {
//   id: string;
//   personalInfo?: {
//     name?: string;
//     email?: string;
//     phone?: string;        // ✅ Add these
//     location?: string;      // ✅ Add these
//     linkedinurl?: string;   // ✅ Add these
//     portifoliourl?: string; // ✅ Add these
//   };
//   professionalSummary?: string;           // ✅ Add this
//   education?: Array<{                     // ✅ Add this
//     school: string;
//     degree: string;
//     startDate: string;
//     endDate: string;
//   }>;
//   workExperience?: Array<{                // ✅ Add this (note: workExperience, not work_experience)
//     company: string;
//     role: string;
//     location: string;
//     startDate: string;
//     endDate: string;
//     currentlyWorking: boolean;
//     description: string;
//   }>;
//   projects?: Array<{                      // ✅ Add this
//     title: string;
//     description: string;
//     technologies: string[];
//     startDate: string;
//     endDate: string;
//     link: string;
//   }>;
//   skills?: string[];                      // ✅ Add this
//   certifications?: Array<{                // ✅ Add this
//     name: string;
//     issuedBy: string;
//     year: string;
//   }>;
//   achievements?: Array<{                  // ✅ Add this
//     title: string;
//     date: string;
//     description: string;
//   }>;
//   volunteering?: Array<{                  // ✅ Add this
//     organization: string;
//     role: string;
//     startDate: string;
//     endDate: string;
//   }>;
//   internships?: Array<{                   // ✅ Add this
//     company: string;
//     role: string;
//     location: string;
//     startDate: string;
//     endDate: string;
//     currentlyWorking: boolean;
//     description: string;
//   }>;
//   awards?: Array<{                        // ✅ Add this
//     title: string;
//     issuedBy: string;
//     year: string;
//   }>;
//   hobbies?: Array<{                       // ✅ Add this
//     name: string;
//     description: string;
//     proficiencyLevel?: string;
//     achievement?: string;
//   }>;
//   interests?: Array<{                     // ✅ Add this
//     name: string;
//     description: string;
//     category?: string;
//   }>;
//   languages?: Array<{                     // ✅ Add this
//     language: string;
//     proficiency: string;
//   }>;
//   publications?: Array<{                  // ✅ Add this
//     title: string;
//     authors: string;
//     publicationName: string;
//     date: string;
//     url: string;
//   }>;
//   references?: Array<{                    // ✅ Add this
//     name: string;
//     relation: string;
//     contact: string;
//   }>;
//   work_experience?: Array<{               // Keep this for backward compatibility
//     role?: string;
//   }>;
//   builder_score?: {
//     score?: number;
//   };
//   updatedAt: string;
//   createdAt: string;
// }

// export interface TemplateResponse {
//   id: number;
//   name: string;
//   subtitle?: string;
//   description?: string;
//   preview_url?: string;
//   ats_friendly?: boolean;
//   category?: string;
// }

// // ✅ Updated interface to match backend response
// export interface ResumeScoreResponse {
//   overall_score: number;
//   details?: {
//     keywords_score?: number;
//     grammar_score?: number;
//     skills_match?: number;
//     improvement_suggestions?: string[];
//   } | null;
// }

// // ✅ Builder Score Response (from GET endpoint)
// export interface BuilderScoreResponse {
//   resume_id: string;
//   score: number;
//   calculated_at: string;
// }

// export interface DefaultTemplateResponse {
//   id: number;
//   name: string;
//   description?: string;
//   preview_url?: string;
// }

// export interface TemplateResponse {
//   id: number;
//   name: string;
//   subtitle?: string;
//   description?: string;
//   preview_url?: string;
//   ats_friendly?: boolean;
//   category?: string;
// }

// // ==================== CREATE RESUME ====================
// export const createResumeWithAuth = async (): Promise<ResumeResponse> => {
//   try {
//     console.log("📤 Creating resume with authenticated user...");
    
//     const token = localStorage.getItem("access_token");
//     const email = localStorage.getItem("user_email");
//     const username = localStorage.getItem("username");
    
//     if (!email || !email.includes("@")) {
//       throw new Error("Invalid email. Please sign in again.");
//     }
    
//     const resumeData = {
//       title: "Untitled Resume",
//       personalInfo: {
//         name: username || email.split('@')[0],
//         email: email,
//       },
//     };

//     console.log("📋 Creating resume for:", resumeData);
//     console.log("🔍 POST URL:", `${httpClient.defaults.baseURL}/resumes/`);
//     console.log("Access Token:", localStorage.getItem("access_token"));

    
//     const response = await httpClient.post<ResumeResponse>(
//       '/resumes/',
//       resumeData,
//        {
//         headers: {
//           Authorization: `Bearer ${token}`, // ✅ important
//         },
//       }
//     );
    
//     const resumeId = response.data.id || (response.data as any)._id;
    
//     console.log("✅ Resume created with ID:", resumeId);
    
//     if (resumeId) {
//       localStorage.setItem("current_resume_id", resumeId);
//       return {
//         ...response.data,
//         id: resumeId,
//       };
//     }
    
//     throw new Error("Resume created but no ID returned");
    
//   } catch (error) {
//     console.error("❌ Error creating resume:", error);
    
//     if (axios.isAxiosError(error)) {
//       const status = error.response?.status;
//       const detail = error.response?.data?.detail;
      
//       console.error("🔥 Create resume error details:", {
//         status,
//         detail,
//         fullURL: `${error.config?.baseURL}${error.config?.url}`,
//         data: error.response?.data
//       });
      
//       if (status === 401) {
//         throw new Error("Authentication failed. Please sign in again.");
//       }
      
//       if (status === 409) {
//         console.log("⚠️ Resume already exists (409 conflict)");
//         throw new Error("RESUME_EXISTS");
//       }
      
//       if (status === 422) {
//         const validationDetail = detail?.detail || detail;
//         if (Array.isArray(validationDetail)) {
//           const errors = validationDetail.map((err: any) => 
//             `${err.loc?.join('.')} - ${err.msg}`
//           ).join(', ');
//           throw new Error(`Validation error: ${errors}`);
//         }
//         throw new Error(validationDetail?.message || validationDetail || "Invalid resume data");
//       }
      
//       throw new Error(detail || "Failed to create resume");
//     }
    
//     throw error;
//   }
// };

// // ==================== GET ALL RESUMES ====================
// export const getAllResumes = async (): Promise<ResumeResponse[]> => {
//   try {
//     console.log("📥 Fetching resumes...");
//     const fullURL = `${httpClient.defaults.baseURL}/resumes`;
//     console.log("🔍 GET Full Request URL:", fullURL);
    
//     const token = localStorage.getItem("access_token");
//     const email = localStorage.getItem("user_email");
    
//     if (!token) {
//       throw new Error("No authentication token found");
//     }
    
//     console.log("👤 Auth check:", { email, hasToken: !!token });
    
//     const response = await httpClient.get('/resumes');
    
//     console.log("✅ Response received:", {
//       status: response.status,
//       dataType: typeof response.data,
//       isArray: Array.isArray(response.data),
//       dataLength: response.data?.length,
//       rawData: response.data
//     });
    
//     if (Array.isArray(response.data)) {
//       console.log("✅ Processing", response.data.length, "resume(s)");
      
//       const transformedResumes = response.data.map((resume: any) => {
//         const resumeId = resume.id || resume._id;
        
//         if (!resumeId) {
//           console.error("⚠️ Resume missing ID:", resume);
//         }
        
//         console.log("🔄 Transforming resume:", { 
//           original_id: resume.id, 
//           original_underscore_id: resume._id,
//           final_id: resumeId 
//         });
        
//         return {
//           ...resume,
//           id: resumeId,
//         };
//       });
      
//       const validResumes = transformedResumes.filter(r => r.id);
      
//       if (validResumes.length > 0 && validResumes[0].id) {
//         const firstResumeId = validResumes[0].id;
//         console.log("💾 Storing first resume ID:", firstResumeId);
//         localStorage.setItem("current_resume_id", firstResumeId);
//       }
      
//       return validResumes;
//     }
    
//     if (response.data && typeof response.data === 'object') {
//       const resumeId = response.data.id || response.data._id;
      
//       if (resumeId) {
//         console.log("✅ Single resume received, ID:", resumeId);
//         const transformedResume = {
//           ...response.data,
//           id: resumeId,
//         };
//         localStorage.setItem("current_resume_id", resumeId);
//         return [transformedResume];
//       }
//     }
    
//     console.log("⚠️ No valid resumes found in response");
//     return [];
    
//   } catch (error) {
//     console.error('❌ Error fetching resumes:', error);
    
//     if (axios.isAxiosError(error)) {
//       console.error("🔥 Fetch error details:", {
//         status: error.response?.status,
//         statusText: error.response?.statusText,
//         data: error.response?.data,
//         url: error.config?.url,
//         baseURL: error.config?.baseURL,
//         fullURL: `${error.config?.baseURL}${error.config?.url}`,
//       });
      
//       if (error.response?.status === 404) {
//         console.error("⚠️ 404 - Endpoint not found. Check your API route!");
//         throw new Error("Resume endpoint not found. Please check API configuration.");
//       }
      
//       if (error.response?.status === 401) {
//         console.error("🔐 Authentication failed");
//         throw new Error("Please sign in again");
//       }
//     }
    
//     throw error;
//   }
// };

// // ==================== UPDATE RESUME ====================
// export const updateResume = async (
//   resumeId: string, 
//   resumeData: Partial<ResumeResponse>
// ): Promise<ResumeResponse> => {
//   try {
//     console.log("📝 Updating resume:", resumeId);
//     console.log("📋 Update payload:", JSON.stringify(resumeData, null, 2));
    
//     const baseURL = httpClient.defaults.baseURL;
//     const endpoint = `/resumes/${resumeId}`;
//     const fullURL = `${baseURL}${endpoint}`;
    
//     console.log("🔍 Full URL:", fullURL);
//     console.log("🔍 BaseURL:", baseURL);
//     console.log("🔍 Endpoint:", endpoint);
//     console.log("🔍 Resume ID:", resumeId);
//     console.log("🔍 Resume ID length:", resumeId.length);
//     console.log("🔍 Resume ID type:", typeof resumeId);
    
//     const token = localStorage.getItem("access_token");
//     console.log("🔐 Has token:", !!token);
    
//     const response = await httpClient.patch<ResumeResponse>(
//       endpoint,
//       resumeData
//     );
    
//     console.log("✅ Resume updated successfully:", response.data);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error updating resume:", error);
    
//     if (axios.isAxiosError(error)) {
//       console.error("🔥 Update error details:", {
//         status: error.response?.status,
//         statusText: error.response?.statusText,
//         data: error.response?.data,
//         url: error.config?.url,
//         method: error.config?.method,
//         resumeId: resumeId,
//         fullURL: `${error.config?.baseURL}${error.config?.url}`,
//         headers: error.config?.headers,
//       });
      
//       if (error.response?.status === 404) {
//         const errorMsg = `Resume with ID ${resumeId} not found at ${error.config?.baseURL}${error.config?.url}. Please refresh the page.`;
//         console.error("❌ 404 Error:", errorMsg);
//         throw new Error(errorMsg);
//       }
      
//       if (error.response?.status === 422) {
//         const detail = error.response?.data?.detail;
//         if (Array.isArray(detail)) {
//           const errors = detail.map((err: any) => 
//             `${err.loc?.join('.')} - ${err.msg}`
//           ).join(', ');
//           throw new Error(`Validation error: ${errors}`);
//         }
//         throw new Error("Invalid data format. Please check your inputs.");
//       }
      
//       if (error.response?.status === 401) {
//         throw new Error("Session expired. Please log in again.");
//       }
      
//       const backendError = error.response?.data?.detail || error.response?.data?.message;
//       throw new Error(backendError || "Failed to update resume");
//     }
    
//     throw error;
//   }
// };


// // ==================== GET RESUME BY ID ====================
// export const getResumeById = async (resumeId: string): Promise<ResumeResponse> => {
//   try {
//     console.log("📥 Fetching resume by ID:", resumeId);
    
//     const response = await httpClient.get<ResumeResponse>(`/resumes/${resumeId}`);
    
//     console.log("✅ Resume fetched successfully:", response.data);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error fetching resume:", error);
    
//     if (axios.isAxiosError(error)) {
//       if (error.response?.status === 404) {
//         throw new Error("Resume not found");
//       }
//       if (error.response?.status === 401) {
//         throw new Error("Please sign in again");
//       }
//     }
    
//     throw error;
//   }
// };


// // ==================== DELETE SECTION ====================
// export const deleteResumeSection = async (
//   resumeId: string,
//   section: string
// ): Promise<void> => {
//   try {
//     console.log("🗑️ Deleting section:", section);
    
//     await httpClient.delete(`/resumes/${resumeId}/sections/${section}`);
    
//     console.log("✅ Section deleted successfully");
    
//   } catch (error) {
//     console.error("❌ Error deleting section:", error);
//     throw error;
//   }
// };

// // ==================== DELETE SECTION ITEM ====================
// export const deleteResumeSectionItem = async (
//   resumeId: string,
//   section: string,
//   itemId: string
// ): Promise<void> => {
//   try {
//     console.log("🗑️ Deleting item from section:", { section, itemId });
    
//     await httpClient.delete(`/resumes/${resumeId}/sections/${section}/items/${itemId}`);
    
//     console.log("✅ Section item deleted successfully");
    
//   } catch (error) {
//     console.error("❌ Error deleting section item:", error);
//     throw error;
//   }
// };

// // ==================== TRIGGER SCORE CALCULATION ====================
// // ✅ FIXED: Use correct endpoint from API docs
// export const triggerScoreCalculation = async (resumeId: string): Promise<void> => {
//   try {
//     console.log("🚀 Triggering score calculation for resume:", resumeId);
    
//     // ✅ CORRECT: POST /api/v1/resumes/{resume_id}/calculate-score
//     const response = await httpClient.post(`/resumes/${resumeId}/calculate-score`);
    
//     console.log("✅ Score calculation triggered:", response.data);
    
//   } catch (error) {
//     console.error("❌ Error triggering score calculation:", error);
//     throw error;
//   }
// };

// // ==================== GET BUILDER SCORE ====================
// // ✅ FIXED: Use correct endpoint from API docs
// export const getBuilderScore = async (resumeId: string): Promise<BuilderScoreResponse> => {
//   try {
//     console.log("📊 Fetching builder score for resume:", resumeId);
    
//     // ✅ CORRECT: GET /api/v1/resumes/{resume_id}/score
//     const response = await httpClient.get<BuilderScoreResponse>(
//       `/resumes/${resumeId}/score`
//     );
    
//     console.log("✅ Builder score fetched:", response.data);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error fetching builder score:", error);
//     throw error;
//   }
// };

// // ==================== GET RESUME SCORE WITH POLLING ====================
// // ✅ This stays the same - uses the corrected functions above
// export const getResumeScore = async (resumeId: string): Promise<ResumeScoreResponse> => {
//   try {
//     console.log("⭐ Starting score calculation flow for resume:", resumeId);
    
//     // Step 1: Trigger calculation
//     await triggerScoreCalculation(resumeId);
    
//     // Step 2: Poll for result
//     const maxAttempts = 10;
//     const pollInterval = 2000; // 2 seconds
    
//     for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//       console.log(`📊 Polling attempt ${attempt}/${maxAttempts}...`);
      
//       // Wait before polling
//       await new Promise(resolve => setTimeout(resolve, pollInterval));
      
//       try {
//         const builderScore = await getBuilderScore(resumeId);
        
//         console.log(`✅ Score received (attempt ${attempt}):`, builderScore.score);
        
//         // If score is greater than 0, return it
//         if (builderScore.score > 0) {
//           console.log("✅ Valid score received:", builderScore.score);
          
//           // Return in the expected format
//           return {
//             overall_score: builderScore.score,
//             details: {
//               keywords_score: Math.floor(builderScore.score * 0.9), // Approximate
//               grammar_score: Math.floor(builderScore.score * 0.95), // Approximate
//               skills_match: Math.floor(builderScore.score * 0.85), // Approximate
//               improvement_suggestions: builderScore.score < 70 
//                 ? ["Add more keywords", "Improve formatting", "Add more skills"]
//                 : builderScore.score < 90
//                 ? ["Fine-tune your summary", "Add certifications"]
//                 : ["Your resume looks great!"]
//             }
//           };
//         }
        
//         console.log(`⏳ Score is still 0, continuing to poll...`);
        
//       } catch (pollError) {
//         console.warn(`⚠️ Poll attempt ${attempt} failed:`, pollError);
//         // Continue polling on error
//       }
//     }
    
//     // If we get here, polling timed out
//     console.warn("⏱️ Polling timeout - returning default score");
//     throw new Error("Score calculation timeout. Please try again later.");
    
//   } catch (error) {
//     console.error("❌ Error in score calculation flow:", error);
//     throw error;
//   }
// };


// // ==================== DELETE RESUME ====================
// export const deleteResume = async (resumeId: string): Promise<void> => {
//   try {
//     console.log("🗑️ Deleting resume:", resumeId);
    
//     await httpClient.delete(`/resumes/${resumeId}`);
    
//     console.log("✅ Resume deleted");
//     localStorage.removeItem("current_resume_id");
    
//   } catch (error) {
//     console.error('❌ Error deleting resume:', error);
//     throw error;
//   }
// };


// // ==================== AUTO-SAVE RESUME ====================
// export const autoSaveResume = async (
//   resumeId: string, 
//   resumeData: Partial<ResumeResponse>
// ): Promise<ResumeResponse> => {
//   try {
//     console.log("💾 Auto-saving resume:", resumeId);
    
//     const response = await httpClient.patch<ResumeResponse>(
//       `/resumes/${resumeId}/autosave`,
//       resumeData
//     );
    
//     console.log("✅ Auto-save successful");
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Auto-save failed:", error);
//     throw error;
//   }
// };

// // ==================== GET DRAFT RESUMES ====================
// export const getDraftResumes = async (): Promise<ResumeResponse[]> => {
//   try {
//     console.log("📥 Fetching draft resumes...");
    
//     const response = await httpClient.get<ResumeResponse[]>('/resumes/status/drafts');
    
//     console.log("✅ Draft resumes fetched:", response.data.length);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error fetching drafts:", error);
//     throw error;
//   }
// };

// // ==================== GET COMPLETED RESUMES ====================
// export const getCompletedResumes = async (): Promise<ResumeResponse[]> => {
//   try {
//     console.log("📥 Fetching completed resumes...");
    
//     const response = await httpClient.get<ResumeResponse[]>('/resumes/status/completed');
    
//     console.log("✅ Completed resumes fetched:", response.data.length);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error fetching completed resumes:", error);
//     throw error;
//   }
// };

// // Add this to your resumeApi.ts file

// export const publishResume = async (resumeId: string): Promise<void> => {
//   try {
//     const response = await fetch(`resumes/${resumeId}/publish`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         // Add auth headers if needed
//       },
//     });

//     if (!response.ok) {
//       throw new Error(`Publish failed: ${response.statusText}`);
//     }

//     console.log("✅ Resume published successfully");
//   } catch (error) {
//     console.error("❌ Publish API error:", error);
//     throw error;
//   }
// };

// // // ==================== DOWNLOAD RESUME ====================
// // export const downloadResume = async (resumeId: string, format: 'pdf' | 'doc'): Promise<Blob> => {
// //   try {
// //     console.log("⬇️ Downloading resume:", resumeId, "Format:", format);
    
// //     const response = await httpClient.get(
// //       `/resumes/${resumeId}/download?format=${format}`,
// //       {
// //         responseType: 'blob',
// //       }
// //     );

// //     return response.data;
    
// //   } catch (error) {
// //     console.error('❌ Error downloading:', error);
// //     throw error;
// //   }
// // };
// // ==================== DOWNLOAD RESUME ====================
// // export const downloadResume = async (resumeId: string, format: 'pdf' | 'doc'): Promise<Blob> => {
// //   try {
// //     console.log("⬇️ Downloading resume:", resumeId, "Format:", format);
// //     console.log("🔍 Download URL:", `${httpClient.defaults.baseURL}/resumes/${resumeId}/download?format=${format}`);
    
// //     const response = await httpClient.get(
// //       `/resumes/${resumeId}/download?format=${format}`,
// //       {
// //         responseType: 'blob',
// //       }
// //     );

// //     console.log("✅ Download response received:", {
// //       status: response.status,
// //       contentType: response.headers['content-type'],
// //       size: response.data.size
// //     });

// //     return response.data;
    
// //   } catch (error) {
// //     console.error('❌ Error downloading:', error);
    
// //     if (axios.isAxiosError(error)) {
// //       console.error("🔥 Download error details:", {
// //         status: error.response?.status,
// //         statusText: error.response?.statusText,
// //         data: error.response?.data,
// //         url: error.config?.url,
// //         fullURL: `${error.config?.baseURL}${error.config?.url}`,
// //       });
      
// //       if (error.response?.status === 400) {
// //         throw new Error("Invalid request. Please check the resume ID and format.");
// //       }
      
// //       if (error.response?.status === 404) {
// //         throw new Error("Download endpoint not found. This feature may not be available yet.");
// //       }
      
// //       if (error.response?.status === 500) {
// //         throw new Error("Server error while generating file. Please try again later.");
// //       }
// //     }
    
// //     throw error;
// //   }
// // };




// // ==================== DOWNLOAD RESUME ====================
// export const downloadResume = async (
//   resumeId: string, 
//   format: 'pdf' | 'doc' | 'docx' // ✅ Add docx option
// ): Promise<Blob> => {
//   try {
//     console.log("⬇️ Downloading resume:", resumeId, "Format:", format);
    
//     // ✅ Backend might expect 'docx' instead of 'doc'
//     const backendFormat = format === 'doc' ? 'docx' : format;
    
//     console.log("🔍 Download URL:", `${httpClient.defaults.baseURL}/resumes/${resumeId}/download?format=${backendFormat}`);
    
//     const response = await httpClient.get(
//       `/resumes/${resumeId}/download?format=${backendFormat}`,
//       {
//         responseType: 'blob',
//       }
//     );

//     console.log("✅ Download response received:", {
//       status: response.status,
//       contentType: response.headers['content-type'],
//       size: response.data.size
//     });

//     return response.data;
    
//   } catch (error) {
//     console.error('❌ Error downloading:', error);
    
//     if (axios.isAxiosError(error)) {
//       console.error("🔥 Download error details:", {
//         status: error.response?.status,
//         statusText: error.response?.statusText,
//         data: error.response?.data,
//         url: error.config?.url,
//         fullURL: `${error.config?.baseURL}${error.config?.url}`,
//       });
      
//       if (error.response?.status === 422) {
//         // ✅ Try to parse validation error
//         const detail = error.response?.data?.detail;
        
//         if (Array.isArray(detail)) {
//           const errors = detail.map((err: any) => 
//             `${err.loc?.join('.')} - ${err.msg}`
//           ).join(', ');
//           throw new Error(`Validation error: ${errors}`);
//         }
        
//         throw new Error("Invalid format or resume data. Make sure your resume has all required fields filled.");
//       }
      
//       if (error.response?.status === 400) {
//         throw new Error("Invalid request. Please check the resume ID and format.");
//       }
      
//       if (error.response?.status === 404) {
//         throw new Error("Download endpoint not found. This feature may not be available yet.");
//       }
      
//       if (error.response?.status === 500) {
//         throw new Error("Server error while generating file. Please try again later.");
//       }
//     }
    
//     throw error;
//   }
// };

// /**
//  * GET /api/v1/templates/categories - List templates by category
//  */
// export const getTemplatesByCategory = async (category: string): Promise<TemplateResponse[]> => {
//   try {
//     console.log("📋 Fetching templates for category:", category);
    
//     const response = await httpClient.get<TemplateResponse[]>(
//       `/templates/categories?category=${category}`
//     );
    
//     console.log("✅ Templates fetched:", response.data.length);
//     return response.data;
//   } catch (error) {
//     console.error("❌ Error fetching templates by category:", error);
//     throw error;
//   }
// };

// /**
//  * GET /api/v1/templates/ - List all templates
//  */
// export const getAllTemplates = async (): Promise<TemplateResponse[]> => {
//   try {
//     console.log("📋 Fetching all templates...");
    
//     const response = await httpClient.get<TemplateResponse[]>('/templates/');
    
//     console.log("✅ All templates fetched:", response.data.length);
//     return response.data;
//   } catch (error) {
//     console.error("❌ Error fetching all templates:", error);
//     throw error;
//   }
// }; before templated id after template list


// import axios from 'axios';
// import { httpClient } from '@/lib/http';

// // export interface ResumeResponse {
// //   id: string;
// //   personalInfo?: {
// //     name?: string;
// //     email?: string;
// //   };
// //   work_experience?: Array<{
// //     role?: string;
// //   }>;
// //   builder_score?: {
// //     score?: number;
// //   };
// //   updatedAt: string;
// //   createdAt: string;
// // }
// export interface ResumeResponse {
//   id: string;
//   personalInfo?: {
//     name?: string;
//     email?: string;
//     phone?: string;        // ✅ Add these
//     location?: string;      // ✅ Add these
//     linkedinurl?: string;   // ✅ Add these
//     portifoliourl?: string; // ✅ Add these
//   };
//   professionalSummary?: string;           // ✅ Add this
//   education?: Array<{                     // ✅ Add this
//     school: string;
//     degree: string;
//     startDate: string;
//     endDate: string;
//   }>;
//   workExperience?: Array<{                // ✅ Add this (note: workExperience, not work_experience)
//     company: string;
//     role: string;
//     location: string;
//     startDate: string;
//     endDate: string;
//     currentlyWorking: boolean;
//     description: string;
//   }>;
//   projects?: Array<{                      // ✅ Add this
//     title: string;
//     description: string;
//     technologies: string[];
//     startDate: string;
//     endDate: string;
//     link: string;
//   }>;
//   skills?: string[];                      // ✅ Add this
//   certifications?: Array<{                // ✅ Add this
//     name: string;
//     issuedBy: string;
//     year: string;
//   }>;
//   achievements?: Array<{                  // ✅ Add this
//     title: string;
//     date: string;
//     description: string;
//   }>;
//   volunteering?: Array<{                  // ✅ Add this
//     organization: string;
//     role: string;
//     startDate: string;
//     endDate: string;
//   }>;
//   internships?: Array<{                   // ✅ Add this
//     company: string;
//     role: string;
//     location: string;
//     startDate: string;
//     endDate: string;
//     currentlyWorking: boolean;
//     description: string;
//   }>;
//   awards?: Array<{                        // ✅ Add this
//     title: string;
//     issuedBy: string;
//     year: string;
//   }>;
//   hobbies?: Array<{                       // ✅ Add this
//     name: string;
//     description: string;
//     proficiencyLevel?: string;
//     achievement?: string;
//   }>;
//   interests?: Array<{                     // ✅ Add this
//     name: string;
//     description: string;
//     category?: string;
//   }>;
//   languages?: Array<{                     // ✅ Add this
//     language: string;
//     proficiency: string;
//   }>;
//   publications?: Array<{                  // ✅ Add this
//     title: string;
//     authors: string;
//     publicationName: string;
//     date: string;
//     url: string;
//   }>;
//   references?: Array<{                    // ✅ Add this
//     name: string;
//     relation: string;
//     contact: string;
//   }>;
//   work_experience?: Array<{               // Keep this for backward compatibility
//     role?: string;
//   }>;
//   builder_score?: {
//     score?: number;
//   };
//   updatedAt: string;
//   createdAt: string;
// }

// export interface TemplateResponse {
//   id: number;
//   name: string;
//   subtitle?: string;
//   description?: string;
//   preview_url?: string;
//   ats_friendly?: boolean;
//   category?: string;
// }

// // ✅ Updated interface to match backend response
// export interface ResumeScoreResponse {
//   overall_score: number;
//   details?: {
//     keywords_score?: number;
//     grammar_score?: number;
//     skills_match?: number;
//     improvement_suggestions?: string[];
//   } | null;
// }

// // ✅ Builder Score Response (from GET endpoint)
// export interface BuilderScoreResponse {
//   resume_id: string;
//   score: number;
//   calculated_at: string;
// }

// export interface DefaultTemplateResponse {
//   id: number;
//   name: string;
//   description?: string;
//   preview_url?: string;
// }

// export interface TemplateResponse {
//   id: number;
//   name: string;
//   subtitle?: string;
//   description?: string;
//   preview_url?: string;
//   ats_friendly?: boolean;
//   category?: string;
// }

// // ==================== CREATE RESUME ====================
// export const createResumeWithAuth = async (): Promise<ResumeResponse> => {
//   try {
//     console.log("📤 Creating resume with authenticated user...");
    
//     const token = localStorage.getItem("access_token");
//     const email = localStorage.getItem("user_email");
//     const username = localStorage.getItem("username");
    
//     if (!email || !email.includes("@")) {
//       throw new Error("Invalid email. Please sign in again.");
//     }
    
//     const resumeData = {
//       title: "Untitled Resume",
//       personalInfo: {
//         name: username || email.split('@')[0],
//         email: email,
//       },
//     };

//     console.log("📋 Creating resume for:", resumeData);
//     console.log("🔍 POST URL:", `${httpClient.defaults.baseURL}/resumes/`);
//     console.log("Access Token:", localStorage.getItem("access_token"));

    
//     const response = await httpClient.post<ResumeResponse>(
//       '/resumes/',
//       resumeData,
//        {
//         headers: {
//           Authorization: `Bearer ${token}`, // ✅ important
//         },
//       }
//     );
    
//     const resumeId = response.data.id || (response.data as any)._id;
    
//     console.log("✅ Resume created with ID:", resumeId);
    
//     if (resumeId) {
//       localStorage.setItem("current_resume_id", resumeId);
//       return {
//         ...response.data,
//         id: resumeId,
//       };
//     }
    
//     throw new Error("Resume created but no ID returned");
    
//   } 
//   catch (error) {
//     console.error("❌ Error creating resume:", error);
    
//     if (axios.isAxiosError(error)) {
//       const status = error.response?.status;
//       const detail = error.response?.data?.detail;
      
//       console.error("🔥 Create resume error details:", {
//         status,
//         detail,
//         fullURL: `${error.config?.baseURL}${error.config?.url}`,
//         data: error.response?.data
//       });
      
//       if (status === 401) {
//         throw new Error("Authentication failed. Please sign in again.");
//       }
      
//       if (status === 409) {
//         console.log("⚠️ Resume already exists (409 conflict)");
//         throw new Error("RESUME_EXISTS");
//       }
      
//       if (status === 422) {
//         const validationDetail = detail?.detail || detail;
//         if (Array.isArray(validationDetail)) {
//           const errors = validationDetail.map((err: any) => 
//             `${err.loc?.join('.')} - ${err.msg}`
//           ).join(', ');
//           throw new Error(`Validation error: ${errors}`);
//         }
//         throw new Error(validationDetail?.message || validationDetail || "Invalid resume data");
//       }
      
//       throw new Error(detail || "Failed to create resume");
//     }
    
//     throw error;
//   }
// };

// // ==================== GET ALL RESUMES ====================
// export const getAllResumes = async (): Promise<ResumeResponse[]> => {
//   try {
//     console.log("📥 Fetching resumes...");
//     const fullURL = `${httpClient.defaults.baseURL}/resumes`;
//     console.log("🔍 GET Full Request URL:", fullURL);
    
//     const token = localStorage.getItem("access_token");
//     const email = localStorage.getItem("user_email");
    
//     if (!token) {
//       throw new Error("No authentication token found");
//     }
    
//     console.log("👤 Auth check:", { email, hasToken: !!token });
    
//     const response = await httpClient.get('/resumes');
    
//     console.log("✅ Response received:", {
//       status: response.status,
//       dataType: typeof response.data,
//       isArray: Array.isArray(response.data),
//       dataLength: response.data?.length,
//       rawData: response.data
//     });
    
//     if (Array.isArray(response.data)) {
//       console.log("✅ Processing", response.data.length, "resume(s)");
      
//       const transformedResumes = response.data.map((resume: any) => {
//         const resumeId = resume.id || resume._id;
        
//         if (!resumeId) {
//           console.error("⚠️ Resume missing ID:", resume);
//         }
        
//         console.log("🔄 Transforming resume:", { 
//           original_id: resume.id, 
//           original_underscore_id: resume._id,
//           final_id: resumeId 
//         });
        
//         return {
//           ...resume,
//           id: resumeId,
//         };
//       });
      
//       const validResumes = transformedResumes.filter(r => r.id);
      
//       if (validResumes.length > 0 && validResumes[0].id) {
//         const firstResumeId = validResumes[0].id;
//         console.log("💾 Storing first resume ID:", firstResumeId);
//         localStorage.setItem("current_resume_id", firstResumeId);
//       }
      
//       return validResumes;
//     }
    
//     if (response.data && typeof response.data === 'object') {
//       const resumeId = response.data.id || response.data._id;
      
//       if (resumeId) {
//         console.log("✅ Single resume received, ID:", resumeId);
//         const transformedResume = {
//           ...response.data,
//           id: resumeId,
//         };
//         localStorage.setItem("current_resume_id", resumeId);
//         return [transformedResume];
//       }
//     }
    
//     console.log("⚠️ No valid resumes found in response");
//     return [];
    
//   } catch (error) {
//     console.error('❌ Error fetching resumes:', error);
    
//     if (axios.isAxiosError(error)) {
//       console.error("🔥 Fetch error details:", {
//         status: error.response?.status,
//         statusText: error.response?.statusText,
//         data: error.response?.data,
//         url: error.config?.url,
//         baseURL: error.config?.baseURL,
//         fullURL: `${error.config?.baseURL}${error.config?.url}`,
//       });
      
//       if (error.response?.status === 404) {
//         console.error("⚠️ 404 - Endpoint not found. Check your API route!");
//         throw new Error("Resume endpoint not found. Please check API configuration.");
//       }
      
//       if (error.response?.status === 401) {
//         console.error("🔐 Authentication failed");
//         throw new Error("Please sign in again");
//       }
//     }
    
//     throw error;
//   }
// };

// // ==================== UPDATE RESUME ====================
// export const updateResume = async (
//   resumeId: string, 
//   resumeData: Partial<ResumeResponse>
// ): Promise<ResumeResponse> => {
//   try {
//     console.log("📝 Updating resume:", resumeId);
//     console.log("📋 Update payload:", JSON.stringify(resumeData, null, 2));
    
//     const baseURL = httpClient.defaults.baseURL;
//     const endpoint = `/resumes/${resumeId}`;
//     const fullURL = `${baseURL}${endpoint}`;
    
//     console.log("🔍 Full URL:", fullURL);
//     console.log("🔍 BaseURL:", baseURL);
//     console.log("🔍 Endpoint:", endpoint);
//     console.log("🔍 Resume ID:", resumeId);
//     console.log("🔍 Resume ID length:", resumeId.length);
//     console.log("🔍 Resume ID type:", typeof resumeId);
    
//     const token = localStorage.getItem("access_token");
//     console.log("🔐 Has token:", !!token);
    
//     const response = await httpClient.patch<ResumeResponse>(
//       endpoint,
//       resumeData
//     );
    
//     console.log("✅ Resume updated successfully:", response.data);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error updating resume:", error);
    
//     if (axios.isAxiosError(error)) {
//       console.error("🔥 Update error details:", {
//         status: error.response?.status,
//         statusText: error.response?.statusText,
//         data: error.response?.data,
//         url: error.config?.url,
//         method: error.config?.method,
//         resumeId: resumeId,
//         fullURL: `${error.config?.baseURL}${error.config?.url}`,
//         headers: error.config?.headers,
//       });
      
//       if (error.response?.status === 404) {
//         const errorMsg = `Resume with ID ${resumeId} not found at ${error.config?.baseURL}${error.config?.url}. Please refresh the page.`;
//         console.error("❌ 404 Error:", errorMsg);
//         throw new Error(errorMsg);
//       }
      
//       if (error.response?.status === 422) {
//         const detail = error.response?.data?.detail;
//         if (Array.isArray(detail)) {
//           const errors = detail.map((err: any) => 
//             `${err.loc?.join('.')} - ${err.msg}`
//           ).join(', ');
//           throw new Error(`Validation error: ${errors}`);
//         }
//         throw new Error("Invalid data format. Please check your inputs.");
//       }
      
//       if (error.response?.status === 401) {
//         throw new Error("Session expired. Please log in again.");
//       }
      
//       const backendError = error.response?.data?.detail || error.response?.data?.message;
//       throw new Error(backendError || "Failed to update resume");
//     }
    
//     throw error;
//   }
// };


// // ==================== GET RESUME BY ID ====================
// export const getResumeById = async (resumeId: string): Promise<ResumeResponse> => {
//   try {
//     console.log("📥 Fetching resume by ID:", resumeId);
    
//     const response = await httpClient.get<ResumeResponse>(`/resumes/${resumeId}`);
    
//     console.log("✅ Resume fetched successfully:", response.data);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error fetching resume:", error);
    
//     if (axios.isAxiosError(error)) {
//       if (error.response?.status === 404) {
//         throw new Error("Resume not found");
//       }
//       if (error.response?.status === 401) {
//         throw new Error("Please sign in again");
//       }
//     }
    
//     throw error;
//   }
// };


// // ==================== DELETE SECTION ====================
// export const deleteResumeSection = async (
//   resumeId: string,
//   section: string
// ): Promise<void> => {
//   try {
//     console.log("🗑️ Deleting section:", section);
    
//     await httpClient.delete(`/resumes/${resumeId}/sections/${section}`);
    
//     console.log("✅ Section deleted successfully");
    
//   } catch (error) {
//     console.error("❌ Error deleting section:", error);
//     throw error;
//   }
// };

// // ==================== DELETE SECTION ITEM ====================
// export const deleteResumeSectionItem = async (
//   resumeId: string,
//   section: string,
//   itemId: string
// ): Promise<void> => {
//   try {
//     console.log("🗑️ Deleting item from section:", { section, itemId });
    
//     await httpClient.delete(`/resumes/${resumeId}/sections/${section}/items/${itemId}`);
    
//     console.log("✅ Section item deleted successfully");
    
//   } catch (error) {
//     console.error("❌ Error deleting section item:", error);
//     throw error;
//   }
// };

// // ==================== TRIGGER SCORE CALCULATION ====================
// // ✅ FIXED: Use correct endpoint from API docs
// export const triggerScoreCalculation = async (resumeId: string): Promise<void> => {
//   try {
//     console.log("🚀 Triggering score calculation for resume:", resumeId);
    
//     // ✅ CORRECT: POST /api/v1/resumes/{resume_id}/calculate-score
//     const response = await httpClient.post(`/resumes/${resumeId}/calculate-score`);
    
//     console.log("✅ Score calculation triggered:", response.data);
    
//   } catch (error) {
//     console.error("❌ Error triggering score calculation:", error);
//     throw error;
//   }
// };

// // ==================== GET BUILDER SCORE ====================
// // ✅ FIXED: Use correct endpoint from API docs
// export const getBuilderScore = async (resumeId: string): Promise<BuilderScoreResponse> => {
//   try {
//     console.log("📊 Fetching builder score for resume:", resumeId);
    
//     // ✅ CORRECT: GET /api/v1/resumes/{resume_id}/score
//     const response = await httpClient.get<BuilderScoreResponse>(
//       `/resumes/${resumeId}/score`
//     );
    
//     console.log("✅ Builder score fetched:", response.data);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error fetching builder score:", error);
//     throw error;
//   }
// };

// // ==================== GET RESUME SCORE WITH POLLING ====================
// // ✅ This stays the same - uses the corrected functions above
// export const getResumeScore = async (resumeId: string): Promise<ResumeScoreResponse> => {
//   try {
//     console.log("⭐ Starting score calculation flow for resume:", resumeId);
    
//     // Step 1: Trigger calculation
//     await triggerScoreCalculation(resumeId);
    
//     // Step 2: Poll for result
//     const maxAttempts = 10;
//     const pollInterval = 2000; // 2 seconds
    
//     for (let attempt = 1; attempt <= maxAttempts; attempt++) {
//       console.log(`📊 Polling attempt ${attempt}/${maxAttempts}...`);
      
//       // Wait before polling
//       await new Promise(resolve => setTimeout(resolve, pollInterval));
      
//       try {
//         const builderScore = await getBuilderScore(resumeId);
        
//         console.log(`✅ Score received (attempt ${attempt}):`, builderScore.score);
        
//         // If score is greater than 0, return it
//         if (builderScore.score > 0) {
//           console.log("✅ Valid score received:", builderScore.score);
          
//           // Return in the expected format
//           return {
//             overall_score: builderScore.score,
//             details: {
//               keywords_score: Math.floor(builderScore.score * 0.9), // Approximate
//               grammar_score: Math.floor(builderScore.score * 0.95), // Approximate
//               skills_match: Math.floor(builderScore.score * 0.85), // Approximate
//               improvement_suggestions: builderScore.score < 70 
//                 ? ["Add more keywords", "Improve formatting", "Add more skills"]
//                 : builderScore.score < 90
//                 ? ["Fine-tune your summary", "Add certifications"]
//                 : ["Your resume looks great!"]
//             }
//           };
//         }
        
//         console.log(`⏳ Score is still 0, continuing to poll...`);
        
//       } catch (pollError) {
//         console.warn(`⚠️ Poll attempt ${attempt} failed:`, pollError);
//         // Continue polling on error
//       }
//     }
    
//     // If we get here, polling timed out
//     console.warn("⏱️ Polling timeout - returning default score");
//     throw new Error("Score calculation timeout. Please try again later.");
    
//   } catch (error) {
//     console.error("❌ Error in score calculation flow:", error);
//     throw error;
//   }
// };


// // ==================== DELETE RESUME ====================
// export const deleteResume = async (resumeId: string): Promise<void> => {
//   try {
//     console.log("🗑️ Deleting resume:", resumeId);
    
//     await httpClient.delete(`/resumes/${resumeId}`);
    
//     console.log("✅ Resume deleted");
//     localStorage.removeItem("current_resume_id");
    
//   } catch (error) {
//     console.error('❌ Error deleting resume:', error);
//     throw error;
//   }
// };


// // ==================== AUTO-SAVE RESUME ====================
// export const autoSaveResume = async (
//   resumeId: string, 
//   resumeData: Partial<ResumeResponse>
// ): Promise<ResumeResponse> => {
//   try {
//     console.log("💾 Auto-saving resume:", resumeId);
    
//     const response = await httpClient.patch<ResumeResponse>(
//       `/resumes/${resumeId}/autosave`,
//       resumeData
//     );
    
//     console.log("✅ Auto-save successful");
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Auto-save failed:", error);
//     throw error;
//   }
// };

// // ==================== GET DRAFT RESUMES ====================
// export const getDraftResumes = async (): Promise<ResumeResponse[]> => {
//   try {
//     console.log("📥 Fetching draft resumes...");
    
//     const response = await httpClient.get<ResumeResponse[]>('/resumes/status/drafts');
    
//     console.log("✅ Draft resumes fetched:", response.data.length);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error fetching drafts:", error);
//     throw error;
//   }
// };

// // ==================== GET COMPLETED RESUMES ====================
// export const getCompletedResumes = async (): Promise<ResumeResponse[]> => {
//   try {
//     console.log("📥 Fetching completed resumes...");
    
//     const response = await httpClient.get<ResumeResponse[]>('/resumes/status/completed');
    
//     console.log("✅ Completed resumes fetched:", response.data.length);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error fetching completed resumes:", error);
//     throw error;
//   }
// };

// // Add this to your resumeApi.ts file

// export const publishResume = async (resumeId: string): Promise<void> => {
//   try {
//     const response = await fetch(`resumes/${resumeId}/publish`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         // Add auth headers if needed
//       },
//     });

//     if (!response.ok) {
//       throw new Error(`Publish failed: ${response.statusText}`);
//     }

//     console.log("✅ Resume published successfully");
//   } catch (error) {
//     console.error("❌ Publish API error:", error);
//     throw error;
//   }
// };

// // // ==================== DOWNLOAD RESUME ====================
// // export const downloadResume = async (resumeId: string, format: 'pdf' | 'doc'): Promise<Blob> => {
// //   try {
// //     console.log("⬇️ Downloading resume:", resumeId, "Format:", format);
    
// //     const response = await httpClient.get(
// //       `/resumes/${resumeId}/download?format=${format}`,
// //       {
// //         responseType: 'blob',
// //       }
// //     );

// //     return response.data;
    
// //   } catch (error) {
// //     console.error('❌ Error downloading:', error);
// //     throw error;
// //   }
// // };
// // ==================== DOWNLOAD RESUME ====================
// // export const downloadResume = async (resumeId: string, format: 'pdf' | 'doc'): Promise<Blob> => {
// //   try {
// //     console.log("⬇️ Downloading resume:", resumeId, "Format:", format);
// //     console.log("🔍 Download URL:", `${httpClient.defaults.baseURL}/resumes/${resumeId}/download?format=${format}`);
    
// //     const response = await httpClient.get(
// //       `/resumes/${resumeId}/download?format=${format}`,
// //       {
// //         responseType: 'blob',
// //       }
// //     );

// //     console.log("✅ Download response received:", {
// //       status: response.status,
// //       contentType: response.headers['content-type'],
// //       size: response.data.size
// //     });

// //     return response.data;
    
// //   } catch (error) {
// //     console.error('❌ Error downloading:', error);
    
// //     if (axios.isAxiosError(error)) {
// //       console.error("🔥 Download error details:", {
// //         status: error.response?.status,
// //         statusText: error.response?.statusText,
// //         data: error.response?.data,
// //         url: error.config?.url,
// //         fullURL: `${error.config?.baseURL}${error.config?.url}`,
// //       });
      
// //       if (error.response?.status === 400) {
// //         throw new Error("Invalid request. Please check the resume ID and format.");
// //       }
      
// //       if (error.response?.status === 404) {
// //         throw new Error("Download endpoint not found. This feature may not be available yet.");
// //       }
      
// //       if (error.response?.status === 500) {
// //         throw new Error("Server error while generating file. Please try again later.");
// //       }
// //     }
    
// //     throw error;
// //   }
// // };




// // ==================== DOWNLOAD RESUME ====================
// export const downloadResume = async (
//   resumeId: string, 
//   format: 'pdf' | 'doc' | 'docx' // ✅ Add docx option
// ): Promise<Blob> => {
//   try {
//     console.log("⬇️ Downloading resume:", resumeId, "Format:", format);
    
//     // ✅ Backend might expect 'docx' instead of 'doc'
//     const backendFormat = format === 'doc' ? 'docx' : format;
    
//     console.log("🔍 Download URL:", `${httpClient.defaults.baseURL}/resumes/${resumeId}/download?format=${backendFormat}`);
    
//     const response = await httpClient.get(
//       `/resumes/${resumeId}/download?format=${backendFormat}`,
//       {
//         responseType: 'blob',
//       }
//     );

//     console.log("✅ Download response received:", {
//       status: response.status,
//       contentType: response.headers['content-type'],
//       size: response.data.size
//     });

//     return response.data;
    
//   } catch (error) {
//     console.error('❌ Error downloading:', error);
    
//     if (axios.isAxiosError(error)) {
//       console.error("🔥 Download error details:", {
//         status: error.response?.status,
//         statusText: error.response?.statusText,
//         data: error.response?.data,
//         url: error.config?.url,
//         fullURL: `${error.config?.baseURL}${error.config?.url}`,
//       });
      
//       if (error.response?.status === 422) {
//         // ✅ Try to parse validation error
//         const detail = error.response?.data?.detail;
        
//         if (Array.isArray(detail)) {
//           const errors = detail.map((err: any) => 
//             `${err.loc?.join('.')} - ${err.msg}`
//           ).join(', ');
//           throw new Error(`Validation error: ${errors}`);
//         }
        
//         throw new Error("Invalid format or resume data. Make sure your resume has all required fields filled.");
//       }
      
//       if (error.response?.status === 400) {
//         throw new Error("Invalid request. Please check the resume ID and format.");
//       }
      
//       if (error.response?.status === 404) {
//         throw new Error("Download endpoint not found. This feature may not be available yet.");
//       }
      
//       if (error.response?.status === 500) {
//         throw new Error("Server error while generating file. Please try again later.");
//       }
//     }
    
//     throw error;
//   }
// };

// /**
//  * GET /api/v1/templates/categories - List templates by category
//  */
// export const getTemplatesByCategory = async (category: string): Promise<TemplateResponse[]> => {
//   try {
//     console.log("📋 Fetching templates for category:", category);
    
//     const response = await httpClient.get<TemplateResponse[]>(
//       `/templates/categories?category=${category}`
//     );
    
//     console.log("✅ Templates fetched:", response.data.length);
//     return response.data;
//   } catch (error) {
//     console.error("❌ Error fetching templates by category:", error);
//     throw error;
//   }
// };

// /**
//  * GET /api/v1/templates/ - List all templates
//  */
// export const getAllTemplates = async (): Promise<TemplateResponse[]> => {
//   try {
//     console.log("📋 Fetching all templates...");
    
//     const response = await httpClient.get<TemplateResponse[]>('/templates/');
    
//     console.log("✅ All templates fetched:", response.data.length);
//     return response.data;
//   } catch (error) {
//     console.error("❌ Error fetching all templates:", error);
//     throw error;
//   }
// };

// /**
//  * GET /api/v1/templates/{template_id} - Get template by ID
//  */
// export const getTemplateById = async (templateId: number): Promise<TemplateResponse> => {
//   try {
//     console.log("📋 Fetching template details for ID:", templateId);
    
//     const response = await httpClient.get<TemplateResponse>(`/templates/${templateId}`);
    
//     console.log("✅ Template details fetched:", response.data);
//     return response.data;
//   } catch (error) {
//     console.error("❌ Error fetching template details:", error);
//     throw error;
//   }
// }; before score reser for new resume




import axios from 'axios';
import { httpClient } from '@/lib/http';
import { getCorrelationId } from '@/lib/correlationId';

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
    portifolioUrl?: string;
  };
  professionalSummary?: string;
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
  const correlationId = getCorrelationId();
  try {
    console.log("📤 Creating resume with authenticated user...", { correlationId });

    const token = localStorage.getItem("access_token");
    const email = localStorage.getItem("user_email");
    const username = localStorage.getItem("username");
    
    if (!email || !email.includes("@")) {
      throw new Error("Invalid email. Please sign in again.");
    }
    
    const resumeData = {
      personalInfo: {
        name: username || email.split('@')[0],
        email: email,
      },
    };

    console.log("📋 Creating resume for:", resumeData);
    console.log("🔍 POST URL:", `${httpClient.defaults.baseURL}/resumes/`);
    console.log("Access Token:", localStorage.getItem("access_token"));
    
    const response = await httpClient.post<ResumeResponse>(
      '/resumes/',
      resumeData,
       {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    
    const resumeId = response.data.id || (response.data as any)._id;
    
    console.log("✅ Resume created with ID:", resumeId);
    
    if (resumeId) {
      localStorage.setItem("current_resume_id", resumeId);
      
      // ✅ NEW: Mark this resume as newly created with timestamp
      if (typeof window !== 'undefined') {
        const timestamp = Date.now();
        localStorage.setItem(`resume_created_${resumeId}`, timestamp.toString());
        console.log(`⏰ Marked resume ${resumeId} as newly created at ${new Date(timestamp).toISOString()}`);
      }
      
      return {
        ...response.data,
        id: resumeId,
      };
    }
    
    throw new Error("Resume created but no ID returned");
    
  } 
  catch (error) {
    console.error("❌ Error creating resume:", error, { correlationId });

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const detail = error.response?.data?.detail;

      console.error("🔥 Create resume error details:", {
        correlationId,
        status,
        detail,
        fullURL: `${error.config?.baseURL}${error.config?.url}`,
        data: error.response?.data
      });
      
      if (status === 401) {
        throw new Error("Authentication failed. Please sign in again.");
      }
      
      if (status === 409) {
        console.log("⚠️ Resume already exists (409 conflict)");
        throw new Error("RESUME_EXISTS");
      }
      
      if (status === 422) {
        const validationDetail = detail?.detail || detail;
        if (Array.isArray(validationDetail)) {
          const errors = validationDetail.map((err: any) => 
            `${err.loc?.join('.')} - ${err.msg}`
          ).join(', ');
          throw new Error(`Validation error: ${errors}`);
        }
        throw new Error(validationDetail?.message || validationDetail || "Invalid resume data");
      }
      
      throw new Error(detail || "Failed to create resume");
    }
    
    throw error;
  }
};

// ==================== GET ALL RESUMES ====================
export const getAllResumes = async (): Promise<ResumeResponse[]> => {
  const correlationId = getCorrelationId();
  try {
    console.log("📥 Fetching resumes...", { correlationId });
    const fullURL = `${httpClient.defaults.baseURL}/resumes`;
    console.log("🔍 GET Full Request URL:", fullURL);
    
    const token = localStorage.getItem("access_token");
    const email = localStorage.getItem("user_email");
    
    if (!token) {
      throw new Error("No authentication token found");
    }
    
    console.log("👤 Auth check:", { email, hasToken: !!token });
    
    const response = await httpClient.get('/resumes');
    
    console.log("✅ Response received:", {
      status: response.status,
      dataType: typeof response.data,
      isArray: Array.isArray(response.data),
      dataLength: response.data?.length,
      rawData: response.data
    });
    
    if (Array.isArray(response.data)) {
      console.log("✅ Processing", response.data.length, "resume(s)");
      
      const transformedResumes = response.data.map((resume: any) => {
        const resumeId = resume.id || resume._id;
        
        if (!resumeId) {
          console.error("⚠️ Resume missing ID:", resume);
        }
        
        console.log("🔄 Transforming resume:", { 
          original_id: resume.id, 
          original_underscore_id: resume._id,
          final_id: resumeId 
        });
        
        return {
          ...resume,
          id: resumeId,
        };
      });
      
      const validResumes = transformedResumes.filter(r => r.id);
      
      if (validResumes.length > 0 && validResumes[0].id) {
        const firstResumeId = validResumes[0].id;
        console.log("💾 Storing first resume ID:", firstResumeId);
        localStorage.setItem("current_resume_id", firstResumeId);
      }
      
      return validResumes;
    }
    
    if (response.data && typeof response.data === 'object') {
      const resumeId = response.data.id || response.data._id;
      
      if (resumeId) {
        console.log("✅ Single resume received, ID:", resumeId);
        const transformedResume = {
          ...response.data,
          id: resumeId,
        };
        localStorage.setItem("current_resume_id", resumeId);
        return [transformedResume];
      }
    }
    
    console.log("⚠️ No valid resumes found in response");
    return [];
    
  } catch (error) {
    console.error('❌ Error fetching resumes:', error, { correlationId });

    if (axios.isAxiosError(error)) {
      console.error("🔥 Fetch error details:", {
        correlationId,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        baseURL: error.config?.baseURL,
        fullURL: `${error.config?.baseURL}${error.config?.url}`,
      });

      if (error.response?.status === 404) {
        console.error("⚠️ 404 - Endpoint not found. Check your API route!");
        throw new Error("Resume endpoint not found. Please check API configuration.");
      }

      if (error.response?.status === 401) {
        console.error("🔐 Authentication failed");
        throw new Error("Please sign in again");
      }
    }

    throw error;
  }
};

// ==================== UPDATE RESUME ====================
export const updateResume = async (
  resumeId: string,
  resumeData: Partial<ResumeResponse>
): Promise<ResumeResponse> => {
  const correlationId = getCorrelationId();
  try {
    console.log("📝 Updating resume:", resumeId, { correlationId });
    console.log("📋 Update payload:", JSON.stringify(resumeData, null, 2));
    
    const baseURL = httpClient.defaults.baseURL;
    const endpoint = `/resumes/${resumeId}`;
    const fullURL = `${baseURL}${endpoint}`;
    
    console.log("🔍 Full URL:", fullURL);
    console.log("🔍 BaseURL:", baseURL);
    console.log("🔍 Endpoint:", endpoint);
    console.log("🔍 Resume ID:", resumeId);
    console.log("🔍 Resume ID length:", resumeId.length);
    console.log("🔍 Resume ID type:", typeof resumeId);
    
    const token = localStorage.getItem("access_token");
    console.log("🔐 Has token:", !!token);
    
    const response = await httpClient.patch<ResumeResponse>(
      endpoint,
      resumeData
    );
    
    console.log("✅ Resume updated successfully:", response.data);
    return response.data;
    
  } catch (error) {
    console.error("❌ Error updating resume:", error);
    
    if (axios.isAxiosError(error)) {
      console.error("🔥 Update error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        method: error.config?.method,
        resumeId: resumeId,
        fullURL: `${error.config?.baseURL}${error.config?.url}`,
        headers: error.config?.headers,
      });
      
      if (error.response?.status === 404) {
        const errorMsg = `Resume with ID ${resumeId} not found at ${error.config?.baseURL}${error.config?.url}. Please refresh the page.`;
        console.error("❌ 404 Error:", errorMsg);
        throw new Error(errorMsg);
      }
      
      if (error.response?.status === 422) {
        const detail = error.response?.data?.detail;
        if (Array.isArray(detail)) {
          const errors = detail.map((err: any) => 
            `${err.loc?.join('.')} - ${err.msg}`
          ).join(', ');
          throw new Error(`Validation error: ${errors}`);
        }
        throw new Error("Invalid data format. Please check your inputs.");
      }
      
      if (error.response?.status === 401) {
        throw new Error("Session expired. Please log in again.");
      }
      
      const backendError = error.response?.data?.detail || error.response?.data?.message;
      throw new Error(backendError || "Failed to update resume");
    }
    
    throw error;
  }
};

// ==================== GET RESUME BY ID ====================
export const getResumeById = async (resumeId: string): Promise<ResumeResponse> => {
  const correlationId = getCorrelationId();
  try {
    console.log("📥 Fetching resume by ID:", resumeId, { correlationId });

    const response = await httpClient.get<ResumeResponse>(`/resumes/${resumeId}`);

    console.log("✅ Resume fetched successfully:", response.data);
    return response.data;

  } catch (error) {
    console.error("❌ Error fetching resume:", error, { correlationId });

    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        throw new Error("Resume not found");
      }
      if (error.response?.status === 401) {
        throw new Error("Please sign in again");
      }
    }

    throw error;
  }
};

// ==================== DELETE SECTION ====================
export const deleteResumeSection = async (
  resumeId: string,
  section: string
): Promise<void> => {
  try {
    console.log("🗑️ Deleting section:", section);
    
    await httpClient.delete(`/resumes/${resumeId}/sections/${section}`);
    
    console.log("✅ Section deleted successfully");
    
  } catch (error) {
    console.error("❌ Error deleting section:", error);
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
    console.log("🗑️ Deleting item from section:", { section, itemId });
    
    await httpClient.delete(`/resumes/${resumeId}/sections/${section}/items/${itemId}`);
    
    console.log("✅ Section item deleted successfully");
    
  } catch (error) {
    console.error("❌ Error deleting section item:", error);
    throw error;
  }
};

// ==================== TRIGGER SCORE CALCULATION ====================
export const triggerScoreCalculation = async (resumeId: string): Promise<void> => {
  try {
    console.log("🚀 Triggering score calculation for resume:", resumeId);
    
    const response = await httpClient.post(`/resumes/${resumeId}/calculate-score`);
    
    console.log("✅ Score calculation triggered:", response.data);
    
  } catch (error) {
    console.error("❌ Error triggering score calculation:", error);
    throw error;
  }
};

// ==================== GET BUILDER SCORE ====================
export const getBuilderScore = async (resumeId: string): Promise<BuilderScoreResponse> => {
  try {
    console.log("📊 Fetching builder score for resume:", resumeId);
    
    const response = await httpClient.get<BuilderScoreResponse>(
      `/resumes/${resumeId}/score`
    );
    
    console.log("✅ Builder score fetched:", response.data);
    return response.data;
    
  } catch (error) {
    console.error("❌ Error fetching builder score:", error);
    throw error;
  }
};

// ==================== GET RESUME SCORE WITH POLLING ====================
export const getResumeScore = async (resumeId: string): Promise<ResumeScoreResponse> => {
  try {
    console.log("⭐ Starting score calculation flow for resume:", resumeId);
    
    await triggerScoreCalculation(resumeId);
    
    const maxAttempts = 10;
    const pollInterval = 2000;
    
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      console.log(`📊 Polling attempt ${attempt}/${maxAttempts}...`);
      
      await new Promise(resolve => setTimeout(resolve, pollInterval));
      
      try {
        const builderScore = await getBuilderScore(resumeId);
        
        console.log(`✅ Score received (attempt ${attempt}):`, builderScore.score);
        
        if (builderScore.score > 0) {
          console.log("✅ Valid score received:", builderScore.score);
          
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
        
        console.log(`⏳ Score is still 0, continuing to poll...`);
        
      } catch (pollError) {
        console.warn(`⚠️ Poll attempt ${attempt} failed:`, pollError);
      }
    }
    
    console.warn("⏱️ Polling timeout - returning default score");
    throw new Error("Score calculation timeout. Please try again later.");
    
  } catch (error) {
    console.error("❌ Error in score calculation flow:", error);
    throw error;
  }
};

// ==================== DELETE RESUME ====================
export const deleteResume = async (resumeId: string): Promise<void> => {
  try {
    console.log("🗑️ Deleting resume:", resumeId);
    
    await httpClient.delete(`/resumes/${resumeId}`);
    
    console.log("✅ Resume deleted");
    localStorage.removeItem("current_resume_id");
    
  } catch (error) {
    console.error('❌ Error deleting resume:', error);
    throw error;
  }
};

// ==================== AUTO-SAVE RESUME ====================
export const autoSaveResume = async (
  resumeId: string, 
  resumeData: Partial<ResumeResponse>
): Promise<ResumeResponse> => {
  try {
    console.log("💾 Auto-saving resume:", resumeId);
    
    const response = await httpClient.patch<ResumeResponse>(
      `/resumes/${resumeId}/autosave`,
      resumeData
    );
    
    console.log("✅ Auto-save successful");
    return response.data;
    
  } catch (error) {
    console.error("❌ Auto-save failed:", error);
    throw error;
  }
};

// ==================== GET DRAFT RESUMES ====================
export const getDraftResumes = async (): Promise<ResumeResponse[]> => {
  try {
    console.log("📥 Fetching draft resumes...");
    
    const response = await httpClient.get<ResumeResponse[]>('/resumes/status/drafts');
    
    console.log("✅ Draft resumes fetched:", response.data.length);
    return response.data;
    
  } catch (error) {
    console.error("❌ Error fetching drafts:", error);
    throw error;
  }
};

// ==================== GET COMPLETED RESUMES ====================
export const getCompletedResumes = async (): Promise<ResumeResponse[]> => {
  try {
    console.log("📥 Fetching completed resumes...");
    
    const response = await httpClient.get<ResumeResponse[]>('/resumes/status/completed');
    
    console.log("✅ Completed resumes fetched:", response.data.length);
    return response.data;
    
  } catch (error) {
    console.error("❌ Error fetching completed resumes:", error);
    throw error;
  }
};

// ==================== PUBLISH RESUME ====================
export const publishResume = async (resumeId: string): Promise<void> => {
  try {
    const response = await fetch(`resumes/${resumeId}/publish`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Publish failed: ${response.statusText}`);
    }

    console.log("✅ Resume published successfully");
  } catch (error) {
    console.error("❌ Publish API error:", error);
    throw error;
  }
};

// ==================== DOWNLOAD RESUME ====================
export const downloadResume = async (
  resumeId: string,
  format: 'pdf' | 'doc' | 'docx'
): Promise<Blob> => {
  const correlationId = getCorrelationId();
  try {
    console.log("⬇️ Downloading resume:", resumeId, "Format:", format, { correlationId });

    const backendFormat = format === 'doc' ? 'docx' : format;

    console.log("🔍 Download URL:", `${httpClient.defaults.baseURL}/resumes/${resumeId}/download?format=${backendFormat}`);

    const response = await httpClient.get(
      `/resumes/${resumeId}/download?format=${backendFormat}`,
      {
        responseType: 'blob',
      }
    );

    console.log("✅ Download response received:", {
      status: response.status,
      contentType: response.headers['content-type'],
      size: response.data.size
    });

    return response.data;

  } catch (error) {
    console.error('❌ Error downloading:', error, { correlationId });

    if (axios.isAxiosError(error)) {
      console.error("🔥 Download error details:", {
        correlationId,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        url: error.config?.url,
        fullURL: `${error.config?.baseURL}${error.config?.url}`,
      });
      
      if (error.response?.status === 422) {
        const detail = error.response?.data?.detail;
        
        if (Array.isArray(detail)) {
          const errors = detail.map((err: any) => 
            `${err.loc?.join('.')} - ${err.msg}`
          ).join(', ');
          throw new Error(`Validation error: ${errors}`);
        }
        
        throw new Error("Invalid format or resume data. Make sure your resume has all required fields filled.");
      }
      
      if (error.response?.status === 400) {
        throw new Error("Invalid request. Please check the resume ID and format.");
      }
      
      if (error.response?.status === 404) {
        throw new Error("Download endpoint not found. This feature may not be available yet.");
      }
      
      if (error.response?.status === 500) {
        throw new Error("Server error while generating file. Please try again later.");
      }
    }
    
    throw error;
  }
};

// // ==================== TEMPLATE APIs ====================
// export const getTemplatesByCategory = async (category: string): Promise<TemplateResponse[]> => {
//   try {
//     console.log("📋 Fetching templates for category:", category);
    
//     const response = await httpClient.get<TemplateResponse[]>(
//       `/templates/categories?category=${category}`
//     );
    
//     console.log("✅ Templates fetched:", response.data.length);
//     return response.data;
//   } catch (error) {
//     console.error("❌ Error fetching templates by category:", error);
//     throw error;
//   }
// };

// export const getAllTemplates = async (): Promise<TemplateResponse[]> => {
//   try {
//     console.log("📋 Fetching all templates...");
    
//     const response = await httpClient.get<TemplateResponse[]>('/templates/');
    
//     console.log("✅ All templates fetched:", response.data.length);
//     return response.data;
//   } catch (error) {
//     console.error("❌ Error fetching all templates:", error);
//     throw error;
//   }
// };

// export const getTemplateById = async (templateId: number): Promise<TemplateResponse> => {
//   try {
//     console.log("📋 Fetching template details for ID:", templateId);
    
//     const response = await httpClient.get<TemplateResponse>(`/templates/${templateId}`);
    
//     console.log("✅ Template details fetched:", response.data);
//     return response.data;
//   } catch (error) {
//     console.error("❌ Error fetching template details:", error);
//     throw error;
//   }
// };

// // ==================== GET TEMPLATES BY CATEGORY ====================
// export const getTemplatesByCategory = async (category?: string): Promise<TemplateResponse[]> => {
//   try {
//     console.log("📋 Fetching templates by category:", category);
    
//     const url = category && category !== 'All' 
//       ? `/templates/?category=${encodeURIComponent(category.toLowerCase())}`
//       : '/templates/';
    
//     console.log("🔍 Request URL:", `${httpClient.defaults.baseURL}${url}`);
    
//     const response = await httpClient.get<TemplateResponse[]>(url);
    
//     console.log("✅ Templates fetched:", response.data.length);
//     return response.data;
//   } catch (error) {
//     console.error("❌ Error fetching templates by category:", error);
//     throw error;
//   }
// };



// Keep your existing getTemplatesByCategory function
export const getTemplatesByCategory = async (category?: string): Promise<TemplateResponse[]> => {
  const correlationId = getCorrelationId();
  try {
    console.log("📋 Fetching templates by category:", category, { correlationId });

    const url = category && category !== 'All'
      ? `/templates/?category=${encodeURIComponent(category.toLowerCase())}`
      : '/templates/';

    console.log("🔍 Request URL:", `${httpClient.defaults.baseURL}${url}`);
    console.log("📌 Category parameter being sent:", category);

    const response = await httpClient.get<unknown>(url);

    console.log("📦 Raw response data:", response.data);

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

    console.log("✅ Templates fetched:", templates.length, templates);
    return templates;
  } catch (error) {
    console.error("❌ Error fetching templates by category:", error, { correlationId });
    throw error;
  }
};


// ==================== APPLY TEMPLATE TO RESUME ====================
// export const applyTemplateToResume = async (
//   resumeId: string,
//   templateId: string
// ): Promise<{ message: string; resume_id: string; template_id: string }> => {
//   try {
//     console.log("🎨 Applying template:", { resumeId, templateId });
    
//     const endpoint = `/templates/${templateId}/apply`;
//     const fullURL = `${httpClient.defaults.baseURL}${endpoint}`;
    
//     console.log("🔍 POST URL:", fullURL);
    
//     const response = await httpClient.post(endpoint, {
//       resume_id: resumeId
//     });
    
//     console.log("✅ Template applied successfully:", response.data);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error applying template:", error);
    
//     if (axios.isAxiosError(error)) {
//       const status = error.response?.status;
//       const detail = error.response?.data?.detail;
      
//       console.error("🔥 Apply template error details:", {
//         status,
//         detail,
//         fullURL: `${error.config?.baseURL}${error.config?.url}`,
//         data: error.response?.data
//       });
      
//       if (status === 404) {
//         throw new Error("Template or Resume not found");
//       }
      
//       if (status === 422) {
//         throw new Error(detail || "Invalid request data");
//       }
      
//       throw new Error(detail || "Failed to apply template");
//     }
    
//     throw error;
//   }
// };


// export const applyTemplateToResume = async (
//   resumeId: string,
//   templateMongoId: string  // ✅ This should be MongoDB _id (24-char hex)
// ): Promise<{ message: string; resume_id: string; template_id: string }> => {
//   try {
//     console.log("🎨 Applying template:", { resumeId, templateMongoId });
    
//     // ✅ Use MongoDB _id in URL path
//     const endpoint = `/templates/${templateMongoId}/apply`;
//     const fullURL = `${httpClient.defaults.baseURL}${endpoint}`;
    
//     console.log("🔍 POST URL:", fullURL);
    
//     // ✅ Send both resume_id and template_id in body
//     const payload = {
//       resume_id: resumeId,
//       template_id: templateMongoId  // ✅ Backend expects this field
//     };
    
//     console.log("🔍 Request payload:", JSON.stringify(payload, null, 2));
    
//     const response = await httpClient.post(endpoint, payload, {
//       headers: {
//         'Content-Type': 'application/json',
//       }
//     });
    
//     console.log("✅ Template applied successfully:", response.data);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error applying template:", error);
    
//     if (axios.isAxiosError(error)) {
//       const status = error.response?.status;
//       const detail = error.response?.data?.detail;
      
//       console.error("🔥 Apply template error details:", {
//         status,
//         statusText: error.response?.statusText,
//         detail,
//         fullError: error.response?.data,
//         fullURL: `${error.config?.baseURL}${error.config?.url}`,
//         requestData: error.config?.data,
//       });
      
//       if (status === 404) {
//         throw new Error("Template or Resume not found");
//       }
      
//       if (status === 422) {
//         const validationDetail = detail?.detail || detail;
        
//         if (Array.isArray(validationDetail)) {
//           const errors = validationDetail.map((err: any) => 
//             `${err.loc?.join('.')} - ${err.msg}`
//           ).join(', ');
//           throw new Error(`Validation error: ${errors}`);
//         }
        
//         throw new Error(JSON.stringify(validationDetail) || "Invalid request data");
//       }
      
//       throw new Error(detail || "Failed to apply template");
//     }
    
//     throw error;
//   }
// };
// export const applyTemplateToResume = async (
//   resumeId: string,
//   templateIdentifier: string  // ✅ Can be either _id or template_id
// ): Promise<{ message: string; resume_id: string; template_id: string }> => {
//   try {
//     console.log("🎨 Applying template:", { resumeId, templateIdentifier });
    
//     const endpoint = `/templates/${templateIdentifier}/apply`;
//     const fullURL = `${httpClient.defaults.baseURL}${endpoint}`;
    
//     console.log("🔍 POST URL:", fullURL);
    
//     const payload = {
//       resume_id: resumeId,
//       template_id: templateIdentifier
//     };
    
//     console.log("🔍 Request payload:", JSON.stringify(payload, null, 2));
    
//     const response = await httpClient.post(endpoint, payload, {
//       headers: {
//         'Content-Type': 'application/json',
//       }
//     });
    
//     console.log("✅ Template applied successfully:", response.data);
//     return response.data;
    
//   } catch (error) {
//     console.error("❌ Error applying template:", error);
    
//     if (axios.isAxiosError(error)) {
//       const status = error.response?.status;
//       const detail = error.response?.data?.detail;
//       const errorData = error.response?.data?.error;
      
//       console.error("🔥 Apply template error details:", {
//         status,
//         statusText: error.response?.statusText,
//         detail,
//         error: errorData,
//         fullError: error.response?.data,
//         fullURL: `${error.config?.baseURL}${error.config?.url}`,
//         requestData: error.config?.data,
//       });
      
//       if (status === 404) {
//         throw new Error(errorData?.message || detail || "Template or Resume not found");
//       }
      
//       if (status === 422) {
//         const validationDetail = detail?.detail || detail;
        
//         if (Array.isArray(validationDetail)) {
//           const errors = validationDetail.map((err: any) => 
//             `${err.loc?.join('.')} - ${err.msg}`
//           ).join(', ');
//           throw new Error(`Validation error: ${errors}`);
//         }
        
//         throw new Error(JSON.stringify(validationDetail) || "Invalid request data");
//       }
      
//       throw new Error(errorData?.message || detail || "Failed to apply template");
//     }
    
//     throw error;
//   }
// };
export const applyTemplateToResume = async (
  resumeId: string,
  templateId: string // Template ID from the templates list API response
): Promise<{ message: string; resume_id: string; template_id: string }> => {
  const correlationId = getCorrelationId();
  try {
    console.log("🎨 Applying template to resume:", { resumeId, templateId, correlationId });

    // ✅ CORRECTED: Use /templates/{resume_id}/apply endpoint
    const endpoint = `/templates/${resumeId}/apply`;
    const payload = {
      template_id: templateId // Pass template_id from list response in request body
    };

    console.log("🔍 POST URL:", endpoint);
    console.log("🔍 Request payload:", JSON.stringify(payload));

    const response = await httpClient.post(endpoint, payload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log("✅ Template applied successfully:", response.data);
    return response.data;

  } catch (error) {
    console.error("❌ Error applying template:", error, { correlationId });
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const detail = error.response?.data?.detail;
      const errorData = error.response?.data?.error;
      const message = error.response?.data?.message;

      console.error("🔥 Apply template error details:", {
        correlationId,
        status,
        statusText: error.response?.statusText,
        detail,
        error: errorData,
        message,
        fullError: error.response?.data,
        fullURL: `${error.config?.baseURL}${error.config?.url}`,
        requestData: error.config?.data
      });

      if (status === 404) {
        throw new Error(message || errorData?.message || detail || "Resume not found");
      }

      if (status === 400) {
        throw new Error(message || errorData?.message || detail || "Invalid request - check resume ID and template ID");
      }

      if (status === 422) {
        const validationDetail = detail?.detail || detail;
        if (Array.isArray(validationDetail)) {
          const errors = validationDetail.map((err: any) =>
            `${err.loc?.join('.')} - ${err.msg}`
          ).join(', ');
          throw new Error(`Validation error: ${errors}`);
        }
        throw new Error(JSON.stringify(validationDetail) || "Invalid request data");
      }
      throw new Error(message || errorData?.message || detail || "Failed to apply template");
    }
    throw error;
  }
};

/**
 * Get all template categories
 */
export const getTemplateCategories = async (): Promise<string[]> => {
  try {
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
    console.error("❌ Error getting template categories:", error);
    throw error;
  }
};

/**
 * Get the default template
 */
export const getDefaultTemplate = async (): Promise<unknown> => {
  try {
    const response = await httpClient.get(
      `/templates/default`
    );
    return response.data;
  } catch (error) {
    console.error("❌ Error getting default template:", error);
    throw error;
  }
};

/**
 * Set a template as default
 */
export const setDefaultTemplate = async (templateId: string | number): Promise<unknown> => {
  try {
    const response = await httpClient.post(
      `/templates/${templateId}/set-default`,
      {},
      {
        params: {
          template_id: templateId
        }
      }
    );
    return response.data;
  } catch (error) {
    console.error("❌ Error setting default template:", error);
    throw error;
  }
};

