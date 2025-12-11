import type { NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
};

// Home Stack
export type HomeStackParamList = {
  Home: undefined;
  CheckIn: undefined;
  NutritionLog: undefined;
};

// Progress Stack
export type ProgressStackParamList = {
  Progress: undefined;
  PhotoComparison: undefined;
};

// Coach Stack
export type CoachStackParamList = {
  Coach: undefined;
  CoachPlan: undefined;
};

// Settings Stack
export type SettingsStackParamList = {
  Settings: undefined;
  EditProfile: undefined;
  EditGoals: undefined;
  EditPreferences: undefined;
  MFPImport: undefined;
  PrivacyPolicy: undefined;
  TermsOfService: undefined;
  DataRetention: undefined;
  PrivacySettings: undefined;
};

// Onboarding Stack
export type OnboardingStackParamList = {
  GoalSelection: undefined;
  MeasurementSystem: undefined;
  BaselineMetrics: undefined;
  TimelinePreferences: undefined;
  DietPreferences: undefined;
  PrivacySettings: undefined;
  OnboardingComplete: undefined;
};

// Main Tab Navigator
export type MainTabParamList = {
  HomeTab: NavigatorScreenParams<HomeStackParamList>;
  ProgressTab: NavigatorScreenParams<ProgressStackParamList>;
  CoachTab: NavigatorScreenParams<CoachStackParamList>;
  SettingsTab: NavigatorScreenParams<SettingsStackParamList>;
};

// Root Navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
};

// Screen props helpers
export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

export type HomeScreenProps<T extends keyof HomeStackParamList> = NativeStackScreenProps<
  HomeStackParamList,
  T
>;

export type ProgressScreenProps<T extends keyof ProgressStackParamList> = NativeStackScreenProps<
  ProgressStackParamList,
  T
>;

export type CoachScreenProps<T extends keyof CoachStackParamList> = NativeStackScreenProps<
  CoachStackParamList,
  T
>;

export type SettingsScreenProps<T extends keyof SettingsStackParamList> = NativeStackScreenProps<
  SettingsStackParamList,
  T
>;

export type OnboardingScreenProps<T extends keyof OnboardingStackParamList> =
  NativeStackScreenProps<OnboardingStackParamList, T>;

export type MainTabScreenProps<T extends keyof MainTabParamList> = BottomTabScreenProps<
  MainTabParamList,
  T
>;

export type RootScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

// Declare global types for useNavigation hook
// This is the official React Navigation pattern for type-safe useNavigation()
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace ReactNavigation {
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    interface RootParamList extends RootStackParamList {}
  }
}
