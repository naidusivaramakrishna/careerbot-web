const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/**
 * Convert YYYY-MM to MMM YY format for backend
 * @param dateStr - e.g., "2024-06"
 * @returns e.g., "Jun 24"
 */
export const formatToMMMYY = (dateStr: string): string => {
  if (!dateStr || dateStr.trim() === '') return '';
  
  const [year, month] = dateStr.split('-');
  const monthIndex = parseInt(month, 10) - 1;
  
  if (monthIndex < 0 || monthIndex > 11) return '';
  
  const shortYear = year.slice(-2);
  return `${monthNames[monthIndex]} ${shortYear}`;
};

/**
 * Convert MMM YY to YYYY-MM format for frontend
 * @param dateStr - e.g., "Jun 24"
 * @returns e.g., "2024-06"
 */
export const formatFromMMMYY = (dateStr: string): string => {
  if (!dateStr || dateStr.trim() === '') return '';
  
  const monthMap: { [key: string]: string } = {
    'Jan': '01', 'Feb': '02', 'Mar': '03', 'Apr': '04',
    'May': '05', 'Jun': '06', 'Jul': '07', 'Aug': '08',
    'Sep': '09', 'Oct': '10', 'Nov': '11', 'Dec': '12'
  };
  
  const [month, year] = dateStr.split(' ');
  
  if (!monthMap[month]) return '';
  
  const fullYear = year.length === 2 ? `20${year}` : year;
  return `${fullYear}-${monthMap[month]}`;
};
