import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.medli.app',
  appName: 'Medli',

  webDir: 'public',

  server: {
    url: 'https://medli-theta.vercel.app',
    cleartext: true,
  },
};

export default config;