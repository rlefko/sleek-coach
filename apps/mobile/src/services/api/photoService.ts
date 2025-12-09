import { apiClient } from './client';
import type { ProgressPhoto, PhotoPresignResponse, PaginatedResponse } from './types';

export interface PhotoCommitRequest {
  photo_id: string;
  s3_key: string;
  date: string;
  visibility?: 'private' | 'coach_only';
  metadata?: Record<string, unknown>;
}

export interface PhotoListParams {
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

export interface PhotoWithDownloadUrl extends ProgressPhoto {
  download_url: string;
}

export const photoService = {
  presign: (filename: string, contentType: string): Promise<PhotoPresignResponse> =>
    apiClient.post('/photos/presign', { filename, content_type: contentType }),

  commit: (data: PhotoCommitRequest): Promise<ProgressPhoto> =>
    apiClient.post('/photos/commit', data),

  list: (params?: PhotoListParams): Promise<PaginatedResponse<PhotoWithDownloadUrl>> => {
    const searchParams = new URLSearchParams();
    if (params?.from) searchParams.set('from_date', params.from);
    if (params?.to) searchParams.set('to_date', params.to);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.offset) searchParams.set('offset', String(params.offset));
    const query = searchParams.toString();
    return apiClient.get(`/photos${query ? `?${query}` : ''}`);
  },

  get: (photoId: string): Promise<PhotoWithDownloadUrl> => apiClient.get(`/photos/${photoId}`),

  delete: (photoId: string): Promise<void> => apiClient.delete(`/photos/${photoId}`),

  uploadToS3: async (uploadUrl: string, imageUri: string, contentType: string): Promise<void> => {
    const response = await fetch(imageUri);
    const blob = await response.blob();

    const uploadResponse = await fetch(uploadUrl, {
      method: 'PUT',
      body: blob,
      headers: {
        'Content-Type': contentType,
      },
    });

    if (!uploadResponse.ok) {
      throw new Error(`Failed to upload image to S3: ${uploadResponse.status}`);
    }
  },
};
