import { ProfileData } from "./ProfileData";

export interface ValidationError {
  field: string;
  message: string;
}

export interface ExperienceSectionProps {
  tempProfile: ProfileData;
  setTempProfile: React.Dispatch<React.SetStateAction<ProfileData>>;
}
