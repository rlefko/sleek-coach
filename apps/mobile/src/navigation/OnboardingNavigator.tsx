import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  GoalSelectionScreen,
  BaselineMetricsScreen,
  TimelinePreferencesScreen,
  DietPreferencesScreen,
  PrivacySettingsScreen,
  OnboardingCompleteScreen,
} from '@/screens/onboarding';
import type { OnboardingStackParamList } from './types';

const Stack = createNativeStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="GoalSelection" component={GoalSelectionScreen} />
      <Stack.Screen name="BaselineMetrics" component={BaselineMetricsScreen} />
      <Stack.Screen name="TimelinePreferences" component={TimelinePreferencesScreen} />
      <Stack.Screen name="DietPreferences" component={DietPreferencesScreen} />
      <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} />
      <Stack.Screen name="OnboardingComplete" component={OnboardingCompleteScreen} />
    </Stack.Navigator>
  );
};
