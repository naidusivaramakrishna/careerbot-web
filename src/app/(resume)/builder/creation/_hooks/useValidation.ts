import { useState } from "react";

export const useValidation = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  const getKey = (section: string, index: number, field: string) =>
    `${section}-${index}-${field}`;

  const validateRequired = (
    section: string,
    index: number,
    fields: Record<string, string>
  ): boolean => {
    let valid = true;
    const newErrors: Record<string, string> = {};

    Object.entries(fields).forEach(([field, value]) => {
      const key = getKey(section, index, field);
      if (!value || value.trim() === "") {
        newErrors[key] = "This field is mandatory";
        valid = false;
      }
    });

    setErrors((prev) => ({ ...prev, ...newErrors }));
    return valid;
  };

  const clearError = (section: string, index: number, field: string) => {
    const key = getKey(section, index, field);
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  const clearSectionIndexErrors = (section: string, index: number) => {
    setErrors((prev) => {
      const updated: Record<string, string> = {};
      Object.entries(prev).forEach(([key, value]) => {
        if (!key.startsWith(`${section}-${index}-`)) {
          updated[key] = value;
        }
      });
      return updated;
    });
  };

  const reindexErrors = (section: string, removedIndex: number) => {
    setErrors((prev) => {
      const updated: Record<string, string> = {};
      Object.entries(prev).forEach(([key, value]) => {
        const match = key.match(new RegExp(`^${section}-(\\d+)-(.+)$`));
        if (match) {
          const idx = parseInt(match[1], 10);
          const field = match[2];

          if (idx < removedIndex) {
            updated[key] = value;
          } else if (idx > removedIndex) {
            const newKey = getKey(section, idx - 1, field);
            updated[newKey] = value;
          }
        } else {
          updated[key] = value;
        }
      });
      return updated;
    });
  };

  // ✅ NEW — Clear all validation errors globally
  const clearAllErrors = () => setErrors({});

  return {
    errors,
    validateRequired,
    clearError,
    clearSectionIndexErrors,
    reindexErrors,
    clearAllErrors, // ✅ expose globally
  };
};


