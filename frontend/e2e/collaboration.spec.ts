import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("CodeShare Collaboration", () => {
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
    expect(accessibilityScanResults.violations).toEqual([]);

    // Test login page accessibility
    await page.goto("/login");
    const loginAccessibilityResults = await new AxeBuilder({ page }).analyze();
    expect(loginAccessibilityResults.violations).toEqual([]);

    // Test register page accessibility
    await page.goto("/register");
    const registerAccessibilityResults = await new AxeBuilder({
      page,
    }).analyze();
    expect(registerAccessibilityResults.violations).toEqual([]);
  });

  test("should allow room creation", async ({ page }) => {
    // Mock authentication for this test
    await page.goto("/dashboard");

    // Click create room button
    await page.click("text=Create Room");
    await expect(page).toHaveURL("/create-room");

    // Fill room creation form
    await page.fill('input[name="name"]', "Test Room");
    await page.selectOption('select[name="language"]', "javascript");

    // Submit form
    await page.click('button[type="submit"]');

    // Should redirect to editor
    await expect(page).toHaveURL(/\/editor\/[a-f0-9-]+/);
  });

  test("should show editor with Monaco", async ({ page }) => {
    await page.goto("/editor/test-room");

    // Check if Monaco editor is present
    await expect(page.locator('[data-testid="monaco-editor"]')).toBeVisible();

    // Check for save status indicator
    await expect(page.locator("text=All changes saved")).toBeVisible();

    // Check for connection status
    await expect(page.locator("text=●")).toBeVisible();
  });

  test("should show user list", async ({ page }) => {
    await page.goto("/editor/test-room");

    // Check if user list is present
    await expect(page.locator("text=Active Users")).toBeVisible();
  });

  test("should handle keyboard shortcuts", async ({ page }) => {
    await page.goto("/editor/test-room");

    // Focus the editor
    await page.click('[data-testid="monaco-editor"]');

    // Type some content
    await page.keyboard.type('console.log("Hello World");');

    // Use Ctrl+S to save
    await page.keyboard.press("Control+s");

    // Check for save indicator (this might be flaky in e2e)
    await expect(page.locator("text=Saving...")).toBeVisible({ timeout: 5000 });
  });
});
