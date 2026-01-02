import {
  Button,
  Coordinates,
  Press,
  ComputerToolUseContentBlock,
  ToolResultContentBlock,
  MessageContentType,
  isScreenshotToolUseBlock,
  isCursorPositionToolUseBlock,
  isMoveMouseToolUseBlock,
  isTraceMouseToolUseBlock,
  isClickMouseToolUseBlock,
  isPressMouseToolUseBlock,
  isDragMouseToolUseBlock,
  isScrollToolUseBlock,
  isTypeKeysToolUseBlock,
  isPressKeysToolUseBlock,
  isTypeTextToolUseBlock,
  isWaitToolUseBlock,
  isApplicationToolUseBlock,
  isPasteTextToolUseBlock,
  isReadFileToolUseBlock,
} from '@bytebot/shared';
import { Logger } from '@nestjs/common';

const DEFAULT_DESKTOP_BASE_URL =
  process.env.BYTEBOT_DESKTOP_BASE_URL || 'http://localhost:9990';
const REQUIRE_SESSION_ID = process.env.BYTEBOT_REQUIRE_SESSION_ID === 'true';

export async function handleComputerToolUse(
  block: ComputerToolUseContentBlock,
  logger: Logger,
  resolveBaseUrl?: (sessionId?: string) => Promise<string | null>,
): Promise<ToolResultContentBlock> {
  logger.debug(
    `Handling computer tool use: ${block.name}, tool_use_id: ${block.id}`,
  );

  const sessionId = (block.input as { session_id?: string } | undefined)?.session_id;
  const resolvedUrl = resolveBaseUrl ? await resolveBaseUrl(sessionId) : null;
  const baseUrl = resolvedUrl || DEFAULT_DESKTOP_BASE_URL;

  if (REQUIRE_SESSION_ID && !sessionId) {
    return {
      type: MessageContentType.ToolResult,
      tool_use_id: block.id,
      content: [
        {
          type: MessageContentType.Text,
          text: 'ERROR: session_id is required for computer tool calls.',
        },
      ],
      is_error: true,
    };
  }

  if (REQUIRE_SESSION_ID && sessionId && resolveBaseUrl && !resolvedUrl) {
    return {
      type: MessageContentType.ToolResult,
      tool_use_id: block.id,
      content: [
        {
          type: MessageContentType.Text,
          text: `ERROR: Unknown session_id ${sessionId || '(missing)'}.`,
        },
      ],
      is_error: true,
    };
  }

  if (isScreenshotToolUseBlock(block)) {
    logger.debug('Processing screenshot request');
    try {
      logger.debug('Taking screenshot');
      const image = await screenshot(baseUrl);
      logger.debug('Screenshot captured successfully');

      return {
        type: MessageContentType.ToolResult,
        tool_use_id: block.id,
        content: [
          {
            type: MessageContentType.Image,
            source: {
              data: image,
              media_type: 'image/png',
              type: 'base64',
            },
          },
        ],
      };
    } catch (error) {
      logger.error(`Screenshot failed: ${error.message}`, error.stack);
      return {
        type: MessageContentType.ToolResult,
        tool_use_id: block.id,
        content: [
          {
            type: MessageContentType.Text,
            text: 'ERROR: Failed to take screenshot',
          },
        ],
        is_error: true,
      };
    }
  }

  if (isCursorPositionToolUseBlock(block)) {
    logger.debug('Processing cursor position request');
    try {
      logger.debug('Getting cursor position');
      const position = await cursorPosition(baseUrl);
      logger.debug(`Cursor position obtained: ${position.x}, ${position.y}`);

      return {
        type: MessageContentType.ToolResult,
        tool_use_id: block.id,
        content: [
          {
            type: MessageContentType.Text,
            text: `Cursor position: ${position.x}, ${position.y}`,
          },
        ],
      };
    } catch (error) {
      logger.error(
        `Getting cursor position failed: ${error.message}`,
        error.stack,
      );
      return {
        type: MessageContentType.ToolResult,
        tool_use_id: block.id,
        content: [
          {
            type: MessageContentType.Text,
            text: 'ERROR: Failed to get cursor position',
          },
        ],
        is_error: true,
      };
    }
  }

  try {
    if (isMoveMouseToolUseBlock(block)) {
      await moveMouse(baseUrl, block.input);
    }
    if (isTraceMouseToolUseBlock(block)) {
      await traceMouse(baseUrl, block.input);
    }
    if (isClickMouseToolUseBlock(block)) {
      await clickMouse(baseUrl, block.input);
    }
    if (isPressMouseToolUseBlock(block)) {
      await pressMouse(baseUrl, block.input);
    }
    if (isDragMouseToolUseBlock(block)) {
      await dragMouse(baseUrl, block.input);
    }
    if (isScrollToolUseBlock(block)) {
      await scroll(baseUrl, block.input);
    }
    if (isTypeKeysToolUseBlock(block)) {
      await typeKeys(baseUrl, block.input);
    }
    if (isPressKeysToolUseBlock(block)) {
      await pressKeys(baseUrl, block.input);
    }
    if (isTypeTextToolUseBlock(block)) {
      await typeText(baseUrl, block.input);
    }
    if (isPasteTextToolUseBlock(block)) {
      await pasteText(baseUrl, block.input);
    }
    if (isWaitToolUseBlock(block)) {
      await wait(baseUrl, block.input);
    }
    if (isApplicationToolUseBlock(block)) {
      await application(baseUrl, block.input);
    }
    if (isReadFileToolUseBlock(block)) {
      logger.debug(`Reading file: ${block.input.path}`);
      const result = await readFile(baseUrl, block.input);

      if (result.success && result.data) {
        // Return document content block
        return {
          type: MessageContentType.ToolResult,
          tool_use_id: block.id,
          content: [
            {
              type: MessageContentType.Document,
              source: {
                type: 'base64',
                media_type: result.mediaType || 'application/octet-stream',
                data: result.data,
              },
              name: result.name || 'file',
              size: result.size,
            },
          ],
        };
      } else {
        // Return error message
        return {
          type: MessageContentType.ToolResult,
          tool_use_id: block.id,
          content: [
            {
              type: MessageContentType.Text,
              text: result.message || 'Error reading file',
            },
          ],
          is_error: true,
        };
      }
    }

    let image: string | null = null;
    try {
      // Wait before taking screenshot to allow UI to settle
      const delayMs = 750; // 750ms delay
      logger.debug(`Waiting ${delayMs}ms before taking screenshot`);
      await new Promise((resolve) => setTimeout(resolve, delayMs));

      logger.debug('Taking screenshot');
      image = await screenshot(baseUrl);
      logger.debug('Screenshot captured successfully');
    } catch (error) {
      logger.error('Failed to take screenshot', error);
    }

    logger.debug(`Tool execution successful for tool_use_id: ${block.id}`);
    const toolResult: ToolResultContentBlock = {
      type: MessageContentType.ToolResult,
      tool_use_id: block.id,
      content: [
        {
          type: MessageContentType.Text,
          text: 'Tool executed successfully',
        },
      ],
    };

    if (image) {
      toolResult.content.push({
        type: MessageContentType.Image,
        source: {
          data: image,
          media_type: 'image/png',
          type: 'base64',
        },
      });
    }

    return toolResult;
  } catch (error) {
    logger.error(
      `Error executing ${block.name} tool: ${error.message}`,
      error.stack,
    );
    return {
      type: MessageContentType.ToolResult,
      tool_use_id: block.id,
      content: [
        {
          type: MessageContentType.Text,
          text: `Error executing ${block.name} tool: ${error.message}`,
        },
      ],
      is_error: true,
    };
  }
}

