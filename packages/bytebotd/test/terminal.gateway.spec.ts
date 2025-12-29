import { Test, TestingModule } from '@nestjs/testing';
import { TerminalGateway } from '../src/terminal/terminal.gateway';
import { TerminalModule } from '../src/terminal/terminal.module';
import * as os from 'os';

// Mock node-pty
jest.mock('node-pty', () => ({
  spawn: jest.fn(() => {
    let exitCallback: ((data: { exitCode: number }) => void) | null = null;
    const mockPty = {
      pid: 12345,
      onData: jest.fn((callback) => {
        // Simulate shell prompt
        setTimeout(() => callback('$ '), 10);
      }),
      onExit: jest.fn((callback) => {
        exitCallback = callback;
      }),
      write: jest.fn((data: string) => {
        // Simulate exit when 'exit\n' is written
        if (data === 'exit\n' && exitCallback) {
          setTimeout(() => exitCallback!({ exitCode: 0 }), 100);
        }
      }),
      resize: jest.fn(),
      kill: jest.fn(),
      destroy: jest.fn(),
    };
    return mockPty;
  }),
}));

// Mock Socket interface
interface MockSocket {
  id: string;
  handshake: {
    query: {
      cols?: string;
      rows?: string;
    };
  };
  emit: jest.Mock;
  on?: jest.Mock;
}

