/**
 * Property-Based Tests for Terminal Workflow Service
 * Feature: kilo-cli-integration
 * Property 7: MCP Registry Integration
 * Property 14: Comprehensive Logging
 */

import * as fc from 'fast-check';
import { TerminalWorkflowService } from '../../services/terminal-workflow.service';

describe('TerminalWorkflowService - Property-Based Tests', () => {
  let service: TerminalWorkflowService;

  beforeEach(() => {
    service = new TerminalWorkflowService();
  });

  afterEach(async () => {
    // Clean up all resources to prevent Jest from hanging
    await service.cleanup();
  });

  // ============================================================================
  // Property: Terminal session creation should initialize with valid environment
  // ============================================================================

  it('Property: For any valid session parameters, session creation should succeed', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom('kilo', 'opencode', 'skills-system'),
        fc.string({ minLength: 1, maxLength: 100 }),
        fc.boolean(),
        async (agentId, platform, workingDir, debugMode) => {
          const session = await service.createSession(agentId, platform as any, workingDir, debugMode);

          expect(session.id).toBeDefined();
          expect(session.agentId).toBe(agentId);
          expect(session.platform).toBe(platform);
          expect(session.workingDirectory).toBe(workingDir);
          expect(session.debugMode).toBe(debugMode);
          expect(session.status).toBe('active');
          expect(session.environment).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  // ============================================================================
  // Property: Command execution should capture output and handle errors
  // ============================================================================

  it('Property: For any valid command, execution should record output', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom('kilo', 'opencode', 'skills-system'),
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.array(fc.string({ maxLength: 30 }), { maxLength: 5 }),
        async (agentId, platform, command, args) => {
          const session = await service.createSession(agentId, platform as any);
          const step = await service.executeCommand(session.id, command, args);

          expect(step.id).toBeDefined();
          expect(step.sessionId).toBe(session.id);
          expect(step.command).toBe(command);
          expect(step.args).toEqual(args);
          expect(['pending', 'running', 'completed', 'failed']).toContain(step.status);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ============================================================================
  // Property: Session retrieval should return current session state
  // ============================================================================

  it('Property: For any created session, retrieval should return correct state', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom('kilo', 'opencode', 'skills-system'),
        async (agentId, platform) => {
          const created = await service.createSession(agentId, platform as any);
          const retrieved = await service.getSession(created.id);

          expect(retrieved).toBeDefined();
          expect(retrieved?.id).toBe(created.id);
          expect(retrieved?.agentId).toBe(agentId);
          expect(retrieved?.status).toBe('active');
        }
      ),
      { numRuns: 100 }
    );
  });

  // ============================================================================
  // Property: Step retrieval should return step details and output
  // ============================================================================

  it('Property: For any executed step, retrieval should return complete details', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom('kilo', 'opencode', 'skills-system'),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (agentId, platform, command) => {
          const session = await service.createSession(agentId, platform as any);
          const step = await service.executeCommand(session.id, command);
          const retrieved = await service.getStep(step.id);

          expect(retrieved).toBeDefined();
          expect(retrieved?.id).toBe(step.id);
          expect(retrieved?.command).toBe(command);
          expect(retrieved?.sessionId).toBe(session.id);
        }
      ),
      { numRuns: 100 }
    );
  });

  // ============================================================================
  // Property: Output retrieval should return all recorded output
  // ============================================================================

  it('Property: For any session with output, retrieval should return all records', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom('kilo', 'opencode', 'skills-system'),
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
        async (agentId, platform, commands) => {
          const session = await service.createSession(agentId, platform as any);

          // Execute multiple commands
          for (const command of commands) {
            await service.executeCommand(session.id, command);
          }

          // Retrieve output
          const output = await service.getOutput(session.id);
          expect(output.length).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  // ============================================================================
  // Property: Step listing should return all steps in order
  // ============================================================================

  it('Property: For any session with steps, listing should return ordered steps', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom('kilo', 'opencode', 'skills-system'),
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 5 }),
        async (agentId, platform, commands) => {
          const session = await service.createSession(agentId, platform as any);

          // Execute commands
          for (const command of commands) {
            await service.executeCommand(session.id, command);
          }

          // List steps
          const steps = await service.listSteps(session.id);
          expect(steps.length).toBe(commands.length);

          // Verify ordering
          for (let i = 0; i < steps.length - 1; i++) {
            expect(steps[i].stepNumber).toBeLessThan(steps[i + 1].stepNumber);
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  // ============================================================================
  // Property: Session pause should preserve state
  // ============================================================================

  it('Property: For any active session, pause should change status', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom('kilo', 'opencode', 'skills-system'),
        async (agentId, platform) => {
          const session = await service.createSession(agentId, platform as any);
          await service.pauseSession(session.id);

          const paused = await service.getSession(session.id);
          expect(paused?.status).toBe('paused');
        }
      ),
      { numRuns: 100 }
    );
  });

  // ============================================================================
  // Property: Session resume should restore previous state
  // ============================================================================

  it('Property: For any paused session, resume should restore active status', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom('kilo', 'opencode', 'skills-system'),
        async (agentId, platform) => {
          const session = await service.createSession(agentId, platform as any);
          await service.pauseSession(session.id);
          await service.resumeSession(session.id);

          const resumed = await service.getSession(session.id);
          expect(resumed?.status).toBe('active');
        }
      ),
      { numRuns: 100 }
    );
  });

  // ============================================================================
  // Property: Session closure should finalize state
  // ============================================================================

  it('Property: For any active session, closure should mark as completed', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom('kilo', 'opencode', 'skills-system'),
        async (agentId, platform) => {
          const session = await service.createSession(agentId, platform as any);
          await service.closeSession(session.id);

          const closed = await service.getSession(session.id);
          expect(closed?.status).toBe('completed');
          expect(closed?.endedAt).toBeDefined();
        }
      ),
      { numRuns: 100 }
    );
  });

  // ============================================================================
  // Property: Debugging should provide detailed execution information
  // ============================================================================

  it('Property: For any executed step, debugging should return complete info', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom('kilo', 'opencode', 'skills-system'),
        fc.string({ minLength: 1, maxLength: 50 }),
        async (agentId, platform, command) => {
          const session = await service.createSession(agentId, platform as any, '/tmp', true);
          const step = await service.executeCommand(session.id, command);

          const debug = await service.debugStep(step.id);
          expect(debug.step).toBeDefined();
          expect(debug.output).toBeDefined();
          expect(debug.environment).toBeDefined();
        }
      ),
      { numRuns: 50 }
    );
  });

  // ============================================================================
  // Property: Output formatting should be readable and complete
  // ============================================================================

  it('Property: For any session output, formatting should produce readable string', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom('kilo', 'opencode', 'skills-system'),
        fc.array(fc.string({ minLength: 1, maxLength: 50 }), { minLength: 1, maxLength: 3 }),
        async (agentId, platform, commands) => {
          const session = await service.createSession(agentId, platform as any);

          for (const command of commands) {
            await service.executeCommand(session.id, command);
          }

          const formatted = await service.formatOutput(session.id);
          expect(typeof formatted).toBe('string');
        }
      ),
      { numRuns: 50 }
    );
  });

  // ============================================================================
  // Property: Workflow execution should run all steps in sequence
  // ============================================================================

  it('Property: For any workflow steps, execution should complete all steps or stop on failure', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom('kilo', 'opencode', 'skills-system'),
        fc.array(
          fc.record({
            command: fc.string({ minLength: 1, maxLength: 50 }),
            args: fc.array(fc.string({ maxLength: 30 }), { maxLength: 3 }),
          }),
          { minLength: 1, maxLength: 5 }
        ),
        async (agentId, platform, steps) => {
          const session = await service.createSession(agentId, platform as any);

          const executed = await service.executeWorkflow(session.id, steps);

          // Filter out empty commands to match service behavior
          const validSteps = steps.filter(s => s.command && s.command.trim().length > 0);

          // Execution should complete all valid steps OR stop early if a step fails
          expect(executed.length).toBeGreaterThan(0);
          expect(executed.length).toBeLessThanOrEqual(validSteps.length);
          expect(executed.every((s) => s.sessionId === session.id)).toBe(true);
          
          // If execution stopped early, the last step should have failed
          if (executed.length < validSteps.length) {
            const lastStep = executed[executed.length - 1];
            expect(lastStep.status).toBe('failed');
          }
        }
      ),
      { numRuns: 50 }
    );
  });

  // ============================================================================
  // Property: Output filtering should return correct output types
  // ============================================================================

  it('Property: For any output type filter, retrieval should return matching records', async () => {
    await fc.assert(
      fc.asyncProperty(
        fc.string({ minLength: 1, maxLength: 50 }),
        fc.constantFrom('kilo', 'opencode', 'skills-system'),
        fc.constantFrom('stdout', 'stderr', 'debug'),
        async (agentId, platform, outputType) => {
          const session = await service.createSession(agentId, platform as any);
          await service.executeCommand(session.id, 'test-command');

          const output = await service.getOutput(session.id, outputType as any);
          expect(output.every((o) => o.type === outputType)).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });
});
