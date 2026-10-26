import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DownloadModal from '@/app/(resume)/builder/start/_components/DownloadModal';

const spinnersIn = (button: HTMLElement) => button.querySelectorAll('.animate-spin').length;

describe('DownloadModal', () => {
  it('shows the spinner only on the format the user picked', () => {
    const onDownload = vi.fn();
    const { rerender } = render(
      <DownloadModal isOpen onClose={vi.fn()} onDownload={onDownload} downloading={false} />,
    );

    const pdf = screen.getByRole('button', { name: /PDF Document/ });
    const word = screen.getByRole('button', { name: /Word Document/ });

    fireEvent.click(word);
    expect(onDownload).toHaveBeenCalledWith('docx');

    rerender(<DownloadModal isOpen onClose={vi.fn()} onDownload={onDownload} downloading />);

    expect(spinnersIn(word)).toBe(1);
    expect(spinnersIn(pdf)).toBe(0);
    expect(pdf).toBeDisabled();
    expect(word).toBeDisabled();
  });

  it('shows the spinner on PDF when PDF was picked', () => {
    const onDownload = vi.fn();
    const { rerender } = render(
      <DownloadModal isOpen onClose={vi.fn()} onDownload={onDownload} downloading={false} />,
    );

    fireEvent.click(screen.getByRole('button', { name: /PDF Document/ }));
    rerender(<DownloadModal isOpen onClose={vi.fn()} onDownload={onDownload} downloading />);

    expect(spinnersIn(screen.getByRole('button', { name: /PDF Document/ }))).toBe(1);
    expect(spinnersIn(screen.getByRole('button', { name: /Word Document/ }))).toBe(0);
  });
});
