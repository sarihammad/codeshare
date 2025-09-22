import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('should load homepage within performance budget', async ({ page }) => {
    // Start performance measurement
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Check that page loads within reasonable time
    const startTime = Date.now();
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    const loadTime = Date.now() - startTime;
    
    // Should load within 3 seconds
    expect(loadTime).toBeLessThan(3000);
  });

  test('should have good Core Web Vitals', async ({ page }) => {
    await page.goto('/');
    
    // Measure Core Web Vitals
    const vitals = await page.evaluate(() => {
      return new Promise((resolve) => {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const vitals = {};
          
          entries.forEach((entry) => {
            if (entry.entryType === 'largest-contentful-paint') {
              vitals.lcp = entry.startTime;
            }
            if (entry.entryType === 'first-input') {
              vitals.fid = entry.processingStart - entry.startTime;
            }
            if (entry.entryType === 'layout-shift') {
              vitals.cls = entry.value;
            }
          });
          
          resolve(vitals);
        });
        
        observer.observe({ entryTypes: ['largest-contentful-paint', 'first-input', 'layout-shift'] });
        
        // Resolve after 5 seconds
        setTimeout(() => resolve({}), 5000);
      });
    });
    
    // Check that vitals are within acceptable ranges
    if (vitals.lcp) {
      expect(vitals.lcp).toBeLessThan(2500); // LCP should be under 2.5s
    }
    if (vitals.fid) {
      expect(vitals.fid).toBeLessThan(100); // FID should be under 100ms
    }
    if (vitals.cls) {
      expect(vitals.cls).toBeLessThan(0.1); // CLS should be under 0.1
    }
  });

  test('should handle large documents efficiently', async ({ page }) => {
    await page.goto('/editor/test-room');
    
    // Wait for Monaco editor to load
    await expect(page.locator('.monaco-editor')).toBeVisible();
    
    // Generate large content
    const largeContent = 'console.log("Hello, World!");\n'.repeat(1000);
    
    // Measure time to insert large content
    const startTime = Date.now();
    await page.click('.monaco-editor');
    await page.keyboard.type(largeContent);
    const insertTime = Date.now() - startTime;
    
    // Should insert large content within reasonable time
    expect(insertTime).toBeLessThan(5000);
    
    // Check that editor is still responsive
    await page.keyboard.press('Home');
    await page.keyboard.press('End');
    
    // Should not freeze
    await expect(page.locator('.monaco-editor')).toBeVisible();
  });

  test('should handle multiple concurrent operations', async ({ page }) => {
    await page.goto('/editor/test-room');
    
    // Wait for editor to load
    await expect(page.locator('.monaco-editor')).toBeVisible();
    
    // Perform multiple operations concurrently
    const operations = [
      page.keyboard.type('const a = 1;'),
      page.keyboard.press('Enter'),
      page.keyboard.type('const b = 2;'),
      page.keyboard.press('Enter'),
      page.keyboard.type('const c = a + b;'),
    ];
    
    const startTime = Date.now();
    await Promise.all(operations);
    const operationTime = Date.now() - startTime;
    
    // Should handle concurrent operations efficiently
    expect(operationTime).toBeLessThan(2000);
  });

  test('should handle memory usage efficiently', async ({ page }) => {
    await page.goto('/editor/test-room');
    
    // Wait for editor to load
    await expect(page.locator('.monaco-editor')).toBeVisible();
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Perform memory-intensive operations
    for (let i = 0; i < 100; i++) {
      await page.keyboard.type(`// Comment ${i}\n`);
      await page.keyboard.press('Enter');
    }
    
    // Get memory usage after operations
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0;
    });
    
    // Memory usage should not increase excessively
    const memoryIncrease = finalMemory - initialMemory;
    expect(memoryIncrease).toBeLessThan(50 * 1024 * 1024); // Less than 50MB increase
  });

  test('should handle network interruptions gracefully', async ({ page }) => {
    await page.goto('/editor/test-room');
    
    // Wait for editor to load
    await expect(page.locator('.monaco-editor')).toBeVisible();
    
    // Simulate network interruption
    await page.context().setOffline(true);
    
    // Should show offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).toBeVisible();
    
    // Restore network
    await page.context().setOffline(false);
    
    // Should hide offline indicator
    await expect(page.locator('[data-testid="offline-indicator"]')).not.toBeVisible();
  });

  test('should handle rapid user input', async ({ page }) => {
    await page.goto('/editor/test-room');
    
    // Wait for editor to load
    await expect(page.locator('.monaco-editor')).toBeVisible();
    
    // Simulate rapid typing
    const startTime = Date.now();
    for (let i = 0; i < 100; i++) {
      await page.keyboard.type('a');
    }
    const typingTime = Date.now() - startTime;
    
    // Should handle rapid input efficiently
    expect(typingTime).toBeLessThan(3000);
    
    // Check that all characters were inserted
    const content = await page.evaluate(() => {
      return document.querySelector('.monaco-editor')?.textContent || '';
    });
    
    expect(content).toContain('a'.repeat(100));
  });

  test('should handle large file operations', async ({ page }) => {
    await page.goto('/editor/test-room');
    
    // Wait for editor to load
    await expect(page.locator('.monaco-editor')).toBeVisible();
    
    // Create a large file content
    const largeFileContent = Array.from({ length: 10000 }, (_, i) => 
      `Line ${i + 1}: This is a test line with some content to make it longer.`
    ).join('\n');
    
    // Measure time to load large content
    const startTime = Date.now();
    await page.click('.monaco-editor');
    await page.keyboard.type(largeFileContent);
    const loadTime = Date.now() - startTime;
    
    // Should load large content within reasonable time
    expect(loadTime).toBeLessThan(10000);
    
    // Check that editor is still responsive
    await page.keyboard.press('Control+Home');
    await page.keyboard.press('Control+End');
    
    // Should not freeze
    await expect(page.locator('.monaco-editor')).toBeVisible();
  });
});
