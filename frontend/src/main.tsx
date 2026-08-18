
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/globals.css";
import { InstallPWAModal } from './components/InstallPWAModal';

import { GoogleOAuthProvider } from '@react-oauth/google';
import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';

import { Toaster } from 'sonner';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

if (Capacitor.isNativePlatform()) {
    SocialLogin.initialize({
        google: {
            webClientId: clientId,
            iOSClientId: import.meta.env.VITE_GOOGLE_IOS_CLIENT_ID || undefined,
            iOSServerClientId: clientId,
        },
    });
}

createRoot(document.getElementById("root")!).render(
    <GoogleOAuthProvider clientId={clientId}>
        <App />
        <InstallPWAModal />
        <Toaster theme="dark" richColors position="top-center" />
    </GoogleOAuthProvider>
);
