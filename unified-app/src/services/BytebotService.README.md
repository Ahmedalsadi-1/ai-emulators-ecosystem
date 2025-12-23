# BytebotService API Wrapper

The `BytebotService` provides a standardized API wrapper for the Bytebot computer control service, enabling comprehensive computer automation through REST endpoints and natural language commands.

## Overview

BytebotService integrates with the running Bytebot container to provide clean, type-safe methods for:

- **Mouse Control**: Move, click, drag, scroll operations
- **Keyboard Input**: Type text, press keys, key combinations
- **Screen Capture**: Take screenshots with base64 encoding
- **Application Management**: Open, close, switch applications
- **File Operations**: Read and write files with base64 encoding
- **Cursor Tracking**: Get current cursor position

## Architecture

The service follows the TuriX unified service pattern with:

- **RESTful API Communication**: Axios-based HTTP client with error handling
- **TypeScript Interfaces**: Strongly typed request/response objects
- **Natural Language Processing**: Command parsing for voice/text input
- **Service Registration**: TuriX ecosystem integration
- **Error Handling**: Comprehensive error management with custom exceptions

## Installation & Setup

```typescript
import BytebotService from './services/BytebotService';

// Initialize with default Bytebot endpoint
const bytebotService = new BytebotService();

// Or specify custom endpoint
const customService = new BytebotService('http://custom-host:9990');
```

## TuriX Integration

Register the service with TuriX:

```typescript
import { TuriX } from 'turix-core';
import BytebotService from './services/BytebotService';

// Register the service
TuriX.registerService(BytebotService.getServiceRegistration());
```

## API Reference

### Mouse Control

#### Move Mouse
```typescript
await bytebotService.moveMouse({ x: 100, y: 200 });
// Result: { success: true, message: "Mouse moved successfully" }
```

#### Click Mouse
```typescript
await bytebotService.clickMouse({
  coordinates: { x: 50, y: 75 },
  button: 'left', // 'left' | 'right' | 'middle'
  clickCount: 1,
  holdKeys: ['ctrl'] // optional modifier keys
});
// Result: { success: true, message: "left mouse click performed successfully" }
```

#### Drag Mouse
```typescript
await bytebotService.dragMouse({
  path: [{ x: 100, y: 100 }, { x: 200, y: 200 }],
  button: 'left',
  holdKeys: ['shift']
});
// Result: { success: true, message: "Mouse drag performed successfully" }
```

#### Scroll
```typescript
await bytebotService.scroll({
  coordinates: { x: 300, y: 400 },
  direction: 'down', // 'up' | 'down' | 'left' | 'right'
  scrollCount: 5,
  holdKeys: ['ctrl']
});
// Result: { success: true, message: "Scrolled down 5 times" }
```

### Keyboard Control

#### Type Text
```typescript
await bytebotService.typeText("Hello World", 50);
// Result: { success: true, message: "Typed text: \"Hello World\"" }
```

#### Press Keys
```typescript
await bytebotService.pressKeys(['ctrl', 'c'], 'down');
// Result: { success: true, message: "Keys down: ctrl,c" }
```

#### Type Keys with Delay
```typescript
await bytebotService.typeKeys(['h', 'e', 'l', 'l', 'o'], 100);
// Result: { success: true, message: "Typed keys: h,e,l,l,o" }
```

### Screen Capture

#### Take Screenshot
```typescript
const screenshot = await bytebotService.takeScreenshot();
// Result: { image: "base64encodedimage..." }
```

#### Get Cursor Position
```typescript
const position = await bytebotService.getCursorPosition();
// Result: { x: 150, y: 250 }
```

### Application Management

#### Open Application
```typescript
await bytebotService.openApplication('firefox');
// Supported apps: firefox, vscode, terminal, directory, desktop, thunderbird, 1password
// Result: { success: true, message: "Application firefox opened successfully" }
```

### File Operations

#### Write File
```typescript
const fileData = await bytebotService.writeFile('/path/to/file.txt', 'SGVsbG8gV29ybGQ='); // base64 encoded
// Result: { success: true, message: "File written successfully to: /path/to/file.txt" }
```

#### Read File
```typescript
const fileContent = await bytebotService.readFile('/path/to/file.txt');
// Result: {
//   success: true,
//   data: "SGVsbG8gV29ybGQ=", // base64 encoded
//   name: "file.txt",
//   size: 1024,
//   mediaType: "text/plain"
// }
```

### Utility Operations

#### Wait
```typescript
await bytebotService.wait(2000); // wait 2 seconds
// Result: { success: true, message: "Waited 2000ms" }
```

## Natural Language Commands

The service supports natural language processing for voice and text commands:

### Supported Commands

