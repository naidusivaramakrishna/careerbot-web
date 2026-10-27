/**
 * TemplatePreviewRenderer `flush` mode (the Templates tab cards and the preview window): the page fills the
 * width with a thin edge instead of a narrow page centred on grey. Without `flush` the old layout is kept.
 */
import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import React from 'react';
import TemplatePreviewRenderer from '@/components/templates/TemplatePreviewRenderer';

const srcDocOf = (props: Partial<React.ComponentProps<typeof TemplatePreviewRenderer>>) => {
  const { container } = render(
    <TemplatePreviewRenderer previewHtml="<div>cv</div>" previewCss="div{}" title="T" {...props} />,
  );
  return container.querySelector('iframe')?.getAttribute('srcdoc') ?? '';
};

describe('TemplatePreviewRenderer flush mode', () => {
  it('flush: no grey padding around the page; the scaled body spans the full width', () => {
    const doc = srcDocOf({ flush: true, scale: 0.5 });
    expect(doc).toContain('width: 200% !important');
    expect(doc).toContain('padding: 6px 10px !important');
    expect(doc).not.toContain('padding: 20px 0 !important');
  });

  it('flush + fillContainer (cards): the thin 4px/6px edge replaces the 12px padding', () => {
    const doc = srcDocOf({ flush: true, fillContainer: true, scale: 0.34 });
    expect(doc).toContain('padding: 4px 6px !important');
    expect(doc).not.toContain('padding: 12px !important');
  });

  it('control: without flush the centred page and its padding stay as before', () => {
    expect(srcDocOf({ scale: 0.5 })).toContain('padding: 20px 0 !important');
    expect(srcDocOf({ fillContainer: true, scale: 0.34 })).toContain('padding: 12px !important');
  });
});
