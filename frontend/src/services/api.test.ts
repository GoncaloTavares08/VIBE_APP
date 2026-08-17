import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { apiFetch } from './api';

function mockFetchOnce(response: Partial<Response> & { text: () => Promise<string> }) {
  global.fetch = vi.fn().mockResolvedValue(response as Response);
}

describe('apiFetch', () => {
  beforeEach(() => {
    localStorage.clear();
    window.history.pushState({}, '', '/');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('parses a successful JSON response', async () => {
    mockFetchOnce({ text: async () => JSON.stringify({ status: 'success' }) });

    const data = await apiFetch('/ping');

    expect(data).toEqual({ status: 'success' });
  });

  it('attaches the Authorization header when a token is stored', async () => {
    localStorage.setItem('authToken', 'abc123');
    mockFetchOnce({ text: async () => JSON.stringify({ status: 'success' }) });

    await apiFetch('/ping');

    const [, options] = (global.fetch as any).mock.calls[0];
    expect(options.headers.Authorization).toBe('Bearer abc123');
  });

  it('attaches X-Client-ID from the first URL path segment', async () => {
    window.history.pushState({}, '', '/vibeclub/dashboard');
    mockFetchOnce({ text: async () => JSON.stringify({ status: 'success' }) });

    await apiFetch('/ping');

    const [url, options] = (global.fetch as any).mock.calls[0];
    expect(options.headers['X-Client-ID']).toBe('vibeclub');
    expect(url).toContain('__cid=vibeclub');
  });

  it('throws on an empty response body', async () => {
    mockFetchOnce({ text: async () => '' });

    await expect(apiFetch('/ping')).rejects.toThrow('Empty response from server');
  });

  it('throws a descriptive error on invalid JSON', async () => {
    mockFetchOnce({ text: async () => 'not json' });

    await expect(apiFetch('/ping')).rejects.toThrow(/Invalid JSON response/);
  });

  it('dispatches a networkError event when fetch fails outright', async () => {
    global.fetch = vi.fn().mockRejectedValue(new TypeError('Failed to fetch'));
    const handler = vi.fn();
    window.addEventListener('networkError', handler);

    await expect(apiFetch('/ping')).rejects.toThrow();

    expect(handler).toHaveBeenCalledTimes(1);
    window.removeEventListener('networkError', handler);
  });
});
