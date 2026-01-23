// // utils/resumeHelpers.ts
// import { ResumeData } from "@/app/(resume)/builder/creation/_context/ResumeContext";

// export const convertResumeDataToFormData = (resumeData: ResumeData): Record<string, string> => {
//   const formData: Record<string, string> = {};
  
//   // Personal Info
//   formData["name"] = resumeData.personalInfo?.name || "";
//   formData["email"] = resumeData.personalInfo?.email || "";
//   formData["phone"] = resumeData.personalInfo?.phone || "";
//   formData["location"] = resumeData.personalInfo?.location || "";
//   formData["linkedinurl"] = resumeData.personalInfo?.linkedinurl || "";
//   formData["portifoliourl"] = resumeData.personalInfo?.portifoliourl || "";
  
//   // Professional Summary
//   formData["professionalSummary"] = resumeData.professionalSummary || "";
  
//   // Skills
//   formData["skills"] = Array.isArray(resumeData.skills) 
//     ? resumeData.skills.join(", ") 
//     : "";
  
//   // Education
//   resumeData.education?.forEach((edu, index) => {
//     formData[`education_${index}_school`] = edu.school || "";
//     formData[`education_${index}_degree`] = edu.degree || "";
//     formData[`education_${index}_startDate`] = edu.startDate || "";
//     formData[`education_${index}_endDate`] = edu.endDate || "";
//   });
  
//   // Work Experience
//   resumeData.workExperience?.forEach((work, index) => {
//     formData[`workExperience_${index}_company`] = work.company || "";
//     formData[`workExperience_${index}_role`] = work.role || "";
//     formData[`workExperience_${index}_location`] = work.location || "";
//     formData[`workExperience_${index}_startDate`] = work.startDate || "";
//     formData[`workExperience_${index}_endDate`] = work.endDate || "";
//     formData[`workExperience_${index}_currentlyWorking`] = String(work.currentlyWorking);
//     formData[`workExperience_${index}_description`] = work.description || "";
//   });
  
//   // Projects
//   resumeData.projects?.forEach((project, index) => {
//     formData[`project_${index}_title`] = project.title || "";
//     formData[`project_${index}_description`] = project.description || "";
//     formData[`project_${index}_technologies`] = Array.isArray(project.technologies)
//       ? project.technologies.join(", ")
//       : "";
//     formData[`project_${index}_startDate`] = project.startDate || "";
//     formData[`project_${index}_endDate`] = project.endDate || "";
//     formData[`project_${index}_link`] = project.link || "";
//   });
  
//   // Add other sections similarly...
  
//   return formData;
// };
