export const metricPatterns = {
  number: /\b\d+(?:\.\d+)?\b/,
  percentage: /\b\d+(?:\.\d+)?%\b/,
  metric: /\d+(?:\.\d+)?[+xX]?\s*(?:users?|customers?|downloads?|installs?|growth|increase|improvement|reduction|traffic|revenue|retention|engagement)/i,
  cgpa: /(?:cgpa?|gpa)[\s:]*\d+(?:\.\d+)?/i,
  quantifiedImpact: /(?:increased|improved|reduced|grew|scaled|decreased|boosted|achieved|delivered|generated)\s+(?:by\s+)?(?:up to\s+)?\d+(?:\.\d+)?%?/i,
};

export const hasQuantifiedMetrics = (text: string): boolean => {
  if (!text || text.trim().length < 5) return false;
  return (
    metricPatterns.percentage.test(text) ||
    metricPatterns.metric.test(text) ||
    metricPatterns.quantifiedImpact.test(text)
  );
};

export const countNumbers = (text: string): number => {
  if (!text) return 0;
  const matches = text.match(/\b\d+(?:\.\d+)?\b/g) || [];
  return matches.length;
};

export const hasCGPA = (text: string): boolean => {
  if (!text) return false;
  return metricPatterns.cgpa.test(text);
};
