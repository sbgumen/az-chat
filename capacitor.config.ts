import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.azchat',
  appName: 'AZ Chat',
  webDir: 'dist',
  server: {
    cleartext: true,
    hostname: 'localhost',
  },
  android: {
    backgroundColor: '#00000000',
  },
  plugins: {
    StatusBar: {
      style: 'LIGHT',
      backgroundColor: '#00000000',
      overlaysWebView: true,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
