import { initializeApp } from 'firebase/app';
import { getMessaging, isSupported } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: ReturnType<typeof initializeApp> | null = null;

export function getFirebaseApp() {
  if (!firebaseConfig.apiKey) return null;
  if (!app) app = initializeApp(firebaseConfig);
  return app;
}

export async function getFirebaseMessaging() {
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  if (!(await isSupported())) return null;
  return getMessaging(firebaseApp);
}
