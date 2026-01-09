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
  MessageContentBlock,
} from '@bytebot/shared';
import { Logger } from '@nestjs/common';
import { DEFAULT_DISPLAY_SIZE } from './agent.constants';

const DEFAULT_DESKTOP_BASE_URL =
  process.env.BYTEBOT_VNC_BRIDGE_URL ||
  process.env.BYTEBOT_DESKTOP_BASE_URL ||
  'http://localhost:9990';
const REQUIRE_SESSION_ID = process.env.BYTEBOT_REQUIRE_SESSION_ID === 'true';
const NORMALIZE_COORDS =
  process.env.BYTEBOT_NORMALIZE_COORDS === 'true' ||
  process.env.BYTEBOT_SMOLAGENTS_MODE === 'true';
const OMNIPARSER_ENABLED = process.env.OMNIPARSER_ENABLED === 'true';
const OMNIPARSER_BASE_URL =
  process.env.OMNIPARSER_BASE_URL || 'http://host.docker.internal:8001';
const OMNIPARSER_TIMEOUT_MS =
  Number(process.env.OMNIPARSER_TIMEOUT_MS) || 5000;
const OMNIPARSER_MAX_ELEMENTS =
  Number(process.env.OMNIPARSER_MAX_ELEMENTS) || 20;
const OMNIPARSER_PARSE_PATH = process.env.OMNIPARSER_PARSE_PATH || '/parse/';
const OMNIPARSER_MIN_INTERVAL_MS =
  Number(process.env.OMNIPARSER_MIN_INTERVAL_MS) || 0;
const COORDS_MAX = Number(process.env.BYTEBOT_COORDS_MAX) || 1000;
const DISPLAY_WIDTH =
  Number(process.env.BYTEBOT_DESKTOP_WIDTH) || DEFAULT_DISPLAY_SIZE.width;
const DISPLAY_HEIGHT =
  Number(process.env.BYTEBOT_DESKTOP_HEIGHT) || DEFAULT_DISPLAY_SIZE.height;
let lastOmniParserAt = 0;

const normalizeBaseUrl = (baseUrl: string): string =>
  baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;

const truncateText = (text: string, maxLength: number): string =>
  text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;

