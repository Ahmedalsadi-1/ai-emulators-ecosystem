interface ToolTrace {
  id: string;
  tool: string;
  status: 'pending' | 'running' | 'success' | 'error';
  input: string;
  output?: string;
  timestamp: string;
}

interface ToolTracePanelProps {
  traces: ToolTrace[];
}

export function ToolTracePanel({ traces }: ToolTracePanelProps) {
  return (
    <div className="tool-trace-panel">
      <div className="mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Tool Trace
        </span>
      </div>
      <div className="space-y-2 max-h-64 overflow-auto pr-2 scrollbar-thin">
        {traces.length === 0 ? (
          <div className="text-center text-gray-500 text-xs py-8">
            No tool calls yet
          </div>
        ) : (
          traces.map(trace => (
            <div 
              key={trace.id} 
              className={`p-3 rounded-lg border ${
                trace.status === 'success' ? 'bg-[#1a2a1a] border-[#2a4a2a]' :
                trace.status === 'error' ? 'bg-[#2a1a1a] border-[#4a2a2a]' :
                trace.status === 'running' ? 'bg-[#2a2a1a] border-[#4a4a2a]' :
                'bg-[#1a1a1a] border-[#3a3a3a]'
              }`}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-[9px] uppercase tracking-wider text-amber-400">
                  {trace.tool}
                </span>
                <span className={`text-[8px] uppercase tracking-wide ${
                  trace.status === 'success' ? 'text-green-400' :
                  trace.status === 'error' ? 'text-red-400' :
                  trace.status === 'running' ? 'text-yellow-400' :
                  'text-gray-500'
                }`}>
                  {trace.status}
                </span>
              </div>
              <div className="text-[9px] text-gray-500 mb-1">Input: {trace.input}</div>
              {trace.output && (
                <div className="text-[9px] text-gray-400">Output: {trace.output}</div>
              )}
              <div className="text-[8px] text-gray-600 mt-1">{trace.timestamp}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
