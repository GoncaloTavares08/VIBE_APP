
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./styles/globals.css";
import { InstallPWAModal } from './components/InstallPWAModal';

import { GoogleOAuthProvider } from '@react-oauth/google';

import { Toaster } from 'sonner';

const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

createRoot(document.getElementById("root")!).render(
    <GoogleOAuthProvider clientId={clientId}>
        <App />
        <InstallPWAModal />
        <Toaster theme="dark" richColors position="top-center" />
    </GoogleOAuthProvider>
);
