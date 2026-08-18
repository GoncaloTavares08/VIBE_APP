import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vibe.nightlife',
  appName: 'VIBE',
  webDir: 'build',
  // Native WebView background (not just CSS) — without this, iOS/Android fall
  // back to a light system default, which shows through during elastic
  // scroll bounce and safe-area gaps before/between content painting.
  backgroundColor: '#0a0a0a',
  server: {
    url: 'https://vibeapp.duckdns.org',
    androidScheme: 'https',
    iosScheme: 'https',
    cleartext: false,
  },
  ios: {
    // Let our own CSS (env(safe-area-inset-*), viewport-fit=cover) be the
    // single source of truth for safe-area spacing. Leaving this at the
    // default lets the native scrollview ALSO auto-inset content, which
    // fights with the CSS padding and causes content to jump back under the
    // notch/status bar as soon as the page scrolls.
    contentInset: 'never',
  },
  plugins: {
    // Capacitor's built-in SystemBars plugin auto-picks LIGHT/DARK status bar
    // style based on the *device's* day/night system setting by default —
    // overriding any manual native code. This app is always dark-themed, so
    // force DARK (light icons) regardless of the device's own light/dark mode.
    SystemBars: {
      style: 'DARK',
    },
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#0a0a0a',
      showSpinner: false,
    },
    SocialLogin: {
      providers: {
        google: true,
        facebook: false,
        apple: false,
        twitter: false,
      },
    },
  },
};

export default config;
