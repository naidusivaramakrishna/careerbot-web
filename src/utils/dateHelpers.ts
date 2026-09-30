/**
 * Converts date strings to ISO format (YYYY-MM-DD).
 * Handles both DD-MM-YYYY user input and existing ISO format.
 *
 * @param value - Date string in either DD-MM-YYYY or YYYY-MM-DD format
 * @returns ISO format date string (YYYY-MM-DD) or empty string if input is empty
 */
export const toISODate = (value: string): string => {
  if (!value) return '';

  // If already in ISO format (YYYY-MM-DD), return as-is
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  // If in DD-MM-YYYY format, convert to YYYY-MM-DD
  const ddmmyyyy = /^(\d{2})-(\d{2})-(\d{4})$/;
  const match = value.match(ddmmyyyy);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;

  return value;
};
