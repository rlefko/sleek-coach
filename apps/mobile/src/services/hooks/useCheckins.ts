import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkinService } from '../api';
import { queryKeys } from '@/lib/queryKeys';
import type { CheckInCreate } from '../api/types';

export const useCheckins = (params?: { from?: string; to?: string }) => {
  return useQuery({
    queryKey: queryKeys.checkins.list(params),
    queryFn: () => checkinService.list(params),
  });
};

export const useLatestCheckin = () => {
  return useQuery({
    queryKey: queryKeys.checkins.latest(),
    queryFn: checkinService.latest,
  });
};

export const useWeightTrend = (days = 30) => {
  return useQuery({
    queryKey: queryKeys.checkins.trend(days),
    queryFn: () => checkinService.trend(days),
  });
};

export const useCreateCheckin = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CheckInCreate) => checkinService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.checkins.all });
    },
  });
};

export const useSyncCheckins = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (checkins: CheckInCreate[]) => checkinService.sync(checkins),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.checkins.all });
    },
  });
};
