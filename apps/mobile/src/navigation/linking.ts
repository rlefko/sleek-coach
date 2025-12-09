import type { LinkingOptions } from '@react-navigation/native';
import type { RootStackParamList } from './types';

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: ['sleekcoach://', 'https://sleekcoach.com'],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          Register: 'register',
          ForgotPassword: 'forgot-password',
        },
      },
      Main: {
        screens: {
          HomeTab: {
            screens: {
              Home: 'home',
              CheckIn: 'checkin',
              NutritionLog: 'nutrition',
            },
          },
          ProgressTab: {
            screens: {
              Progress: 'progress',
              PhotoComparison: 'photos',
            },
          },
          CoachTab: {
            screens: {
              Coach: 'coach',
              CoachPlan: 'coach/plan',
            },
          },
          SettingsTab: {
            screens: {
              Settings: 'settings',
              EditProfile: 'settings/profile',
              EditGoals: 'settings/goals',
              EditPreferences: 'settings/preferences',
              MFPImport: 'settings/import/mfp',
            },
          },
        },
      },
      Onboarding: 'onboarding',
    },
  },
};
