import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.trace.uxresearch',
  appName: 'TRACE',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
