import { device, element, by, expect } from 'detox';

describe('Check-In Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    // Login or set authenticated state
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Daily Check-In', () => {
    it('should navigate to check-in screen from FAB', async () => {
      // Tap the FAB (Floating Action Button)
      await element(by.id('fab-checkin')).tap();

      // Should show check-in screen
      await expect(element(by.text('Daily Check-in'))).toBeVisible();
    });

    it('should display current date', async () => {
      await element(by.id('fab-checkin')).tap();

      // Current date should be visible
      const today = new Date().toLocaleDateString(undefined, {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
      });
      await expect(element(by.text(today))).toBeVisible();
    });

    it('should enter weight value', async () => {
      await element(by.id('fab-checkin')).tap();

      // Weight input should be visible
      await expect(element(by.text('Weight'))).toBeVisible();

      // Increment weight
      await element(by.id('weight-increment')).tap();
      await element(by.id('weight-increment')).tap();
      await element(by.id('weight-increment')).tap();
    });

    it('should toggle wellness metrics', async () => {
      await element(by.id('fab-checkin')).tap();

      // Wellness metrics should be hidden initially
      await expect(element(by.text('Energy Level'))).not.toBeVisible();

      // Show wellness metrics
      await element(by.text(/Show wellness metrics/)).tap();

      // Now they should be visible
      await expect(element(by.text('Energy Level'))).toBeVisible();
      await expect(element(by.text('Sleep Quality'))).toBeVisible();
      await expect(element(by.text('Mood'))).toBeVisible();
    });

    it('should add notes', async () => {
      await element(by.id('fab-checkin')).tap();

      // Find and tap notes input
      await element(by.text('Notes (Optional)')).tap();
      await element(by.id('notes-input')).typeText('Feeling great today!');

      await expect(element(by.text('Feeling great today!'))).toBeVisible();
    });

    it('should save check-in successfully', async () => {
      await element(by.id('fab-checkin')).tap();

      // Enter weight
      await element(by.id('weight-increment')).tap();

      // Save
      await element(by.text('Save Check-in')).tap();

      // Should show success message
      await expect(element(by.text('Check-in saved!'))).toBeVisible();

      // Should return to home screen
      await expect(element(by.id('home-screen'))).toBeVisible();
    });

    it('should handle offline mode', async () => {
      // Simulate offline
      await device.setURLBlacklist(['.*']);

      await element(by.id('fab-checkin')).tap();
      await element(by.id('weight-increment')).tap();
      await element(by.text('Save Check-in')).tap();

      // Should show offline save message
      await expect(element(by.text('Saved offline. Will sync when online.'))).toBeVisible();

      // Reset network
      await device.setURLBlacklist([]);
    });
  });

  describe('Weight History', () => {
    it('should show last weight reference', async () => {
      await element(by.id('fab-checkin')).tap();

      // Last weight should be shown
      await expect(element(by.text(/Last:/))).toBeVisible();
    });
  });
});
