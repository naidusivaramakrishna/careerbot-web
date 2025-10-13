import { useState } from "react";

export const useValidation = () => {
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Generate key format: section-index-field
  const getKey = (section: string, index: number, field: string) =>
    `${section}-${index}-${field}`;

  // Validate required fields
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

  // Clear error for a field when user types
  const clearError = (section: string, index: number, field: string) => {
    const key = getKey(section, index, field);
    setErrors((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  // Clear all errors for a specific index in a section (on delete)
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

  // Reindex errors after removing an entry (shift errors down)
  const reindexErrors = (section: string, removedIndex: number) => {
    setErrors((prev) => {
      const updated: Record<string, string> = {};

      Object.entries(prev).forEach(([key, value]) => {
        const match = key.match(new RegExp(`^${section}-(\\d+)-(.+)$`));
        if (match) {
          const idx = parseInt(match[1], 10);
          const field = match[2];

          if (idx < removedIndex) {
            // keep errors before removed index
            updated[key] = value;
          } else if (idx > removedIndex) {
            // shift errors down by 1
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

  return {
    errors,
    validateRequired,
    clearError,
    clearSectionIndexErrors,
    reindexErrors,
  };
};