async function moveMouse(
  baseUrl: string,
  input: { coordinates: Coordinates },
): Promise<void> {
  const { coordinates } = input;
  console.log(
    `Moving mouse to coordinates: [${coordinates.x}, ${coordinates.y}]`,
  );

  try {
    await fetch(`${baseUrl}/computer-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'move_mouse',
        coordinates,
      }),
    });
  } catch (error) {
    console.error('Error in move_mouse action:', error);
    throw error;
  }
}

async function traceMouse(
  baseUrl: string,
  input: {
    path: Coordinates[];
    holdKeys?: string[];
  },
): Promise<void> {
  const { path, holdKeys } = input;
  console.log(
    `Tracing mouse to path: ${path} ${holdKeys ? `with holdKeys: ${holdKeys}` : ''}`,
  );

  try {
    await fetch(`${baseUrl}/computer-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'trace_mouse',
        path,
        holdKeys,
      }),
    });
  } catch (error) {
    console.error('Error in trace_mouse action:', error);
    throw error;
  }
}

async function clickMouse(
  baseUrl: string,
  input: {
    coordinates?: Coordinates;
    button: Button;
    holdKeys?: string[];
    clickCount: number;
  },
): Promise<void> {
  const { coordinates, button, holdKeys, clickCount } = input;
  console.log(
    `Clicking mouse ${button} ${clickCount} times ${coordinates ? `at coordinates: [${coordinates.x}, ${coordinates.y}] ` : ''} ${holdKeys ? `with holdKeys: ${holdKeys}` : ''}`,
  );

  try {
    await fetch(`${baseUrl}/computer-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'click_mouse',
        coordinates,
        button,
        holdKeys: holdKeys && holdKeys.length > 0 ? holdKeys : undefined,
        clickCount,
      }),
    });
  } catch (error) {
    console.error('Error in click_mouse action:', error);
    throw error;
  }
}

async function pressMouse(
  baseUrl: string,
  input: {
    coordinates?: Coordinates;
    button: Button;
    press: Press;
  },
): Promise<void> {
  const { coordinates, button, press } = input;
  console.log(
    `Pressing mouse ${button} ${press} ${coordinates ? `at coordinates: [${coordinates.x}, ${coordinates.y}]` : ''}`,
  );

  try {
    await fetch(`${baseUrl}/computer-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'press_mouse',
        coordinates,
        button,
        press,
      }),
    });
  } catch (error) {
    console.error('Error in press_mouse action:', error);
    throw error;
  }
}

