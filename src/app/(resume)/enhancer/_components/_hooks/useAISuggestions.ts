import { useState, useCallback, useEffect } from 'react';
import type { Improvement } from '@/api/enhancerApi';

interface UseAISuggestionsReturn {
  // State
  improvements: Improvement[];
  acceptedSuggestions: Map<string, string>;
  ignoredSuggestions: Set<string>;

  // Actions
  loadImprovements: (improvements: Improvement[]) => void;
  acceptSuggestion: (improvementId: string, newText: string) => void;
  ignoreSuggestion: (improvementId: string) => void;
  clearSuggestions: () => void;

  // Computed
  totalImprovements: number;
  acceptedCount: number;
  totalPointsGained: number;
}

/**
 * Custom hook for managing AI suggestions from the enhancer API
 *
 * @example
 * ```tsx
 * const {
 *   improvements,
 *   acceptSuggestion,
 *   ignoreSuggestion,
 *   acceptedCount,
 *   totalPointsGained,
 * } = useAISuggestions();
 *
 * // Load improvements from API
 * useEffect(() => {
 *   const stored = sessionStorage.getItem('improvements');
 *   if (stored) {
 *     loadImprovements(JSON.parse(stored));
 *   }
 * }, []);
 *
 * // Handle accept
 * acceptSuggestion(improvementId, newText);
 * ```
 */
export function useAISuggestions(): UseAISuggestionsReturn {
  const [improvements, setImprovements] = useState<Improvement[]>([]);
  const [acceptedSuggestions, setAcceptedSuggestions] = useState<Map<string, string>>(
    new Map()
  );
  const [ignoredSuggestions, setIgnoredSuggestions] = useState<Set<string>>(
    new Set()
  );

  /**
   * Load improvements from the API response
   */
  const loadImprovements = useCallback((newImprovements: Improvement[]) => {
    setImprovements(newImprovements);
  }, []);

  /**
   * Accept a suggestion and store the new text
   */
  const acceptSuggestion = useCallback((improvementId: string, newText: string) => {
    setAcceptedSuggestions((prev) => {
      const updated = new Map(prev);
      updated.set(improvementId, newText);
      return updated;
    });

    // Remove from ignored if it was there
    setIgnoredSuggestions((prev) => {
      const updated = new Set(prev);
      updated.delete(improvementId);
      return updated;
    });
  }, []);

  /**
   * Ignore a suggestion
   */
  const ignoreSuggestion = useCallback((improvementId: string) => {
    setIgnoredSuggestions((prev) => new Set([...prev, improvementId]));

    // Remove from accepted if it was there
    setAcceptedSuggestions((prev) => {
      const updated = new Map(prev);
      updated.delete(improvementId);
      return updated;
    });
  }, []);

  /**
   * Clear all suggestions
   */
  const clearSuggestions = useCallback(() => {
    setImprovements([]);
    setAcceptedSuggestions(new Map());
    setIgnoredSuggestions(new Set());
  }, []);

  /**
   * Calculate total points gained from accepted suggestions
   */
  const totalPointsGained = Array.from(acceptedSuggestions.keys()).reduce(
    (sum, id) => {
      const improvement = improvements.find((imp) => imp.id === id);
      return sum + (improvement?.impact_points || 0);
    },
    0
  );

  return {
    improvements,
    acceptedSuggestions,
    ignoredSuggestions,
    loadImprovements,
    acceptSuggestion,
    ignoreSuggestion,
    clearSuggestions,
    totalImprovements: improvements.length,
    acceptedCount: acceptedSuggestions.size,
    totalPointsGained,
  };
}
