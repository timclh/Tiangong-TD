import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.tiangong.celestialtd',
  appName: '天宫弈',
  webDir: 'build',
  server: {
    androidScheme: 'https',
    iosScheme: 'capacitor',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      launchAutoHide: true,
      backgroundColor: '#120E1E',
      showSpinner: false,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#120E1E',
    },
  },
};

export default config;