async function dragMouse(
  baseUrl: string,
  input: {
    path: Coordinates[];
    button: Button;
    holdKeys?: string[];
  },
): Promise<void> {
  const { path, button, holdKeys } = input;
  console.log(
    `Dragging mouse to path: ${path} ${holdKeys ? `with holdKeys: ${holdKeys}` : ''}`,
  );

  try {
    await fetch(`${baseUrl}/computer-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'drag_mouse',
        path,
        button,
        holdKeys: holdKeys && holdKeys.length > 0 ? holdKeys : undefined,
      }),
    });
  } catch (error) {
    console.error('Error in drag_mouse action:', error);
    throw error;
  }
}

async function scroll(
  baseUrl: string,
  input: {
    coordinates?: Coordinates;
    direction: 'up' | 'down' | 'left' | 'right';
    scrollCount: number;
    holdKeys?: string[];
  },
): Promise<void> {
  const { coordinates, direction, scrollCount, holdKeys } = input;
  console.log(
    `Scrolling ${direction} ${scrollCount} times ${coordinates ? `at coordinates: [${coordinates.x}, ${coordinates.y}]` : ''}`,
  );

  try {
    await fetch(`${baseUrl}/computer-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'scroll',
        coordinates,
        direction,
        scrollCount,
        holdKeys: holdKeys && holdKeys.length > 0 ? holdKeys : undefined,
      }),
    });
  } catch (error) {
    console.error('Error in scroll action:', error);
    throw error;
  }
}

