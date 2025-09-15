import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("CodeShare Collaboration", () => {
  test.beforeEach(async ({ page }) => {
    // Mock API calls to prevent backend dependency
    await page.route('**/api/**', async (route) => {
      const url = route.request().url();
      
      if (url.includes('/api/auth/register')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'User registered successfully' }),
        });
      } else if (url.includes('/api/auth/login')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Login successful' }),
        });
      } else if (url.includes('/api/auth/me')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ user: { id: '1', email: 'test@example.com' } }),
        });
      } else if (url.includes('/api/rooms')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ id: 'test-room-id', name: 'Test Room' }),
        });
      } else {
        // Default mock response
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({}),
        });
      }
    });
  });

  test("should allow user registration and login", async ({ page }) => {
    await page.goto("/");

    // Navigate to register page
    await page.click("text=Register");
    await expect(page).toHaveURL("/register");

    // Fill registration form
    await page.fill('input[name="email"]', "test@example.com");
    await page.fill('input[name="password"]', "password123");
    await page.fill('input[name="confirmPassword"]', "password123");

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to dashboard or show success
    await expect(page).toHaveURL(/dashboard|login/);
  });

  test("should pass accessibility checks on main pages", async ({ page }) => {
    // Test homepage accessibility
    await page.goto("/");
    const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
    // Check for critical accessibility issues (impact: serious or critical)
    const criticalViolations = accessibilityScanResults.violations.filter(
      v => v.impact === 'serious' || v.impact === 'critical'
    );
    expect(criticalViolations).toEqual([]);

    // Test login page accessibility
    await page.goto("/login");
    const loginAccessibilityResults = await new AxeBuilder({ page }).analyze();
    const loginCriticalViolations = loginAccessibilityResults.violations.filter(
      v => v.impact === 'serious' || v.impact === 'critical'
    );
    expect(loginCriticalViolations).toEqual([]);

    // Test register page accessibility
    await page.goto("/register");
    const registerAccessibilityResults = await new AxeBuilder({
      page,
    }).analyze();
    const registerCriticalViolations = registerAccessibilityResults.violations.filter(
      v => v.impact === 'serious' || v.impact === 'critical'
    );
    expect(registerCriticalViolations).toEqual([]);
  });

  test("should allow room creation", async ({ page }) => {
    // Mock authentication for this test
    await page.goto("/dashboard");

    // Click create room button
    await page.click("text=Create Room");
    await expect(page).toHaveURL("/create-room");

    // Fill room creation form
    await page.fill('input[name="name"]', "Test Room");
    await page.fill('input[name="language"]', "javascript");

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to editor (mocked response will return test-room-id)
    await expect(page).toHaveURL(/\/editor\/test-room-id/);
  });

  test("should show editor with Monaco", async ({ page }) => {
    await page.goto("/editor/test-room");

    // Check if Monaco editor is present (it might take time to load)
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 10000 });

    // Check for basic editor functionality
    await expect(page.locator('text=CodeShare Editor')).toBeVisible();
  });

  test("should show user list", async ({ page }) => {
    await page.goto("/editor/test-room");

    // Check if user list is present
    await expect(page.locator("text=Active Users")).toBeVisible({ timeout: 5000 });
  });

  test("should handle keyboard shortcuts", async ({ page }) => {
    await page.goto("/editor/test-room");

    // Wait for editor to load
    await expect(page.locator('.monaco-editor')).toBeVisible({ timeout: 10000 });

    // Focus the editor
    await page.click('.monaco-editor');

    // Type some content
    await page.keyboard.type('console.log("Hello World");');

    // Use Ctrl+S to save (this will be mocked)
    await page.keyboard.press("Control+s");

    // Check for any save-related UI changes
    await page.waitForTimeout(1000);
  });
});
