#!/usr/bin/env node
/**
 * KRONOS-OS Mobile MCP Server
 * 
 * Provides MCP tools for controlling Android emulator via ADB.
 * Designed for use with budtmo/docker-android container.
 * 
 * Available tools:
 * - android_take_screenshot
 * - android_tap
 * - android_type
 * - android_swipe
 * - android_press_button
 * - android_install_app
 * - android_open_app
 * - android_get_screen_size
 * - android_list_apps
 * 
 * Usage:
 *   npm start                    # Start MCP server
 *   npm run dev                  # Start with hot reload
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { spawn } from "child_process";
import { createInterface } from "readline";

const ADB_HOST = process.env.ADB_HOST || "localhost";
const ADB_PORT = parseInt(process.env.ADB_PORT || "5555");

// ADB command helper
async function runAdbCommand(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const proc = spawn("adb", [
      "-H", ADB_HOST,
      "-P", ADB_PORT.toString(),
      ...args
    ]);

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (data: Buffer) => {
      stdout += data.toString();
    });

    proc.stderr?.on("data", (data: Buffer) => {
      stderr += data.toString();
    });

    proc.on("close", (code: number | null) => {
      if (code === 0) {
        resolve(stdout);
      } else {
        reject(new Error(`ADB command failed: ${stderr}`));
      }
    });

    proc.on("error", (err: Error) => {
      reject(err);
    });
  });
}

// Connect to Android device via ADB TCPIP
async function connectAdb(): Promise<void> {
  try {
    await runAdbCommand(["connect", `${ADB_HOST}:${ADB_PORT}`]);
    console.log(`Connected to Android device at ${ADB_HOST}:${ADB_PORT}`);
  } catch (error) {
    console.warn(`Could not connect to ADB: ${error}`);
  }
}

// MCP Server instance
const server = new Server(
  {
    name: "kronos-android-mcp",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Tool definitions
const tools: Tool[] = [
  {
    name: "android_take_screenshot",
    description: "Take a screenshot of the Android device screen",
    inputSchema: {
      type: "object",
      properties: {
        saveTo: {
          type: "string",
          description: "File path to save the screenshot (optional, default: /tmp/screenshot.png)",
        },
      },
      required: [],
    },
  },
  {
    name: "android_tap",
    description: "Tap on the screen at specified coordinates",
    inputSchema: {
      type: "object",
      properties: {
        x: {
          type: "number",
          description: "X coordinate (pixels)",
        },
        y: {
          type: "number",
          description: "Y coordinate (pixels)",
        },
      },
      required: ["x", "y"],
    },
  },
  {
    name: "android_type",
    description: "Type text into the currently focused input field",
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "Text to type",
        },
        submit: {
          type: "boolean",
          description: "Whether to press Enter after typing (default: false)",
        },
      },
      required: ["text"],
    },
  },
  {
    name: "android_swipe",
    description: "Swipe on the screen in a direction",
    inputSchema: {
      type: "object",
      properties: {
        direction: {
          type: "string",
          enum: ["up", "down", "left", "right"],
          description: "Direction to swipe",
        },
        distance: {
          type: "number",
          description: "Distance in pixels (default: 500)",
        },
        x: {
          type: "number",
          description: "Starting X coordinate (default: center)",
        },
        y: {
          type: "number",
          description: "Starting Y coordinate (default: center)",
        },
      },
      required: ["direction"],
    },
  },
  {
    name: "android_press_button",
    description: "Press a hardware button on the device",
    inputSchema: {
      type: "object",
      properties: {
        button: {
          type: "string",
          enum: ["home", "back", "menu", "power", "volume_up", "volume_down", "enter", "delete"],
          description: "Button to press",
        },
      },
      required: ["button"],
    },
  },
  {
    name: "android_install_app",
    description: "Install an APK file on the device",
    inputSchema: {
      type: "object",
      properties: {
        path: {
          type: "string",
          description: "Path to APK file",
        },
      },
      required: ["path"],
    },
  },
  {
    name: "android_open_app",
    description: "Open an installed application by package name",
    inputSchema: {
      type: "object",
      properties: {
        packageName: {
          type: "string",
          description: "Android package name (e.g., 'com.android.settings')",
        },
      },
      required: ["packageName"],
    },
  },
  {
    name: "android_get_screen_size",
    description: "Get the screen size of the Android device",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "android_list_apps",
    description: "List all installed applications on the device",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "android_screenshot_base64",
    description: "Take a screenshot and return as base64 encoded string",
    inputSchema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
];

// List tools handler
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// Call tool handler
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case "android_take_screenshot": {
        const savePath = (args?.saveTo as string) || "/tmp/screenshot.png";
        await runAdbCommand(["shell", "screencap", "-p", savePath]);
        await runAdbCommand(["pull", savePath, "."]);
        return {
          content: [
            {
              type: "text",
              text: `Screenshot saved to ${savePath}`,
            },
          ],
        };
      }

      case "android_screenshot_base64": {
        await runAdbCommand(["shell", "screencap", "-p", "/tmp/screenshot.png"]);
        await runAdbCommand(["pull", "/tmp/screenshot.png", "/tmp/screenshot_local.png"]);
        
        const fs = await import("fs");
        const imageBuffer = fs.readFileSync("/tmp/screenshot_local.png");
        const base64 = imageBuffer.toString("base64");
        
        return {
          content: [
            {
              type: "text",
              text: `Screenshot taken. Base64 length: ${base64.length} characters`,
            },
            {
              type: "image",
              data: base64,
              mimeType: "image/png",
            },
          ],
        };
      }

      case "android_tap": {
        const x = args?.x as number;
        const y = args?.y as number;
        await runAdbCommand(["shell", "input", "tap", x.toString(), y.toString()]);
        return {
          content: [
            {
              type: "text",
              text: `Tapped at coordinates (${x}, ${y})`,
            },
          ],
        };
      }

      case "android_type": {
        const text = args?.text as string;
        const submit = args?.submit as boolean || false;
        
        // Escape special characters for shell
        const escapedText = text.replace(/"/g, '\\"').replace(/;/g, '\\;');
        await runAdbCommand(["shell", "input", "text", `"${escapedText}"`]);
        
        if (submit) {
          await runAdbCommand(["shell", "input", "keyevent", "66"]); // KEYCODE_ENTER
        }
        
        return {
          content: [
            {
              type: "text",
              text: `Typed "${text}"${submit ? " and submitted" : ""}`,
            },
          ],
        };
      }

      case "android_swipe": {
        const direction = args?.direction as string;
        const distance = (args?.distance as number) || 500;
        let x1 = (args?.x as number) || 540;
        let y1 = (args?.y as number) || 960;
        let x2 = x1;
        let y2 = y1;
        
        // Calculate swipe coordinates
        switch (direction) {
          case "up":
            y2 = y1 - distance;
            break;
          case "down":
            y2 = y1 + distance;
            break;
          case "left":
            x2 = x1 - distance;
            break;
          case "right":
            x2 = x1 + distance;
            break;
        }
        
        await runAdbCommand([
          "shell", "input", "swipe",
          x1.toString(), y1.toString(),
          x2.toString(), y2.toString()
        ]);
        
        return {
          content: [
            {
              type: "text",
              text: `Swiped ${direction} from (${x1}, ${y1}) to (${x2}, ${y2})`,
            },
          ],
        };
      }

      case "android_press_button": {
        const button = args?.button as string;
        const buttonMap: Record<string, string> = {
          home: "3",
          back: "4",
          menu: "82",
          power: "26",
          volume_up: "24",
          volume_down: "25",
          enter: "66",
          delete: "67",
        };
        
        const keycode = buttonMap[button];
        if (keycode) {
          await runAdbCommand(["shell", "input", "keyevent", keycode]);
          return {
            content: [
              {
                type: "text",
                text: `Pressed ${button} button`,
              },
            ],
          };
        } else {
          throw new Error(`Unknown button: ${button}`);
        }
      }

      case "android_install_app": {
        const path = args?.path as string;
        await runAdbCommand(["install", "-r", path]);
        return {
          content: [
            {
              type: "text",
              text: `Installed app from ${path}`,
            },
          ],
        };
      }

      case "android_open_app": {
        const packageName = args?.packageName as string;
        await runAdbCommand([
          "shell", "am", "start",
          "-a", "android.intent.action.MAIN",
          "-c", "android.intent.category.LAUNCHER",
          packageName
        ]);
        return {
          content: [
            {
              type: "text",
              text: `Opened app: ${packageName}`,
            },
          ],
        };
      }

      case "android_get_screen_size": {
        const output = await runAdbCommand(["shell", "wm", "size"]);
        const match = output.match(/Physical size: (\d+)x(\d+)/);
        if (match) {
          return {
            content: [
              {
                type: "text",
                text: `Screen size: ${match[1]}x${match[2]}`,
              },
            ],
          };
        }
        throw new Error("Could not get screen size");
      }

      case "android_list_apps": {
        const output = await runAdbCommand([
          "shell", "pm", "list", "packages", "-3"
        ]);
        const packages = output
          .split("\n")
          .filter(line => line.startsWith("package:"))
          .map(line => line.replace("package:", ""));
        
        return {
          content: [
            {
              type: "text",
              text: `Found ${packages.length} installed apps:\n${packages.slice(0, 20).join("\n")}${packages.length > 20 ? "\n..." : ""}`,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return {
      content: [
        {
          type: "text",
          text: `Error: ${errorMessage}`,
        },
      ],
      isError: true,
    };
  }
});

// Start server
async function main() {
  console.log("Starting KRONOS-OS Mobile MCP Server...");
  console.log(`Connecting to ADB at ${ADB_HOST}:${ADB_PORT}`);
  
  // Connect to Android device
  await connectAdb();
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.log("Mobile MCP Server running!");
  console.log("Available tools:");
  tools.forEach((tool) => {
    console.log(`  - ${tool.name}`);
  });
}

main().catch(console.error);
