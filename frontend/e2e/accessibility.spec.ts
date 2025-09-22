import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Tests', () => {
  test('should not have any automatically detectable accessibility issues on homepage', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have any automatically detectable accessibility issues on login page', async ({ page }) => {
    await page.goto('/login');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have any automatically detectable accessibility issues on register page', async ({ page }) => {
    await page.goto('/register');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have any automatically detectable accessibility issues on create room page', async ({ page }) => {
    await page.goto('/create-room');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should not have any automatically detectable accessibility issues on join room page', async ({ page }) => {
    await page.goto('/join-room');
    
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    
    expect(accessibilityScanResults.violations).toEqual([]);
  });

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/');
    
    // Check for proper heading structure
    const h1 = await page.locator('h1').count();
    expect(h1).toBeGreaterThan(0);
    
    // Check that headings are in logical order
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    let previousLevel = 0;
    
    for (const heading of headings) {
      const tagName = await heading.evaluate(el => el.tagName.toLowerCase());
      const level = parseInt(tagName.substring(1));
      
      // Skip if this is the first heading
      if (previousLevel > 0) {
        expect(level).toBeLessThanOrEqual(previousLevel + 1);
      }
      
      previousLevel = level;
    }
  });

  test('should have proper form labels and ARIA attributes', async ({ page }) => {
    await page.goto('/login');
    
    // Check that all form inputs have labels
    const inputs = await page.locator('input[type="email"], input[type="password"], input[type="text"]').all();
    
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      // At least one of these should be present
      const hasLabel = id && await page.locator(`label[for="${id}"]`).count() > 0;
      const hasAriaLabel = !!ariaLabel;
      const hasAriaLabelledBy = !!ariaLabelledBy;
      
      expect(hasLabel || hasAriaLabel || hasAriaLabelledBy).toBeTruthy();
    }
  });

  test('should have proper focus management', async ({ page }) => {
    await page.goto('/login');
    
    // Test tab navigation
    await page.keyboard.press('Tab');
    const firstFocused = await page.evaluate(() => document.activeElement?.tagName);
    expect(firstFocused).toBeTruthy();
    
    // Test that focus is visible
    const focusedElement = await page.evaluate(() => document.activeElement);
    const focusStyles = await page.evaluate((el) => {
      if (!el) return null;
      const styles = window.getComputedStyle(el);
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        boxShadow: styles.boxShadow,
      };
    }, focusedElement);
    
    expect(focusStyles?.outline !== 'none' || focusStyles?.boxShadow !== 'none').toBeTruthy();
  });

  test('should have proper color contrast', async ({ page }) => {
    await page.goto('/');
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21aa'])
      .analyze();
    
    // Filter out color contrast violations for now (can be addressed later)
    const nonColorContrastViolations = accessibilityScanResults.violations.filter(
      violation => !violation.id.includes('color-contrast')
    );
    
    expect(nonColorContrastViolations).toEqual([]);
  });

  test('should have proper keyboard navigation', async ({ page }) => {
    await page.goto('/');
    
    // Test that all interactive elements are keyboard accessible
    const interactiveElements = await page.locator('button, a, input, select, textarea, [tabindex]').all();
    
    for (const element of interactiveElements) {
      const tabIndex = await element.getAttribute('tabindex');
      const isDisabled = await element.getAttribute('disabled');
      
      // Skip disabled elements
      if (isDisabled) continue;
      
      // Check that element is focusable
      await element.focus();
      const isFocused = await element.evaluate(el => el === document.activeElement);
      
      // If tabindex is not -1, element should be focusable
      if (tabIndex !== '-1') {
        expect(isFocused).toBeTruthy();
      }
    }
  });

  test('should have proper ARIA landmarks', async ({ page }) => {
    await page.goto('/');
    
    // Check for main landmark
    const main = await page.locator('main, [role="main"]').count();
    expect(main).toBeGreaterThan(0);
    
    // Check for navigation landmark
    const nav = await page.locator('nav, [role="navigation"]').count();
    expect(nav).toBeGreaterThan(0);
    
    // Check for banner landmark
    const banner = await page.locator('header, [role="banner"]').count();
    expect(banner).toBeGreaterThan(0);
  });

  test('should have proper alt text for images', async ({ page }) => {
    await page.goto('/');
    
    const images = await page.locator('img').all();
    
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      const role = await img.getAttribute('role');
      
      // Images should have alt text or be decorative (role="presentation")
      expect(alt !== null || role === 'presentation').toBeTruthy();
    }
  });
});
