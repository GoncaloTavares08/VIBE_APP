import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.vibe.nightlife',
  appName: 'VIBE',
  webDir: 'build',
  server: {
    url: 'https://vibeapp.duckdns.org',
    androidScheme: 'https',
    iosScheme: 'https',
    cleartext: false,
  },
  plugins: {
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
