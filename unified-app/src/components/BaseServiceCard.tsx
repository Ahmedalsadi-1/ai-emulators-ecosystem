import React from 'react';

/**
 * Base service card component for TuriX services.
 * Extend this component for specific service UIs.
 */
export class BaseServiceCard extends React.Component<{
  name: string;
  status: string;
  actions: Array<{ label: string; action: string }>;
  onAction?: (action: string) => void;
}> {
  render() {
    const { name, status, actions, onAction } = this.props;

    return (
      <div className="service-card bg-white rounded-lg shadow-md p-4 m-2">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{name}</h3>
          <span className={`px-2 py-1 rounded text-sm ${
            status === 'active' ? 'bg-green-100 text-green-800' :
            status === 'inactive' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            {status}
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          {actions.map((action, index) => (
            <button
              key={index}
              className="px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
              onClick={() => onAction && onAction(action.action)}
            >
              {action.label}
            </button>
          ))}
        </div>
      </div>
    );
  }
}