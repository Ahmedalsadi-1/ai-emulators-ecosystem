const express = require('express');
const app = express();
const port = 8080;

// Mock API responses for ByteBot Agent
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Tasks endpoint
app.get('/api/tasks', (req, res) => {
  res.json({
    tasks: [
      {
        id: '1',
        title: 'Sample Task',
        description: 'This is a sample task',
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    ],
    total: 1
  });
});

// Task models endpoint
app.get('/api/tasks/models', (req, res) => {
  res.json([
    { id: 'gpt-4', name: 'GPT-4', provider: 'OpenAI' },
    { id: 'claude-3', name: 'Claude 3', provider: 'Anthropic' }
  ]);
});

// Catch-all for other API calls
app.all('/api/*', (req, res) => {
  console.log(`Mock API call: ${req.method} ${req.path}`);
  res.json({ message: 'Mock response', path: req.path, method: req.method });
});

app.listen(port, () => {
  console.log(`Mock ByteBot Agent API server running on port ${port}`);
});