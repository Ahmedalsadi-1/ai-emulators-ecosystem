import React from 'react';
import OpenInterface from './components/OpenInterface';

const App: React.FC = () => {
  const handleStatusChange = (status: string) => {
    console.log('Open-Interface status:', status);
    // Could send status updates to Electron main process if needed
  };

  return (
    <div style={{ width: '100vw', height: '100vh' }}>
      <OpenInterface
        apiUrl={process.env.REACT_APP_API_URL || 'http://localhost:5000'}
        onStatusChange={handleStatusChange}
      />
    </div>
  );
};

export default App;