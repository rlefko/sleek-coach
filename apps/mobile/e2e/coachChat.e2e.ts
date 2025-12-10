import { device, element, by, expect, waitFor } from 'detox';

describe('Coach Chat Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    // Login or set authenticated state
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Chat Interface', () => {
    it('should navigate to coach screen', async () => {
      // Navigate to coach tab
      await element(by.id('tab-coach')).tap();

      // Should show coach screen
      await expect(element(by.text('Coach'))).toBeVisible();
    });

    it('should display chat input', async () => {
      await element(by.id('tab-coach')).tap();

      // Chat input should be visible
      await expect(element(by.id('chat-input'))).toBeVisible();
      await expect(element(by.id('send-button'))).toBeVisible();
    });

    it('should display welcome message', async () => {
      await element(by.id('tab-coach')).tap();

      // Should see welcome message from coach
      await expect(element(by.text(/Hi! I'm your fitness coach/))).toBeVisible();
    });
  });

  describe('Sending Messages', () => {
    it('should send a message', async () => {
      await element(by.id('tab-coach')).tap();

      // Type a message
      await element(by.id('chat-input')).typeText('What should I eat today?');

      // Send
      await element(by.id('send-button')).tap();

      // Message should appear in chat
      await expect(element(by.text('What should I eat today?'))).toBeVisible();
    });

    it('should show streaming indicator while waiting for response', async () => {
      await element(by.id('tab-coach')).tap();

      await element(by.id('chat-input')).typeText('Give me a workout plan');
      await element(by.id('send-button')).tap();

      // Should show streaming indicator
      await expect(element(by.id('streaming-indicator'))).toBeVisible();
    });

    it('should receive coach response', async () => {
      await element(by.id('tab-coach')).tap();

      await element(by.id('chat-input')).typeText('How much protein should I eat?');
      await element(by.id('send-button')).tap();

      // Wait for response (with timeout)
      await waitFor(element(by.id('assistant-message')))
        .toBeVisible()
        .withTimeout(30000);
    });

    it('should disable send button while streaming', async () => {
      await element(by.id('tab-coach')).tap();

      await element(by.id('chat-input')).typeText('Test message');
      await element(by.id('send-button')).tap();

      // Send button should be disabled
      await expect(element(by.id('send-button'))).toHaveId('send-button-disabled');
    });

    it('should show stop button during streaming', async () => {
      await element(by.id('tab-coach')).tap();

      await element(by.id('chat-input')).typeText('Write me a long response');
      await element(by.id('send-button')).tap();

      // Stop button should appear
      await expect(element(by.id('stop-button'))).toBeVisible();
    });

    it('should stop streaming when stop button pressed', async () => {
      await element(by.id('tab-coach')).tap();

      await element(by.id('chat-input')).typeText('Write a very long response');
      await element(by.id('send-button')).tap();

      // Wait for stop button
      await waitFor(element(by.id('stop-button')))
        .toBeVisible()
        .withTimeout(5000);

      // Tap stop
      await element(by.id('stop-button')).tap();

      // Streaming should stop
      await expect(element(by.id('streaming-indicator'))).not.toBeVisible();
    });
  });

  describe('Error Handling', () => {
    it('should show error message on failure', async () => {
      // Simulate network error
      await device.setURLBlacklist(['.*api.*']);

      await element(by.id('tab-coach')).tap();
      await element(by.id('chat-input')).typeText('Test message');
      await element(by.id('send-button')).tap();

      // Should show error
      await expect(element(by.text(/error|failed/i))).toBeVisible();

      // Reset network
      await device.setURLBlacklist([]);
    });

    it('should allow retry on error', async () => {
      await element(by.id('tab-coach')).tap();

      // Assuming there's an error message visible
      await element(by.text('Tap to retry')).tap();

      // Should attempt to resend
      await expect(element(by.id('streaming-indicator'))).toBeVisible();
    });
  });

  describe('Chat History', () => {
    it('should persist chat history', async () => {
      await element(by.id('tab-coach')).tap();

      // Send a message
      await element(by.id('chat-input')).typeText('Test persistence');
      await element(by.id('send-button')).tap();

      // Wait for response
      await waitFor(element(by.id('assistant-message')))
        .toBeVisible()
        .withTimeout(30000);

      // Reload the app
      await device.reloadReactNative();

      // Navigate back to coach
      await element(by.id('tab-coach')).tap();

      // Previous message should still be there
      await expect(element(by.text('Test persistence'))).toBeVisible();
    });
  });

  describe('Disclaimers', () => {
    it('should show disclaimers on health-related responses', async () => {
      await element(by.id('tab-coach')).tap();

      // Ask a health-related question
      await element(by.id('chat-input')).typeText('Should I take supplements for weight loss?');
      await element(by.id('send-button')).tap();

      // Wait for response
      await waitFor(element(by.id('assistant-message')))
        .toBeVisible()
        .withTimeout(30000);

      // Should show disclaimer
      await expect(element(by.text(/not medical advice|consult.*professional/i))).toBeVisible();
    });
  });
});
