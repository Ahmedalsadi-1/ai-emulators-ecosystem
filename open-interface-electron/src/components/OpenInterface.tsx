import React, { useState, useEffect, useRef } from 'react';

// Extend Window interface for Electron API
declare global {
  interface Window {
    electronAPI: {
      getServerStatus: () => Promise<any>;
      restartServer: () => Promise<any>;
      onServerStatusUpdate: (callback: (status: any) => void) => void;
      removeAllListeners: (channel: string) => void;
    };
  }
}

interface OpenInterfaceProps {
  apiUrl?: string;
  onStatusChange?: (status: string) => void;
}

interface StatusData {
  status: string;
  is_executing: boolean;
}

const OpenInterface: React.FC<OpenInterfaceProps> = ({
  apiUrl = 'http://localhost:5000',
  onStatusChange
}) => {
  const [userRequest, setUserRequest] = useState('');
  const [currentStatus, setCurrentStatus] = useState('Ready');
  const [isExecuting, setIsExecuting] = useState(false);
  const [settings, setSettings] = useState<any>({});
  const [showSettings, setShowSettings] = useState(false);
  const statusIntervalRef = useRef<number | null>(null);

  // Monitor server status via Electron API
  useEffect(() => {
    if (window.electronAPI) {
      // Listen for server status updates from Electron
      window.electronAPI.onServerStatusUpdate((status: any) => {
        console.log('Server status update:', status);
        if (status.running) {
          setCurrentStatus('Server running');
        } else {
          setCurrentStatus('Server stopped');
          setIsExecuting(false);
        }
      });

      // Get initial server status
      window.electronAPI.getServerStatus().then((status) => {
        console.log('Initial server status:', status);
        if (status.running) {
          setCurrentStatus('Server running');
        } else {
          setCurrentStatus('Server not running');
        }
      }).catch((error) => {
        console.error('Failed to get server status:', error);
        setCurrentStatus('Server status unknown');
      });
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeAllListeners('python-server-status');
      }
    };
  }, []);

  // Poll for status updates from Flask API
  useEffect(() => {
    const pollStatus = async () => {
      try {
        const response = await fetch(`${apiUrl}/status`);
        const data: StatusData = await response.json();
        setCurrentStatus(data.status);
        setIsExecuting(data.is_executing);

        if (onStatusChange) {
          onStatusChange(data.status);
        }
      } catch (error) {
        console.error('Failed to get status:', error);
        // Don't override server status messages
        if (!currentStatus.includes('Server')) {
          setCurrentStatus('Connection error');
        }
      }
    };

    // Only poll if we think the server is running
    if (currentStatus !== 'Server not running' && currentStatus !== 'Server status unknown') {
      // Initial poll
      pollStatus();

      // Set up polling interval
      statusIntervalRef.current = window.setInterval(pollStatus, 1000);
    }

    return () => {
      if (statusIntervalRef.current) {
        window.clearInterval(statusIntervalRef.current);
      }
    };
  }, [apiUrl, onStatusChange, currentStatus]);

  // Load settings on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch(`${apiUrl}/settings`);
        const data = await response.json();
        setSettings(data);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    };

    loadSettings();
  }, [apiUrl]);

  const handleExecute = async () => {
    if (!userRequest.trim()) return;

    try {
      const response = await fetch(`${apiUrl}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ request: userRequest }),
      });

      const data = await response.json();
      if (response.ok) {
        setCurrentStatus('Starting execution...');
        setIsExecuting(true);
      } else {
        setCurrentStatus(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to execute request:', error);
      setCurrentStatus('Failed to execute request');
    }
  };

  const handleStop = async () => {
    try {
      const response = await fetch(`${apiUrl}/stop`, {
        method: 'POST',
      });

      const data = await response.json();
      if (response.ok) {
        setCurrentStatus('Stopping execution...');
      } else {
        setCurrentStatus(`Error: ${data.error}`);
      }
    } catch (error) {
      console.error('Failed to stop execution:', error);
      setCurrentStatus('Failed to stop execution');
    }
  };

  const handleSettingsChange = async (newSettings: any) => {
    try {
      const response = await fetch(`${apiUrl}/settings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSettings),
      });

      const data = await response.json();
      if (response.ok) {
        setSettings(newSettings);
        setCurrentStatus('Settings updated');
      } else {
        setCurrentStatus(`Settings error: ${data.error}`);
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
    <div className="open-interface-container" style={{
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      backgroundColor: '#f8f9fa',
      fontFamily: 'Arial, sans-serif',
    }}>
      {/* Header */}
      <div style={{
        backgroundColor: '#2c3e50',
        color: 'white',
        padding: '10px 15px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>Open-Interface</h2>
        <div>
          <button
            onClick={() => setShowSettings(!showSettings)}
            style={{
              backgroundColor: '#34495e',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '3px',
              cursor: 'pointer',
              marginRight: '5px',
            }}
          >
            Settings
          </button>
          <button
            onClick={handleStop}
            disabled={!isExecuting}
            style={{
              backgroundColor: isExecuting ? '#e74c3c' : '#95a5a6',
              color: 'white',
              border: 'none',
              padding: '5px 10px',
              borderRadius: '3px',
              cursor: isExecuting ? 'pointer' : 'not-allowed',
            }}
          >
            Stop
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div style={{
        backgroundColor: isExecuting ? '#f39c12' : '#27ae60',
        color: 'white',
        padding: '8px 15px',
        fontSize: '14px',
      }}>
        Status: {currentStatus}
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: '15px',
      }}>
        {showSettings ? (
          /* Settings Panel */
          <div style={{
            backgroundColor: 'white',
            borderRadius: '5px',
            padding: '15px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          }}>
            <h3 style={{ marginTop: 0 }}>Settings</h3>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                API Key:
                <input
                  type="password"
                  value={settings.api_key || ''}
                  onChange={(e) => setSettings({...settings, api_key: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '3px',
                    marginTop: '5px',
                  }}
                />
              </label>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Base URL:
                <input
                  type="text"
                  value={settings.base_url || ''}
                  onChange={(e) => setSettings({...settings, base_url: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '3px',
                    marginTop: '5px',
                  }}
                />
              </label>
            </div>
            <div style={{ marginBottom: '10px' }}>
              <label style={{ display: 'block', marginBottom: '5px' }}>
                Model:
                <input
                  type="text"
                  value={settings.model || ''}
                  onChange={(e) => setSettings({...settings, model: e.target.value})}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '3px',
                    marginTop: '5px',
                  }}
                />
              </label>
            </div>
            <div style={{ textAlign: 'right' }}>
              <button
                onClick={() => handleSettingsChange(settings)}
                style={{
                  backgroundColor: '#3498db',
                  color: 'white',
                  border: 'none',
                  padding: '8px 15px',
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
              >
                Save Settings
              </button>
            </div>
          </div>
        ) : (
          /* Main Interface */
          <>
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold' }}>
                What would you like me to do?
              </label>
              <textarea
                value={userRequest}
                onChange={(e) => setUserRequest(e.target.value)}
                onKeyDown={handleKeyPress}
                placeholder="Describe what you want to automate on your screen..."
                style={{
                  width: '100%',
                  height: '120px',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px',
                  resize: 'vertical',
                  fontFamily: 'inherit',
                }}
                disabled={isExecuting}
              />
            </div>

            <div style={{ textAlign: 'center' }}>
              <button
                onClick={handleExecute}
                disabled={isExecuting || !userRequest.trim()}
                style={{
                  backgroundColor: isExecuting ? '#95a5a6' : '#3498db',
                  color: 'white',
                  border: 'none',
                  padding: '12px 30px',
                  borderRadius: '5px',
                  fontSize: '16px',
                  cursor: (isExecuting || !userRequest.trim()) ? 'not-allowed' : 'pointer',
                  fontWeight: 'bold',
                }}
              >
                {isExecuting ? 'Executing...' : 'Execute'}
              </button>
            </div>

            {/* Example commands */}
            <div style={{
              marginTop: '20px',
              backgroundColor: 'white',
              borderRadius: '5px',
              padding: '15px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            }}>
              <h4 style={{ marginTop: 0, color: '#2c3e50' }}>Example Commands:</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <button
                  onClick={() => setUserRequest('Take a screenshot and describe what you see')}
                  style={{
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '3px',
                    backgroundColor: '#f8f9fa',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  📸 Screenshot & Describe
                </button>
                <button
                  onClick={() => setUserRequest('Move mouse to the center of the screen')}
                  style={{
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '3px',
                    backgroundColor: '#f8f9fa',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  🖱️ Move Mouse Center
                </button>
                <button
                  onClick={() => setUserRequest('Click on the first button you find')}
                  style={{
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '3px',
                    backgroundColor: '#f8f9fa',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  👆 Click First Button
                </button>
                <button
                  onClick={() => setUserRequest('Type "Hello World" where the cursor is')}
                  style={{
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '3px',
                    backgroundColor: '#f8f9fa',
                    cursor: 'pointer',
                    textAlign: 'left',
                  }}
                >
                  ⌨️ Type Hello World
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default OpenInterface;