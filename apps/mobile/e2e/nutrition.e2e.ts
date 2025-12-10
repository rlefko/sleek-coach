import { device, element, by, expect } from 'detox';

describe('Nutrition Logging Flow', () => {
  beforeAll(async () => {
    await device.launchApp({ newInstance: true });
    // Login or set authenticated state
  });

  beforeEach(async () => {
    await device.reloadReactNative();
  });

  describe('Manual Nutrition Entry', () => {
    it('should navigate to nutrition screen', async () => {
      // Navigate to nutrition tab
      await element(by.id('tab-nutrition')).tap();

      // Should show nutrition screen
      await expect(element(by.text('Nutrition'))).toBeVisible();
    });

    it("should show today's date by default", async () => {
      await element(by.id('tab-nutrition')).tap();

      const today = new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
      await expect(element(by.text(today))).toBeVisible();
    });

    it('should enter calories', async () => {
      await element(by.id('tab-nutrition')).tap();

      // Tap on calories input
      await element(by.id('calories-input')).tap();
      await element(by.id('calories-input')).typeText('2000');

      await expect(element(by.text('2000'))).toBeVisible();
    });

    it('should enter macros', async () => {
      await element(by.id('tab-nutrition')).tap();

      // Enter protein
      await element(by.id('protein-input')).tap();
      await element(by.id('protein-input')).typeText('150');

      // Enter carbs
      await element(by.id('carbs-input')).tap();
      await element(by.id('carbs-input')).typeText('200');

      // Enter fat
      await element(by.id('fat-input')).tap();
      await element(by.id('fat-input')).typeText('70');
    });

    it('should auto-calculate calories from macros', async () => {
      await element(by.id('tab-nutrition')).tap();

      // Enable auto-calculate
      await element(by.id('auto-calc-toggle')).tap();

      // Enter macros
      await element(by.id('protein-input')).replaceText('150'); // 150 * 4 = 600
      await element(by.id('carbs-input')).replaceText('200'); // 200 * 4 = 800
      await element(by.id('fat-input')).replaceText('70'); // 70 * 9 = 630

      // Total should be 2030 calories
      await expect(element(by.text('2030'))).toBeVisible();
    });

    it('should save nutrition entry', async () => {
      await element(by.id('tab-nutrition')).tap();

      // Enter some values
      await element(by.id('calories-input')).typeText('2000');
      await element(by.id('protein-input')).typeText('150');

      // Save
      await element(by.text('Save')).tap();

      // Should show success
      await expect(element(by.text('Nutrition saved!'))).toBeVisible();
    });

    it('should navigate between days', async () => {
      await element(by.id('tab-nutrition')).tap();

      // Go to previous day
      await element(by.id('prev-day')).tap();

      // Date should change
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
      await expect(element(by.text(yesterdayStr))).toBeVisible();

      // Go to next day
      await element(by.id('next-day')).tap();

      // Should be back to today
      const today = new Date().toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      });
      await expect(element(by.text(today))).toBeVisible();
    });
  });

  describe('MFP Import', () => {
    it('should show import option', async () => {
      await element(by.id('tab-nutrition')).tap();

      // Look for import button
      await expect(element(by.text('Import from MyFitnessPal'))).toBeVisible();
    });

    it('should navigate to import screen', async () => {
      await element(by.id('tab-nutrition')).tap();
      await element(by.text('Import from MyFitnessPal')).tap();

      // Should show import instructions
      await expect(element(by.text('Import Instructions'))).toBeVisible();
    });
  });
});
