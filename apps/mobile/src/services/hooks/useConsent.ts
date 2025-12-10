import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { legalService } from '../api';
import { queryKeys } from '@/lib/queryKeys';
import type { ConsentRequest, ConsentType } from '../api/types';

export const useConsents = () => {
  return useQuery({
    queryKey: queryKeys.legal.consents(),
    queryFn: legalService.getConsents,
  });
};

export const useGrantConsent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ConsentRequest) => legalService.grantConsent(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.legal.consents() });
    },
  });
};

export const useRevokeConsent = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (consentType: ConsentType) => legalService.revokeConsent(consentType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.legal.consents() });
    },
  });
};

export const useHasConsent = (consentType: ConsentType) => {
  const { data: consents } = useConsents();
  const consent = consents?.consents.find((c) => c.consent_type === consentType);
  return consent?.granted && !consent?.revoked_at;
};
