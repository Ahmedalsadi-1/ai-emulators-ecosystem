import { chromium, Browser, Page } from "playwright";

let browser: Browser | null = null;
let page: Page | null = null;
const clients: Set<WebSocket> = new Set();
let screenshotInterval: NodeJS.Timeout | null = null;

const BROWSER_WIDTH = 1366;
const BROWSER_HEIGHT = 768;

async function launchBrowser() {
  if (browser) return;
  
  console.log("[BrowserServer] Launching Playwright browser...");
  
  browser = await chromium.launch({
    headless: true,
    args: [
      "--disable-dev-shm-usage",
      "--disable-setuid-sandbox", 
      "--no-sandbox",
      "--single-process",
      "--disable-extensions",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-component-extensions-with-background-pages",
      "--window-size=1366,768"
    ]
  });

  const context = await browser.newContext({
    viewport: { width: BROWSER_WIDTH, height: BROWSER_HEIGHT },
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
    deviceScaleFactor: 1,
    locale: "en-US",
  });

  page = await context.newPage();
  
  await page.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  page.on("framenavigated", async (frame) => {
    if (frame === page?.mainFrame()) {
      const url = page?.url() || "about:blank";
      broadcast({ type: "urlchange", url });
    }
  });

  console.log("[BrowserServer] Browser launched successfully");
}

async function startScreenshotStream() {
  if (screenshotInterval) return;
  
  screenshotInterval = setInterval(async () => {
    if (!page || clients.size === 0) return;
    
    try {
      const screenshot = await page.screenshot({
        type: "jpeg",
        quality: 60,
        clip: { x: 0, y: 0, width: BROWSER_WIDTH, height: BROWSER_HEIGHT }
      });
      
      const imageBase64 = `data:image/jpeg;base64,${screenshot.toString("base64")}`;
      broadcast({
        type: "screenshot",
        image: imageBase64,
        url: page.url()
      });
    } catch (error) {
      console.error("[BrowserServer] Screenshot error:", error);
    }
  }, 100);
}

function broadcast(data: Record<string, unknown>) {
  const message = JSON.stringify(data);
  clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

async function handleClientMessage(ws: WebSocket, data: string) {
  try {
    const message = JSON.parse(data);
    
    if (!page) {
      ws.send(JSON.stringify({ type: "error", message: "Browser not initialized" }));
      return;
    }

    switch (message.type) {
      case "navigate":
        await page.goto(message.url, { waitUntil: "networkidle" });
        broadcast({ type: "urlchange", url: page.url() });
        break;
        
      case "click":
        await page.mouse.click(message.x, message.y);
        break;
        
      case "scroll":
        await page.mouse.wheel(0, message.deltaY);
        break;
        
      case "key":
        await page.keyboard.press(message.key);
        break;
        
      case "type":
        await page.keyboard.type(message.text);
        break;
        
      case "goto":
        await page.goto(message.url, { waitUntil: "domcontentloaded" });
        break;
        
      default:
        console.log("[BrowserServer] Unknown message type:", message.type);
    }
  } catch (error) {
    console.error("[BrowserServer] Error handling message:", error);
    ws.send(JSON.stringify({ type: "error", message: String(error) }));
  }
}

interface BrowserMessage {
  type: string;
  url?: string;
  x?: number;
  y?: number;
  deltaY?: number;
  key?: string;
  text?: string;
}

export function createBrowserServer() {
  return {
    launchBrowser,
    startScreenshotStream,
    handleClientMessage,
    broadcast,
    getBrowser: () => browser,
    getPage: () => page,
    getClients: () => clients
  };
}

export async function cleanupBrowser() {
  if (screenshotInterval) {
    clearInterval(screenshotInterval);
    screenshotInterval = null;
  }
  
  clients.forEach((client) => {
    client.close();
  });
  clients.clear();
  
  if (page) {
    await page.close();
    page = null;
  }
  
  if (browser) {
    await browser.close();
    browser = null;
  }
  
  console.log("[BrowserServer] Cleanup complete");
}
