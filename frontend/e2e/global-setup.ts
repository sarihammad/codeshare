import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global setup...');
  
  // Create a browser instance for setup
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    // Wait for the application to be ready
    await page.goto('http://localhost:3000');
    await page.waitForLoadState('networkidle');
    
    // Check if the application is running
    const title = await page.title();
    console.log(`✅ Application is running with title: ${title}`);
    
    // Set up test data or perform any global setup
    await setupTestData(page);
    
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  } finally {
    await browser.close();
  }
  
  console.log('✅ Global setup completed');
}

async function setupTestData(page: any) {
  // Set up any test data needed for E2E tests
  // This could include creating test users, rooms, etc.
  
  // For now, we'll just ensure the app is responsive
  await page.waitForSelector('body', { timeout: 10000 });
  
  // You can add more setup logic here, such as:
  // - Creating test users via API
  // - Setting up test rooms
  // - Configuring test environment variables
}

export default globalSetup;