- **"take screenshot"** → Takes a screenshot
- **"move mouse to 100, 200"** → Moves mouse to coordinates
- **"click mouse at 50, 75"** → Performs left click
- **"right click at 25, 30"** → Performs right click
- **"double click at 10, 15"** → Performs double click
- **"type 'Hello World'"** → Types the specified text
- **"press key ctrl+c"** → Presses key combination
- **"open firefox"** → Opens Firefox browser
- **"scroll down"** → Scrolls down
- **"get cursor position"** → Returns cursor coordinates
- **"wait 2 seconds"** → Waits for specified duration

### Command Processing

```typescript
try {
  const result = await bytebotService.processCommand("take screenshot");
  console.log("Command executed:", result);
} catch (error) {
  console.error("Command failed:", error.message);
}
```

## Error Handling

The service includes comprehensive error handling:

```typescript
try {
  await bytebotService.takeScreenshot();
} catch (error) {
  if (error instanceof BytebotServiceError) {
    console.error("Bytebot service error:", error.message);
  } else {
    console.error("Unexpected error:", error);
  }
}
```

## Service Status

Check service health and status:

```typescript
// Get service status
const status = await bytebotService.getServiceStatus();

// Get health status
const health = await bytebotService.getHealthStatus();

// Get VNC URL for direct browser access
const vncUrl = bytebotService.getVncUrl(); // "http://localhost:9990/vnc"
```

## TypeScript Interfaces

### Core Types
```typescript
interface Coordinates {
  x: number;
  y: number;
}

type Button = "left" | "right" | "middle";
type Press = "up" | "down";
type Application = "firefox" | "vscode" | "terminal" | "directory" | "desktop" | "thunderbird" | "1password";

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

interface ScreenshotResponse {
  image: string; // Base64 encoded
}

interface CursorPositionResponse {
  x: number;
  y: number;
}

interface FileOperationResponse {
  success: boolean;
  message: string;
  name?: string;
  size?: number;
  mediaType?: string;
  data?: string; // Base64 encoded for reads
}
```

## Integration Examples

### React Component Integration
```tsx
import React, { useState } from 'react';
import BytebotService from '../services/BytebotService';

const ComputerControlPanel: React.FC = () => {
  const [screenshot, setScreenshot] = useState<string>('');
  const [cursorPos, setCursorPos] = useState<{x: number, y: number} | null>(null);

  const handleScreenshot = async () => {
    try {
      const result = await BytebotService.takeScreenshot();
      setScreenshot(result.image);
    } catch (error) {
      console.error('Screenshot failed:', error);
    }
  };

  const handleCursorPosition = async () => {
    try {
      const position = await BytebotService.getCursorPosition();
      setCursorPos(position);
    } catch (error) {
      console.error('Cursor position failed:', error);
    }
  };

  return (
    <div>
      <button onClick={handleScreenshot}>Take Screenshot</button>
      <button onClick={handleCursorPosition}>Get Cursor Position</button>

      {cursorPos && (
        <p>Cursor at: ({cursorPos.x}, {cursorPos.y})</p>
      )}

      {screenshot && (
        <img src={`data:image/png;base64,${screenshot}`} alt="Screenshot" />
      )}
    </div>
  );
};
```

### Voice Command Integration
```typescript
// Integrate with speech recognition
const handleVoiceCommand = async (transcript: string) => {
  try {
    const result = await BytebotService.processCommand(transcript.toLowerCase());
    console.log('Voice command executed:', result);
  } catch (error) {
    console.error('Voice command failed:', error.message);
  }
};
```

## Testing

Run the test suite:

```bash
npm test BytebotService.test.ts
```

## Dependencies

- **axios**: HTTP client for API communication
- **@bytebot/shared**: Shared types (optional, types defined locally if not available)

## Configuration

Default configuration:
- **Base URL**: `http://localhost:9990`
- **Timeout**: 10 seconds for computer operations
- **VNC Path**: `/vnc` endpoint for direct browser access

## Security Considerations

- All file operations are performed with sudo privileges on the Bytebot container
- Base64 encoding is used for file data transfer
- Network communication should be secured in production environments
- Consider rate limiting for API endpoints

## Troubleshooting

### Common Issues

1. **Connection refused**: Ensure Bytebot container is running on port 9990
2. **Application not found**: Check supported application names
3. **File permission errors**: Ensure proper file system permissions
4. **Screenshot failures**: Verify display environment is properly configured

### Debug Mode

Enable detailed logging:

```typescript
// Service logs are automatically enabled
// Check browser console for detailed error information
```

## Contributing

When extending the service:

1. Add new action types to the `ComputerAction` union
2. Implement corresponding methods following the existing pattern
3. Add natural language command parsing
4. Update TypeScript interfaces
5. Add comprehensive error handling
6. Update tests and documentation

## License

This service follows the same license as the TuriX ecosystem.