const parseWithOmniParser = async (
  imageBase64: string,
  logger: Logger,
): Promise<{ summaryText: string; annotatedImage?: string } | null> => {
  if (!OMNIPARSER_ENABLED) return null;
  if (OMNIPARSER_MIN_INTERVAL_MS > 0) {
    const now = Date.now();
    if (now - lastOmniParserAt < OMNIPARSER_MIN_INTERVAL_MS) {
      logger.debug('OmniParser throttled to reduce CPU usage');
      return null;
    }
    lastOmniParserAt = now;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), OMNIPARSER_TIMEOUT_MS);

  try {
    const response = await fetch(
      `${normalizeBaseUrl(OMNIPARSER_BASE_URL)}${OMNIPARSER_PARSE_PATH}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ base64_image: imageBase64 }),
        signal: controller.signal,
      },
    );

    if (!response.ok) {
      logger.warn(`OmniParser request failed: ${response.status}`);
      return null;
    }

    const data = (await response.json()) as {
      parsed_content_list?: unknown;
      som_image_base64?: string;
      latency?: number;
    };

    const parsedList = Array.isArray(data.parsed_content_list)
      ? data.parsed_content_list
      : [];
    const limited = parsedList.slice(0, OMNIPARSER_MAX_ELEMENTS);
    const summary = truncateText(JSON.stringify(limited), 2000);
    const latencyMs =
      typeof data.latency === 'number'
        ? Math.round(data.latency * 1000)
        : undefined;
    const summaryText = latencyMs
      ? `OmniParser (${latencyMs}ms): ${summary}`
      : `OmniParser: ${summary}`;

    return {
      summaryText,
      annotatedImage: data.som_image_base64,
    };
  } catch (error) {
    logger.warn(
      `OmniParser request error: ${error instanceof Error ? error.message : error}`,
    );
    return null;
  } finally {
    clearTimeout(timeoutId);
  }
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(max, Math.max(min, value));

const normalizeCoordinates = (
  coordinates?: Coordinates,
): Coordinates | undefined => {
  if (!coordinates || !NORMALIZE_COORDS) return coordinates;
  return {
    x: Math.round(
      (clamp(coordinates.x, 0, COORDS_MAX) / COORDS_MAX) * DISPLAY_WIDTH,
    ),
    y: Math.round(
      (clamp(coordinates.y, 0, COORDS_MAX) / COORDS_MAX) * DISPLAY_HEIGHT,
    ),
  };
};

const normalizePath = (path?: Coordinates[]): Coordinates[] | undefined => {
  if (!path || !NORMALIZE_COORDS) return path;
  return path.map((point) => normalizeCoordinates(point) || point);
};

const withSessionId = <T extends Record<string, any>>(
  payload: T,
  sessionId?: string,
): T & { session_id?: string } => {
  if (!sessionId) return payload;
  return { ...payload, session_id: sessionId };
};

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
      const image = await screenshot(baseUrl, sessionId);
      logger.debug('Screenshot captured successfully');
      const omniparserResult = await parseWithOmniParser(image, logger);

      const content: MessageContentBlock[] = [];
      if (omniparserResult?.summaryText) {
        content.push({
          type: MessageContentType.Text,
          text: omniparserResult.summaryText,
        });
      }
      content.push({
        type: MessageContentType.Image,
        source: {
          data: image,
          media_type: 'image/png',
          type: 'base64',
        },
      });
      if (omniparserResult?.annotatedImage) {
        content.push({
          type: MessageContentType.Image,
          source: {
            data: omniparserResult.annotatedImage,
            media_type: 'image/png',
            type: 'base64',
          },
        });
      }

      return {
        type: MessageContentType.ToolResult,
        tool_use_id: block.id,
        content,
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
      await moveMouse(baseUrl, block.input, sessionId);
    }
    if (isTraceMouseToolUseBlock(block)) {
      await traceMouse(baseUrl, block.input, sessionId);
    }
    if (isClickMouseToolUseBlock(block)) {
      await clickMouse(baseUrl, block.input, sessionId);
    }
    if (isPressMouseToolUseBlock(block)) {
      await pressMouse(baseUrl, block.input, sessionId);
    }
    if (isDragMouseToolUseBlock(block)) {
      await dragMouse(baseUrl, block.input, sessionId);
    }
    if (isScrollToolUseBlock(block)) {
      await scroll(baseUrl, block.input, sessionId);
    }
    if (isTypeKeysToolUseBlock(block)) {
      await typeKeys(baseUrl, block.input, sessionId);
    }
    if (isPressKeysToolUseBlock(block)) {
      await pressKeys(baseUrl, block.input, sessionId);
    }
    if (isTypeTextToolUseBlock(block)) {
      await typeText(baseUrl, block.input, sessionId);
    }
    if (isPasteTextToolUseBlock(block)) {
      await pasteText(baseUrl, block.input, sessionId);
    }
    if (isWaitToolUseBlock(block)) {
      await wait(baseUrl, block.input, sessionId);
    }
    if (isApplicationToolUseBlock(block)) {
      await application(baseUrl, block.input, sessionId);
    }
    if (isReadFileToolUseBlock(block)) {
      logger.debug(`Reading file: ${block.input.path}`);
      const result = await readFile(baseUrl, block.input, sessionId);

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
      image = await screenshot(baseUrl, sessionId);
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
      const omniparserResult = await parseWithOmniParser(image, logger);
      if (omniparserResult?.summaryText) {
        toolResult.content.push({
          type: MessageContentType.Text,
          text: omniparserResult.summaryText,
        });
      }
      toolResult.content.push({
        type: MessageContentType.Image,
        source: {
          data: image,
          media_type: 'image/png',
          type: 'base64',
        },
      });
      if (omniparserResult?.annotatedImage) {
        toolResult.content.push({
          type: MessageContentType.Image,
          source: {
            data: omniparserResult.annotatedImage,
            media_type: 'image/png',
            type: 'base64',
          },
        });
      }
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
  sessionId?: string,
): Promise<void> {
  const coordinates = normalizeCoordinates(input.coordinates) || input.coordinates;
  console.log(
    `Moving mouse to coordinates: [${coordinates.x}, ${coordinates.y}]`,
  );

  try {
    await fetch(`${baseUrl}/computer-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        withSessionId(
          {
            action: 'move_mouse',
            coordinates,
          },
          sessionId,
        ),
      ),
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
  sessionId?: string,
): Promise<void> {
  const path = normalizePath(input.path) || input.path;
  const { holdKeys } = input;
  console.log(
    `Tracing mouse to path: ${path} ${holdKeys ? `with holdKeys: ${holdKeys}` : ''}`,
  );

  try {
    await fetch(`${baseUrl}/computer-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        withSessionId(
          {
            action: 'trace_mouse',
            path,
            holdKeys,
          },
          sessionId,
        ),
      ),
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
  sessionId?: string,
): Promise<void> {
  const { button, holdKeys, clickCount } = input;
  const coordinates =
    normalizeCoordinates(input.coordinates) || input.coordinates;
  console.log(
    `Clicking mouse ${button} ${clickCount} times ${coordinates ? `at coordinates: [${coordinates.x}, ${coordinates.y}] ` : ''} ${holdKeys ? `with holdKeys: ${holdKeys}` : ''}`,
  );

  try {
    await fetch(`${baseUrl}/computer-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        withSessionId(
          {
            action: 'click_mouse',
            coordinates,
            button,
            holdKeys: holdKeys && holdKeys.length > 0 ? holdKeys : undefined,
            clickCount,
          },
          sessionId,
        ),
      ),
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
  sessionId?: string,
): Promise<void> {
  const { button, press } = input;
  const coordinates =
    normalizeCoordinates(input.coordinates) || input.coordinates;
  console.log(
    `Pressing mouse ${button} ${press} ${coordinates ? `at coordinates: [${coordinates.x}, ${coordinates.y}]` : ''}`,
  );

  try {
    await fetch(`${baseUrl}/computer-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        withSessionId(
          {
            action: 'press_mouse',
            coordinates,
            button,
            press,
          },
          sessionId,
        ),
      ),
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
  sessionId?: string,
): Promise<void> {
  const path = normalizePath(input.path) || input.path;
  const { button, holdKeys } = input;
  console.log(
    `Dragging mouse to path: ${path} ${holdKeys ? `with holdKeys: ${holdKeys}` : ''}`,
  );

  try {
    await fetch(`${baseUrl}/computer-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        withSessionId(
          {
            action: 'drag_mouse',
            path,
            button,
            holdKeys: holdKeys && holdKeys.length > 0 ? holdKeys : undefined,
          },
          sessionId,
        ),
      ),
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
  sessionId?: string,
): Promise<void> {
  const { direction, scrollCount, holdKeys } = input;
  const coordinates =
    normalizeCoordinates(input.coordinates) || input.coordinates;
  console.log(
    `Scrolling ${direction} ${scrollCount} times ${coordinates ? `at coordinates: [${coordinates.x}, ${coordinates.y}]` : ''}`,
  );

  try {
    await fetch(`${baseUrl}/computer-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        withSessionId(
          {
            action: 'scroll',
            coordinates,
            direction,
            scrollCount,
            holdKeys: holdKeys && holdKeys.length > 0 ? holdKeys : undefined,
          },
          sessionId,
        ),
      ),
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
  sessionId?: string,
): Promise<void> {
  const { keys, delay } = input;
  console.log(`Typing keys: ${keys}`);

  try {
    await fetch(`${baseUrl}/computer-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        withSessionId(
          {
            action: 'type_keys',
            keys,
            delay,
          },
          sessionId,
        ),
      ),
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
  sessionId?: string,
): Promise<void> {
  const { keys, press } = input;
  console.log(`Pressing keys: ${keys}`);

  try {
    await fetch(`${baseUrl}/computer-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        withSessionId(
          {
            action: 'press_keys',
            keys,
            press,
          },
          sessionId,
        ),
      ),
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
  sessionId?: string,
): Promise<void> {
  const { text, delay } = input;
  console.log(`Typing text: ${text}`);

  try {
    await fetch(`${baseUrl}/computer-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        withSessionId(
          {
            action: 'type_text',
            text,
            delay,
          },
          sessionId,
        ),
      ),
    });
  } catch (error) {
    console.error('Error in type_text action:', error);
    throw error;
  }
}

async function pasteText(
  baseUrl: string,
  input: { text: string },
  sessionId?: string,
): Promise<void> {
  const { text } = input;
  console.log(`Pasting text: ${text}`);

  try {
    await fetch(`${baseUrl}/computer-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        withSessionId(
          {
            action: 'paste_text',
            text,
          },
          sessionId,
        ),
      ),
    });
  } catch (error) {
    console.error('Error in paste_text action:', error);
    throw error;
  }
}

async function wait(
  baseUrl: string,
  input: { duration: number },
  sessionId?: string,
): Promise<void> {
  const { duration } = input;
  console.log(`Waiting for ${duration}ms`);

  try {
    await fetch(`${baseUrl}/computer-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        withSessionId(
          {
            action: 'wait',
            duration,
          },
          sessionId,
        ),
      ),
    });
  } catch (error) {
    console.error('Error in wait action:', error);
    throw error;
  }
}

