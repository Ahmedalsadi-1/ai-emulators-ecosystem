import React from 'react';
import { BaseServiceCard } from './BaseServiceCard';

interface AIOSServiceCardProps {
  status: string;
  onAction?: (action: string) => void;
}

export class AIOSServiceCard extends React.Component<AIOSServiceCardProps> {
  render() {
    const { status, onAction } = this.props;

    const actions = [
      { label: 'Run LLM Query', action: 'run-llm-query' },
      { label: 'Store Memory', action: 'store-memory' },
      { label: 'Retrieve Memory', action: 'retrieve-memory' },
      { label: 'Discover MCP Tools', action: 'discover-mcp-tools' },
      { label: 'Execute Agent', action: 'execute-agent' },
      { label: 'List LLMs', action: 'list-llms' }
    ];

    return (
      <BaseServiceCard
        name="AIOS Service"
        status={status}
        actions={actions}
        onAction={onAction}
      />
    );
  }
}