async function typeKeys(
  baseUrl: string,
  input: {
    keys: string[];
    delay?: number;
  },
): Promise<void> {
  const { keys, delay } = input;
  console.log(`Typing keys: ${keys}`);

  try {
    await fetch(`${baseUrl}/computer-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'type_keys',
        keys,
        delay,
      }),
    });
  } catch (error) {
    console.error('Error in type_keys action:', error);
    throw error;
  }
}

async function pressKeys(
  baseUrl: string,
  input: {
    keys: string[];
    press: Press;
  },
): Promise<void> {
  const { keys, press } = input;
  console.log(`Pressing keys: ${keys}`);

  try {
    await fetch(`${baseUrl}/computer-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'press_keys',
        keys,
        press,
      }),
    });
  } catch (error) {
    console.error('Error in press_keys action:', error);
    throw error;
  }
}

async function typeText(
  baseUrl: string,
  input: {
    text: string;
    delay?: number;
  },
): Promise<void> {
  const { text, delay } = input;
  console.log(`Typing text: ${text}`);

  try {
    await fetch(`${baseUrl}/computer-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'type_text',
        text,
        delay,
      }),
    });
  } catch (error) {
    console.error('Error in type_text action:', error);
    throw error;
  }
}

async function pasteText(
  baseUrl: string,
  input: { text: string },
): Promise<void> {
  const { text } = input;
  console.log(`Pasting text: ${text}`);

  try {
    await fetch(`${baseUrl}/computer-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'paste_text',
        text,
      }),
    });
  } catch (error) {
    console.error('Error in paste_text action:', error);
    throw error;
  }
}

async function wait(
  baseUrl: string,
  input: { duration: number },
): Promise<void> {
  const { duration } = input;
  console.log(`Waiting for ${duration}ms`);

  try {
    await fetch(`${baseUrl}/computer-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'wait',
        duration,
      }),
    });
  } catch (error) {
    console.error('Error in wait action:', error);
    throw error;
  }
}

async function cursorPosition(baseUrl: string): Promise<Coordinates> {
  console.log('Getting cursor position');

  try {
    const response = await fetch(`${baseUrl}/computer-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'cursor_position',
      }),
    });

    const data = await response.json();
    return { x: data.x, y: data.y };
  } catch (error) {
    console.error('Error in cursor_position action:', error);
    throw error;
  }
}

async function screenshot(baseUrl: string): Promise<string> {
  console.log('Taking screenshot');

  try {
    const requestBody = {
      action: 'screenshot',
    };

    const response = await fetch(`${baseUrl}/computer-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      throw new Error(`Failed to take screenshot: ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.image) {
      throw new Error('Failed to take screenshot: No image data received');
    }

    return data.image; // Base64 encoded image
  } catch (error) {
    console.error('Error in screenshot action:', error);
    throw error;
  }
}

async function application(
  baseUrl: string,
  input: { application: string },
): Promise<void> {
  const { application } = input;
  console.log(`Opening application: ${application}`);

  try {
    await fetch(`${baseUrl}/computer-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'application',
        application,
      }),
    });
  } catch (error) {
    console.error('Error in application action:', error);
    throw error;
  }
}

async function readFile(
  baseUrl: string,
  input: { path: string },
): Promise<{
  success: boolean;
  data?: string;
  name?: string;
  size?: number;
  mediaType?: string;
  message?: string;
}> {
  const { path } = input;
  console.log(`Reading file: ${path}`);

  try {
    const response = await fetch(`${baseUrl}/computer-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'read_file',
        path,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to read file: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in read_file action:', error);
    return {
      success: false,
      message: `Error reading file: ${error.message}`,
    };
  }
}

export async function writeFile(
  input: {
    path: string;
    content: string;
  },
  baseUrl: string = DEFAULT_DESKTOP_BASE_URL,
): Promise<{ success: boolean; message?: string }> {
  const { path, content } = input;
  console.log(`Writing file: ${path}`);

  try {
    // Content is always base64 encoded
    const base64Data = content;

    const response = await fetch(`${baseUrl}/computer-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'write_file',
        path,
        data: base64Data,
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to write file: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error in write_file action:', error);
    return {
      success: false,
      message: `Error writing file: ${error.message}`,
    };
  }
}
