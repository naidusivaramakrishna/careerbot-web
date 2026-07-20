import { LinkedinImportResponse } from "@/api/linkedinParsingApi";
import { ProfileData } from "../_types/ProfileData";

export const mapLinkedinToProfile = (data: LinkedinImportResponse): Partial<ProfileData> => {

    const profileData: Partial<ProfileData> = {};

    const { personal_info, will_skip, summary } = data;

    // -----------------------------------
    // PERSONAL INFORMATION
    // -----------------------------------
    if (personal_info) {
        // Normalize phone number - add +91 for Indian numbers
        let phoneNumber = personal_info.phone || '';
        const location = personal_info.location || '';

        // If location is India and phone doesn't have country code, add +91
        if (location.toLowerCase().includes('india') && phoneNumber) {
            // Remove any spaces, hyphens, or parentheses
            phoneNumber = phoneNumber.replace(/[\s\-\(\)]/g, '');

            // If it's a 10-digit number without country code, add +91 with space
            if (/^\d{10}$/.test(phoneNumber)) {
                phoneNumber = '+91 ' + phoneNumber;
            }
            // If it starts with 91 but no +, add the + with space
            else if (/^91\d{10}$/.test(phoneNumber)) {
                phoneNumber = '+91 ' + phoneNumber.substring(2);
            }
            // If it doesn't start with + but is already complete, add + with space
            else if (/^\d{12}$/.test(phoneNumber) && phoneNumber.startsWith('91')) {
                phoneNumber = '+91 ' + phoneNumber.substring(2);
            }
        }

        profileData.personalInformation = {
            fullName: personal_info.name || "",
            email: personal_info.email || "",
            phone: phoneNumber,
            location: personal_info.location || "",
            linkedin: personal_info.linkedinurl || "",
            github: "",
            summary: summary || "",
            headline: ""
        };
    }

    // -----------------------------------
    // SKILLS (from will_skip.skills)
    // -----------------------------------
    profileData.skills = will_skip?.skills?.map(s => s) || [];

    return profileData;
};
