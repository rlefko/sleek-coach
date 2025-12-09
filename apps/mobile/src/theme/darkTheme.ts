import { MD3DarkTheme } from 'react-native-paper';
import { darkColors } from './colors';

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    ...darkColors,
  },
};
