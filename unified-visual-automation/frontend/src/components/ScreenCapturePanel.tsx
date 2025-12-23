// frontend/src/components/ScreenCapturePanel.tsx
import React, { useState, useRef, useEffect } from 'react';
import { DetectedElement, Platform } from '../../../shared/types/automation.types';

interface ScreenCapturePanelProps {
  platform: Platform;
  onScreenshot: (screenshot: string) => void;
  onElementSelect: (element: DetectedElement) => void;
  selectedElement: DetectedElement | null;
}

export const ScreenCapturePanel: React.FC<ScreenCapturePanelProps> = ({
  platform,
  onScreenshot,
  onElementSelect,
  selectedElement,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [screenshot, setScreenshot] = useState<string | null>(null);
  const [elements, setElements] = useState<DetectedElement[]>([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [hoveredElement, setHoveredElement] = useState<DetectedElement | null>(null);

  const captureScreenshot = async () => {
    setIsCapturing(true);
    try {
      let screenshotData: string;

      if (platform === 'web') {
        // Use Factif AI backend for web screenshots
        const response = await fetch('/api/actions/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actionId: 'web_screenshot',
            parameters: {},
            platform: 'web',
          }),
        });
        const result = await response.json();
        screenshotData = result.result.screenshot;
      } else {
        // Use OpenInterface for desktop screenshots
        const response = await fetch('/api/actions/execute', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            actionId: 'desktop_screenshot',
            parameters: {},
            platform: 'desktop',
          }),
        });
        const result = await response.json();
        screenshotData = result.result.screenshot;
      }

      setScreenshot(screenshotData);
      onScreenshot(screenshotData);

      // Detect elements in the screenshot
      await detectElements(screenshotData);
    } catch (error) {
      console.error('Screenshot capture failed:', error);
    } finally {
      setIsCapturing(false);
    }
  };

  const detectElements = async (screenshotData: string) => {
    try {
      const response = await fetch('/api/elements/detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform,
          screenshot: screenshotData,
        }),
      });
      const result = await response.json();
      setElements(result.elements);
    } catch (error) {
      console.error('Element detection failed:', error);
    }
  };

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!screenshot) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find element at click position
    const clickedElement = elements.find(element =>
      x >= element.coordinates.x &&
      x <= element.coordinates.x + element.coordinates.width &&
      y >= element.coordinates.y &&
      y <= element.coordinates.y + element.coordinates.height
    );

    if (clickedElement) {
      onElementSelect(clickedElement);
    }
  };

  const handleCanvasMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (!screenshot) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Find hovered element
    const hovered = elements.find(element =>
      x >= element.coordinates.x &&
      x <= element.coordinates.x + element.coordinates.width &&
      y >= element.coordinates.y &&
      y <= element.coordinates.y + element.coordinates.height
    );

    setHoveredElement(hovered || null);
  };

  useEffect(() => {
    if (screenshot && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        // Draw element overlays
        elements.forEach(element => {
          const isSelected = selectedElement?.id === element.id;
          const isHovered = hoveredElement?.id === element.id;

          if (isSelected || isHovered) {
            ctx.strokeStyle = isSelected ? '#3b82f6' : '#f59e0b';
            ctx.lineWidth = isSelected ? 3 : 2;
            ctx.strokeRect(
              element.coordinates.x,
              element.coordinates.y,
              element.coordinates.width,
              element.coordinates.height
            );

            // Draw label
            ctx.fillStyle = isSelected ? '#3b82f6' : '#f59e0b';
            ctx.fillRect(element.coordinates.x, element.coordinates.y - 20, 100, 20);
            ctx.fillStyle = 'white';
            ctx.font = '12px Arial';
            ctx.fillText(
              element.type,
              element.coordinates.x + 5,
              element.coordinates.y - 5
            );
          }
        });
      };
      img.src = `data:image/png;base64,${screenshot}`;
    }
  }, [screenshot, elements, selectedElement, hoveredElement]);

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Screen Capture</h2>
        <button
          onClick={captureScreenshot}
          disabled={isCapturing}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {isCapturing ? 'Capturing...' : 'Capture Screen'}
        </button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        {screenshot ? (
          <canvas
            ref={canvasRef}
            onClick={handleCanvasClick}
            onMouseMove={handleCanvasMouseMove}
            className="max-w-full cursor-crosshair"
            style={{ maxHeight: '400px' }}
          />
        ) : (
          <div className="h-64 flex items-center justify-center text-gray-500">
            No screenshot captured
          </div>
        )}
      </div>

      {elements.length > 0 && (
        <div className="mt-4">
          <h3 className="font-medium mb-2">Detected Elements ({elements.length})</h3>
          <div className="max-h-32 overflow-y-auto">
            {elements.map(element => (
              <div
                key={element.id}
                className={`p-2 border rounded cursor-pointer ${
                  selectedElement?.id === element.id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => onElementSelect(element)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium capitalize">{element.type}</span>
                  <span className="text-sm text-gray-500">
                    {Math.round(element.confidence * 100)}%
                  </span>
                </div>
                {element.properties.text && (
                  <div className="text-sm text-gray-600 truncate">
                    {element.properties.text}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};