export { useLogin, useRegister, useLogout } from './useAuth';
export { useUser, useUpdateProfile, useUpdateGoals, useUpdatePreferences } from './useUser';
export { useSubmitOnboarding } from './useOnboarding';
export {
  useCheckins,
  useLatestCheckin,
  useWeightTrend,
  useCreateCheckin,
  useSyncCheckins,
} from './useCheckins';
export {
  useNutritionDay,
  useNutritionRange,
  useLogNutrition,
  useCalculateMacroTargets,
} from './useNutrition';
export { usePhotos, usePhoto, useUploadPhoto, useDeletePhoto } from './usePhotos';
export {
  useInsights,
  usePlan,
  useGeneratePlan,
  useChat,
  useChatStream,
  useChatSessions,
} from './useCoach';
export {
  usePrivacyPolicy,
  useTermsOfService,
  useDataRetention,
  useLegalVersions,
} from './useLegal';
export { useConsents, useGrantConsent, useRevokeConsent, useHasConsent } from './useConsent';
