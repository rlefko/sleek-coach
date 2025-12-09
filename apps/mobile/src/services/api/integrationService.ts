import { getApiBaseUrl } from '@/constants/config';
import { useAuthStore } from '@/stores/authStore';
import type { MFPImportResponse } from './types';
import type { DocumentPickerAsset } from 'expo-document-picker';

export const integrationService = {
  importMFP: async (file: DocumentPickerAsset, overwrite: boolean): Promise<MFPImportResponse> => {
    const formData = new FormData();
    formData.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || 'application/zip',
    } as unknown as Blob);

    const accessToken = useAuthStore.getState().accessToken;
    const baseUrl = getApiBaseUrl();

    const response = await fetch(`${baseUrl}/integrations/mfp/import?overwrite=${overwrite}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || 'Import failed');
    }

    return response.json();
  },
};
