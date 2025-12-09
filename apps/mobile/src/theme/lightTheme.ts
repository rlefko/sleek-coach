import { MD3LightTheme } from 'react-native-paper';
import { lightColors } from './colors';

export const lightTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    ...lightColors,
  },
};
