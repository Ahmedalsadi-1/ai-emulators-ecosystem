// Simple test functions to verify AIOS service functionality
import { AIOSService } from './AIOSService';

export async function testAIOSServiceHealth(): Promise<boolean> {
  console.log('Testing AIOS Service health...');

  const aiosService = new AIOSService();

  try {
    // Test health check
    const health = await aiosService.getHealthStatus();
    console.log('✅ Health status:', health);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return false;
  }
}

export async function testAIOSServiceStatus(): Promise<boolean> {
  console.log('Testing AIOS Service status...');

  const aiosService = new AIOSService();

  try {
    // Test service status
    const status = await aiosService.getServiceStatus();
    console.log('✅ Service status:', status);
    return true;
  } catch (error) {
    console.error('❌ Service status check failed:', error);
    return false;
  }
}

export async function testAIOSLLMListing(): Promise<boolean> {
  console.log('Testing AIOS LLM listing...');

  const aiosService = new AIOSService();

  try {
    // Test LLM listing
    const llms = await aiosService.listAvailableLLMs();
    console.log('✅ Available LLMs:', llms);
    return true;
  } catch (error) {
    console.error('❌ LLM listing failed:', error);
    return false;
  }
}

export async function testAIOSCommandProcessing(): Promise<boolean> {
  console.log('Testing AIOS command processing...');

  const aiosService = new AIOSService();

  try {
    // Test natural language command processing
    const result = await aiosService.processCommand('list llms');
    console.log('✅ Command result:', result);
    return true;
  } catch (error) {
    console.error('❌ Command processing failed:', error);
    return false;
  }
}

// Export all tests as an object for easy access
export const AIOSServiceTests = {
  testHealth: testAIOSServiceHealth,
  testStatus: testAIOSServiceStatus,
  testLLMListing: testAIOSLLMListing,
  testCommandProcessing: testAIOSCommandProcessing,

  async runAllTests(): Promise<boolean> {
    console.log('Running all AIOS Service tests...\n');

    const results = await Promise.all([
      this.testHealth(),
      this.testStatus(),
      this.testLLMListing(),
      this.testCommandProcessing()
    ]);

    const passed = results.filter(Boolean).length;
    const total = results.length;

    console.log(`\nTest Results: ${passed}/${total} tests passed`);

    if (passed === total) {
      console.log('🎉 All AIOS Service tests passed!');
      return true;
    } else {
      console.log('❌ Some tests failed. Check the output above.');
      return false;
    }
  }
};