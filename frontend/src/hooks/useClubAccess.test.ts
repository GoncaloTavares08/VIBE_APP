import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from '../services/api';
import { useClubAccess } from './useClubAccess';

vi.mock('../services/api', () => ({
  apiFetch: vi.fn(),
}));

describe('useClubAccess', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.mocked(apiFetch).mockReset();
    window.history.pushState({}, '', '/vibeclub/dashboard');
  });

  it('grants access and caches the result when the API confirms it', async () => {
    vi.mocked(apiFetch).mockResolvedValue({
      has_access: true,
      club: { name: 'Vibe Club' },
      role: 'CLIENT',
      points: 42,
      joined_at: '2026-01-01',
    });

    const { result } = renderHook(() => useClubAccess(1, '/vibeclub/dashboard'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasAccess).toBe(true);
    expect(result.current.role).toBe('CLIENT');
    expect(result.current.points).toBe(42);
    expect(apiFetch).toHaveBeenCalledTimes(1);

    const cached = sessionStorage.getItem('club_access_vibeclub_1');
    expect(cached).not.toBeNull();
    expect(JSON.parse(cached!).hasAccess).toBe(true);
  });

  it('uses the cached result instead of calling the API again', async () => {
    sessionStorage.setItem(
      'club_access_vibeclub_1',
      JSON.stringify({ hasAccess: true, clubName: 'Vibe Club', role: 'RP', points: 10, memberSince: null, error: null })
    );

    const { result } = renderHook(() => useClubAccess(1, '/vibeclub/dashboard'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.role).toBe('RP');
    expect(apiFetch).not.toHaveBeenCalled();
  });

  it('denies access and surfaces an error when the API call fails', async () => {
    vi.mocked(apiFetch).mockRejectedValue(new Error('network down'));

    const { result } = renderHook(() => useClubAccess(1, '/vibeclub/dashboard'));

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.hasAccess).toBe(false);
    expect(result.current.error).toBe('network down');
  });
});
