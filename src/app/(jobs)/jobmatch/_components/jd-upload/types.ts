export type UploadMode = "link" | "paste" | "file" | null;

export interface JDFormState {
  mode: UploadMode;
  text: string;
  url: string;
  file: File | null;
}
