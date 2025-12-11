import EventSource, { type MessageEvent } from 'react-native-sse';

import { getApiBaseUrl } from '@/constants/config';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from './client';
import type {
  ChatRequest,
  ChatResponse,
  StreamEvent,
  WeeklyPlanRequest,
  WeeklyPlanResponse,
  InsightsResponse,
} from './types';

export const coachService = {
  /**
   * Send a chat message and get a complete response (non-streaming)
   */
  chat: (request: ChatRequest): Promise<ChatResponse> => apiClient.post('/coach/chat', request),

  /**
   * Send a chat message and receive streaming SSE events.
   * Uses react-native-sse for React Native compatibility.
   */
  chatStream: async function* (request: ChatRequest): AsyncGenerator<StreamEvent> {
    const baseUrl = getApiBaseUrl();
    const accessToken = useAuthStore.getState().accessToken;

    // Promise-based queue to bridge EventSource events to async generator
    const eventQueue: StreamEvent[] = [];
    let resolveNext: ((value: StreamEvent | null) => void) | null = null;
    let isDone = false;

    const es = new EventSource<'message' | 'error'>(`${baseUrl}/coach/chat/stream`, {
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      method: 'POST',
      body: JSON.stringify(request),
    });

    const pushEvent = (event: StreamEvent) => {
      if (resolveNext) {
        resolveNext(event);
        resolveNext = null;
      } else {
        eventQueue.push(event);
      }
    };

    const signalDone = () => {
      isDone = true;
      if (resolveNext) {
        resolveNext(null);
        resolveNext = null;
      }
    };

    // Handle SSE message events
    es.addEventListener('message', (e: MessageEvent) => {
      if (e.data) {
        try {
          const parsed = JSON.parse(e.data) as StreamEvent;
          pushEvent(parsed);

          if (parsed.type === 'done' || parsed.type === 'error') {
            signalDone();
            es.close();
          }
        } catch {
          // Skip malformed JSON
        }
      }
    });

    // Handle connection errors
    es.addEventListener('error', (e) => {
      const errorMessage = e instanceof Error ? e.message : 'Connection error occurred';
      pushEvent({ type: 'error', data: errorMessage });
      signalDone();
      es.close();
    });

    // Async generator yielding from the queue
    try {
      while (!isDone || eventQueue.length > 0) {
        if (eventQueue.length > 0) {
          const event = eventQueue.shift()!;
          yield event;
          if (event.type === 'done' || event.type === 'error') {
            break;
          }
        } else if (!isDone) {
          // Wait for next event
          const event = await new Promise<StreamEvent | null>((resolve) => {
            resolveNext = resolve;
          });
          if (event === null) {
            break;
          }
          yield event;
          if (event.type === 'done' || event.type === 'error') {
            break;
          }
        }
      }
    } finally {
      es.close();
    }
  },

  /**
   * Get the current weekly plan
   */
  getPlan: (): Promise<WeeklyPlanResponse> => apiClient.get('/coach/plan'),

  /**
   * Generate a new weekly plan
   */
  generatePlan: (request?: WeeklyPlanRequest): Promise<WeeklyPlanResponse> =>
    apiClient.post('/coach/plan', request),

  /**
   * Get pre-computed coach insights
   */
  getInsights: (): Promise<InsightsResponse> => apiClient.get('/coach/insights'),
};
