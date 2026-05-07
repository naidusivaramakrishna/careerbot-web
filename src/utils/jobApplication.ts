import { toast } from "sonner";
 
export interface ApplicationData {
  cover_letter: string;
  experience_years: string;
  notice_period: string;
  phone_number: string;
}
 
export const applyToJob = async (jobId: string, data: ApplicationData) => {
  // Validate required fields before sending to backend
  if (!data.phone_number?.trim()) {
    toast.error("Phone number is required");
    return { success: false, applied: false };
  }
 
  if (!data.experience_years?.trim()) {
    toast.error("Years of experience is required");
    return { success: false, applied: false };
  }
 
  if (!data.notice_period?.trim()) {
    toast.error("Notice period is required");
    return { success: false, applied: false };
  }
 
  // Validate phone format (basic check)
  const phoneRegex = /^\d{10}$/;
  if (!phoneRegex.test(data.phone_number.replace(/\D/g, ""))) {
    toast.error("Please enter a valid 10-digit phone number");
    return { success: false, applied: false };
  }
 
  const response = await fetch(`/api/v1/jobs/${jobId}/apply`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data),
  });
 
  // Parse backend response
  const responseBody = await response.json();
 
  if (response.status === 201) {
    toast.success("Applied successfully ✓");
    return {
      success: true,
      applied: responseBody?.data?.applied ?? true, // Backend says applied status
    };
  }
 
  // 409 = already applied, still counts as success for UI purposes
  if (response.status === 409) {
    toast.info("Already applied to this job");
    return {
      success: true,
      applied: responseBody?.data?.applied ?? true, // Backend confirms applied
    };
  }
 
  if (response.status === 401) {
    toast.error("Please login to apply");
    return { success: false, applied: false };
  }
 
  if (response.status === 422) {
    toast.error("Please check your input");
    return { success: false, applied: false };
  }
 
  toast.error("Failed to apply. Please try again.");
  return { success: false, applied: false };
};
