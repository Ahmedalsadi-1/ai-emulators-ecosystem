/**
 * KRONOS-OS Mobile MCP Server v1.1.0
 * Multi-Mode Android Control
 * 
 * Supports three connection modes:
 * 1. DOCKER - budtmo/docker-android container (Linux with KVM)
 * 2. STUDIO - Local Android Studio AVD via ADB
 * 3. PHYSICAL - Physical Android device via ADB TCPIP
 * 
 * Usage:
 *   npm start                    # Auto-detect mode
 *   npm start -- --docker        # Force Docker mode
 *   npm start -- --studio        # Force Android Studio mode
 *   npm start -- --physical      # Force physical device mode
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
import { spawn, execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// Connection modes
type ConnectionMode = "docker" | "studio" | "physical" | "auto";

interface AdbDevice {
  serial: string;
  state: "device" | "offline" | "unauthorized";
  product?: string;
  model?: string;
  device?: string;
  transport_id?: string;
}

// Parse command line arguments
const args = process.argv.slice(2);
const forceMode = args.find(arg => arg.startsWith("--"))?.replace("--", "") as ConnectionMode | undefined;
const verbose = args.includes("-v") || args.includes("--verbose");

// Environment configuration
const ENV_MODE = (process.env.ANDROID_MODE || "auto").toLowerCase() as ConnectionMode;
const ADB_HOST = process.env.ADB_HOST || "localhost";
const ADB_PORT = parseInt(process.env.ADB_PORT || "5555");
const ADB_TIMEOUT = parseInt(process.env.ADB_TIMEOUT || "30000");

// Detect connection mode
function detectConnectionMode(): ConnectionMode {
  if (forceMode && ["docker", "studio", "physical"].includes(forceMode)) {
    if (verbose) console.error(`[Mobile-MCP] Force mode: ${forceMode}`);
    return forceMode;
  }

  if (ENV_MODE !== "auto" && ["docker", "studio", "physical"].includes(ENV_MODE)) {
    if (verbose) console.error(`[Mobile-MCP] Env mode: ${ENV_MODE}`);
    return ENV_MODE;
  }

  const devices = getConnectedDevices();
  
  if (devices.length === 0) {
    if (verbose) console.error("[Mobile-MCP] No devices, using Docker mode");
    return "docker";
  }

  for (const device of devices) {
    if (device.product && device.model) {
      if (verbose) console.error(`[Mobile-MCP] Physical device: ${device.model}`);
      return "physical";
    }
  }

  if (verbose) console.error(`[Mobile-MCP] Using Studio mode (${devices.length} devices)`);
  return "studio";
}

function getConnectedDevices(): AdbDevice[] {
  try {
    const output = runAdbCommandSync(["devices", "-l"]);
    const lines = output.split("\n").slice(1);
    
    const devices: AdbDevice[] = [];
    for (const line of lines) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 2 && parts[1] === "device") {
        const device: AdbDevice = { serial: parts[0], state: "device" };
        
        for (let i = 2; i < parts.length; i++) {
          const [key, value] = parts[i].split(":");
          if (key === "product") device.product = value;
          if (key === "model") device.model = value;
          if (key === "device") device.device = value;
          if (key === "transport_id") device.transport_id = value;
        }
        devices.push(device);
      }
    }
    return devices;
  } catch (error) {
    if (verbose) console.error(`[Mobile-MCP] Error getting devices: ${error}`);
    return [];
  }
}

function log(message: string): void {
  if (verbose || process.env.DEBUG) {
    console.error(`[Mobile-MCP] ${message}`);
  }
}

function runAdbCommandSync(args: string[], timeout = ADB_TIMEOUT): string {
  return execSync(`adb ${args.join(" ")}`, {
    encoding: "utf-8",
    timeout,
    stdio: ["pipe", "pipe", "pipe"],
  });
}

async function runAdbCommand(args: string[]): Promise<string> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`ADB timeout: adb ${args.join(" ")}`));
    }, ADB_TIMEOUT);

    const proc = spawn("adb", args);
    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (data: Buffer) => { stdout += data.toString(); });
    proc.stderr?.on("data", (data: Buffer) => { stderr += data.toString(); });

    proc.on("close", (code: number | null) => {
      clearTimeout(timeout);
      if (code === 0) resolve(stdout);
      else reject(new Error(`ADB failed (${code}): ${stderr.trim()}`));
    });

    proc.on("error", (err: Error) => {
      clearTimeout(timeout);
      reject(err);
    });
  });
}

async function connectAndroidDevice(mode: ConnectionMode): Promise<void> {
  log(`Connecting in ${mode} mode...`);

  switch (mode) {
    case "docker":
      try {
        await runAdbCommand(["connect", `${ADB_HOST}:${ADB_PORT}`]);
        log(`Connected to Docker at ${ADB_HOST}:${ADB_PORT}`);
      } catch {
        try {
          await runAdbCommand(["connect", `localhost:${ADB_PORT}`]);
          log(`Connected to localhost:${ADB_PORT}`);
        } catch { log("Waiting for device..."); }
      }
      break;

    case "studio":
      const devices = getConnectedDevices();
      log(`Found ${devices.length} device(s): ${devices.map(d => d.serial).join(", ")}`);
      break;

    case "physical":
      try {
        const connected = getConnectedDevices();
        const tcpDevices = connected.filter(d => d.serial.includes(":"));
        if (tcpDevices.length === 0) {
          await runAdbCommand(["connect", `${ADB_HOST}:${ADB_PORT}`]);
        }
      } catch (error) { log(`Note: ${error}`); }
      break;
  }

  await verifyConnection();
}

async function verifyConnection(): Promise<boolean> {
  try {
    const devices = getConnectedDevices();
    const online = devices.filter(d => d.state === "device");
    
    if (online.length > 0) {
      log(`Verified: ${online.length} device(s) online`);
      for (const device of online) {
        try {
          const model = await runAdbCommand(["-s", device.serial, "shell", "getprop", "ro.product.model"]);
          log(`Device: ${model.trim()}`);
        } catch { }
      }
      return true;
    }
    
    log("No online devices found");
    return false;
  } catch (error) {
    log(`Verification error: ${error}`);
    return false;
  }
}

const server = new Server(
  { name: "kronos-android-mcp", version: "1.1.0" },
  { capabilities: { tools: {} } }
);

const tools: Tool[] = [
  {
    name: "android_take_screenshot",
    description: "Take a screenshot of the Android device screen",
    inputSchema: {
      type: "object",
      properties: {
        saveTo: { type: "string", description: "Local file path (default: ./screenshot.png)" },
        device: { type: "string", description: "Device serial (optional)" },
      },
    },
  },
  {
    name: "android_screenshot_base64",
    description: "Take screenshot and return as base64",
    inputSchema: {
      type: "object",
      properties: { device: { type: "string", description: "Device serial (optional)" } },
    },
  },
  {
    name: "android_tap",
    description: "Tap on screen at coordinates",
    inputSchema: {
      type: "object",
      properties: {
        x: { type: "number", description: "X coordinate" },
        y: { type: "number", description: "Y coordinate" },
        device: { type: "string", description: "Device serial (optional)" },
      },
      required: ["x", "y"],
    },
  },
  {
    name: "android_type",
    description: "Type text into focused input",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text to type" },
        submit: { type: "boolean", description: "Press Enter after (default: false)" },
        device: { type: "string", description: "Device serial (optional)" },
      },
      required: ["text"],
    },
  },
  {
    name: "android_swipe",
    description: "Swipe on screen",
    inputSchema: {
      type: "object",
      properties: {
        direction: { type: "string", enum: ["up", "down", "left", "right"], description: "Direction" },
        x1: { type: "number", description: "Start X (default: center)" },
        y1: { type: "number", description: "Start Y (default: center)" },
        x2: { type: "number", description: "End X (precise swipe)" },
        y2: { type: "number", description: "End Y (precise swipe)" },
        distance: { type: "number", description: "Distance (default: 500)" },
        duration: { type: "number", description: "Duration ms (default: 300)" },
        device: { type: "string", description: "Device serial (optional)" },
      },
    },
  },
  {
    name: "android_press_button",
    description: "Press hardware button",
    inputSchema: {
      type: "object",
      properties: {
        button: { type: "string", enum: ["home", "back", "menu", "power", "volume_up", "volume_down", "volume_mute", "enter", "delete", "tab", "escape", "recent_apps"], description: "Button" },
        long_press: { type: "boolean", description: "Long press (default: false)" },
        device: { type: "string", description: "Device serial (optional)" },
      },
      required: ["button"],
    },
  },
  {
    name: "android_install_app",
    description: "Install APK on device",
    inputSchema: {
      type: "object",
      properties: {
        path: { type: "string", description: "APK path or URL" },
        reinstall: { type: "boolean", description: "Allow reinstall (default: true)" },
        device: { type: "string", description: "Device serial (optional)" },
      },
      required: ["path"],
    },
  },
  {
    name: "android_uninstall_app",
    description: "Uninstall application",
    inputSchema: {
      type: "object",
      properties: {
        packageName: { type: "string", description: "Package name" },
        keepData: { type: "boolean", description: "Keep data (default: false)" },
        device: { type: "string", description: "Device serial (optional)" },
      },
      required: ["packageName"],
    },
  },
  {
    name: "android_open_app",
    description: "Open application",
    inputSchema: {
      type: "object",
      properties: {
        packageName: { type: "string", description: "Package name" },
        action: { type: "string", description: "Intent action" },
        uri: { type: "string", description: "URI for deep links" },
        device: { type: "string", description: "Device serial (optional)" },
      },
      required: ["packageName"],
    },
  },
  {
    name: "android_get_screen_size",
    description: "Get screen size and density",
    inputSchema: {
      type: "object",
      properties: { device: { type: "string", description: "Device serial (optional)" } },
    },
  },
  {
    name: "android_list_apps",
    description: "List installed applications",
    inputSchema: {
      type: "object",
      properties: {
        system: { type: "boolean", description: "Include system apps" },
        thirdParty: { type: "boolean", description: "Include third-party (default: true)" },
        search: { type: "string", description: "Filter by name" },
        limit: { type: "number", description: "Max results (default: 50)" },
        device: { type: "string", description: "Device serial (optional)" },
      },
    },
  },
  {
    name: "android_get_device_info",
    description: "Get device information",
    inputSchema: {
      type: "object",
      properties: { device: { type: "string", description: "Device serial (optional)" } },
    },
  },
  {
    name: "android_shell",
    description: "Execute shell command",
    inputSchema: {
      type: "object",
      properties: {
        command: { type: "string", description: "Shell command" },
        timeout: { type: "number", description: "Timeout ms (default: 10000)" },
        device: { type: "string", description: "Device serial (optional)" },
      },
      required: ["command"],
    },
  },
  {
    name: "android_pull",
    description: "Download file from device",
    inputSchema: {
      type: "object",
      properties: {
        remotePath: { type: "string", description: "Device path" },
        localPath: { type: "string", description: "Local path" },
        device: { type: "string", description: "Device serial (optional)" },
      },
      required: ["remotePath", "localPath"],
    },
  },
  {
    name: "android_push",
    description: "Upload file to device",
    inputSchema: {
      type: "object",
      properties: {
        localPath: { type: "string", description: "Local path" },
        remotePath: { type: "string", description: "Device path" },
        device: { type: "string", description: "Device serial (optional)" },
      },
      required: ["localPath", "remotePath"],
    },
  },
  {
    name: "android_get_clipboard",
    description: "Get clipboard text",
    inputSchema: {
      type: "object",
      properties: { device: { type: "string", description: "Device serial (optional)" } },
    },
  },
  {
    name: "android_set_clipboard",
    description: "Set clipboard text",
    inputSchema: {
      type: "object",
      properties: {
        text: { type: "string", description: "Text to set" },
        device: { type: "string", description: "Device serial (optional)" },
      },
      required: ["text"],
    },
  },
  {
    name: "android_wake",
    description: "Wake device (turn on screen)",
    inputSchema: {
      type: "object",
      properties: { device: { type: "string", description: "Device serial (optional)" } },
    },
  },
];

async function getDeviceSerial(device?: string): Promise<string> {
  if (device) return device;
  
  const devices = getConnectedDevices();
  const online = devices.filter(d => d.state === "device");
  
  if (online.length === 0) {
    throw new Error("No connected Android device found");
  }
  
  const tcpDevice = online.find(d => d.serial.includes(":"));
  if (tcpDevice) return tcpDevice.serial;
  
  return online[0].serial;
}

async function buildAdbCommand(args: string[], device?: string): Promise<string[]> {
  const serial = await getDeviceSerial(device);
  return serial ? ["-s", serial, ...args] : args;
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const device = args?.device as string | undefined;

  try {
    switch (name) {
      case "android_take_screenshot": {
        const savePath = (args?.saveTo as string) || "./screenshot.png";
        const serial = await getDeviceSerial(device);
        const tempPath = "/tmp/screenshot.png";
        
        await runAdbCommand(await buildAdbCommand(["shell", "screencap", "-p", tempPath], serial));
        await runAdbCommand(await buildAdbCommand(["pull", tempPath, savePath], serial));
        
        return { content: [{ type: "text", text: `Saved to ${savePath}` }] };
      }

      case "android_screenshot_base64": {
        const serial = await getDeviceSerial(device);
        const tempPath = "/tmp/screenshot.png";
        
        await runAdbCommand(await buildAdbCommand(["shell", "screencap", "-p", tempPath], serial));
        await runAdbCommand(await buildAdbCommand(["pull", tempPath, "/tmp/screenshot_local.png"], serial));
        
        const imageBuffer = fs.readFileSync("/tmp/screenshot_local.png");
        const base64 = imageBuffer.toString("base64");
        
        return {
          content: [
            { type: "text", text: `Screenshot (${Math.round(base64.length / 1024)}KB)` },
            { type: "image", data: base64, mimeType: "image/png" },
          ],
        };
      }

      case "android_tap": {
        const x = args?.x as number;
        const y = args?.y as number;
        await runAdbCommand(await buildAdbCommand(["shell", "input", "tap", x.toString(), y.toString()], device));
        return { content: [{ type: "text", text: `Tapped (${x}, ${y})` }] };
      }

      case "android_type": {
        const text = args?.text as string;
        const submit = args?.submit as boolean || false;
        const escaped = text.replace(/"/g, '\\"').replace(/;/g, '\\;');
        
        await runAdbCommand(await buildAdbCommand(["shell", "input", "text", `"${escaped}"`], device));
        if (submit) await runAdbCommand(await buildAdbCommand(["shell", "input", "keyevent", "66"], device));
        
        return { content: [{ type: "text", text: `Typed "${text}"${submit ? " (submitted)" : ""}` }] };
      }

      case "android_swipe": {
        const direction = args?.direction as string;
        const x1 = (args?.x1 as number) || 540;
        const y1 = (args?.y1 as number) || 960;
        const x2 = args?.x2 as number;
        const y2 = args?.y2 as number;
        const distance = (args?.distance as number) || 500;
        const duration = (args?.duration as number) || 300;
        
        let cmdArgs: string[];
        
        if (x2 !== undefined && y2 !== undefined) {
          cmdArgs = ["shell", "input", "swipe", x1.toString(), y1.toString(), x2.toString(), y2.toString(), duration.toString()];
        } else if (direction) {
          let sx1 = x1, sy1 = y1, sx2 = x1, sy2 = y1;
          switch (direction) {
            case "up": sy2 = y1 - distance; break;
            case "down": sy2 = y1 + distance; break;
            case "left": sx2 = x1 - distance; break;
            case "right": sx2 = x1 + distance; break;
          }
          cmdArgs = ["shell", "input", "swipe", sx1.toString(), sy1.toString(), sx2.toString(), sy2.toString(), duration.toString()];
        } else {
          throw new Error("direction or x2/y2 required");
        }
        
        await runAdbCommand(await buildAdbCommand(cmdArgs, device));
        return { content: [{ type: "text", text: `Swiped ${direction || "custom"}` }] };
      }

      case "android_press_button": {
        const button = args?.button as string;
        const longPress = args?.long_press as boolean || false;
        const map: Record<string, string> = {
          home: "3", back: "4", menu: "82", power: "26",
          volume_up: "24", volume_down: "25", volume_mute: "164",
          enter: "66", delete: "67", tab: "61", escape: "4", recent_apps: "187",
        };
        
        const keycode = map[button];
        if (!keycode) throw new Error(`Unknown button: ${button}`);
        
        if (longPress) {
          await runAdbCommand(await buildAdbCommand(["shell", "input", "keyevent", "--longpress", keycode], device));
        } else {
          await runAdbCommand(await buildAdbCommand(["shell", "input", "keyevent", keycode], device));
        }
        
        return { content: [{ type: "text", text: `Pressed ${button}${longPress ? " (long)" : ""}` }] };
      }

      case "android_install_app": {
        const apkPath = args?.path as string;
        const reinstall = args?.reinstall as boolean ?? true;
        
        let localPath = apkPath;
        if (apkPath.startsWith("http")) {
          localPath = `/tmp/${path.basename(apkPath)}`;
          log(`Downloading ${apkPath}...`);
          try {
            runAdbCommandSync(["shell", "curl", "-o", localPath, apkPath]);
          } catch {
            throw new Error(`Download failed: ${apkPath}`);
          }
        }
        
        const cmd = reinstall ? ["install", "-r"] : ["install"];
        await runAdbCommand(await buildAdbCommand([...cmd, localPath], device));
        
        return { content: [{ type: "text", text: `Installed ${localPath}` }] };
      }

      case "android_uninstall_app": {
        const packageName = args?.packageName as string;
        const keepData = args?.keepData as boolean || false;
        const cmd = keepData ? ["uninstall", "-k"] : ["uninstall"];
        await runAdbCommand(await buildAdbCommand([...cmd, packageName], device));
        return { content: [{ type: "text", text: `Uninstalled ${packageName}` }] };
      }

      case "android_open_app": {
        const packageName = args?.packageName as string;
        const action = args?.action as string || "android.intent.action.MAIN";
        const uri = args?.uri as string;
        
        const cmd = uri
          ? ["shell", "am", "start", "-a", action, "-d", uri, packageName]
          : ["shell", "am", "start", "-a", action, "-c", "android.intent.category.LAUNCHER", packageName];
        
        await runAdbCommand(await buildAdbCommand(cmd, device));
        return { content: [{ type: "text", text: `Opened ${packageName}` }] };
      }

      case "android_get_screen_size": {
        const serial = await getDeviceSerial(device);
        const size = await runAdbCommand(await buildAdbCommand(["shell", "wm", "size"], serial));
        const density = await runAdbCommand(await buildAdbCommand(["shell", "wm", "density"], serial));
        
        const sizeMatch = size.match(/Physical size: (\d+)x(\d+)/);
        const densityMatch = density.match(/Physical density: (\d+)/);
        
        return {
          content: [{
            type: "text",
            text: `Screen: ${sizeMatch ? sizeMatch[1] + "x" + sizeMatch[2] : "?"} @ ${densityMatch ? densityMatch[1] : "?"} DPI`,
          }],
        };
      }

      case "android_list_apps": {
        const showSystem = args?.system as boolean || false;
        const showThirdParty = args?.thirdParty as boolean ?? true;
        const search = args?.search as string;
        const limit = (args?.limit as number) || 50;
        
        let cmd = ["shell", "pm", "list", "packages"];
        if (showSystem) cmd.push("-a");
        if (showThirdParty) cmd.push("-3");
        
        const output = await runAdbCommand(await buildAdbCommand(cmd, device));
        let pkgs = output.split("\n").filter(l => l.startsWith("package:"));
        
        if (search) {
          pkgs = pkgs.filter(p => p.toLowerCase().includes(search.toLowerCase()));
        }
        
        pkgs = pkgs.slice(0, limit);
        return {
          content: [{
            type: "text",
            text: `${pkgs.length} app(s):\n${pkgs.map(p => p.replace("package:", "")).join("\n")}`,
          }],
        };
      }

      case "android_get_device_info": {
        const serial = await getDeviceSerial(device);
        const [model, version, sdk, manufacturer] = await Promise.all([
          runAdbCommand(await buildAdbCommand(["shell", "getprop", "ro.product.model"], serial)),
          runAdbCommand(await buildAdbCommand(["shell", "getprop", "ro.build.version.release"], serial)),
          runAdbCommand(await buildAdbCommand(["shell", "getprop", "ro.build.version.sdk"], serial)),
          runAdbCommand(await buildAdbCommand(["shell", "getprop", "ro.product.manufacturer"], serial)),
        ]);
        
        return {
          content: [{
            type: "text",
            text: `${manufacturer.trim()} ${model.trim()} (Android ${version.trim()}, SDK ${sdk.trim()})`,
          }],
        };
      }

      case "android_shell": {
        const command = args?.command as string;
        const timeout = (args?.timeout as number) || 10000;
        const output = await runAdbCommand(await buildAdbCommand(["shell", command], device));
        return { content: [{ type: "text", text: output.trim() || "(no output)" }] };
      }

      case "android_pull": {
        const remotePath = args?.remotePath as string;
        const localPath = args?.localPath as string;
        await runAdbCommand(await buildAdbCommand(["pull", remotePath, localPath], device));
        return { content: [{ type: "text", text: `Pulled ${remotePath} → ${localPath}` }] };
      }

      case "android_push": {
        const localPath = args?.localPath as string;
        const remotePath = args?.remotePath as string;
        await runAdbCommand(await buildAdbCommand(["push", localPath, remotePath], device));
        return { content: [{ type: "text", text: `Pushed ${localPath} → ${remotePath}` }] };
      }

      case "android_get_clipboard": {
        const serial = await getDeviceSerial(device);
        const output = await runAdbCommand(await buildAdbCommand(["shell", "am", "broadcast", "-a", "clipper.get"], serial));
        return { content: [{ type: "text", text: output.trim() || "Clipboard empty" }] };
      }

      case "android_set_clipboard": {
        const text = args?.text as string;
        const serial = await getDeviceSerial(device);
        await runAdbCommand(await buildAdbCommand(["shell", "am", "broadcast", "-a", "clipper.set", "--es", "text", text], serial));
        return { content: [{ type: "text", text: `Clipboard: ${text.substring(0, 50)}...` }] };
      }

      case "android_wake": {
        await runAdbCommand(await buildAdbCommand(["shell", "input", "keyevent", "26"], device));
        await runAdbCommand(await buildAdbCommand(["shell", "input", "swipe", "540", "1000", "540", "500"], device));
        return { content: [{ type: "text", text: "Device woken" }] };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [{ type: "text", text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
      isError: true,
    };
  }
});

async function main() {
  console.error("Starting KRONOS-OS Mobile MCP Server v1.1.0...");
  
  const mode = detectConnectionMode();
  console.error(`Mode: ${mode}`);
  
  await connectAndroidDevice(mode);
  
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error("Running! Tools:", tools.length);
  tools.forEach(t => console.error(`  - ${t.name}`));
}

main().catch(err => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});
