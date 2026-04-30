import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.smartmotivation.taskreminder',
  appName: 'Smart Motivation Task Reminder',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
  },
};

export default config;
