export const queryKeys = {
  // User
  user: {
    all: ['user'] as const,
    me: () => [...queryKeys.user.all, 'me'] as const,
    profile: () => [...queryKeys.user.all, 'profile'] as const,
  },

  // Check-ins
  checkins: {
    all: ['checkins'] as const,
    list: (filters?: { from?: string; to?: string }) =>
      [...queryKeys.checkins.all, 'list', filters] as const,
    latest: () => [...queryKeys.checkins.all, 'latest'] as const,
    trend: (days?: number) => [...queryKeys.checkins.all, 'trend', days] as const,
    single: (id: string) => [...queryKeys.checkins.all, 'single', id] as const,
  },

  // Nutrition
  nutrition: {
    all: ['nutrition'] as const,
    day: (date: string) => [...queryKeys.nutrition.all, 'day', date] as const,
    range: (from: string, to: string) => [...queryKeys.nutrition.all, 'range', from, to] as const,
    aggregate: (from: string, to: string) =>
      [...queryKeys.nutrition.all, 'aggregate', from, to] as const,
    targets: () => [...queryKeys.nutrition.all, 'targets'] as const,
  },

  // Photos
  photos: {
    all: ['photos'] as const,
    list: (filters?: { from?: string; to?: string }) =>
      [...queryKeys.photos.all, 'list', filters] as const,
    single: (id: string) => [...queryKeys.photos.all, 'single', id] as const,
  },

  // Coach
  coach: {
    all: ['coach'] as const,
    insights: () => [...queryKeys.coach.all, 'insights'] as const,
    plan: () => [...queryKeys.coach.all, 'plan'] as const,
    sessions: () => [...queryKeys.coach.all, 'sessions'] as const,
    session: (sessionId: string) => [...queryKeys.coach.all, 'session', sessionId] as const,
    messages: (sessionId: string) => [...queryKeys.coach.all, 'messages', sessionId] as const,
  },

  // Legal
  legal: {
    all: ['legal'] as const,
    privacyPolicy: () => [...queryKeys.legal.all, 'privacy-policy'] as const,
    termsOfService: () => [...queryKeys.legal.all, 'terms-of-service'] as const,
    dataRetention: () => [...queryKeys.legal.all, 'data-retention'] as const,
    versions: () => [...queryKeys.legal.all, 'versions'] as const,
    consents: () => [...queryKeys.legal.all, 'consents'] as const,
  },
} as const;
