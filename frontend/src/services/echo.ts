import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { apiFetch } from './api';

declare global {
  interface Window {
    Pusher: typeof Pusher;
  }
}

let echoInstance: Echo<'reverb'> | null = null;

/**
 * Lazily creates a singleton Echo/Reverb connection authenticated with the
 * same Bearer token used everywhere else (this API has no session auth for
 * Broadcast::routes() to piggyback on, so channel auth goes through our own
 * apiFetch instead of Echo's default cookie-based authorizer).
 */
export function getEcho(): Echo<'reverb'> | null {
  if (!import.meta.env.VITE_REVERB_APP_KEY) return null;
  if (echoInstance) return echoInstance;

  window.Pusher = Pusher;

  echoInstance = new Echo({
    broadcaster: 'reverb',
    key: import.meta.env.VITE_REVERB_APP_KEY,
    wsHost: import.meta.env.VITE_REVERB_HOST,
    wsPort: Number(import.meta.env.VITE_REVERB_PORT) || 80,
    wssPort: Number(import.meta.env.VITE_REVERB_PORT) || 443,
    forceTLS: (import.meta.env.VITE_REVERB_SCHEME || 'https') === 'https',
    enabledTransports: ['ws', 'wss'],
    authorizer: (channel: { name: string }) => ({
      authorize: (
        socketId: string,
        callback: (error: Error | null, data: { auth: string; channel_data?: string } | null) => void
      ) => {
        apiFetch('/broadcasting/auth', {
          method: 'POST',
          body: JSON.stringify({ socket_id: socketId, channel_name: channel.name }),
        })
          .then((data) => callback(null, data))
          .catch((err) => callback(err instanceof Error ? err : new Error(String(err)), null));
      },
    }),
  });

  return echoInstance;
}

export function disconnectEcho(): void {
  echoInstance?.disconnect();
  echoInstance = null;
}
