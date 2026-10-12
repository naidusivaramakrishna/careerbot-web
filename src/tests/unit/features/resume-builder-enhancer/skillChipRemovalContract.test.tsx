/**
 * PR #148 review F4. Skills.tsx's onRemoveSkill handlers bail when
 * skill_id_map has no backend id for the skill, because the delete-by-id
 * endpoints reject a plain name. HOW they bail decides what the user sees,
 * and that is TechnologyChipsInput's contract, not Skills.tsx's:
 *
 *   handleRemove() calls onTechnologiesChange ONLY when onRemoveSkill
 *   resolves, and returns without touching it when onRemoveSkill throws.
 *
 * So a bail that RESOLVES removes the chip while the skill is still on the
 * server; a bail that THROWS keeps the chip. This locks the contract down so
 * the Skills.tsx bail cannot quietly go back to `return`.
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import React from 'react';
import TechnologyChipsInput from '@/app/(resume)/builder/creation/_components/editor/TechnologyChipsInput';

function renderChips(onRemoveSkill: (skill: string) => Promise<void>) {
  const onTechnologiesChange = vi.fn();
  render(
    <TechnologyChipsInput
      selectedTechnologies={['Kubernetes']}
      onTechnologiesChange={onTechnologiesChange}
      suggestions={[]}
      onRemoveSkill={onRemoveSkill}
    />,
  );
  return onTechnologiesChange;
}

const clickRemove = () => {
  // The chip's only button is its X.
  const buttons = screen.getAllByRole('button');
  fireEvent.click(buttons[buttons.length - 1]);
};

describe('TechnologyChipsInput remove contract', () => {
  it('keeps the chip when onRemoveSkill rejects (the bail Skills.tsx uses)', async () => {
    const onRemoveSkill = vi.fn().mockRejectedValue(new Error('api_failed'));
    const onTechnologiesChange = renderChips(onRemoveSkill);

    clickRemove();

    await waitFor(() => expect(onRemoveSkill).toHaveBeenCalledWith('Kubernetes'));
    expect(onTechnologiesChange).not.toHaveBeenCalled();
    expect(screen.getByText('Kubernetes')).toBeTruthy();
    cleanup();
  });

  it('removes the chip when onRemoveSkill resolves', async () => {
    const onRemoveSkill = vi.fn().mockResolvedValue(undefined);
    const onTechnologiesChange = renderChips(onRemoveSkill);

    clickRemove();

    await waitFor(() => expect(onTechnologiesChange).toHaveBeenCalledWith([]));
    cleanup();
  });
});