async function cursorPosition(
  baseUrl: string,
  sessionId?: string,
): Promise<Coordinates> {
  console.log('Getting cursor position');

  try {
    const response = await fetch(`${baseUrl}/computer-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        withSessionId(
          {
            action: 'cursor_position',
          },
          sessionId,
        ),
      ),
    });

    const data = await response.json();
    return { x: data.x, y: data.y };
  } catch (error) {
    console.error('Error in cursor_position action:', error);
    throw error;
  }
}

async function screenshot(baseUrl: string, sessionId?: string): Promise<string> {
  console.log('Taking screenshot');

  try {
    const requestBody = withSessionId(
      {
        action: 'screenshot',
      },
      sessionId,
    );

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
  sessionId?: string,
): Promise<void> {
  const { application } = input;
  console.log(`Opening application: ${application}`);

  try {
    await fetch(`${baseUrl}/computer-use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(
        withSessionId(
          {
            action: 'application',
            application,
          },
          sessionId,
        ),
      ),
    });
  } catch (error) {
    console.error('Error in application action:', error);
    throw error;
  }
}

async function readFile(
  baseUrl: string,
  input: { path: string },
  sessionId?: string,
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
      body: JSON.stringify(
        withSessionId(
          {
            action: 'read_file',
            path,
          },
          sessionId,
        ),
      ),
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
