import React, { useState, useEffect, useRef } from 'react';
import { Computer, Settings, Play, Square, Monitor, Zap } from 'lucide-react';

// Extend Window interface for Electron API
declare global {
  interface Window {
    electronAPI: {
      getServerStatus: () => Promise<any>;
      restartServer: () => Promise<any>;
      executeRequest: (request: string) => Promise<any>;
      getScreenshot: () => Promise<any>;
      getSettings: () => Promise<any>;
      updateSettings: (settings: any) => Promise<any>;
      onServerStatusUpdate: (callback: (status: any) => void) => void;
      onValidationError: (callback: (error: any) => void) => void;
      removeAllListeners: (channel: string) => void;
      executeComputerAction: (action: any) => Promise<any>;
      onComputerActionRequest: (callback: (action: any) => void) => void;
      sendComputerActionResult: (result: any) => void;
    };
  }
}

interface BytebotOpenInterfaceProps {
  onActionResult?: (result: any) => void;
  onScreenshot?: (screenshot: string) => void;
}

interface StatusData {
  status: string;
  is_executing: boolean;
}

const BytebotOpenInterface: React.FC<BytebotOpenInterfaceProps> = ({
  onActionResult,
  onScreenshot
}) => {
  const [userRequest, setUserRequest] = useState('');
  const [currentStatus, setCurrentStatus] = useState('Initializing...');
  const [isExecuting, setIsExecuting] = useState(false);
  const [serverRunning, setServerRunning] = useState(false);
  const [settings, setSettings] = useState<any>({});
  const [showSettings, setShowSettings] = useState(false);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const statusIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Monitor server status and validation errors
  useEffect(() => {
    if (window.electronAPI) {
      // Listen for server status updates from Electron
      window.electronAPI.onServerStatusUpdate((status: any) => {
        console.log('Server status update:', status);
        setServerRunning(status.running);
        if (status.running) {
          setCurrentStatus('Server running - Ready for commands');
        } else {
          setCurrentStatus('Server stopped');
          setIsExecuting(false);
        }
      });

      // Listen for validation errors
      window.electronAPI.onValidationError((error: any) => {
        console.error('Python validation error:', error);
        setCurrentStatus(`Python Error: ${error.error}`);
        setServerRunning(false);
      });

      // Get initial server status
      window.electronAPI.getServerStatus().then((status) => {
        console.log('Initial server status:', status);
        setServerRunning(status.running);
        if (status.running) {
          setCurrentStatus('Server running - Ready for commands');
        } else {
          setCurrentStatus('Server not running');
        }
      }).catch((error: any) => {
        console.error('Failed to get server status:', error);
        setCurrentStatus('Server status unknown');
      });
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('python-server-status');
        window.electronAPI.removeAllListeners('python-validation-error');
      }
    };
  }, []);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await window.electronAPI.getSettings();
        setSettings(data);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    if (serverRunning) {
      loadSettings();
    }
  }, [serverRunning]);

  // Listen for computer action requests from Bytebot
  useEffect(() => {
    if (window.electronAPI) {
      window.electronAPI.onComputerActionRequest(async (action: any) => {
        console.log('Received computer action request:', action);
        try {
          const result = await handleComputerAction(action);
          window.electronAPI.sendComputerActionResult(result);
          if (onActionResult) {
            onActionResult(result);
          }
        } catch (error: any) {
          console.error('Failed to execute computer action:', error);
          const errorResult = { success: false, error: error.message };
          window.electronAPI.sendComputerActionResult(errorResult);
          if (onActionResult) {
            onActionResult(errorResult);
          }
        }
      });
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('computer-action-request');
      }
    };
  }, []);

  const handleComputerAction = async (action: any) => {
    // Convert Bytebot computer action to Open-Interface request
    let request = '';

    switch (action.action) {
      case 'move_mouse':
        request = `Move mouse to coordinates (${action.coordinates?.x || 0}, ${action.coordinates?.y || 0})`;
        break;
      case 'click_mouse':
        const button = action.button === 2 ? 'right' : action.button === 3 ? 'middle' : 'left';
        request = `Click the ${button} mouse button`;
        if (action.coordinates) {
          request += ` at coordinates (${action.coordinates.x}, ${action.coordinates.y})`;
        }
        if (action.clickCount > 1) {
          request += ` ${action.clickCount} times`;
        }
        break;
      case 'type_text':
        request = `Type the following text: "${action.text}"`;
        break;
      case 'press_keys':
        const keys = Array.isArray(action.keys) ? action.keys.join(' + ') : action.keys;
        request = `Press the following keys: ${keys}`;
        break;
      case 'scroll':
        const direction = action.direction === 'up' ? 'up' : 'down';
        request = `Scroll ${direction} by ${action.scrollCount || 1} units`;
        if (action.coordinates) {
          request += ` at coordinates (${action.coordinates.x}, ${action.coordinates.y})`;
        }
        break;
      case 'screenshot':
        request = 'Take a screenshot and describe what you see';
        break;
      case 'wait':
        request = `Wait for ${action.duration || 1000} milliseconds`;
        break;
      default:
        request = `Execute computer action: ${JSON.stringify(action)}`;
    }

    return await window.electronAPI.executeRequest(request);
  };

  const handleExecute = async () => {
    if (!userRequest.trim() || !serverRunning) return;

    try {
      setIsExecuting(true);
      setCurrentStatus('Executing request...');

      const result = await window.electronAPI.executeRequest(userRequest);

      if (result.error) {
        setCurrentStatus(`Error: ${result.error}`);
      } else {
        setCurrentStatus('Request completed successfully');
      }

      if (onActionResult) {
        onActionResult(result);
      }
    } catch (error) {
      console.error('Failed to execute request:', error);
      setCurrentStatus('Failed to execute request');
      if (onActionResult) {
        onActionResult({ success: false, error: error.message });
      }
    } finally {
      setIsExecuting(false);
    }
  };

  const handleTakeScreenshot = async () => {
    try {
      setCurrentStatus('Taking screenshot...');
      const result = await window.electronAPI.getScreenshot();

      if (result.image) {
        setScreenshot(result.image);
        setCurrentStatus('Screenshot captured');
        if (onScreenshot) {
          onScreenshot(result.image);
        }
      } else {
        setCurrentStatus('Failed to capture screenshot');
      }
    } catch (error: any) {
      console.error('Failed to take screenshot:', error);
      setCurrentStatus('Failed to take screenshot');
    }
  };

  const handleStop = async () => {
    try {
      // Stop execution by sending empty request or specific stop command
      await window.electronAPI.executeRequest('stop');
      setIsExecuting(false);
      setCurrentStatus('Execution stopped');
    } catch (error) {
      console.error('Failed to stop execution:', error);
    }
  };

  const handleSettingsChange = async (newSettings: any) => {
    try {
      const result = await window.electronAPI.updateSettings(newSettings);
      if (result.status === 'updated') {
        setSettings(newSettings);
        setCurrentStatus('Settings updated');
      } else {
        setCurrentStatus(`Settings error: ${result.error}`);
      }
    } catch (error) {
      console.error('Failed to update settings:', error);
      setCurrentStatus('Failed to update settings');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleExecute();
    }
  };

  return (
    <div style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#1a1a1a',
      color: '#ffffff',
      fontFamily: 'Inter, system-ui, sans-serif',
      borderRadius: '8px',
      overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#2d3748',
        padding: '12px 16px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderBottom: '1px solid #4a5568',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Computer size={20} />
          <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>Open-Interface Controller</h2>
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: serverRunning ? '#48bb78' : '#e53e3e',
          }} />
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              backgroundColor: 'transparent',
              color: '#a0aec0',
              border: '1px solid #4a5568',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Settings size={14} />
            Settings
          </button>
          <button
            onClick={handleStop}
            disabled={!isExecuting}
            style={{
              backgroundColor: isExecuting ? '#e53e3e' : '#4a5568',
              color: '#ffffff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '4px',
              cursor: isExecuting ? 'pointer' : 'not-allowed',
              fontSize: '12px',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
            }}
          >
            <Square size={14} />
            Stop
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div style={{
        backgroundColor: isExecuting ? '#d69e2e' : serverRunning ? '#38a169' : '#e53e3e',
        color: '#ffffff',
        padding: '6px 16px',
        fontSize: '13px',
        fontWeight: '500',
      }}>
        {currentStatus}
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '16px',
        gap: '16px',
      }}>
        {showSettings ? (
          /* Settings Panel */
          <div style={{
            backgroundColor: '#2d3748',
            borderRadius: '6px',
            padding: '16px',
            border: '1px solid #4a5568',
          }}>
            <h3 style={{ marginTop: 0, marginBottom: '16px', color: '#ffffff' }}>Settings</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', color: '#a0aec0', fontSize: '13px' }}>
                  API Key:
                </label>
                <input
                  type="password"
                  value={settings.api_key || ''}
                  onChange={(e) => setSettings({...settings, api_key: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #4a5568',
                    borderRadius: '4px',
                    backgroundColor: '#1a202c',
                    color: '#ffffff',
                    fontSize: '13px',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', color: '#a0aec0', fontSize: '13px' }}>
                  Base URL:
                </label>
                <input
                  type="text"
                  value={settings.base_url || ''}
                  onChange={(e) => setSettings({...settings, base_url: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #4a5568',
                    borderRadius: '4px',
                    backgroundColor: '#1a202c',
                    color: '#ffffff',
                    fontSize: '13px',
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '4px', color: '#a0aec0', fontSize: '13px' }}>
                  Model:
                </label>
                <input
                  type="text"
                  value={settings.model || ''}
                  onChange={(e) => setSettings({...settings, model: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #4a5568',
                    borderRadius: '4px',
                    backgroundColor: '#1a202c',
                    color: '#ffffff',
                    fontSize: '13px',
                  }}
                />
              </div>
              <div style={{ textAlign: 'right' }}>
                <button
                  onClick={() => handleSettingsChange(settings)}
                  style={{
                    backgroundColor: '#3182ce',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                  }}
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Main Interface */
          <>
            {/* Screenshot Display */}
            {screenshot && (
              <div style={{
                backgroundColor: '#2d3748',
                borderRadius: '6px',
                padding: '12px',
                border: '1px solid #4a5568',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <h4 style={{ margin: 0, color: '#ffffff', fontSize: '14px' }}>Latest Screenshot</h4>
                  <button
                    onClick={() => setScreenshot(null)}
                    style={{
                      backgroundColor: 'transparent',
                      color: '#a0aec0',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: '12px',
                    }}
                  >
                    ✕
                  </button>
                </div>
                <img
                  src={screenshot}
                  alt="Screenshot"
                  style={{
                    width: '100%',
                    maxHeight: '200px',
                    objectFit: 'contain',
                    borderRadius: '4px',
                    border: '1px solid #4a5568',
                  }}
                />
              </div>
            )}

            {/* Command Input */}
            <div style={{
              backgroundColor: '#2d3748',
              borderRadius: '6px',
              padding: '16px',
              border: '1px solid #4a5568',
            }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '500',
                color: '#ffffff',
                fontSize: '14px'
              }}>
                Computer Control Command:
              </label>
              <textarea
                value={userRequest}
                onChange={(e) => setUserRequest(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Describe what you want the computer to do... (e.g., 'Click on the save button', 'Type hello world')"
                style={{
                  width: '100%',
                  height: '80px',
                  padding: '10px',
                  border: '1px solid #4a5568',
                  borderRadius: '4px',
                  backgroundColor: '#1a202c',
                  color: '#ffffff',
                  fontSize: '13px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
                disabled={!serverRunning || isExecuting}
              />
              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                <button
                  onClick={handleExecute}
                  disabled={!serverRunning || isExecuting || !userRequest.trim()}
                  style={{
                    backgroundColor: (!serverRunning || isExecuting || !userRequest.trim()) ? '#4a5568' : '#3182ce',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: (!serverRunning || isExecuting || !userRequest.trim()) ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Zap size={14} />
                  {isExecuting ? 'Executing...' : 'Execute'}
                </button>
                <button
                  onClick={handleTakeScreenshot}
                  disabled={!serverRunning || isExecuting}
                  style={{
                    backgroundColor: (!serverRunning || isExecuting) ? '#4a5568' : '#38a169',
                    color: '#ffffff',
                    border: 'none',
                    padding: '8px 16px',
                    borderRadius: '4px',
                    cursor: (!serverRunning || isExecuting) ? 'not-allowed' : 'pointer',
                    fontSize: '13px',
                    fontWeight: '500',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <Monitor size={14} />
                  Screenshot
                </button>
              </div>
            </div>

            {/* Quick Actions */}
            <div style={{
              backgroundColor: '#2d3748',
              borderRadius: '6px',
              padding: '16px',
              border: '1px solid #4a5568',
            }}>
              <h4 style={{ marginTop: 0, marginBottom: '12px', color: '#ffffff', fontSize: '14px' }}>Quick Actions:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '8px' }}>
                {[
                  'Move mouse to center',
                  'Click left button',
                  'Type "Hello"',
                  'Press Enter key',
                  'Take screenshot',
                  'Wait 1 second'
                ].map((action, index) => (
                  <button
                    key={index}
                    onClick={() => setUserRequest(action)}
                    disabled={!serverRunning || isExecuting}
                    style={{
                      padding: '8px',
                      border: '1px solid #4a5568',
                      borderRadius: '4px',
                      backgroundColor: '#1a202c',
                      color: '#a0aec0',
                      cursor: (!serverRunning || isExecuting) ? 'not-allowed' : 'pointer',
                      fontSize: '12px',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      if (serverRunning && !isExecuting) {
                        e.currentTarget.style.backgroundColor = '#2d3748';
                        e.currentTarget.style.color = '#ffffff';
                      }
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#1a202c';
                      e.currentTarget.style.color = '#a0aec0';
                    }}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default BytebotOpenInterface;