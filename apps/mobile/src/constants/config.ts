import Constants from 'expo-constants';

export const config = {
  apiUrl: Constants.expoConfig?.extra?.apiUrl ?? 'http://localhost:8000',
  apiVersion: '/api/v1',
} as const;

export const getApiBaseUrl = () => `${config.apiUrl}${config.apiVersion}`;
