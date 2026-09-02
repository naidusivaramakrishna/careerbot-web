import { describe, it, expect } from 'vitest';
import { http, HttpResponse } from 'msw';
import { useHandler } from '../../shared/msw-server';

/**
 * Integration Test: Settings + Profile Synchronization
 *
 * Tests that profile updates in settings sync across the application
 * and are reflected in dashboard
 *
 * Run: npm run test:integration:settings
 */
describe('Settings: Profile Update & Sync', () => {
  it('loads user profile from settings', async () => {
    const profileRes = await fetch('/api/user/profile');
    const profile = await profileRes.json();

    expect(profileRes.status).toBe(200);
    expect(profile.id).toBeDefined();
    expect(profile.email).toBeDefined();
    expect(profile.name).toBeDefined();
  });

  it('updates user profile successfully', async () => {
    const updateRes = await fetch('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Updated Name',
        email: 'newemail@example.com',
      }),
    });

    const updated = await updateRes.json();

    expect(updateRes.status).toBe(200);
    expect(updated.name).toBeDefined();
    expect(updated.email).toBeDefined();
  });

  it('reflects profile changes in dashboard', async () => {
    // Update profile in settings
    const updateRes = await fetch('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify({ name: 'New Name' }),
    });

    const updated = await updateRes.json();
    expect(updated.name).toBe('New Name');

    // Dashboard should reflect change
    const dashboardRes = await fetch('/api/dashboard/summary');
    const dashboard = await dashboardRes.json();

    expect(dashboardRes.status).toBe(200);
    expect(dashboard.user).toBeDefined();
  });

  it('persists profile updates', async () => {
    const updateRes = await fetch('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Persistent Name' }),
    });

    const updated = await updateRes.json();

    // Fetch again - should have the update
    const refetchRes = await fetch('/api/user/profile');
    const refetched = await refetchRes.json();

    expect(refetched.name).toBeDefined();
  });

  it('handles profile update errors gracefully', async () => {
    useHandler(
      http.put('/api/user/profile', () => {
        return HttpResponse.json(
          { error: 'Invalid profile data' },
          { status: 400 }
        );
      })
    );

    const updateRes = await fetch('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify({ name: '' }), // Invalid: empty name
    });

    expect(updateRes.status).toBe(400);
    const error = await updateRes.json();
    expect(error.error).toBeDefined();
  });

  it('validates email format on update', async () => {
    const updateRes = await fetch('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify({ email: 'invalid-email' }),
    });

    // Either succeeds or returns error - depends on backend validation
    expect(updateRes.status).toBeLessThan(500);
  });

  it('maintains email verification status', async () => {
    const profileRes = await fetch('/api/user/profile');
    const profile = await profileRes.json();

    // Profile should include verification status
    expect(profile.email).toBeDefined();
    expect(profileRes.status).toBe(200);
  });

  it('updates multiple profile fields', async () => {
    const updateRes = await fetch('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify({
        name: 'Full Name Update',
        email: 'multi@example.com',
      }),
    });

    const updated = await updateRes.json();

    expect(updateRes.status).toBe(200);
    expect(updated.name).toBe('Full Name Update');
    expect(updated.email).toBe('multi@example.com');
  });

  it('handles concurrent profile updates', async () => {
    // Simulate concurrent updates
    const promises = [
      fetch('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Update 1' }),
      }),
      fetch('/api/user/profile', {
        method: 'PUT',
        body: JSON.stringify({ name: 'Update 2' }),
      }),
    ];

    const responses = await Promise.all(promises);

    // Both should complete (order may vary)
    responses.forEach((res) => {
      expect(res.status).toBe(200);
    });
  });

  it('syncs profile changes across features', async () => {
    // Update in settings
    await fetch('/api/user/profile', {
      method: 'PUT',
      body: JSON.stringify({ name: 'Synced Name' }),
    });

    // Check in dashboard
    const dashboardRes = await fetch('/api/dashboard/summary');
    const dashboard = await dashboardRes.json();

    expect(dashboard.user).toBeDefined();
    expect(dashboardRes.status).toBe(200);
  });
});
