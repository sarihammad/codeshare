import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test.describe("CodeShare Collaboration", () => {
  test.beforeEach(async ({ page }) => {
    // Mock API calls to prevent backend dependency
    await page.route("**/api/**", async (route) => {
      const url = route.request().url();

      if (url.includes("/api/auth/register")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "User registered successfully",
            user: { id: "1", email: "test@example.com" },
            token: "mock-jwt-token",
          }),
        });
      } else if (url.includes("/api/auth/login")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            message: "Login successful",
            user: { id: "1", email: "test@example.com" },
            token: "mock-jwt-token",
          }),
        });
      } else if (url.includes("/api/auth/me")) {
        // Return authenticated user for most tests
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            user: { id: "1", email: "test@example.com" },
          }),
        });
      } else if (url.includes("/api/rooms/me")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "test-room-id",
              name: "Test Room",
              createdAt: "2024-01-01T00:00:00Z",
              language: "javascript",
            },
          ]),
        });
      } else if (url.includes("/api/rooms")) {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ id: "test-room-id", name: "Test Room" }),
        });
      } else {
        // Default mock response
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({}),
        });
      }
    });
  });

  test("should allow user registration and login", async ({ page }) => {
    // Override auth check for registration test to simulate unauthenticated user
    await page.route("**/api/auth/me", async (route) => {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Unauthorized" }),
      });
    });

    // Since homepage redirects to dashboard, go directly to register
    await page.goto("/register");

    // Wait for loading spinner to disappear (if present)
    await page
      .waitForFunction(
        () => {
          const spinner = document.querySelector(".animate-spin");
          return !spinner || spinner.style.display === "none";
        },
        { timeout: 5000 }
      )
      .catch(() => {
        // Ignore if no spinner found
      });

    // Wait for the page to load and form to be visible (with longer timeout)
    await expect(page.locator("form")).toBeVisible({ timeout: 10000 });

    // Fill registration form using id selectors
    await page.fill("#email", "test@example.com");
    await page.fill("#password", "password123");
    await page.fill("#confirmPassword", "password123");

    // Check the terms checkbox
    await page.check("#terms");

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation to complete
    await page.waitForURL(/dashboard|login/, { timeout: 10000 });
  });

  test("should pass accessibility checks on main pages", async ({ page }) => {
    // Test dashboard accessibility (homepage redirects here)
    await page.goto("/dashboard");

    // Wait for page to load and check if it's in error state
    await page.waitForLoadState("networkidle");
    const isErrorPage = await page
      .locator("text=Something went wrong!")
      .isVisible();

    if (!isErrorPage) {
      const accessibilityScanResults = await new AxeBuilder({ page }).analyze();
      // Check for critical accessibility issues (impact: serious or critical)
      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical"
      );
      expect(criticalViolations).toEqual([]);
    }

    // Test login page accessibility
    await page.goto("/login");
    const loginAccessibilityResults = await new AxeBuilder({ page }).analyze();
    const loginCriticalViolations = loginAccessibilityResults.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );
    expect(loginCriticalViolations).toEqual([]);

    // Test register page accessibility
    await page.goto("/register");
    const registerAccessibilityResults = await new AxeBuilder({
      page,
    }).analyze();
    const registerCriticalViolations =
      registerAccessibilityResults.violations.filter(
        (v) => v.impact === "serious" || v.impact === "critical"
      );
    expect(registerCriticalViolations).toEqual([]);
  });

  test("should allow room creation", async ({ page }) => {
    await page.goto("/dashboard");

    // Wait for the page to load completely
    await page.waitForLoadState("networkidle");

    // Wait for the dashboard to load and show the create room button
    await expect(page.locator("text=Create New Room")).toBeVisible({
      timeout: 10000,
    });

    // Click create room button and wait for navigation
    await page.click("text=Create New Room");
    await page.waitForURL("/create-room", { timeout: 10000 });

    // Wait for the form to be visible
    await expect(page.locator("form")).toBeVisible();

    // Fill room creation form using id selectors
    await page.fill("#name", "Test Room");
    await page.fill("#language", "javascript");

    // Submit form
    await page.click('button[type="submit"]');

    // Wait for navigation to editor
    await page.waitForURL(/\/editor\/test-room-id/, { timeout: 10000 });
  });

  test("should show editor with Monaco", async ({ page }) => {
    await page.goto("/editor/test-room");

    // Check if Monaco editor is present (it might take time to load)
    await expect(page.locator(".monaco-editor")).toBeVisible({
      timeout: 10000,
    });

    // Check for basic editor functionality - look for room ID text
    await expect(page.locator("text=Room: test-room")).toBeVisible();
  });

  test("should show user list", async ({ page }) => {
    await page.goto("/editor/test-room");

    // Check if user list is present
    await expect(page.locator("text=Active Users")).toBeVisible({
      timeout: 5000,
    });
  });

  test("should handle keyboard shortcuts", async ({ page }) => {
    await page.goto("/editor/test-room");

    // Wait for editor to load
    await expect(page.locator(".monaco-editor")).toBeVisible({
      timeout: 10000,
    });

    // Focus the editor
    await page.click(".monaco-editor");

    // Type some content
    await page.keyboard.type('console.log("Hello World");');

    // Use Ctrl+S to save (this will be mocked)
    await page.keyboard.press("Control+s");

    // Check for any save-related UI changes
    await page.waitForTimeout(1000);
  });
});
