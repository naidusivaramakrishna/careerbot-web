import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import AISuggestions from '@/app/(resume)/builder/creation/_components/editor/AISuggestions';
import { InlineEditorContext } from '@/app/(resume)/builder/creation/_components/editor/InlineEditorContext';

const options = ['First suggestion', 'Second suggestion'];

const renderInline = (props: Partial<React.ComponentProps<typeof AISuggestions>> = {}) => {
  const onSelect = vi.fn();
  const onClose = vi.fn();
  const anchor = document.createElement('button');
  document.body.appendChild(anchor);
  render(
    <InlineEditorContext.Provider value={{ anchorRef: { current: anchor } }}>
      <AISuggestions options={options} onSelect={onSelect} onClose={onClose} {...props} />
    </InlineEditorContext.Provider>,
  );
  return { onSelect, onClose, anchor };
};

describe('AISuggestions inside the inline editor', () => {
  it('opens as a centred modal with a title, description, close icon and chevron rows', () => {
    renderInline({ description: 'Based on your target role and career level, here are some professional summary suggestions.' });

    const dialog = screen.getByRole('dialog', { name: 'AI Suggestions' });
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(screen.getByRole('heading', { name: 'AI Suggestions' })).toBeInTheDocument();
    expect(screen.getByText(/professional summary suggestions/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Close suggestions' })).toBeInTheDocument();
    expect(screen.getAllByRole('button', { name: /suggestion$/ })).toHaveLength(2);
    expect(dialog.querySelectorAll('svg.lucide-chevron-right').length).toBe(2);
  });

  it('fills with the picked suggestion and closes by itself', () => {
    const { onSelect, onClose } = renderInline();

    fireEvent.click(screen.getByText('Second suggestion'));

    expect(onSelect).toHaveBeenCalledWith('Second suggestion');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('closes from the close icon, Escape and a click on the blurred backdrop', () => {
    const { onClose } = renderInline();

    fireEvent.click(screen.getByRole('button', { name: 'Close suggestions' }));
    fireEvent.keyDown(document, { key: 'Escape' });
    const backdrop = screen.getByRole('dialog').previousElementSibling as HTMLElement;
    fireEvent.click(backdrop);

    expect(onClose).toHaveBeenCalledTimes(3);
  });

  it('does not close when the click is inside the modal', () => {
    const { onClose } = renderInline();

    fireEvent.click(screen.getByRole('heading', { name: 'AI Suggestions' }));

    expect(onClose).not.toHaveBeenCalled();
  });
});

describe('AISuggestions over the editor panel', () => {
  it('is drawn inside the given panel, covering only it, not the whole page', () => {
    const host = document.createElement('div');
    document.body.appendChild(host);
    render(
      <InlineEditorContext.Provider value={{ anchorRef: { current: null }, overlayHost: host }}>
        <AISuggestions options={options} onSelect={vi.fn()} onClose={vi.fn()} />
      </InlineEditorContext.Provider>,
    );

    const dialog = screen.getByRole('dialog', { name: 'AI Suggestions' });
    expect(host).toContainElement(dialog);
    const overlay = dialog.parentElement as HTMLElement;
    expect(overlay.className).toContain('absolute');
    expect(overlay.className).not.toContain('fixed');
  });

  it('covers the whole page when no panel is given', () => {
    renderInline();
    const overlay = screen.getByRole('dialog').parentElement as HTMLElement;
    expect(overlay.className).toContain('fixed');
  });
});

describe('AISuggestions outside the inline editor (ATS pages, modal)', () => {
  it('keeps the side-panel behaviour: stays open after a pick', () => {
    const onSelect = vi.fn();
    const onClose = vi.fn();
    render(<AISuggestions options={options} onSelect={onSelect} onClose={onClose} />);

    fireEvent.click(screen.getByText('First suggestion'));

    expect(onSelect).toHaveBeenCalledWith('First suggestion');
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
