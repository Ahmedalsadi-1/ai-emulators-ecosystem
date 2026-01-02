import { Test, TestingModule } from '@nestjs/testing';
import { OpenInterfaceScreenController } from './open-interface-screen-controller.service';
import { CrossPlatformPythonManager } from './cross-platform-python-manager.service';

describe('OpenInterfaceScreenController', () => {
  let service: OpenInterfaceScreenController;
  let pythonManager: CrossPlatformPythonManager;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OpenInterfaceScreenController,
        {
          provide: CrossPlatformPythonManager,
          useValue: {
            setupPythonEnvironment: jest.fn().mockResolvedValue({
              executable: 'python3',
              version: '3.9.0',
              hasRequiredPackages: true,
              missingPackages: [],
            }),
            diagnoseIssues: jest.fn().mockResolvedValue({
              issues: [],
              recommendations: [],
            }),
          },
        },
        {
          provide: 'NutService',
          useValue: {
            mouseMoveEvent: jest.fn(),
            mouseClickEvent: jest.fn(),
            mouseButtonEvent: jest.fn(),
            mouseWheelEvent: jest.fn(),
            sendKeys: jest.fn(),
            holdKeys: jest.fn(),
            typeText: jest.fn(),
            pasteText: jest.fn(),
            screendump: jest.fn(),
            getCursorPosition: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<OpenInterfaceScreenController>(OpenInterfaceScreenController);
    pythonManager = module.get<CrossPlatformPythonManager>(CrossPlatformPythonManager);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should convert computer actions to Open-Interface requests', () => {
    // Test mouse movement action
    const mouseAction = {
      action: 'move_mouse' as const,
      coordinates: { x: 100, y: 200 },
    };

    // Access private method for testing
    const convertMethod = (service as any).convertActionToRequest.bind(service);
    const result = convertMethod(mouseAction);
    expect(result).toBe('Move mouse to coordinates (100, 200)');

    // Test click action
    const clickAction = {
      action: 'click_mouse' as const,
      coordinates: { x: 50, y: 75 },
      button: 'left' as const,
      clickCount: 1,
    };

    const clickResult = convertMethod(clickAction);
    expect(clickResult).toBe('Click the left mouse button at coordinates (50, 75)');

    // Test text typing action
    const typeAction = {
      action: 'type_text' as const,
      text: 'Hello World',
    };

    const typeResult = convertMethod(typeAction);
    expect(typeResult).toBe('Type the following text: "Hello World"');

    // Test screenshot action
    const screenshotAction = {
      action: 'screenshot' as const,
    };

    const screenshotResult = convertMethod(screenshotAction);
    expect(screenshotResult).toBe('Take a screenshot and describe what you see');
  });

  it('should get controller status', async () => {
    const status = await service.getStatus();
    expect(status).toEqual({
      name: 'open-interface',
      displayName: 'Open-Interface AI Controller',
      description: 'AI-powered computer control using GPT-4V and screenshot analysis',
      isReady: false, // Not initialized yet
      capabilities: [
        'screenshot',
        'mouse_control',
        'keyboard_input',
        'text_input',
        'file_operations',
        'application_control',
      ],
      metadata: {
        pythonPath: expect.any(String),
        serverPort: 5001,
        serverRunning: false,
      },
    });
  });
});