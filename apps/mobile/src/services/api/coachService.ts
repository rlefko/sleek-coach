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

/**
 * Parse SSE events from a ReadableStream
 */
async function* parseSSE(
  reader: ReadableStreamDefaultReader<Uint8Array>
): AsyncGenerator<StreamEvent> {
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const jsonStr = line.slice(6).trim();
        if (jsonStr) {
          try {
            yield JSON.parse(jsonStr) as StreamEvent;
          } catch {
            // Skip malformed JSON
          }
        }
      }
    }
  }

  // Process any remaining data in buffer
  if (buffer.startsWith('data: ')) {
    const jsonStr = buffer.slice(6).trim();
    if (jsonStr) {
      try {
        yield JSON.parse(jsonStr) as StreamEvent;
      } catch {
        // Skip malformed JSON
      }
    }
  }
}

export const coachService = {
  /**
   * Send a chat message and get a complete response (non-streaming)
   */
  chat: (request: ChatRequest): Promise<ChatResponse> => apiClient.post('/coach/chat', request),

  /**
   * Send a chat message and receive streaming SSE events
   */
  chatStream: async function* (request: ChatRequest): AsyncGenerator<StreamEvent> {
    const baseUrl = getApiBaseUrl();
    const accessToken = useAuthStore.getState().accessToken;

    const response = await fetch(`${baseUrl}/coach/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'text/event-stream',
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ detail: 'Stream request failed' }));
      yield {
        type: 'error',
        data: errorData.detail || 'Stream request failed',
      };
      return;
    }

    const reader = response.body?.getReader();
    if (!reader) {
      yield {
        type: 'error',
        data: 'Failed to get response stream reader',
      };
      return;
    }

    try {
      for await (const event of parseSSE(reader)) {
        yield event;
      }
    } finally {
      reader.releaseLock();
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
