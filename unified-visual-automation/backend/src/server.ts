// backend/src/server.ts
import express from 'express';
import cors from 'cors';
import { automationController } from './controllers/AutomationController';

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Large limit for screenshots
app.use(express.urlencoded({ extended: true }));

// Routes
const router = express.Router();

// Workflow routes
router.post('/workflows', automationController.createWorkflow.bind(automationController));
router.get('/workflows', automationController.listWorkflows.bind(automationController));
router.get('/workflows/:id', automationController.getWorkflow.bind(automationController));
router.post('/workflows/:id/execute', automationController.executeWorkflow.bind(automationController));

// Element detection routes
router.post('/elements/detect', automationController.detectElements.bind(automationController));
router.post('/elements/detect-at', automationController.detectElementAt.bind(automationController));

// Action routes
router.get('/actions', automationController.getAvailableActions.bind(automationController));
router.post('/actions/execute', automationController.executeAction.bind(automationController));

// Visual testing routes
router.post('/visual-tests', automationController.createVisualTest.bind(automationController));
router.post('/visual-tests/compare', automationController.compareScreenshots.bind(automationController));
router.post('/visual-tests/baseline', automationController.updateBaseline.bind(automationController));

// LLM integration routes
router.post('/llm/generate-workflow', automationController.generateWorkflowFromText.bind(automationController));
router.post('/llm/suggest-actions', automationController.suggestActions.bind(automationController));

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api', router);

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Unified Visual Automation API running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
});

export default app;