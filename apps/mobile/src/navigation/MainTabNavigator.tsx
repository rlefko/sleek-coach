import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';
import { useAppTheme } from '@/theme';
import { HomeScreen, CheckInScreen, NutritionLogScreen } from '@/screens/home';
import { ProgressScreen, PhotoComparisonScreen } from '@/screens/progress';
import { CoachScreen, CoachPlanScreen } from '@/screens/coach';
import {
  SettingsScreen,
  EditProfileScreen,
  EditGoalsScreen,
  EditPreferencesScreen,
  MFPImportScreen,
  PrivacySettingsScreen,
} from '@/screens/settings';
import { PrivacyPolicyScreen, TermsOfServiceScreen, DataRetentionScreen } from '@/screens/legal';
import type {
  MainTabParamList,
  HomeStackParamList,
  ProgressStackParamList,
  CoachStackParamList,
  SettingsStackParamList,
} from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();
const HomeStack = createNativeStackNavigator<HomeStackParamList>();
const ProgressStack = createNativeStackNavigator<ProgressStackParamList>();
const CoachStack = createNativeStackNavigator<CoachStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

const HomeNavigator = () => {
  const { theme } = useAppTheme();
  return (
    <HomeStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: { color: theme.colors.onSurface, fontWeight: '600' },
        headerShadowVisible: false,
      }}
    >
      <HomeStack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
      <HomeStack.Screen
        name="CheckIn"
        component={CheckInScreen}
        options={{ title: 'Check-in', headerBackTitle: 'Home' }}
      />
      <HomeStack.Screen
        name="NutritionLog"
        component={NutritionLogScreen}
        options={{ title: 'Log Nutrition', headerBackTitle: 'Home' }}
      />
    </HomeStack.Navigator>
  );
};

const ProgressNavigator = () => {
  const { theme } = useAppTheme();
  return (
    <ProgressStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: { color: theme.colors.onSurface, fontWeight: '600' },
        headerShadowVisible: false,
      }}
    >
      <ProgressStack.Screen
        name="Progress"
        component={ProgressScreen}
        options={{ headerShown: false }}
      />
      <ProgressStack.Screen
        name="PhotoComparison"
        component={PhotoComparisonScreen}
        options={{ title: 'Compare Photos', headerBackTitle: 'Progress' }}
      />
    </ProgressStack.Navigator>
  );
};

const CoachNavigator = () => {
  const { theme } = useAppTheme();
  return (
    <CoachStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: { color: theme.colors.onSurface, fontWeight: '600' },
        headerShadowVisible: false,
      }}
    >
      <CoachStack.Screen name="Coach" component={CoachScreen} options={{ headerShown: false }} />
      <CoachStack.Screen
        name="CoachPlan"
        component={CoachPlanScreen}
        options={{ title: 'Weekly Plan', headerBackTitle: 'Coach' }}
      />
    </CoachStack.Navigator>
  );
};

const SettingsNavigator = () => {
  const { theme } = useAppTheme();
  return (
    <SettingsStack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: theme.colors.surface },
        headerTintColor: theme.colors.primary,
        headerTitleStyle: { color: theme.colors.onSurface, fontWeight: '600' },
        headerShadowVisible: false,
      }}
    >
      <SettingsStack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ headerShown: false }}
      />
      <SettingsStack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ title: 'Edit Profile', headerBackTitle: 'Settings' }}
      />
      <SettingsStack.Screen
        name="EditGoals"
        component={EditGoalsScreen}
        options={{ title: 'Edit Goals', headerBackTitle: 'Settings' }}
      />
      <SettingsStack.Screen
        name="EditPreferences"
        component={EditPreferencesScreen}
        options={{ title: 'Diet Preferences', headerBackTitle: 'Settings' }}
      />
      <SettingsStack.Screen
        name="MFPImport"
        component={MFPImportScreen}
        options={{ title: 'Import from MFP', headerBackTitle: 'Settings' }}
      />
      <SettingsStack.Screen
        name="PrivacyPolicy"
        component={PrivacyPolicyScreen}
        options={{ title: 'Privacy Policy', headerBackTitle: 'Settings' }}
      />
      <SettingsStack.Screen
        name="TermsOfService"
        component={TermsOfServiceScreen}
        options={{ title: 'Terms of Service', headerBackTitle: 'Settings' }}
      />
      <SettingsStack.Screen
        name="DataRetention"
        component={DataRetentionScreen}
        options={{ title: 'Data Retention', headerBackTitle: 'Settings' }}
      />
      <SettingsStack.Screen
        name="PrivacySettings"
        component={PrivacySettingsScreen}
        options={{ title: 'Privacy Settings', headerBackTitle: 'Settings' }}
      />
    </SettingsStack.Navigator>
  );
};

const tabIcons: Record<keyof MainTabParamList, string> = {
  HomeTab: 'home',
  ProgressTab: 'chart-line',
  CoachTab: 'robot',
  SettingsTab: 'cog',
};

export const MainTabNavigator: React.FC = () => {
  const { theme } = useAppTheme();

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.onSurfaceVariant,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.outlineVariant,
        },
        tabBarIcon: ({ color, size }) => (
          <Icon source={tabIcons[route.name]} size={size} color={color} />
        ),
      })}
    >
      <Tab.Screen name="HomeTab" component={HomeNavigator} options={{ title: 'Today' }} />
      <Tab.Screen
        name="ProgressTab"
        component={ProgressNavigator}
        options={{ title: 'Progress' }}
      />
      <Tab.Screen name="CoachTab" component={CoachNavigator} options={{ title: 'Coach' }} />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsNavigator}
        options={{ title: 'Settings' }}
      />
    </Tab.Navigator>
  );
};
