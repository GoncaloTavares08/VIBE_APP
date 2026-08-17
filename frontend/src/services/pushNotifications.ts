import { getToken, onMessage } from 'firebase/messaging';
import { getFirebaseMessaging } from './firebase';
import { apiFetch } from './api';

let foregroundListenerAttached = false;

/**
 * Requests notification permission and registers the resulting FCM token with
 * the backend. Fails silently (returns false) if the browser doesn't support
 * push, Firebase isn't configured, or the user declines — the app must work
 * fine without push, this is purely additive.
 */
export async function enablePushNotifications(): Promise<boolean> {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    return false;
  }

  try {
    const messaging = await getFirebaseMessaging();
    if (!messaging) return false;

    const permission = await Notification.requestPermission();
    if (permission !== 'granted') return false;

    const registration = await navigator.serviceWorker.ready;
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    const token = await getToken(messaging, {
      vapidKey,
      serviceWorkerRegistration: registration,
    });

    if (!token) return false;

    await apiFetch('/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({ token, platform: 'web' }),
    });

    await listenForForegroundMessages();

    return true;
  } catch (err) {
    console.error('Push notification setup failed:', err);
    return false;
  }
}

/**
 * Firebase only auto-displays a notification via the service worker's
 * onBackgroundMessage when the app is closed/backgrounded. While the tab is
 * open and focused, the message arrives silently in-page instead — this shows
 * it as a real system notification too, so the user always sees it either way.
 *
 * Must be called on every app load where permission is already granted, not
 * just the one session where the user first grants it.
 */
export async function listenForForegroundMessages(): Promise<void> {
  if (foregroundListenerAttached) return;

  const messaging = await getFirebaseMessaging();
  if (!messaging) return;

  foregroundListenerAttached = true;

  onMessage(messaging, async (payload) => {
    const title = payload.notification?.title || 'VIBE';
    const body = payload.notification?.body || '';
    const registration = await navigator.serviceWorker.ready;
    registration.showNotification(title, {
      body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      data: payload.data,
    });
  });
}
