import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useAuth } from './useAuth';

function makeToken(exp: number): string {
  const payload = btoa(JSON.stringify({ exp }));
  return `header.${payload}.signature`;
}

const futureExp = () => Math.floor(Date.now() / 1000) + 3600;
const pastExp = () => Math.floor(Date.now() / 1000) - 3600;

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('starts unauthenticated when nothing is stored', () => {
    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('login stores the token/user and becomes authenticated', () => {
    const { result } = renderHook(() => useAuth());
    const token = makeToken(futureExp());
    const user = { id: 1, name: 'Ana', email: 'ana@example.com' };

    act(() => {
      result.current.login(token, user);
    });

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.user).toEqual(user);
    expect(localStorage.getItem('authToken')).toBe(token);
    expect(JSON.parse(localStorage.getItem('user')!)).toEqual(user);
  });

  it('clears an expired session on mount instead of trusting it', () => {
    const token = makeToken(pastExp());
    localStorage.setItem('authToken', token);
    localStorage.setItem('user', JSON.stringify({ id: 1, name: 'Ana', email: 'ana@example.com' }));

    const { result } = renderHook(() => useAuth());

    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });

  it('logout clears storage and club-access cache', () => {
    const { result } = renderHook(() => useAuth());
    const token = makeToken(futureExp());

    act(() => {
      result.current.login(token, { id: 1, name: 'Ana', email: 'ana@example.com' });
    });
    sessionStorage.setItem('club_access_vibeclub_1', JSON.stringify({ hasAccess: true }));

    act(() => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorage.getItem('authToken')).toBeNull();
    expect(sessionStorage.getItem('club_access_vibeclub_1')).toBeNull();
  });
});
