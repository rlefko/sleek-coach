import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Icon } from 'react-native-paper';
import { useAppTheme } from '@/theme';
import { HomeScreen, CheckInScreen, NutritionLogScreen } from '@/screens/home';
import { ProgressScreen, PhotoComparisonScreen } from '@/screens/progress';
import { CoachScreen, CoachPlanScreen } from '@/screens/coach';
import { SettingsScreen } from '@/screens/settings';
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

const HomeNavigator = () => (
  <HomeStack.Navigator>
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

const ProgressNavigator = () => (
  <ProgressStack.Navigator>
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

const CoachNavigator = () => (
  <CoachStack.Navigator>
    <CoachStack.Screen name="Coach" component={CoachScreen} options={{ headerShown: false }} />
    <CoachStack.Screen
      name="CoachPlan"
      component={CoachPlanScreen}
      options={{ title: 'Weekly Plan', headerBackTitle: 'Coach' }}
    />
  </CoachStack.Navigator>
);

const SettingsNavigator = () => (
  <SettingsStack.Navigator screenOptions={{ headerShown: false }}>
    <SettingsStack.Screen name="Settings" component={SettingsScreen} />
  </SettingsStack.Navigator>
);

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
