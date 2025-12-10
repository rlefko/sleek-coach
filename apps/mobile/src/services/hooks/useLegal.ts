import { useQuery } from '@tanstack/react-query';
import { legalService } from '../api';
import { queryKeys } from '@/lib/queryKeys';

export const usePrivacyPolicy = () => {
  return useQuery({
    queryKey: queryKeys.legal.privacyPolicy(),
    queryFn: legalService.getPrivacyPolicy,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour - legal docs don't change often
  });
};

export const useTermsOfService = () => {
  return useQuery({
    queryKey: queryKeys.legal.termsOfService(),
    queryFn: legalService.getTermsOfService,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
};

export const useDataRetention = () => {
  return useQuery({
    queryKey: queryKeys.legal.dataRetention(),
    queryFn: legalService.getDataRetention,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
};

export const useLegalVersions = () => {
  return useQuery({
    queryKey: queryKeys.legal.versions(),
    queryFn: legalService.getVersions,
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
  });
};
