export const strongActionVerbs = new Set([
  "achieved", "accelerated", "accomplished", "built", "created", "delivered",
  "designed", "developed", "directed", "drove", "engineered", "enhanced",
  "expanded", "generated", "implemented", "improved", "increased", "innovated",
  "launched", "led", "managed", "optimized", "orchestrated", "pioneered",
  "redesigned", "reduced", "refined", "scaled", "spearheaded", "streamlined",
  "transformed", "upgraded", "architected", "championed", "deployed", "established"
]);

export const hasActionVerb = (text: string): boolean => {
  if (!text) return false;
  const words = text.toLowerCase().split(/\s+/);
  return words.some(word => strongActionVerbs.has(word));
};

export const countActionVerbs = (text: string): number => {
  if (!text) return 0;
  const words = text.toLowerCase().split(/\s+/);
  return words.filter(word => strongActionVerbs.has(word)).length;
};
