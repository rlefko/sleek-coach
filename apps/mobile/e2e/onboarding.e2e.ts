import { device, element, by, expect } from 'detox';

describe('Onboarding Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Registration', () => {
    it('should show login screen on app launch', async () => {
      await expect(element(by.text('Sleek Coach'))).toBeVisible();
      await expect(element(by.text('Welcome back! Sign in to continue.'))).toBeVisible();
    });

    it('should navigate to register screen', async () => {
      await element(by.text('Create Account')).tap();
      await expect(element(by.text('Start your fitness journey today.'))).toBeVisible();
    });

    it('should register a new user', async () => {
      await element(by.text('Create Account')).tap();

      // Fill in registration form
      await element(by.label('Email')).typeText('test@example.com');
      await element(by.label('Password')).typeText('Test123!@#');
      await element(by.label('Confirm Password')).typeText('Test123!@#');

      // Accept terms
      await element(by.text(/Terms of Service/)).tap();

      // Submit
      await element(by.text('Create Account')).atIndex(1).tap();

      // Should proceed to onboarding
      await expect(element(by.text('Goal Selection'))).toBeVisible();
    });
  });

  describe('Onboarding Steps', () => {
    beforeEach(async () => {
      // Assume user is already registered and at onboarding
      // In a real test, you'd set up the state appropriately
    });

    it('should complete goal selection', async () => {
      await expect(element(by.text('What is your primary goal?'))).toBeVisible();

      // Select a goal
      await element(by.text('Lose Weight')).tap();

      // Continue
      await element(by.text('Continue')).tap();

      // Should move to next step
      await expect(element(by.text('Baseline Metrics'))).toBeVisible();
    });

    it('should enter baseline metrics', async () => {
      // Assuming we're on baseline metrics screen
      await expect(element(by.text('Current Weight'))).toBeVisible();

      // Enter weight (using weight input component)
      await element(by.id('weight-input')).tap();

      // Enter height
      await element(by.label('Height')).typeText('175');

      // Enter age
      await element(by.label('Age')).typeText('30');

      // Continue
      await element(by.text('Continue')).tap();
    });

    it('should select activity level', async () => {
      // Select activity level
      await element(by.text('Moderately Active')).tap();

      // Continue
      await element(by.text('Continue')).tap();
    });

    it('should complete onboarding', async () => {
      // Skip through remaining steps or complete them

      // Should reach home screen
      await expect(element(by.text('Home'))).toBeVisible();
    });
  });
});
