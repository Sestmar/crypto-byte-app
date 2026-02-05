import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter', // O el ID que tengas
  appName: 'cryptoByte',
  webDir: 'www',
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '953486025598-j4j1otlkse0obv95gcpij2c439fjig7j.apps.googleusercontent.com', 
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;