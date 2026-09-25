/**
 * PR #96 ai-review (58ef79ee) P2 — the card/modal images moved into
 * TemplatePreviewRenderer, which dropped develop2's onError fallback
 * (TemplatesTab careerImgErrors, the preview modal's DOMAIN_FAMILY_IMAGES
 * fallback, DomainCard's FALLBACK_IMAGE). A 404 preview_url showed a broken image.
 */
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import TemplatePreviewRenderer from '@/components/templates/TemplatePreviewRenderer';

describe('TemplatePreviewRenderer image fallback', () => {
  it('switches to errorFallbackImage when the preview image fails to load', () => {
    const props = {
      fallbackImage: '/missing.png',
      errorFallbackImage: '/family.png',
      title: 'Mid-Level',
    } as React.ComponentProps<typeof TemplatePreviewRenderer>;
    render(<TemplatePreviewRenderer {...props} />);
    const img = screen.getByAltText('Mid-Level') as HTMLImageElement;
    expect(img.getAttribute('src')).toBe('/missing.png');
    fireEvent.error(img);
    expect((screen.getByAltText('Mid-Level') as HTMLImageElement).getAttribute('src')).toBe('/family.png');
    // A failing fallback does not loop.
    fireEvent.error(screen.getByAltText('Mid-Level'));
    expect((screen.getByAltText('Mid-Level') as HTMLImageElement).getAttribute('src')).toBe('/family.png');
  });
});
