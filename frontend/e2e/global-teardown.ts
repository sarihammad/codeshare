import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global teardown...');
  
  try {
    // Clean up any test data or resources
    await cleanupTestData();
    
    // Close any remaining connections
    await cleanupConnections();
    
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw here to avoid masking test failures
  }
  
  console.log('✅ Global teardown completed');
}

async function cleanupTestData() {
  // Clean up any test data created during tests
  // This could include:
  // - Deleting test users
  // - Cleaning up test rooms
  // - Removing temporary files
  
  console.log('🧹 Cleaning up test data...');
}

async function cleanupConnections() {
  // Close any remaining WebSocket connections or other resources
  console.log('🧹 Cleaning up connections...');
}

export default globalTeardown;
