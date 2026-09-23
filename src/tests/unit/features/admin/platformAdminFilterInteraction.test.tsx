/**
 * BEHAVIOURAL test: click the filter, assert the wire value.
 *
 * The companion source-scanning suite guards against a role being dropped from
 * a list. Codex's review made the fair point that it cannot prove the feature
 * WORKS -- deleting "Platform Admin" from the dropdown while leaving ROLE_MAP
 * intact would pass every one of those assertions.
 *
 * This mounts the real component, opens the real dropdown, clicks the real
 * option, and asserts on the value handed to the caller. It fails if the
 * option is missing, if the map is missing, or if the two disagree.
 */
import { fireEvent, render, screen } from '@testing-library/react';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import SearchFilterControls from
  '@/app/admin/dashboard/admin-management/_components/SearchFilterControls';

function mount() {
  const onFilterChange = vi.fn();
  render(
    <SearchFilterControls
      filters={{ search: '', role: '', status: '' }}
      activeFilterCount={0}
      onFilterChange={onFilterChange}
      onToggleAdvancedFilters={vi.fn()}
    />
  );
  return onFilterChange;
}

describe('filtering admins by the platform-admin role', () => {
  it('offers the option and emits the backend wire value', () => {
    const onFilterChange = mount();

    // Open the role dropdown. Its trigger shows the current value, "Role".
    fireEvent.click(screen.getByText('Role'));

    const option = screen.getByRole('option', { name: 'Platform Admin' });
    expect(option).toBeTruthy();
    fireEvent.click(option);

    // LOWERCASE. get_admins_paginated puts this straight into a Mongo query
    // without normalising, so the uppercase label would match nothing.
    expect(onFilterChange).toHaveBeenCalledWith('role', 'platform_admin');
  });

  it('still emits the wire value for a pre-existing role', () => {
    // Guards against a change that fixes platform_admin by breaking the rest.
    const onFilterChange = mount();
    fireEvent.click(screen.getByText('Role'));
    fireEvent.click(screen.getByRole('option', { name: 'Super Admin' }));
    expect(onFilterChange).toHaveBeenCalledWith('role', 'super_admin');
  });
});
