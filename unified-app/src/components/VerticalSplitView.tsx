import React, { useState, useRef, useCallback } from 'react';
import { ResizableBox } from 'react-resizable';
import 'react-resizable/css/styles.css';

interface PanelConfig {
  id: string;
  title: string;
  content: React.ReactNode;
  defaultHeight: number;
  minHeight: number;
  maxHeight?: number;
}

interface VerticalSplitViewProps {
  panels: PanelConfig[];
  className?: string;
  onPanelResize?: (panelId: string, newHeight: number) => void;
}

export function VerticalSplitView({
  panels,
  className = '',
  onPanelResize
}: VerticalSplitViewProps) {
  const [heights, setHeights] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    panels.forEach(panel => {
      initial[panel.id] = panel.defaultHeight;
    });
    return initial;
  });

  const containerRef = useRef<HTMLDivElement>(null);

  const handleResize = useCallback((panelId: string, _event: React.SyntheticEvent, { size }: any) => {
    setHeights(prev => ({
      ...prev,
      [panelId]: size.height
    }));
    onPanelResize?.(panelId, size.height);
  }, [onPanelResize]);

  return (
    <div
      ref={containerRef}
      className={`flex flex-col h-full bg-bg-primary ${className}`}
    >
      {panels.map((panel, index) => {
        const isLast = index === panels.length - 1;
        const height = heights[panel.id];

        return (
          <React.Fragment key={panel.id}>
            <div className="flex flex-col border-b border-border last:border-b-0">
              {/* Panel Header */}
              <div className="flex items-center justify-between px-4 py-2 bg-bg-secondary border-b border-border">
                <h3 className="text-sm font-semibold text-text-primary">
                  {panel.title}
                </h3>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 rounded-full bg-status-success" />
                  <span className="text-xs text-text-muted">Active</span>
                </div>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-hidden">
                {isLast ? (
                  // Last panel fills remaining space
                  <div className="h-full">
                    {panel.content}
                  </div>
                ) : (
                  // Resizable panels (except last one)
                  <ResizableBox
                    width={Infinity}
                    height={height}
                    minConstraints={[100, panel.minHeight]}
                    maxConstraints={panel.maxHeight ? [Infinity, panel.maxHeight] : [Infinity, Infinity]}
                    resizeHandles={['s']}
                    onResize={handleResize.bind(null, panel.id)}
                    className="relative"
                  >
                    <div className="h-full overflow-hidden">
                      {panel.content}
                    </div>
                  </ResizableBox>
                )}
              </div>
            </div>

            {/* Resize Handle (except for last panel) */}
            {!isLast && (
              <div className="h-2 bg-bg-tertiary border-t border-b border-border cursor-ns-resize hover:bg-accent-primary transition-colors">
                <div className="flex justify-center items-center h-full">
                  <div className="w-8 h-0.5 bg-border-color rounded-full" />
                </div>
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

export default VerticalSplitView;