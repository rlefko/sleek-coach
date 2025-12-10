import { apiClient } from './client';
import type { LegalDocument, LegalVersions, Consent, ConsentRequest, ConsentsList } from './types';

export const legalService = {
  getPrivacyPolicy: (): Promise<LegalDocument> => apiClient.get('/legal/privacy-policy'),

  getTermsOfService: (): Promise<LegalDocument> => apiClient.get('/legal/terms-of-service'),

  getDataRetention: (): Promise<LegalDocument> => apiClient.get('/legal/data-retention'),

  getVersions: (): Promise<LegalVersions> => apiClient.get('/legal/versions'),

  getConsents: (): Promise<ConsentsList> => apiClient.get('/me/consents'),

  grantConsent: (data: ConsentRequest): Promise<Consent> => apiClient.post('/me/consents', data),

  revokeConsent: (consentType: string): Promise<Consent> =>
    apiClient.delete(`/me/consents/${consentType}`),
};
