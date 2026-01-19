// import { EducationItem, ExperienceItem, LinkedinImportResponse } from "@/api/linkedinParsingApi";
// import { ProfileData } from "../_types/ProfileData";

// export const mapLinkedinToProfile = (data: LinkedinImportResponse) => {
//     const profileData: Partial<ProfileData> = {};
//     const will_add = data.will_add;
//     const will_skip = data.will_skip;

//     if (data.personal_info) {
//         profileData.personalInformation = {
//             fullName: data.personal_info?.name || "",
//             email: data.personal_info?.email || "",
//             phone: data.personal_info?.phone || "",
//             location: data.personal_info?.location || "",
//             linkedin: data.personal_info?.linkedinurl || "",
//             github: '',
//             summary: data.summary || "",
//             headline: '',
//         };
//     }

//     if (data.will_add) {
//         if (data.will_add.experience?.length > 0) {
//             profileData.workExperience = {
//             }
//         }

//     }
//     if (data.will_skip) {
//         if (data.will_skip.education?.length > 0) {
//             profileData.education = {
//             }
//         }
//         // -------------------------
//         // SKILLS
//         // -------------------------
//         if (data.will_skip.skills?.length > 0) {
//             profileData.skills = data.will_skip.skills.map((item) => item);
//         }
//     }
//     return {
//         education: will_skip.education?.map((edu: EducationItem) => ({
//             institution: edu.school,
//             degree: edu.degree,
//             stream: "",
//             cgpa: "",
//             start_date: edu.startDate,
//             end_date: edu.endDate,
//         })) || [],

//         workExperience: will_add.experiece?.map((exp: ExperienceItem) => ({
//             job_title: exp.role,
//             company: exp.company,
//             job_type: exp.currentlyWorking ? "full_time" : "contract",
//             location: exp.location,
//             start_date: exp.startDate,
//             end_date: exp.endDate || "",
//             description: exp.description,
//             key_achievements: exp.description ? exp.description.split("\n") : []
//         })) || [],
//     };
//     return profileData
// };


import { EducationItem, ExperienceItem, LinkedinImportResponse } from "@/api/linkedinParsingApi";
import { ProfileData } from "../_types/ProfileData";

export const mapLinkedinToProfile = (data: LinkedinImportResponse): Partial<ProfileData> => {

    const profileData: Partial<ProfileData> = {};

    const { personal_info, will_add, will_skip, summary } = data;

    // -----------------------------------
    // PERSONAL INFORMATION
    // -----------------------------------
    if (personal_info) {
        profileData.personalInformation = {
            fullName: personal_info.name || "",
            email: personal_info.email || "",
            phone: personal_info.phone || "",
            location: personal_info.location || "",
            linkedin: personal_info.linkedinurl || "",
            github: "",
            summary: summary || "",
            headline: ""
        };
    }

    // -----------------------------------
    // EDUCATION (from will_skip.education)
    // -----------------------------------
    // profileData.education = will_skip?.education?.map((edu: EducationItem) => ({
    //     institution: edu.school || "",
    //     degree: edu.degree || "",
    //     stream: "",
    //     cgpa: "",
    //     start_date: edu.startDate || "",
    //     end_date: edu.endDate || "",
    // })) || [];

    // -----------------------------------
    // EXPERIENCE (from will_add.experiece)
    // -----------------------------------
    // profileData.workExperience = will_add?.experience?.map((exp: ExperienceItem) => ({
    //     job_title: exp.role || "",
    //     company: exp.company || "",
    //     job_type: exp.currentlyWorking ? "full_time" : "contract",
    //     location: exp.location || "",
    //     start_date: exp.startDate || "",
    //     end_date: exp.endDate || "",
    //     description: exp.description || "",
    //     key_achievements: exp.description
    //         ? exp.description.split("\n").filter(Boolean)
    //         : []
    // })) || [];

    // -----------------------------------
    // SKILLS (from will_skip.skills)
    // -----------------------------------
    profileData.skills = will_skip?.skills?.map(s => s) || [];

    return profileData;
};
