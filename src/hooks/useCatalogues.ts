import { useState, useEffect } from 'react';
import logger from '@/lib/logger';

export interface CatalogueConfig {
  key: string;
  label: string;
  description: string;
  preview_url: string;
  template_id: string;
  header_layout: string;
  ats_level: 'safe' | 'friendly' | 'creative';
  default_color: string;
  color_palette: string[];
  accent_swatches: string[];
  typography: {
    font_family: string;
    name_font_size: string;
    heading_font_size: string;
    body_font_size: string;
    line_spacing: string;
  };
  colors: {
    heading: string;
    body: string;
    accent: string;
  };
  styling: Record<string, any>;
}

export interface CataloguesResponse {
  catalogues: CatalogueConfig[];
}

const CATALOGUES_API_URL = '/api/v1/templates/catalogues/all';
const CACHE_KEY = 'catalogues_cache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Hook to fetch and cache catalogues from the backend
 * Provides a centralized source of truth for all catalogue configurations
 */
export const useCatalogues = () => {
  const [catalogues, setCatalogues] = useState<CatalogueConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCatalogues = async () => {
      try {
        // Check cache first
        const cached = localStorage.getItem(CACHE_KEY);
        if (cached) {
          try {
            const { data, timestamp } = JSON.parse(cached);
            if (Date.now() - timestamp < CACHE_DURATION) {
              setCatalogues(data);
              setLoading(false);
              logger.info('Catalogues loaded from cache');
              return;
            }
          } catch (e) {
            logger.debug('Failed to parse cached catalogues, fetching fresh');
          }
        }

        // Fetch from API
        const response = await fetch(CATALOGUES_API_URL);

        if (!response.ok) {
          throw new Error(`Failed to fetch catalogues: ${response.statusText}`);
        }

        const data: CatalogueConfig[] = await response.json();

        // Cache the result
        localStorage.setItem(CACHE_KEY, JSON.stringify({
          data,
          timestamp: Date.now()
        }));

        setCatalogues(data);
        logger.info(`Catalogues loaded from API: ${data.length} catalogues`);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        logger.error('Failed to fetch catalogues:', err);
        // Fallback: return empty array to prevent app crash
        setCatalogues([]);
      } finally {
        setLoading(false);
      }
    };

    fetchCatalogues();
  }, []);

  /**
   * Get a specific catalogue by key or template_id
   */
  const getCatalogue = (keyOrId: string): CatalogueConfig | undefined => {
    return catalogues.find(c => c.key === keyOrId || c.template_id === keyOrId);
  };

  /**
   * Get catalogues as a Record for compatibility with STYLE_CATALOGUES
   */
  const getCataloguesMap = (): Record<string, CatalogueConfig> => {
    const map: Record<string, CatalogueConfig> = {};
    catalogues.forEach(c => {
      map[c.key] = c;
    });
    return map;
  };

  return {
    catalogues,
    loading,
    error,
    getCatalogue,
    getCataloguesMap,
  };
};
