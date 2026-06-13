/**
 * Unit tests for ConfirmDeleteModal — reusable delete confirmation modal.
 *
 * Covers:
 *   - Does not render when open=false
 *   - Renders title and description when open=true
 *   - Cancel button calls onCancel
 *   - Confirm (Delete) button calls onConfirm
 *   - Buttons are disabled while loading=true
 *   - Confirm button shows "Deleting..." while loading
 *   - Custom title and description are rendered
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';

import ConfirmDeleteModal from '@/app/(user)/profile/_components/ConfirmDeleteModal';

const defaultProps = {
  open: true,
  onCancel: vi.fn(),
  onConfirm: vi.fn(),
};

describe('ConfirmDeleteModal — visibility', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not render when open=false', () => {
    render(<ConfirmDeleteModal {...defaultProps} open={false} />);
    expect(screen.queryByText('Delete Experience')).not.toBeInTheDocument();
  });

  it('renders when open=true', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    expect(screen.getByText('Delete Experience')).toBeInTheDocument();
  });
});

describe('ConfirmDeleteModal — default content', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows the default title "Delete Experience"', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    expect(screen.getByText('Delete Experience')).toBeInTheDocument();
  });

  it('shows the default description text', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    expect(
      screen.getByText(/are you sure you want to delete this experience/i)
    ).toBeInTheDocument();
  });

  it('renders Cancel and Delete buttons', () => {
    render(<ConfirmDeleteModal {...defaultProps} />);
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument();
  });
});

describe('ConfirmDeleteModal — custom props', () => {
  beforeEach(() => vi.clearAllMocks());

  it('renders a custom title', () => {
    render(
      <ConfirmDeleteModal {...defaultProps} title="Delete Education" />
    );
    expect(screen.getByText('Delete Education')).toBeInTheDocument();
  });

  it('renders a custom description', () => {
    render(
      <ConfirmDeleteModal
        {...defaultProps}
        description="This will permanently remove your education record."
      />
    );
    expect(
      screen.getByText('This will permanently remove your education record.')
    ).toBeInTheDocument();
  });
});

describe('ConfirmDeleteModal — actions', () => {
  beforeEach(() => vi.clearAllMocks());

  it('calls onCancel when Cancel is clicked', () => {
    const onCancel = vi.fn();
    render(<ConfirmDeleteModal {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /cancel/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });

  it('calls onConfirm when Delete is clicked', () => {
    const onConfirm = vi.fn();
    render(<ConfirmDeleteModal {...defaultProps} onConfirm={onConfirm} />);
    fireEvent.click(screen.getByRole('button', { name: /^delete$/i }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onCancel when the modal backdrop X button is clicked', () => {
    const onCancel = vi.fn();
    render(<ConfirmDeleteModal {...defaultProps} onCancel={onCancel} />);
    fireEvent.click(screen.getByRole('button', { name: /close modal/i }));
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});

describe('ConfirmDeleteModal — loading state', () => {
  beforeEach(() => vi.clearAllMocks());

  it('shows "Deleting..." on the confirm button when loading=true', () => {
    render(<ConfirmDeleteModal {...defaultProps} loading={true} />);
    expect(screen.getByRole('button', { name: /deleting/i })).toBeInTheDocument();
  });

  it('disables both buttons when loading=true', () => {
    render(<ConfirmDeleteModal {...defaultProps} loading={true} />);
    expect(screen.getByRole('button', { name: /cancel/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /deleting/i })).toBeDisabled();
  });

  it('enables both buttons when loading=false', () => {
    render(<ConfirmDeleteModal {...defaultProps} loading={false} />);
    expect(screen.getByRole('button', { name: /cancel/i })).not.toBeDisabled();
    expect(screen.getByRole('button', { name: /^delete$/i })).not.toBeDisabled();
  });
});
