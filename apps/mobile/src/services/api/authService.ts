import { apiClient } from './client';
import type { LoginRequest, RegisterRequest, TokenResponse } from './types';

export const authService = {
  login: (data: LoginRequest): Promise<TokenResponse> => apiClient.post('/auth/login', data, false),

  register: (data: RegisterRequest): Promise<TokenResponse> =>
    apiClient.post('/auth/register', data, false),

  refresh: (refreshToken: string): Promise<TokenResponse> =>
    apiClient.post('/auth/refresh', { refresh_token: refreshToken }, false),

  logout: (refreshToken: string): Promise<{ message: string }> =>
    apiClient.post('/auth/logout', { refresh_token: refreshToken }),

  logoutAll: (): Promise<{ message: string }> => apiClient.post('/auth/logout-all'),
};
