import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Clock, X } from 'lucide-react';

interface StatusCardProps {
  command: string;
  status: 'idle' | 'processing' | 'success' | 'error';
  onClose: () => void;
}

const StatusCard: React.FC<StatusCardProps> = ({ command, status, onClose }) => {
  const getStatusIcon = () => {
    switch (status) {
      case 'processing':
        return <Clock className="status-icon processing" size={20} />;
      case 'success':
        return <CheckCircle className="status-icon success" size={20} />;
      case 'error':
        return <XCircle className="status-icon error" size={20} />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'processing':
        return 'Processing...';
      case 'success':
        return 'Completed';
      case 'error':
        return 'Failed';
      default:
        return '';
    }
  };

  const getErrorMessage = () => {
    if (status === 'error') {
      return 'Device lock expired due to inactivity.';
    }
    return null;
  };

  return (
    <motion.div
      className="status-card"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="status-header">
        <div className="status-title">
          <span className="status-label">Last Command:</span>
          <span className="command-text">{command}</span>
        </div>

        <div className="status-indicator">
          {getStatusIcon()}
          <span className={`status-text ${status}`}>{getStatusText()}</span>
        </div>

        <div className="status-actions">
          <button className="share-button">📤</button>
          <button className="refresh-button">🔄</button>
          <button onClick={onClose} className="close-button">
            <X size={16} />
          </button>
        </div>
      </div>

      {getErrorMessage() && (
        <div className="status-body">
          <div className="error-message">
            <strong>Error:</strong> {getErrorMessage()}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default StatusCard;