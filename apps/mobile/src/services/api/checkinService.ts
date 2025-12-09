import { apiClient } from './client';
import type { CheckIn, CheckInCreate, CheckInListResponse, WeightTrendResponse } from './types';

export const checkinService = {
  create: (data: CheckInCreate): Promise<CheckIn> => apiClient.post('/checkins', data),

  list: (params?: {
    from?: string;
    to?: string;
    limit?: number;
    offset?: number;
  }): Promise<CheckInListResponse> => {
    const searchParams = new URLSearchParams();
    if (params?.from) searchParams.set('from_date', params.from);
    if (params?.to) searchParams.set('to_date', params.to);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));
    const query = searchParams.toString();
    return apiClient.get(`/checkins${query ? `?${query}` : ''}`);
  },

  latest: (): Promise<CheckIn> => apiClient.get('/checkins/latest'),

  trend: (days = 30): Promise<WeightTrendResponse> => apiClient.get(`/checkins/trend?days=${days}`),

  sync: (checkins: CheckInCreate[]): Promise<{ synced: number; conflicts: number }> =>
    apiClient.post('/checkins/sync', { checkins }),
};