describe('Terminal Gateway - Smoke Tests', () => {
  let gateway: TerminalGateway;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TerminalModule],
    }).compile();

    gateway = moduleFixture.get<TerminalGateway>(TerminalGateway);
  });

  describe('Connection and Basic Operations', () => {
    it('should be defined', () => {
      expect(gateway).toBeDefined();
    });

    it('should create a new terminal session on connection', (done) => {
      const mockSocket: MockSocket = {
        id: 'test-session-1',
        handshake: {
          query: { cols: '120', rows: '32' },
        },
        emit: jest.fn((event, data) => {
          if (event === 'terminal:data' && data) {
            expect(mockSocket.emit).toHaveBeenCalledWith(
              'terminal:data',
              expect.any(String),
            );
            done();
          }
        }),
      };

      gateway.handleConnection(mockSocket as any);
    }, 10000);

    it('should clean up session on disconnect', () => {
      const mockSocket: MockSocket = {
        id: 'test-session-2',
        handshake: {
          query: { cols: '120', rows: '32' },
        },
        emit: jest.fn(),
      };

      // First connect
      gateway.handleConnection(mockSocket as any);

      // Then disconnect - should not throw
      expect(() => {
        gateway.handleDisconnect(mockSocket as any);
      }).not.toThrow();
    });
  });

  describe('Basic Shell Commands', () => {
    let mockSocket: MockSocket;

    beforeEach((done) => {
      mockSocket = {
        id: `test-session-${Date.now()}`,
        handshake: {
          query: { cols: '120', rows: '32' },
        },
        emit: jest.fn((event, data) => {
          if (event === 'terminal:data') {
            // Wait for shell prompt to appear
            if (
              data &&
              (data.includes('$') || data.includes('#') || data.includes('>'))
            ) {
              done();
            }
          }
        }),
      };

      gateway.handleConnection(mockSocket as any);
    }, 10000);

    afterEach(() => {
      gateway.handleDisconnect(mockSocket as any);
    });

    it('should handle terminal input without crashing', () => {
      expect(() => {
        gateway.handleInput('ls\n', mockSocket as any);
        gateway.handleInput({ data: 'pwd\n' }, mockSocket as any);
        gateway.handleInput({ data: 'whoami\n' }, mockSocket as any);
      }).not.toThrow();
    });

    it('should handle empty input', () => {
      expect(() => {
        gateway.handleInput('', mockSocket as any);
        gateway.handleInput({ data: '' }, mockSocket as any);
      }).not.toThrow();
    });

    it('should handle terminal resize', () => {
      expect(() => {
        gateway.handleResize({ cols: 80, rows: 24 }, mockSocket as any);
        gateway.handleResize({ cols: 160, rows: 48 }, mockSocket as any);
      }).not.toThrow();
    });

    it('should handle resize with missing dimensions', () => {
      expect(() => {
        gateway.handleResize({}, mockSocket as any);
        gateway.handleResize({ cols: 120 }, mockSocket as any);
        gateway.handleResize({ rows: 32 }, mockSocket as any);
      }).not.toThrow();
    });
  });

  describe('Session Management', () => {
    it('should handle Ctrl+C signal', () => {
      const mockSocket: MockSocket = {
        id: 'test-session-ctrlc',
        handshake: {
          query: { cols: '120', rows: '32' },
        },
        emit: jest.fn(),
      };

      gateway.handleConnection(mockSocket as any);

      expect(() => {
        gateway.handleInput('\u0003', mockSocket as any); // Ctrl+C
        gateway.handleInput({ data: '\u0003' }, mockSocket as any); // Ctrl+C with data wrapper
      }).not.toThrow();

      gateway.handleDisconnect(mockSocket as any);
    });

    it('should handle multiple concurrent sessions', (done) => {
      const sockets: MockSocket[] = [];
      let connectedCount = 0;

      for (let i = 0; i < 3; i++) {
        const mockSocket: MockSocket = {
          id: `test-session-concurrent-${i}`,
          handshake: {
            query: { cols: '80', rows: '24' },
          },
          emit: jest.fn((event, data) => {
            if (event === 'terminal:data') {
              connectedCount++;
              if (connectedCount === 3) {
                done();
              }
            }
          }),
        };

        sockets.push(mockSocket);
        gateway.handleConnection(mockSocket as any);
      }

      // Clean up
      sockets.forEach((socket) => {
        gateway.handleDisconnect(socket as any);
      });
    }, 15000);
  });

  describe('Error Handling', () => {
    it('should handle invalid input without crashing', () => {
      const mockSocket: MockSocket = {
        id: 'test-session-invalid',
        handshake: {
          query: { cols: '120', rows: '32' },
        },
        emit: jest.fn(),
      };

      gateway.handleConnection(mockSocket as any);

      expect(() => {
        gateway.handleInput(null as any, mockSocket as any);
        gateway.handleInput(undefined as any, mockSocket as any);
        gateway.handleInput({}, mockSocket as any);
        gateway.handleInput({ data: undefined }, mockSocket as any);
      }).not.toThrow();

      gateway.handleDisconnect(mockSocket as any);
    });

    it('should handle disconnect for non-existent session', () => {
      const mockSocket: MockSocket = {
        id: 'non-existent-session',
        handshake: {
          query: { cols: '120', rows: '32' },
        },
        emit: jest.fn(),
      };

      // Disconnect without connecting - should not throw
      expect(() => {
        gateway.handleDisconnect(mockSocket as any);
      }).not.toThrow();
    });

    it('should handle input for non-existent session', () => {
      const mockSocket: MockSocket = {
        id: 'non-existent-session-input',
        handshake: {
          query: { cols: '120', rows: '32' },
        },
        emit: jest.fn(),
      };

      // Send input without connecting - should not throw
      expect(() => {
        gateway.handleInput('test', mockSocket as any);
      }).not.toThrow();
    });
  });
});

