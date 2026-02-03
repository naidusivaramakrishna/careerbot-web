import { useState, useCallback } from 'react';
import {
  processResumeEnhancement,
  updateEnhancedResume,
  downloadEnhancedResume,
  previewEnhancedResume,
  getEnhancedResume,
  deleteEnhancedResume,
  getEnhancementHistory,
  type EnhanceResumeResponse,
  type EnhancedResumeHistoryItem,
} from '@/api/enhancerApi';

interface UseEnhancerReturn {
  // State
  isProcessing: boolean;
  error: string | null;
  enhancedResume: EnhanceResumeResponse | null;

  // Actions
  processResume: (file: File, jobDescription?: string) => Promise<EnhanceResumeResponse | null>;
  updateResume: (enhancedId: string, enhancedSections: unknown) => Promise<void>;
  downloadResume: (enhancedId: string, format?: 'pdf' | 'docx') => Promise<void>;
  previewResume: (enhancedId: string) => Promise<{
    resumeData: EnhancedResumeHistoryItem;
    previewUrl: string | null;
  }>;
  fetchEnhancedResume: (enhancedId: string) => Promise<EnhancedResumeHistoryItem | null>;
  deleteResume: (enhancedId: string) => Promise<void>;
  fetchHistory: (limit?: number) => Promise<EnhancedResumeHistoryItem[]>;
  clearError: () => void;
}

/**
 * Custom hook for managing resume enhancement workflow
 *
 * @example
 * ```tsx
 * const {
 *   isProcessing,
 *   error,
 *   enhancedResume,
 *   processResume,
 *   updateResume,
 *   downloadResume,
 * } = useEnhancer();
 *
 * // Process a resume file
 * const result = await processResume(file);
 *
 * // Update enhanced sections
 * await updateResume(enhancedId, { contact: { email: "new@email.com" } });
 *
 * // Download as PDF
 * await downloadResume(enhancedId, 'pdf');
 * ```
 */
export function useEnhancer(): UseEnhancerReturn {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [enhancedResume, setEnhancedResume] = useState<EnhanceResumeResponse | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Process a resume file (parse + enhance)
   */
  const processResume = useCallback(async (
    file: File,
    jobDescription?: string
  ): Promise<EnhanceResumeResponse | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const { enhanceResult } = await processResumeEnhancement(file, jobDescription);
      setEnhancedResume(enhanceResult);
      return enhanceResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process resume';
      setError(errorMessage);
      // // console.error('Error processing resume:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Update enhanced resume sections
   */
  const updateResume = useCallback(async (
    enhancedId: string,
    enhancedSections: unknown
  ): Promise<void> => {
    setIsProcessing(true);
    setError(null);

    try {
      await updateEnhancedResume(enhancedId, {
        enhanced_sections: enhancedSections,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update resume';
      setError(errorMessage);
      // // console.error('Error updating resume:', err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Download enhanced resume as PDF or DOCX
   */
  const downloadResume = useCallback(async (
    enhancedId: string,
    format: 'pdf' | 'docx' = 'pdf'
  ): Promise<void> => {
    setIsProcessing(true);
    setError(null);

    try {
      const blob = await downloadEnhancedResume(enhancedId, format);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `enhanced-resume.${format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download resume';
      setError(errorMessage);
      // // console.error('Error downloading resume:', err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Preview enhanced resume with full data and optional PDF
   */
  const previewResume = useCallback(async (
    enhancedId: string
  ): Promise<{
    resumeData: EnhancedResumeHistoryItem;
    previewUrl: string | null;
  }> => {
    setIsProcessing(true);
    setError(null);

    try {
      const { resumeData, previewBlob } = await previewEnhancedResume(enhancedId);

      // Convert blob to object URL if available
      const previewUrl = previewBlob ? window.URL.createObjectURL(previewBlob) : null;

      return {
        resumeData,
        previewUrl,
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to preview resume';
      setError(errorMessage);
      // // console.error('Error previewing resume:', err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Fetch enhanced resume by ID
   */
  const fetchEnhancedResume = useCallback(async (
    enhancedId: string
  ): Promise<EnhancedResumeHistoryItem | null> => {
    setIsProcessing(true);
    setError(null);

    try {
      const resume = await getEnhancedResume(enhancedId);
      return resume;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch resume';
      setError(errorMessage);
      // // console.error('Error fetching resume:', err);
      return null;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Delete enhanced resume
   */
  const deleteResume = useCallback(async (enhancedId: string): Promise<void> => {
    setIsProcessing(true);
    setError(null);

    try {
      await deleteEnhancedResume(enhancedId);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete resume';
      setError(errorMessage);
      // // console.error('Error deleting resume:', err);
      throw err;
    } finally {
      setIsProcessing(false);
    }
  }, []);

  /**
   * Fetch enhancement history
   */
  const fetchHistory = useCallback(async (
    limit: number = 20
  ): Promise<EnhancedResumeHistoryItem[]> => {
    setIsProcessing(true);
    setError(null);

    try {
      const history = await getEnhancementHistory(limit);
      return history;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch history';
      setError(errorMessage);
      // // console.error('Error fetching history:', err);
      return [];
    } finally {
      setIsProcessing(false);
    }
  }, []);

  return {
    isProcessing,
    error,
    enhancedResume,
    processResume,
    updateResume,
    downloadResume,
    previewResume,
    fetchEnhancedResume,
    deleteResume,
    fetchHistory,
    clearError,
  };
}
