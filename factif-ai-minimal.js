const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Mock testing data
let testResults = {
  totalTests: 0,
  passedTests: 0,
  failedTests: 0,
  lastRun: null,
  testSuites: []
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Factif-AI Testing Service',
    version: '1.0.0',
    uptime: process.uptime(),
    timestamp: new Date().toISOString()
  });
});

// Get test results
app.get('/api/tests/results', (req, res) => {
  res.json({
    results: testResults,
    timestamp: new Date().toISOString()
  });
});

// Run tests endpoint
app.post('/api/tests/run', (req, res) => {
  const { testSuite, targetUrl } = req.body;

  // Simulate running tests
  setTimeout(() => {
    testResults.totalTests += 5;
    testResults.passedTests += 4;
    testResults.failedTests += 1;
    testResults.lastRun = new Date().toISOString();

    const newTestSuite = {
      id: Date.now(),
      name: testSuite || 'UI Tests',
      targetUrl: targetUrl || 'http://localhost:9999',
      status: 'completed',
      results: {
        total: 5,
        passed: 4,
        failed: 1,
        duration: Math.random() * 1000 + 500
      },
      timestamp: new Date().toISOString()
    };

    testResults.testSuites.unshift(newTestSuite);

    // Keep only last 10 test suites
    if (testResults.testSuites.length > 10) {
      testResults.testSuites = testResults.testSuites.slice(0, 10);
    }
  }, 2000);

  res.json({
    message: 'Test execution started',
    testSuite: testSuite || 'UI Tests',
    estimatedDuration: '2-5 seconds',
    timestamp: new Date().toISOString()
  });
});

// Get test suites
app.get('/api/tests/suites', (req, res) => {
  res.json({
    testSuites: testResults.testSuites,
    timestamp: new Date().toISOString()
  });
});

// Screenshot endpoint (mock)
app.post('/api/tests/screenshot', (req, res) => {
  const { url, element } = req.body;

  // Mock screenshot response
  res.json({
    screenshot: {
      id: Date.now(),
      url: url || 'http://localhost:9999',
      element: element || 'body',
      imageData: 'mock-screenshot-data',
      timestamp: new Date().toISOString()
    },
    message: 'Screenshot captured successfully'
  });
});

// Accessibility testing endpoint (mock)
app.post('/api/tests/accessibility', (req, res) => {
  const { url } = req.body;

  // Mock accessibility results
  res.json({
    results: {
      url: url || 'http://localhost:9999',
      score: 85,
      issues: [
        { type: 'warning', message: 'Missing alt text on image', element: 'img.logo' },
        { type: 'error', message: 'Low color contrast', element: 'button.secondary' }
      ],
      passed: 12,
      failed: 2,
      timestamp: new Date().toISOString()
    }
  });
});

// Performance testing endpoint (mock)
app.post('/api/tests/performance', (req, res) => {
  const { url } = req.body;

  // Mock performance results
  res.json({
    results: {
      url: url || 'http://localhost:9999',
      loadTime: Math.random() * 2000 + 1000,
      firstPaint: Math.random() * 1000 + 500,
      domContentLoaded: Math.random() * 1500 + 800,
      fullyLoaded: Math.random() * 3000 + 2000,
      score: Math.floor(Math.random() * 40) + 60, // 60-100 score
      timestamp: new Date().toISOString()
    }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Factif-AI Testing Service running on 0.0.0.0:${PORT}`);
  console.log('Available endpoints:');
  console.log('  GET  /health');
  console.log('  GET  /api/tests/results');
  console.log('  POST /api/tests/run');
  console.log('  GET  /api/tests/suites');
  console.log('  POST /api/tests/screenshot');
  console.log('  POST /api/tests/accessibility');
  console.log('  POST /api/tests/performance');
});