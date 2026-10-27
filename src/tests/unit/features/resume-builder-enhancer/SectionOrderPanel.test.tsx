import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import SectionOrderPanel from '@/app/(resume)/builder/creation/_components/templates/SectionOrderPanel';

const sections = [{ name: 'Personal Info' }, { name: 'Professional Summary' }, { name: 'Work Experience' }];

// jsdom has no layout: give each row a 40px slot so pointer positions map to rows.
// jsdom has no PointerEvent: a MouseEvent carries clientY / button the same way.
if (typeof window.PointerEvent === 'undefined') {
  class PointerEventPolyfill extends MouseEvent {
    pointerId: number;
    constructor(type: string, init: PointerEventInit = {}) {
      super(type, init);
      this.pointerId = init.pointerId ?? 0;
    }
  }
  (window as unknown as { PointerEvent: unknown }).PointerEvent = PointerEventPolyfill;
}

beforeEach(() => {
  vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function (this: HTMLElement) {
    if (this.hasAttribute('data-row')) {
      const idx = Array.from(this.parentElement!.children).indexOf(this);
      return { top: idx * 40, height: 40, bottom: idx * 40 + 40, left: 0, right: 100, width: 100, x: 0, y: idx * 40, toJSON: () => ({}) } as DOMRect;
    }
    return { top: 0, height: 0, bottom: 0, left: 0, right: 0, width: 0, x: 0, y: 0, toJSON: () => ({}) } as DOMRect;
  });
});

describe('SectionOrderPanel', () => {
  it('lists the sections in their current order with a drag handle each', () => {
    render(<SectionOrderPanel sections={sections} onReorder={vi.fn()} />);
    expect(screen.getByText('Manage section order')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem').map((li) => li.textContent)).toEqual(['Personal Info', 'Professional Summary', 'Work Experience']);
    expect(screen.getByLabelText('Drag to move Work Experience')).toBeInTheDocument();
  });

  it('reports the move when a row is dragged to a new place', () => {
    const onReorder = vi.fn();
    render(<SectionOrderPanel sections={sections} onReorder={onReorder} />);
    const handle = screen.getByLabelText('Drag to move Work Experience');
    fireEvent.pointerDown(handle, { button: 0, pointerId: 1, clientY: 100 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientY: 5 });
    // the list previews the new order while dragging
    expect(screen.getAllByRole('listitem')[0]).toHaveTextContent('Work Experience');
    fireEvent.pointerUp(handle, { pointerId: 1, clientY: 5 });
    expect(onReorder).toHaveBeenCalledTimes(1);
    const r = onReorder.mock.calls[0][0];
    expect([r.source.index, r.destination.index]).toEqual([2, 0]);
  });

  it('does nothing when dropped where it started', () => {
    const onReorder = vi.fn();
    render(<SectionOrderPanel sections={sections} onReorder={onReorder} />);
    const handle = screen.getByLabelText('Drag to move Personal Info');
    fireEvent.pointerDown(handle, { button: 0, pointerId: 1, clientY: 5 });
    fireEvent.pointerUp(handle, { pointerId: 1, clientY: 5 });
    expect(onReorder).not.toHaveBeenCalled();
  });

  it('moves a section with the arrow keys', () => {
    const onReorder = vi.fn();
    render(<SectionOrderPanel sections={sections} onReorder={onReorder} />);
    fireEvent.keyDown(screen.getByLabelText('Drag to move Professional Summary'), { key: 'ArrowDown' });
    const r = onReorder.mock.calls[0][0];
    expect([r.source.index, r.destination.index]).toEqual([1, 2]);
    fireEvent.keyDown(screen.getByLabelText('Drag to move Personal Info'), { key: 'ArrowUp' });
    expect(onReorder).toHaveBeenCalledTimes(1);
  });
});