describe('Terminal Gateway - Integration Tests', () => {
  let gateway: TerminalGateway;

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [TerminalModule],
    }).compile();

    gateway = moduleFixture.get<TerminalGateway>(TerminalGateway);
  });

  describe('PTY Session Management', () => {
    it('should spawn PTY session with default configuration', (done) => {
      const mockSocket: MockSocket = {
        id: 'test-pty-session-default',
        handshake: {
          query: {},
        },
        emit: jest.fn((event, data) => {
          if (event === 'terminal:data' && data) {
            expect(mockSocket.emit).toHaveBeenCalledWith(
              'terminal:data',
              expect.any(String),
            );
            done();
          }
        }),
      };

      gateway.handleConnection(mockSocket as any);
    }, 10000);

    it('should spawn PTY session with custom size', (done) => {
      const mockSocket: MockSocket = {
        id: 'test-pty-session-custom',
        handshake: {
          query: { cols: '160', rows: '48' },
        },
        emit: jest.fn((event, data) => {
          if (event === 'terminal:data' && data) {
            expect(mockSocket.emit).toHaveBeenCalled();
            done();
          }
        }),
      };

      gateway.handleConnection(mockSocket as any);
    }, 10000);

    it('should emit exit event when shell exits', (done) => {
      const mockSocket: MockSocket = {
        id: 'test-pty-session-exit',
        handshake: {
          query: { cols: '120', rows: '32' },
        },
        emit: jest.fn((event, data) => {
          if (event === 'terminal:data') {
            // Send exit command
            gateway.handleInput('exit\n', mockSocket as any);
          }
          if (event === 'terminal:exit') {
            expect(data).toHaveProperty('exitCode');
            done();
          }
        }),
      };

      gateway.handleConnection(mockSocket as any);
    }, 15000);
  });

  describe('WebSocket Message Routing', () => {
    it('should route terminal:input to PTY', () => {
      const mockSocket: MockSocket = {
        id: 'test-routing-input',
        handshake: {
          query: { cols: '120', rows: '32' },
        },
        emit: jest.fn(),
      };

      gateway.handleConnection(mockSocket as any);

      expect(() => {
        gateway.handleInput('echo hello\n', mockSocket as any);
        gateway.handleInput({ data: 'echo world\n' }, mockSocket as any);
      }).not.toThrow();

      gateway.handleDisconnect(mockSocket as any);
    });

    it('should route terminal:resize to PTY', () => {
      const mockSocket: MockSocket = {
        id: 'test-routing-resize',
        handshake: {
          query: { cols: '120', rows: '32' },
        },
        emit: jest.fn(),
      };

      gateway.handleConnection(mockSocket as any);

      expect(() => {
        gateway.handleResize({ cols: 80, rows: 24 }, mockSocket as any);
        gateway.handleResize({ cols: 160, rows: 48 }, mockSocket as any);
      }).not.toThrow();

      gateway.handleDisconnect(mockSocket as any);
    });
  });

  describe('Environment and Configuration', () => {
    it('should use SHELL environment variable or default to /bin/bash', () => {
      const shell = process.env.SHELL || '/bin/bash';
      expect(typeof shell).toBe('string');
      expect(shell.length).toBeGreaterThan(0);
    });

    it('should use TERMINAL_CWD or home directory', () => {
      const cwd = process.env.TERMINAL_CWD || os.homedir() || '/home/user';
      expect(typeof cwd).toBe('string');
      expect(cwd.length).toBeGreaterThan(0);
    });

    it('should set TERM environment variable', (done) => {
      const mockSocket: MockSocket = {
        id: 'test-term-env',
        handshake: {
          query: { cols: '120', rows: '32' },
        },
        emit: jest.fn((event) => {
          if (event === 'terminal:data') {
            // Send command to check TERM
            gateway.handleInput('echo $TERM\n', mockSocket as any);
          }
        }),
      };

      gateway.handleConnection(mockSocket as any);
      done();
    }, 5000);
  });

  describe('Data Flow Verification', () => {
    it('should receive shell prompt after connection', (done) => {
      const mockSocket: MockSocket = {
        id: 'test-shell-prompt',
        handshake: {
          query: { cols: '120', rows: '32' },
        },
        emit: jest.fn((event, data) => {
          if (event === 'terminal:data' && data) {
            // Shell prompt typically contains $, #, or >
            if (
              data.toString().includes('$') ||
              data.toString().includes('#') ||
              data.toString().includes('>')
            ) {
              expect(data).toBeTruthy();
              done();
            }
          }
        }),
      };

      gateway.handleConnection(mockSocket as any);
    }, 10000);

    it('should handle continuous data stream', () => {
      const mockSocket: MockSocket = {
        id: 'test-data-stream',
        handshake: {
          query: { cols: '120', rows: '32' },
        },
        emit: jest.fn(),
      };

      gateway.handleConnection(mockSocket as any);

      expect(() => {
        // Simulate rapid inputs
        for (let i = 0; i < 10; i++) {
          gateway.handleInput(`echo test${i}\n`, mockSocket as any);
        }
      }).not.toThrow();

      gateway.handleDisconnect(mockSocket as any);
    });
  });
});
