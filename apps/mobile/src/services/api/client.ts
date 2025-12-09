import { getApiBaseUrl } from '@/constants/config';
import { useAuthStore } from '@/stores/authStore';
import type { ApiError, TokenResponse } from './types';

class ApiClient {
  private baseUrl: string;
  private isRefreshing = false;
  private refreshPromise: Promise<void> | null = null;

  constructor() {
    this.baseUrl = getApiBaseUrl();
  }

  private getHeaders(includeAuth = true): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const accessToken = useAuthStore.getState().accessToken;
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }
    }

    return headers;
  }

  private async handleRefreshToken(): Promise<void> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise;
    }

    this.isRefreshing = true;
    this.refreshPromise = (async () => {
      const { refreshToken, setTokens, logout } = useAuthStore.getState();

      if (!refreshToken) {
        logout();
        throw new Error('No refresh token');
      }

      try {
        const response = await fetch(`${this.baseUrl}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: refreshToken }),
        });

        if (!response.ok) {
          throw new Error('Token refresh failed');
        }

        const data: TokenResponse = await response.json();
        setTokens(data.access_token, data.refresh_token);
      } catch (error) {
        logout();
        throw error;
      } finally {
        this.isRefreshing = false;
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  async request<T>(endpoint: string, options: RequestInit = {}, requiresAuth = true): Promise<T> {
    const headers = this.getHeaders(requiresAuth);
    const url = `${this.baseUrl}${endpoint}`;

    let response = await fetch(url, {
      ...options,
      headers: { ...headers, ...options.headers },
    });

    // Handle 401 - try to refresh token
    if (response.status === 401 && requiresAuth) {
      try {
        await this.handleRefreshToken();
        const newHeaders = this.getHeaders(true);
        response = await fetch(url, {
          ...options,
          headers: { ...newHeaders, ...options.headers },
        });
      } catch {
        // Refresh failed, error already handled
        throw { detail: 'Session expired. Please log in again.', status: 401 } as ApiError;
      }
    }

    if (!response.ok) {
      let error: ApiError;
      try {
        error = await response.json();
        error.status = response.status;
      } catch {
        error = {
          detail: 'An unexpected error occurred',
          status: response.status,
        };
      }
      throw error;
    }

    // Handle 204 No Content
    if (response.status === 204) {
      return undefined as T;
    }

    return response.json();
  }

  async get<T>(endpoint: string, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, requiresAuth);
  }

  async post<T>(endpoint: string, data?: unknown, requiresAuth = true): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      requiresAuth
    );
  }

  async patch<T>(endpoint: string, data: unknown, requiresAuth = true): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PATCH',
        body: JSON.stringify(data),
      },
      requiresAuth
    );
  }

  async put<T>(endpoint: string, data: unknown, requiresAuth = true): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      },
      requiresAuth
    );
  }

  async delete<T>(endpoint: string, requiresAuth = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }, requiresAuth);
  }
}

export const apiClient = new ApiClient();
