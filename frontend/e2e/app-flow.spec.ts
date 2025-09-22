import { test, expect } from '@playwright/test';

test.describe('Application Flow Tests', () => {
  test('should complete full user journey from landing to editor', async ({ page }) => {
    // Start at landing page
    await page.goto('/');
    await expect(page).toHaveTitle(/CodeShare/);
    
    // Check that main elements are visible
    await expect(page.locator('h1')).toBeVisible();
    await expect(page.locator('text=Get Started')).toBeVisible();
    
    // Navigate to create room
    await page.click('text=Create Room');
    await expect(page).toHaveURL(/.*create-room/);
    
    // Fill out create room form
    await page.fill('input[name="name"]', 'Test Room');
    await page.fill('textarea[name="description"]', 'A test room for E2E testing');
    
    // Submit form (this will be mocked in test environment)
    await page.click('button[type="submit"]');
    
    // Should redirect to editor (mocked)
    await expect(page).toHaveURL(/.*editor/);
  });

  test('should handle authentication flow', async ({ page }) => {
    // Start at login page
    await page.goto('/login');
    
    // Check form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Fill out login form
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    
    // Submit form (mocked in test environment)
    await page.click('button[type="submit"]');
    
    // Should redirect to dashboard or editor
    await expect(page).toHaveURL(/.*(dashboard|editor)/);
  });

  test('should handle room joining flow', async ({ page }) => {
    // Start at join room page
    await page.goto('/join-room');
    
    // Check form elements
    await expect(page.locator('input[name="roomId"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    
    // Fill out join room form
    await page.fill('input[name="roomId"]', 'test-room-123');
    
    // Submit form (mocked in test environment)
    await page.click('button[type="submit"]');
    
    // Should redirect to editor
    await expect(page).toHaveURL(/.*editor/);
  });

  test('should handle keyboard shortcuts', async ({ page }) => {
    await page.goto('/editor/test-room');
    
    // Test command palette shortcut (Cmd/Ctrl + K)
    await page.keyboard.press('Meta+k');
    
    // Command palette should open
    await expect(page.locator('[data-testid="command-palette"]')).toBeVisible();
    
    // Close command palette with Escape
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-testid="command-palette"]')).not.toBeVisible();
  });

  test('should handle responsive design', async ({ page }) => {
    // Test desktop view
    await page.setViewportSize({ width: 1920, height: 1080 });
    await page.goto('/');
    
    // Check that desktop layout is correct
    await expect(page.locator('nav')).toBeVisible();
    
    // Test tablet view
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.reload();
    
    // Check that tablet layout is correct
    await expect(page.locator('nav')).toBeVisible();
    
    // Test mobile view
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    
    // Check that mobile layout is correct
    await expect(page.locator('nav')).toBeVisible();
  });

  test('should handle error states gracefully', async ({ page }) => {
    // Test 404 page
    await page.goto('/non-existent-page');
    
    // Should show 404 error page
    await expect(page.locator('text=404')).toBeVisible();
    await expect(page.locator('text=Page Not Found')).toBeVisible();
    
    // Should have link back to home
    await expect(page.locator('a[href="/"]')).toBeVisible();
  });

  test('should handle loading states', async ({ page }) => {
    // Mock slow API response
    await page.route('**/api/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });
    
    await page.goto('/login');
    
    // Fill out form and submit
    await page.fill('input[type="email"]', 'test@example.com');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button[type="submit"]');
    
    // Should show loading state
    await expect(page.locator('[data-testid="loading"]')).toBeVisible();
  });

  test('should handle form validation', async ({ page }) => {
    await page.goto('/register');
    
    // Try to submit empty form
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('text=Email is required')).toBeVisible();
    await expect(page.locator('text=Password is required')).toBeVisible();
    
    // Fill out form with invalid data
    await page.fill('input[type="email"]', 'invalid-email');
    await page.fill('input[type="password"]', '123');
    
    await page.click('button[type="submit"]');
    
    // Should show validation errors
    await expect(page.locator('text=Please enter a valid email')).toBeVisible();
    await expect(page.locator('text=Password must be at least 8 characters')).toBeVisible();
  });

  test('should handle navigation between pages', async ({ page }) => {
    await page.goto('/');
    
    // Test navigation to different pages
    const navLinks = [
      { text: 'Create Room', url: '/create-room' },
      { text: 'Join Room', url: '/join-room' },
      { text: 'Login', url: '/login' },
    ];
    
    for (const link of navLinks) {
      await page.click(`text=${link.text}`);
      await expect(page).toHaveURL(new RegExp(link.url));
      
      // Go back to home
      await page.goto('/');
    }
  });

  test('should handle WebSocket connection states', async ({ page }) => {
    await page.goto('/editor/test-room');
    
    // Check that WebSocket connection indicator is present
    await expect(page.locator('[data-testid="connection-status"]')).toBeVisible();
    
    // Should show connected state initially
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Connected');
    
    // Mock WebSocket disconnection
    await page.evaluate(() => {
      // Simulate WebSocket disconnection
      window.dispatchEvent(new Event('websocket-disconnected'));
    });
    
    // Should show disconnected state
    await expect(page.locator('[data-testid="connection-status"]')).toContainText('Disconnected');
  });

  test('should handle Monaco editor integration', async ({ page }) => {
    await page.goto('/editor/test-room');
    
    // Check that Monaco editor is loaded
    await expect(page.locator('.monaco-editor')).toBeVisible();
    
    // Test editor functionality
    await page.click('.monaco-editor');
    await page.keyboard.type('console.log("Hello, World!");');
    
    // Check that content is in editor
    await expect(page.locator('.monaco-editor')).toContainText('console.log');
  });

  test('should handle collaborative features', async ({ page }) => {
    await page.goto('/editor/test-room');
    
    // Check that collaborative features are present
    await expect(page.locator('[data-testid="collaborators"]')).toBeVisible();
    await expect(page.locator('[data-testid="cursor-indicators"]')).toBeVisible();
    
    // Test awareness features
    await page.click('.monaco-editor');
    await page.keyboard.type('test');
    
    // Should show cursor position
    await expect(page.locator('[data-testid="cursor-indicators"]')).toBeVisible();
  });
});
