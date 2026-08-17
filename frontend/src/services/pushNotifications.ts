import { getToken } from 'firebase/messaging';
import { getFirebaseMessaging } from './firebase';
import { apiFetch } from './api';

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

    return true;
  } catch (err) {
    console.error('Push notification setup failed:', err);
    return false;
  }
}
