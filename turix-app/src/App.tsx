import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SearchBar from './components/SearchBar';
import StatusCard from './components/StatusCard';
import ServiceRegistry from './services/ServiceRegistry';
import BytebotService from './services/BytebotService';
import AIOSService from './services/AIOSService';
import FactifAIService from './services/FactifAIService';
import PostizService from './services/PostizService';
import './App.css';

declare global {
  interface Window {
    electronAPI: any;
  }
}

function App() {
  const [isVisible, setIsVisible] = useState(true);
  const [currentCommand, setCurrentCommand] = useState<string | null>(null);
  const [commandStatus, setCommandStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [services, setServices] = useState<any[]>([]);
  const [activeService, setActiveService] = useState<string | null>(null);

  useEffect(() => {
    // Initialize service registry
    const registry = ServiceRegistry.getInstance();

    // Initialize services
    BytebotService.init();
    AIOSService.init();
    FactifAIService.init();
    PostizService.init();

    // Load available services
    const loadServices = async () => {
      try {
        const availableServices = await window.electronAPI.getServices();
        setServices(availableServices);
      } catch (error) {
        console.error('Failed to load services:', error);
      }
    };

    loadServices();

    // Listen for service updates
    window.electronAPI.onServiceUpdate((event: any, serviceData: any) => {
      setServices(prev => prev.map(s =>
        s.name === serviceData.name ? { ...s, ...serviceData } : s
      ));
    });

    return () => {
      window.electronAPI.removeAllListeners('service-update');
    };
  }, []);

  const handleCommand = async (command: string) => {
    setCurrentCommand(command);
    setCommandStatus('processing');

    try {
      const result = await window.electronAPI.processCommand(command);
      setCommandStatus('success');

      // Auto-hide success after 3 seconds
      setTimeout(() => {
        setCommandStatus('idle');
        setCurrentCommand(null);
      }, 3000);
    } catch (error) {
      setCommandStatus('error');
      console.error('Command failed:', error);
    }
  };

  const handleServiceSelect = (serviceName: string) => {
    setActiveService(serviceName);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="turix-app"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.2 }}
        >
          <div className="app-container">
            <SearchBar onCommand={handleCommand} />

            <AnimatePresence>
              {currentCommand && (
                <StatusCard
                  command={currentCommand}
                  status={commandStatus}
                  onClose={() => {
                    setCurrentCommand(null);
                    setCommandStatus('idle');
                  }}
                />
              )}
            </AnimatePresence>

            <div className="service-actions">
              {activeService && services.find(s => s.name === activeService) && (
                <div className="active-service-controls">
                  {services.find(s => s.name === activeService)?.actions?.map((action: string) => (
                    <button
                      key={action}
                      className="action-button"
                      onClick={() => handleCommand(`${activeService} ${action.toLowerCase()}`)}
                    >
                      {action}
                    </button>
                  ))}
                </div>
              )}

              <div className="global-actions">
                <button className="action-button" onClick={() => handleCommand('select screen')}>
                  Select Screen
                </button>
                <button className="action-button" onClick={() => handleCommand('open web')}>
                  Open Web
                </button>
                <button className="action-button" onClick={() => handleCommand('settings')}>
                  Settings
                </button>
                <button
                  className="action-button hide-button"
                  onClick={() => window.electronAPI.toggleVisibility()}
                >
                  Hide TuriX
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default App;