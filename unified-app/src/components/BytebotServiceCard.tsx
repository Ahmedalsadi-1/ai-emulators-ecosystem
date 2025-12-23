import React from 'react';

/**
 * Props for BytebotServiceCard component
 */
interface BytebotServiceCardProps {
  name: string;
  status: string;
  onScreenshot?: () => void;
  onMouseControl?: () => void;
  onKeyboardControl?: () => void;
  onApplicationControl?: () => void;
  onFileOperations?: () => void;
}

/**
 * BytebotServiceCard component for computer control operations.
 * Provides a beautiful UI for Bytebot service interactions.
 */
export const BytebotServiceCard: React.FC<BytebotServiceCardProps> = ({
  name,
  status,
  onScreenshot,
  onMouseControl,
  onKeyboardControl,
  onApplicationControl,
  onFileOperations
}) => {
  const actions = [
    { label: 'Take Screenshot', action: 'screenshot', handler: onScreenshot },
    { label: 'Mouse Control', action: 'mouse_control', handler: onMouseControl },
    { label: 'Keyboard Control', action: 'keyboard_control', handler: onKeyboardControl },
    { label: 'Application Control', action: 'application_control', handler: onApplicationControl },
    { label: 'File Operations', action: 'file_operations', handler: onFileOperations }
  ];

  return (
    <div className="bytebot-service-card bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg shadow-lg p-6 m-4 border border-blue-200">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-800">{name}</h3>
            <p className="text-sm text-gray-600">Computer Control & Automation</p>
          </div>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
          status === 'active'
            ? 'bg-green-100 text-green-800 border border-green-200'
            : status === 'inactive'
            ? 'bg-red-100 text-red-800 border border-red-200'
            : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
        }`}>
          {status}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-4">
        {actions.map((action, index) => (
          <button
            key={index}
            className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 hover:border-blue-400 transition-colors duration-200 font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={action.handler}
            disabled={!action.handler}
          >
            {action.label}
          </button>
        ))}
      </div>

      <div className="text-xs text-gray-500 bg-white bg-opacity-50 rounded p-2">
        <div className="flex items-center space-x-2 mb-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>Voice commands supported</span>
        </div>
        <p className="text-gray-600">Use natural language like "take screenshot" or "click mouse at 100, 200"</p>
      </div>
    </div>
  );
};