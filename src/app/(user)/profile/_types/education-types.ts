import { ProfileData } from "./ProfileData";

export interface ValidationError {
  field: string;
  message: string;
}

export interface EducationSectionProps {
  tempProfile: ProfileData;
  setTempProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
}
