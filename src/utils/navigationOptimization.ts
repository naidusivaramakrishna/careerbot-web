/**
 * Navigation optimization utilities for faster page transitions
 */

// Cache for prefetched question data
const questionCache = new Map<string, any>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export interface CachedQuestion {
  data: any;
  timestamp: number;
  sectionName: string;
}

/**
 * Prefetch the next section's question data to speed up navigation
 */
export async function prefetchNextSection(
  currentSectionName: string,
  sessionId: string,
  fetchFunction: (sessionId: string) => Promise<any>
): Promise<void> {
  try {
    const cacheKey = `${sessionId}_next_${currentSectionName}`;

    // Don't prefetch if already cached and fresh
    const cached = questionCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return;
    }

    // Prefetch in background
    const data = await fetchFunction(sessionId);
    questionCache.set(cacheKey, {
      data,
      timestamp: Date.now(),
      sectionName: data.section_name,
    });

    // // console.log('✅ Prefetched next section data:', data.section_name);
  } catch (error) {
    // Silent fail for prefetch - don't block current page
    // // console.warn('Prefetch failed:', error);
  }
}

/**
 * Get cached question data if available and fresh
 */
export function getCachedQuestion(
  sessionId: string,
  sectionName: string
): any | null {
  const cacheKey = `${sessionId}_${sectionName}`;
  const cached = questionCache.get(cacheKey);

  if (!cached) return null;

  // Check if cache is still fresh
  if (Date.now() - cached.timestamp > CACHE_DURATION) {
    questionCache.delete(cacheKey);
    return null;
  }

  return cached.data;
}

/**
 * Cache current question for faster back navigation
 */
export function cacheCurrentQuestion(
  sessionId: string,
  sectionName: string,
  data: any
): void {
  const cacheKey = `${sessionId}_${sectionName}`;
  questionCache.set(cacheKey, {
    data,
    timestamp: Date.now(),
    sectionName,
  });
}

/**
 * Clear all cached questions (call on session end)
 */
export function clearQuestionCache(): void {
  questionCache.clear();
}

/**
 * Optimize router push with transition hints
 */
export function optimizedRouterPush(
  router: any,
  path: string,
  options?: { prefetch?: boolean }
): void {
  // Use shallow routing if possible for faster transitions
  router.push(path, options);
}

/**
 * Debounce function to prevent rapid repeated calls
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Preload Next.js route to speed up navigation
 */
export function preloadRoute(path: string): void {
  if (typeof window !== 'undefined') {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = path;
    document.head.appendChild(link);
  }
}
