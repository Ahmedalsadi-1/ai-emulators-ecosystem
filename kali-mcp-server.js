#!/usr/bin/env node

const { Server } = require('@modelcontextprotocol/sdk/server/index.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { CallToolRequestSchema, ListToolsRequestSchema } = require('@modelcontextprotocol/sdk/types.js');
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs').promises;
const path = require('path');

const execAsync = promisify(exec);

// Add HTTP server for MCP endpoint
const express = require('express');
const app = express();
app.use(express.json());

class KaliDesktopMCP {
  constructor() {
    this.server = new Server(
      { name: 'kali-desktop-mcp', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );
    this.setupHandlers();
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'kali_screenshot',
          description: 'Take a screenshot of the Kali desktop with optional OmniParser UI analysis',
          inputSchema: {
            type: 'object',
            properties: {
              analyze: { type: 'boolean', description: 'Use OmniParser to analyze UI elements (default: false)' }
            }
          }
        },
        {
          name: 'kali_click',
          description: 'Click at specific coordinates on the desktop',
          inputSchema: {
            type: 'object',
            properties: {
              x: { type: 'number', description: 'X coordinate' },
              y: { type: 'number', description: 'Y coordinate' },
              button: { type: 'string', enum: ['left', 'right', 'middle'], default: 'left' }
            },
            required: ['x', 'y']
          }
        },
        {
          name: 'kali_click_element',
          description: 'AI-powered click on UI elements using natural language descriptions',
          inputSchema: {
            type: 'object',
            properties: {
              description: { type: 'string', description: 'Natural language description of the element to click (e.g., "the red button", "terminal window", "firefox icon")' },
              button: { type: 'string', enum: ['left', 'right', 'middle'], default: 'left' }
            },
            required: ['description']
          }
        },
        {
          name: 'kali_hawkeye_pinpoint',
          description: 'Hawkeye-style AI pinpointing for precise element targeting and analysis',
          inputSchema: {
            type: 'object',
            properties: {
              target: { type: 'string', description: 'What to pinpoint (element, text, icon, etc.)' },
              action: { type: 'string', enum: ['locate', 'analyze', 'highlight'], default: 'locate' }
            },
            required: ['target']
          }
        },
        {
          name: 'kali_ai_interact',
          description: 'Advanced AI-powered desktop interaction with intelligent automation',
          inputSchema: {
            type: 'object',
            properties: {
              instruction: { type: 'string', description: 'Natural language instruction for AI to execute (e.g., "open firefox and navigate to google.com", "run nmap scan on localhost")' },
              analyze_screen: { type: 'boolean', description: 'Whether to analyze screen before action', default: true }
            },
            required: ['instruction']
          }
        },
        {
          name: 'kali_type',
          description: 'Type text on the desktop',
          inputSchema: {
            type: 'object',
            properties: {
              text: { type: 'string', description: 'Text to type' }
            },
            required: ['text']
          }
        },
        {
          name: 'kali_drag',
          description: 'Drag from one position to another on the desktop',
          inputSchema: {
            type: 'object',
            properties: {
              x1: { type: 'number', description: 'Start X coordinate' },
              y1: { type: 'number', description: 'Start Y coordinate' },
              x2: { type: 'number', description: 'End X coordinate' },
              y2: { type: 'number', description: 'End Y coordinate' },
              button: { type: 'string', enum: ['left', 'right', 'middle'], default: 'left' }
            },
            required: ['x1', 'y1', 'x2', 'y2']
          }
        },
        {
          name: 'kali_key',
          description: 'Press keyboard keys or combinations',
          inputSchema: {
            type: 'object',
            properties: {
              keys: { type: 'string', description: 'Key combination (e.g., "ctrl+c", "alt+tab", "Return")' }
            },
            required: ['keys']
          }
        },
        {
          name: 'kali_execute',
          description: 'Execute a command in the Kali container',
          inputSchema: {
            type: 'object',
            properties: {
              command: { type: 'string', description: 'Command to execute' }
            },
            required: ['command']
          }
        },
        {
          name: 'kali_launch_app',
          description: 'Launch an application on the desktop',
          inputSchema: {
            type: 'object',
            properties: {
              app: { type: 'string', description: 'Application command (e.g., "firefox", "wireshark", "xterm")' }
            },
            required: ['app']
          }
        },
        {
          name: 'kali_security_scan',
          description: 'AI-powered security scanning with automated tool selection and execution',
          inputSchema: {
            type: 'object',
            properties: {
              target: { type: 'string', description: 'Target to scan (IP, domain, network range)' },
              scan_type: { type: 'string', enum: ['quick', 'comprehensive', 'web', 'network', 'wireless'], default: 'quick' },
              tools: { type: 'array', items: { type: 'string' }, description: 'Specific tools to use (optional)' }
            },
            required: ['target']
          }
        },
        {
          name: 'kali_status',
          description: 'Check if Kali desktop is running',
          inputSchema: { type: 'object', properties: {} }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'kali_screenshot':
            return await this.takeScreenshot(args);
          case 'kali_click':
            return await this.clickMouse(args);
          case 'kali_click_element':
            return await this.clickElement(args);
          case 'kali_hawkeye_pinpoint':
            return await this.hawkeyePinpoint(args);
          case 'kali_ai_interact':
            return await this.aiInteract(args);
          case 'kali_type':
            return await this.typeText(args);
          case 'kali_key':
            return await this.pressKey(args);
          case 'kali_drag':
            return await this.dragMouse(args);
          case 'kali_execute':
            return await this.executeCommand(args.command);
          case 'kali_launch_app':
            return await this.launchApp(args);
          case 'kali_security_scan':
            return await this.securityScan(args);
          case 'kali_status':
            return await this.checkStatus();
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    });
  }

  async takeScreenshot(args = {}) {
    try {
      const { analyze = false } = args;
      
      // Take screenshot in container
      await execAsync('docker exec kali-desktop bash -c "DISPLAY=:1 import -window root /tmp/kali-screenshot.png"');

      // Copy to host
      await execAsync('docker cp kali-desktop:/tmp/kali-screenshot.png /tmp/kali-screenshot.png');
      
      // Read and encode as base64
      const imageBuffer = await fs.readFile('/tmp/kali-screenshot.png');
      const base64Image = imageBuffer.toString('base64');
      
      const content = [
        { type: 'text', text: 'Screenshot captured successfully' },
        { 
          type: 'image', 
          data: base64Image, 
          mimeType: 'image/png' 
        }
      ];

      // Add OmniParser analysis if requested
      if (analyze) {
        try {
          const analysisResult = await this.analyzeScreenWithOmniParser('/tmp/kali-screenshot.png');
          content.push({
            type: 'text',
            text: `OmniParser Analysis:\n${analysisResult}`
          });
        } catch (error) {
          content.push({
            type: 'text',
            text: `OmniParser analysis failed: ${error.message}`
          });
        }
      }
      
      return { content };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Screenshot failed: ${error.message}` }]
      };
    }
  }

  async analyzeScreenWithOmniParser(imagePath) {
    try {
      // Call the external OmniParser script for visual reasoning
      const { stdout } = await execAsync(`docker exec kali-desktop python3 /app/omni_parser.py ${imagePath}`);
      const analysisData = JSON.parse(stdout);

      if (analysisData.error) {
        throw new Error(analysisData.error);
      }

      let analysis = `OmniParser Analysis:\nFound ${analysisData.total_elements} UI elements and ${analysisData.ocr_elements.length} text regions.\n\n`;

      if (analysisData.ocr_elements.length > 0) {
        analysis += "--- SEMANTIC TEXT ELEMENTS ---\n";
        analysisData.ocr_elements.forEach((el, i) => {
          analysis += `${i+1}. "${el.text}" at (${el.center.x}, ${el.center.y})\n`;
        });
        analysis += "\n";
      }

      analysis += "--- STRUCTURAL UI ELEMENTS ---\n";
      analysisData.elements.forEach((el, i) => {
        analysis += `${i+1}. ${el.type} at (${el.center.x}, ${el.center.y}) - ${el.bounds.width}x${el.bounds.height}px\n`;
      });

      return analysis;
    } catch (error) {
      console.error('OmniParser error:', error);
      return `OmniParser Analysis Error: ${error.message}`;
    }
  }

  async clickMouse(args) {
    try {
      const { x, y, button = 'left' } = args;
      
      const result = await execAsync(`docker exec kali-desktop python3 /usr/local/bin/vnc_control.py click ${x} ${y} ${button}`);
      const response = JSON.parse(result.stdout);
      
      if (response.success) {
        return {
          content: [{ type: 'text', text: `Successfully clicked ${button} button at (${x}, ${y})` }]
        };
      } else {
        return {
          content: [{ type: 'text', text: `Click failed: ${response.error || 'Unknown error'}` }]
        };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Click failed: ${error.message}` }]
      };
    }
  }

  async typeText(args) {
    try {
      const { text } = args;
      
      const result = await execAsync(`docker exec kali-desktop python3 /usr/local/bin/vnc_control.py type "${text.replace(/"/g, '\\"')}"`);
      const response = JSON.parse(result.stdout);
      
      if (response.success) {
        return {
          content: [{ type: 'text', text: `Successfully typed: ${text}` }]
        };
      } else {
        return {
          content: [{ type: 'text', text: `Type failed: ${response.error || 'Unknown error'}` }]
        };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Type failed: ${error.message}` }]
      };
    }
  }

  async pressKey(args) {
    try {
      const { keys } = args;
      
      const result = await execAsync(`docker exec kali-desktop python3 /usr/local/bin/vnc_control.py key "${keys}"`);
      const response = JSON.parse(result.stdout);
      
      if (response.success) {
        return {
          content: [{ type: 'text', text: `Successfully pressed keys: ${keys}` }]
        };
      } else {
        return {
          content: [{ type: 'text', text: `Key press failed: ${response.error || 'Unknown error'}` }]
        };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Key press failed: ${error.message}` }]
      };
    }
  }

  async dragMouse(args) {
    try {
      const { x1, y1, x2, y2, button = 'left' } = args;
      
      const result = await execAsync(`docker exec kali-desktop python3 /usr/local/bin/vnc_control.py drag ${x1} ${y1} ${x2} ${y2} ${button}`);
      const response = JSON.parse(result.stdout);
      
      if (response.success) {
        return {
          content: [{ type: 'text', text: `Successfully dragged from (${x1}, ${y1}) to (${x2}, ${y2})` }]
        };
      } else {
        return {
          content: [{ type: 'text', text: `Drag failed: ${response.error || 'Unknown error'}` }]
        };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Drag failed: ${error.message}` }]
      };
    }
  }

  async launchApp(args) {
    try {
      const { app } = args;
      
      await execAsync(`docker exec kali-desktop bash -c "DISPLAY=:1 ${app} &"`);
      
      return {
        content: [{ type: 'text', text: `Launched application: ${app}` }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Launch failed: ${error.message}` }]
      };
    }
  }

  async executeCommand(command) {
    try {
      const { stdout, stderr } = await execAsync(`docker exec kali-desktop bash -c "${command.replace(/"/g, '\\"')}"`);
      return {
        content: [{
          type: 'text',
          text: `Command: ${command}\n\nOutput:\n${stdout}${stderr ? `\nErrors:\n${stderr}` : ''}`
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Command failed: ${error.message}` }]
      };
    }
  }

  async checkStatus() {
    try {
      const { stdout } = await execAsync('docker ps --filter name=kali-desktop --format "{{.Status}}"');
      const isRunning = stdout.trim().includes('Up');
      return {
        content: [{
          type: 'text',
          text: isRunning ? 'Kali Desktop is running' : 'Kali Desktop is not running'
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: 'Failed to check status' }]
      };
    }
  }

  async clickElement(args) {
    try {
      const { description, button = 'left' } = args;

      // Take screenshot and analyze with advanced AI
      const screenshotResult = await this.takeScreenshot({ analyze: true });
      const analysis = screenshotResult.content.find(c => c.type === 'text' && c.text.includes('OmniParser Analysis'));

      if (!analysis) {
        return {
          content: [{ type: 'text', text: 'Failed to analyze screen for element detection' }]
        };
      }

      // Use AI to find the element based on description
      const aiPrompt = `Based on this UI analysis: ${analysis.text}

Find the best element that matches this description: "${description}"

Return coordinates in format: {"x": number, "y": number, "confidence": number, "reasoning": "explanation"}`;

      // For now, use a simple heuristic - in production this would call an AI model
      const elementCoords = await this.findElementByDescription(description, analysis.text);

      if (!elementCoords) {
        return {
          content: [{ type: 'text', text: `Could not find element matching: "${description}"` }]
        };
      }

      // Click on the found element
      return await this.clickMouse({ x: elementCoords.x, y: elementCoords.y, button });

    } catch (error) {
      return {
        content: [{ type: 'text', text: `AI click failed: ${error.message}` }]
      };
    }
  }

  async hawkeyePinpoint(args) {
    try {
      const { target, action = 'locate' } = args;

      // Take screenshot with advanced analysis
      const screenshotResult = await this.takeScreenshot({ analyze: true });

      // Extract analysis data
      const analysis = screenshotResult.content.find(c => c.type === 'text' && c.text.includes('OmniParser Analysis'));
      const image = screenshotResult.content.find(c => c.type === 'image');

      if (!analysis || !image) {
        return {
          content: [{ type: 'text', text: 'Failed to capture and analyze screen' }]
        };
      }

      // Hawkeye-style pinpointing with AI analysis
      const pinpointResult = await this.performHawkeyeAnalysis(target, analysis.text, image.data);

      const content = [
        { type: 'text', text: `Hawkeye Analysis for "${target}":\n${pinpointResult.analysis}` }
      ];

      if (pinpointResult.coordinates && action === 'highlight') {
        // Draw highlight on image (would need image processing library)
        content.push({
          type: 'text',
          text: `Target located at: (${pinpointResult.coordinates.x}, ${pinpointResult.coordinates.y})`
        });
      }

      return { content };

    } catch (error) {
      return {
        content: [{ type: 'text', text: `Hawkeye pinpointing failed: ${error.message}` }]
      };
    }
  }

  async aiInteract(args) {
    try {
      const { instruction, analyze_screen = true } = args;

      // STEP 1: Memory Search (Learning from the past)
      const pastExperiences = await this.recallExperience({ query: instruction });
      let contextPrefix = "";
      if (pastExperiences.content[0].text.includes("Recalled")) {
        contextPrefix = `Recalled past experiences:\n${pastExperiences.content[0].text}\n\n`;
      }

      // STEP 2: Vision Analysis (Understanding the present)
      let screenAnalysis = '';
      if (analyze_screen) {
        const screenshotResult = await this.takeScreenshot({ analyze: true });
        const analysis = screenshotResult.content.find(c => c.type === 'text' && c.text.includes('OmniParser Analysis'));
        screenAnalysis = analysis ? analysis.text : 'Screen analysis unavailable';
      }

      // STEP 3: Planning & Reasoning (Sentient logic)
      const aiResponse = await this.processAIInstruction(instruction, screenAnalysis);

      // STEP 4: Execution & Feedback Loop
      const results = [];
      for (const action of aiResponse.actions) {
        try {
          // Store state before action
          const beforeState = await this.appStatus({});
          
          let result;
          switch (action.type) {
            case 'click': result = await this.clickMouse(action.params); break;
            case 'type': result = await this.typeText(action.params); break;
            case 'key': result = await this.pressKey(action.params); break;
            case 'execute': result = await this.executeCommand(action.params.command); break;
            case 'launch': result = await this.launchApp(action.params); break;
            default: result = { content: [{ type: 'text', text: `Unknown action type: ${action.type}` }] };
          }
          
          // Verify outcome (Learning)
          const afterState = await this.appStatus({});
          const success = result.content[0].text.includes('Successfully');
          results.push(`${action.description}: ${success ? '✅' : '❌'} - ${result.content[0].text}`);
        } catch (error) {
          results.push(`${action.description}: Failed - ${error.message}`);
        }
      }

      // STEP 5: Remember for future (Self-Training)
      await this.rememberExperience({
        instruction,
        steps: aiResponse.actions,
        success: results.every(r => r.includes('✅'))
      });

      return {
        content: [{
          type: 'text',
          text: `${contextPrefix}AI Interaction Results:\n${aiResponse.reasoning}\n\nActions Performed:\n${results.join('\n')}\n\n🧠 This interaction has been saved to memory for future learning.`
        }]
      };

    } catch (error) {
      return {
        content: [{ type: 'text', text: `AI interaction failed: ${error.message}` }]
      };
    }
  }

  async securityScan(args) {
    try {
      const { target, scan_type = 'quick', tools = [] } = args;

      // AI-powered tool selection based on scan type and target
      const selectedTools = tools.length > 0 ? tools : this.selectSecurityTools(scan_type, target);

      const results = [];

      for (const tool of selectedTools) {
        try {
          const command = this.buildSecurityCommand(tool, target, scan_type);
          const result = await this.executeCommand(command);

          results.push({
            tool,
            command,
            output: result.content[0].text,
            success: !result.content[0].text.includes('Command failed')
          });
        } catch (error) {
          results.push({
            tool,
            error: error.message,
            success: false
          });
        }
      }

      // AI analysis of results
      const analysis = await this.analyzeSecurityResults(results, target, scan_type);

      return {
        content: [{
          type: 'text',
          text: `Security Scan Results for ${target} (${scan_type}):\n\n${results.map(r =>
            `🔧 ${r.tool}: ${r.success ? '✅ Success' : '❌ Failed'}\n${r.output || r.error}\n`
          ).join('')}\n\nAI Analysis:\n${analysis}`
        }]
      };

    } catch (error) {
      return {
        content: [{ type: 'text', text: `Security scan failed: ${error.message}` }]
      };
    }
  }

  // Helper methods for AI-powered functionality
  async findElementByDescription(description, analysis) {
    try {
      const lowerDesc = description.toLowerCase();

      // Parse the text-based analysis from OmniParser
      const lines = analysis.split('\n');
      const elements = [];

      // Extract elements from the text format
      for (const line of lines) {
        if (line.includes('Element at') && line.includes('px')) {
          const match = line.match(/Element at \((\d+), (\d+)\) - (\d+)x(\d+)px/);
          if (match) {
            const x = parseInt(match[1]);
            const y = parseInt(match[2]);
            const width = parseInt(match[3]);
            const height = parseInt(match[4]);
            const centerX = x + width / 2;
            const centerY = y + height / 2;
            const area = width * height;

            elements.push({
              bounds: { x, y, width, height },
              center: { x: centerX, y: centerY },
              area: area
            });
          }
        }
      }

      if (elements.length === 0) {
        return null;
      }

      // Strategy 1: Firefox/browser detection
      if (lowerDesc.includes('firefox') || lowerDesc.includes('browser') || lowerDesc.includes('window')) {
        // Look for large elements that could be browser windows
        const largeElements = elements.filter(el => el.bounds.width > 800 && el.bounds.height > 400);
        if (largeElements.length > 0) {
          const element = largeElements[0];
          return {
            x: Math.floor(element.center.x),
            y: Math.floor(element.center.y),
            confidence: 0.9,
            reasoning: `Found Firefox browser window: ${element.bounds.width}x${element.bounds.height}px at (${element.center.x}, ${element.center.y})`
          };
        }
      }

      // Strategy 2: Center/middle detection
      if (lowerDesc.includes('center') || lowerDesc.includes('middle')) {
        // Return the largest element (likely the main window)
        const largestElement = elements.reduce((max, el) => el.area > max.area ? el : max, elements[0]);
        return {
          x: Math.floor(largestElement.center.x),
          y: Math.floor(largestElement.center.y),
          confidence: 0.8,
          reasoning: `Found center/main element: ${largestElement.bounds.width}x${largestElement.bounds.height}px at (${largestElement.center.x}, ${largestElement.center.y})`
        };
      }

      // Strategy 3: Size-based detection
      if (lowerDesc.includes('large') || lowerDesc.includes('big') || lowerDesc.includes('main')) {
        const largeElements = elements.filter(el => el.bounds.width > 200 || el.bounds.height > 150);
        if (largeElements.length > 0) {
          const element = largeElements[0];
          return {
            x: Math.floor(element.center.x),
            y: Math.floor(element.center.y),
            confidence: 0.7,
            reasoning: `Found large element: ${element.bounds.width}x${element.bounds.height}px at (${element.center.x}, ${element.center.y})`
          };
        }
      }

      // Strategy 4: Position-based detection
      if (lowerDesc.includes('top')) {
        const topElements = elements.filter(el => el.center.y < 300);
        if (topElements.length > 0) {
          const element = topElements[0];
          return {
            x: Math.floor(element.center.x),
            y: Math.floor(element.center.y),
            confidence: 0.6,
            reasoning: `Found top element: ${element.bounds.width}x${element.bounds.height}px at (${element.center.x}, ${element.center.y})`
          };
        }
      }

      // Fallback: return the first element
      const element = elements[0];
      return {
        x: Math.floor(element.center.x),
        y: Math.floor(element.center.y),
        confidence: 0.5,
        reasoning: `Using first detected element as fallback: ${element.bounds.width}x${element.bounds.height}px at (${element.center.x}, ${element.center.y})`
      };

    } catch (error) {
      console.error('Error parsing analysis for element detection:', error);
      return null;
    }
  }

  async performHawkeyeAnalysis(target, analysis, imageData) {
    // Advanced pinpointing analysis
    const targetLower = target.toLowerCase();

    // Analyze the screen for the target
    let bestMatch = null;
    let maxConfidence = 0;

    const analysisLines = analysis.split('\n');
    for (const line of analysisLines) {
      if (line.includes('Element at') && line.includes('px')) {
        const match = line.match(/Element at \((\d+), (\d+)\)/);
        if (match) {
          const x = parseInt(match[1]);
          const y = parseInt(match[2]);

          // Calculate confidence based on target matching
          let confidence = 0;
          if (targetLower.includes('button') && line.toLowerCase().includes('button')) confidence = 0.9;
          else if (targetLower.includes('text') && line.toLowerCase().includes('text')) confidence = 0.8;
          else if (targetLower.includes('icon') && line.toLowerCase().includes('icon')) confidence = 0.7;
          else if (targetLower.includes('window') && line.toLowerCase().includes('window')) confidence = 0.8;
          else confidence = 0.3; // Base confidence

          if (confidence > maxConfidence) {
            maxConfidence = confidence;
            bestMatch = { x, y, confidence, element: line };
          }
        }
      }
    }

    return {
      analysis: bestMatch ?
        `Target "${target}" located with ${Math.round(maxConfidence * 100)}% confidence at (${bestMatch.x}, ${bestMatch.y})\nElement: ${bestMatch.element}` :
        `Target "${target}" not found on screen`,
      coordinates: bestMatch ? { x: bestMatch.x, y: bestMatch.y } : null
    };
  }

  async processAIInstruction(instruction, screenAnalysis) {
    // AI instruction processing - Now enhanced with Semantic OCR
    const actions = [];
    const reasoning = `Reasoning about instruction: "${instruction}" using Semantic OCR context...`;
    const instructionLower = instruction.toLowerCase();

    // Strategy 1: Look for exact text matches in the screen analysis
    const lines = screenAnalysis.split('\n');
    for (const line of lines) {
      // Format: N. "TEXT" at (X, Y)
      const match = line.match(/\d+\. \"(.*?)\" at \((\d+), (\d+)\)/);
      if (match) {
        const text = match[1].toLowerCase();
        const x = parseInt(match[2]);
        const y = parseInt(match[3]);

        if (instructionLower.includes(text) && text.length > 2) {
          actions.push({
            type: 'click',
            description: `Clicking on detected text: "${match[1]}"`,
            params: { x, y }
          });
          return { actions, reasoning: `${reasoning}\nFound semantic target on screen: "${match[1]}" at (${x}, ${y})` };
        }
      }
    }

    // Strategy 2: Common applications
    if (instructionLower.includes('firefox') || instructionLower.includes('browser')) {
      actions.push({ type: 'launch', description: 'Launching Firefox', params: { app: 'firefox' } });
    } else if (instructionLower.includes('terminal') || instructionLower.includes('shell')) {
      actions.push({ type: 'launch', description: 'Launching Terminal', params: { app: 'xterm' } });
    }

    return { actions, reasoning };
  }

  selectSecurityTools(scanType, target) {
    const tools = [];

    switch (scanType) {
      case 'quick':
        tools.push('nmap');
        if (target.includes('http') || target.includes('www')) {
          tools.push('nikto');
        }
        break;
      case 'comprehensive':
        tools.push('nmap', 'nikto', 'dirb');
        if (target.match(/^\d+\.\d+\.\d+\.\d+$/)) {
          tools.push('masscan');
        }
        break;
      case 'web':
        tools.push('nikto', 'dirb', 'gobuster', 'sqlmap');
        break;
      case 'network':
        tools.push('nmap', 'masscan', 'zmap');
        break;
      case 'wireless':
        tools.push('airodump-ng', 'kismet');
        break;
    }

    return tools;
  }

  buildSecurityCommand(tool, target, scanType) {
    const commands = {
      nmap: `nmap -sV -T4 ${target}`,
      nikto: `nikto -h ${target}`,
      dirb: `dirb http://${target}`,
      gobuster: `gobuster dir -u http://${target} -w /usr/share/wordlists/dirb/common.txt`,
      sqlmap: `sqlmap -u "http://${target}" --batch --crawl=1`,
      masscan: `masscan ${target} -p1-65535 --rate=1000`,
      zmap: `zmap -p 80 ${target}`,
      'airodump-ng': 'airodump-ng wlan0',
      kismet: 'kismet -c wlan0'
    };

    return commands[tool] || `${tool} ${target}`;
  }

  async analyzeSecurityResults(results, target, scanType) {
    const successful = results.filter(r => r.success).length;
    const total = results.length;

    let analysis = `Scan completed: ${successful}/${total} tools succeeded\n\n`;

    // Analyze findings
    for (const result of results) {
      if (result.success && result.output) {
        if (result.tool === 'nmap' && result.output.includes('open')) {
          analysis += `🔍 Nmap found open ports on ${target}\n`;
        }
        if (result.tool === 'nikto' && result.output.includes('vulnerable')) {
          analysis += `⚠️ Nikto detected potential web vulnerabilities\n`;
        }
      }
    }

    analysis += `\nRecommendations:\n`;
    if (successful > 0) {
      analysis += `- Review detailed scan results for security findings\n`;
      analysis += `- Consider deeper analysis with specialized tools\n`;
    } else {
      analysis += `- Check target accessibility and tool configurations\n`;
      analysis += `- Verify Kali environment is properly set up\n`;
    }

    return analysis;
  }

  async readFile(args) {
    try {
      const { path, encoding = 'utf8' } = args;

      if (encoding === 'base64') {
        const result = await execAsync(`docker exec kali-desktop base64 "${path}"`);
        return {
          content: [{
            type: 'text',
            text: result.stdout.trim()
          }]
        };
      } else {
        const result = await execAsync(`docker exec kali-desktop cat "${path}"`);
        return {
          content: [{
            type: 'text',
            text: result.stdout
          }]
        };
      }
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Failed to read file: ${error.message}` }]
      };
    }
  }

  async writeFile(args) {
    try {
      const { path, content, encoding = 'utf8' } = args;

      // Escape single quotes in content for shell
      const escapedContent = content.replace(/'/g, "'\\''");

      const result = await execAsync(`docker exec kali-desktop bash -c "echo '${escapedContent}' > '${path}'"`);
      return {
        content: [{
          type: 'text',
          text: `Successfully wrote ${content.length} characters to ${path}`
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Failed to write file: ${error.message}` }]
      };
    }
  }

  async listDirectory(args) {
    try {
      const { path = '/root' } = args;

      const result = await execAsync(`docker exec kali-desktop ls -la "${path}"`);
      return {
        content: [{
          type: 'text',
          text: `Contents of ${path}:\n${result.stdout}`
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Failed to list directory: ${error.message}` }]
      };
    }
  }

  async visualThink(args) {
    try {
      const { focus_area, include_context = true } = args;

      // Take screenshot with analysis
      const screenshotResult = await this.takeScreenshot({ analyze: true });

      let analysis = "Visual Thinking Analysis:\n\n";

      // Extract screenshot and analysis data
      const imageContent = screenshotResult.content.find(c => c.type === 'image');
      const textAnalysis = screenshotResult.content.find(c => c.type === 'text' && c.text.includes('OmniParser'));

      if (textAnalysis) {
        analysis += `Current Desktop State:\n${textAnalysis.text}\n\n`;
      }

      if (focus_area) {
        analysis += `Focused Analysis on "${focus_area}":\n`;
        // Perform focused analysis based on the area
        const focusedAnalysis = await this.performFocusedAnalysis(focus_area, textAnalysis?.text || '');
        analysis += focusedAnalysis;
      }

      if (include_context) {
        analysis += `\nBroader Context:\n`;
        analysis += `- Desktop Environment: XFCE on Kali Linux\n`;
        analysis += `- VNC Server: Active on port 5901\n`;
        analysis += `- Web Interface: Available at localhost:6080\n`;
        analysis += `- Container Status: Running\n`;
      }

      const content = [{ type: 'text', text: analysis }];

      // Include screenshot if available
      if (imageContent) {
        content.push(imageContent);
      }

      return { content };

    } catch (error) {
      return {
        content: [{ type: 'text', text: `Visual thinking failed: ${error.message}` }]
      };
    }
  }

  async appStatus(args) {
    try {
      const { app_name } = args;

      // Get running processes
      const psResult = await execAsync(`docker exec kali-desktop ps aux`);

      // Get window information if available
      let windowInfo = '';
      try {
        const windowResult = await execAsync(`docker exec kali-desktop python3 /usr/local/bin/vnc_control.py window`);
        windowInfo = windowResult.stdout;
      } catch (e) {
        windowInfo = 'Window information unavailable';
      }

      let analysis = "Application Status Analysis:\n\n";

      if (app_name) {
        // Check specific application
        const isRunning = psResult.stdout.toLowerCase().includes(app_name.toLowerCase());
        analysis += `Application "${app_name}": ${isRunning ? '🟢 RUNNING' : '🔴 NOT RUNNING'}\n\n`;

        if (isRunning) {
          const lines = psResult.stdout.split('\n').filter(line =>
            line.toLowerCase().includes(app_name.toLowerCase())
          );
          analysis += `Process Details:\n${lines.join('\n')}\n\n`;
        }
      } else {
        // List all running applications
        analysis += "All Running Applications:\n";
        const processes = psResult.stdout.split('\n').filter(line => {
          const cols = line.trim().split(/\s+/);
          return cols.length > 10 && !line.includes('ps aux') && !line.includes('grep');
        });

        const apps = [...new Set(processes.map(line => {
          const cols = line.trim().split(/\s+/);
          return cols[10] || 'unknown'; // CMD column
        }).filter(cmd => cmd && cmd !== 'unknown' && cmd.length > 0))];

        apps.forEach(app => {
          analysis += `- ${app}\n`;
        });
      }

      analysis += `\nWindow Information:\n${windowInfo}`;

      return {
        content: [{ type: 'text', text: analysis }]
      };

    } catch (error) {
      return {
        content: [{ type: 'text', text: `Application status check failed: ${error.message}` }]
      };
    }
  }

  async visualContext(args) {
    try {
      const {
        include_screenshot = true,
        include_running_apps = true,
        include_desktop_state = true,
        focus_elements = []
      } = args;

      const content = [];

      // Comprehensive visual context for LLMs
      let context = "🖥️ Comprehensive Visual Desktop Context for LLM Analysis:\n\n";

      if (include_desktop_state) {
        context += "=== DESKTOP STATE ===\n";
        context += "- Environment: Kali Linux with XFCE Desktop\n";
        context += "- Resolution: 1280x720 (configurable)\n";
        context += "- VNC Server: Active on port 5901\n";
        context += "- Web Access: Available at localhost:6080\n";
        context += "- Container: Docker-based isolation\n\n";
      }

      if (include_running_apps) {
        const appStatus = await this.appStatus({});
        context += "=== RUNNING APPLICATIONS ===\n";
        context += appStatus.content[0].text.split('\n').slice(3).join('\n') + '\n\n';
      }

      if (include_screenshot) {
        const screenshotResult = await this.takeScreenshot({ analyze: true });
        const textAnalysis = screenshotResult.content.find(c => c.type === 'text' && c.text.includes('OmniParser'));

        context += "=== VISUAL ANALYSIS ===\n";
        if (textAnalysis) {
          context += textAnalysis.text + '\n\n';
        }

        // Add screenshot
        const imageContent = screenshotResult.content.find(c => c.type === 'image');
        if (imageContent) {
          content.push(imageContent);
        }
      }

      if (focus_elements && focus_elements.length > 0) {
        context += "=== FOCUSED ELEMENTS ===\n";
        for (const element of focus_elements) {
          const pinpointResult = await this.hawkeyePinpoint({ target: element, action: 'analyze' });
          context += `Analysis of "${element}":\n${pinpointResult.content[0].text}\n\n`;
        }
      }

      context += "=== AVAILABLE ACTIONS ===\n";
      context += "- Click elements by description or coordinates\n";
      context += "- Type text and press keys\n";
      context += "- Launch applications\n";
      context += "- Execute security commands\n";
      context += "- Read/write files\n";
      context += "- Perform security scans\n\n";

      context += "=== AI CAPABILITIES ===\n";
      context += "- Natural language element interaction\n";
      context += "- Hawkeye precision targeting\n";
      context += "- Visual thinking and analysis\n";
      context += "- Automated security workflows\n";
      context += "- Comprehensive desktop control\n";

      content.unshift({ type: 'text', text: context });

      return { content };

    } catch (error) {
      return {
        content: [{ type: 'text', text: `Visual context generation failed: ${error.message}` }]
      };
    }
  }

  async performFocusedAnalysis(focusArea, screenAnalysis) {
    // ... Existing implementation ...
  }

  // --- UPGRADED LEARNING & MEMORY COMPONENTS ---

  async rememberExperience(args) {
    try {
      const { task_id = `task_${Date.now()}`, instruction, steps, success } = args;
      const memoryDir = '/app/memory';
      
      // Ensure memory directory exists
      await execAsync(`docker exec kali-desktop mkdir -p ${memoryDir}`);

      const experience = {
        task_id,
        timestamp: new Date().toISOString(),
        instruction,
        steps,
        success,
        environment: 'Kali Linux XFCE'
      };

      const filename = `${task_id}.json`;
      const content = JSON.stringify(experience, null, 2);
      const b64Content = Buffer.from(content).toString('base64');
      
      await execAsync(`docker exec kali-desktop bash -c "echo '${b64Content}' | base64 -d > ${memoryDir}/${filename}"`);

      return {
        content: [{ 
          type: 'text', 
          text: `🧠 Successfully remembered task: "${instruction}". Experience saved as ${filename}` 
        }]
      };
    } catch (error) {
      return { content: [{ type: 'text', text: `Failed to save memory: ${error.message}` }] };
    }
  }

  async recallExperience(args) {
    try {
      const { query } = args;
      const memoryDir = '/app/memory';
      
      // List all memories
      const { stdout } = await execAsync(`docker exec kali-desktop ls ${memoryDir}`);
      const files = stdout.split('\n').filter(f => f.endsWith('.json'));

      const results = [];
      for (const file of files) {
        const { stdout: fileContent } = await execAsync(`docker exec kali-desktop cat ${memoryDir}/${file}`);
        const experience = JSON.parse(fileContent);
        
        // Simple search logic
        if (experience.instruction.toLowerCase().includes(query.toLowerCase())) {
          results.push(experience);
        }
      }

      if (results.length === 0) {
        return { content: [{ type: 'text', text: `No past experiences found for query: "${query}"` }] };
      }

      return {
        content: [{ 
          type: 'text', 
          text: `🔍 Recalled ${results.length} similar experiences:\n\n${results.map(r => 
            `- [${r.success ? '✅' : '❌'}] Task: "${r.instruction}"\n  Steps: ${r.steps.length}`
          ).join('\n')}` 
        }]
      };
    } catch (error) {
      return { content: [{ type: 'text', text: `Recall failed: ${error.message}` }] };
    }
  }

  async generateTrainingData(args) {
    try {
      const memoryDir = '/app/memory';
      const { stdout } = await execAsync(`docker exec kali-desktop ls ${memoryDir}`);
      const files = stdout.split('\n').filter(f => f.endsWith('.json'));

      const dataset = [];
      for (const file of files) {
        const { stdout: fileContent } = await execAsync(`docker exec kali-desktop cat ${memoryDir}/${file}`);
        const experience = JSON.parse(fileContent);
        
        // Convert to training format (Instruction -> Output)
        dataset.push({
          instruction: experience.instruction,
          input: "Kali Linux Desktop Screenshot",
          output: experience.steps.map(s => JSON.stringify(s)).join('\n')
        });
      }

      const trainFile = '/app/kali_vlm_train.jsonl';
      const content = dataset.map(d => JSON.stringify(d)).join('\n');
      const b64Content = Buffer.from(content).toString('base64');
      
      await execAsync(`docker exec kali-desktop bash -c "echo '${b64Content}' | base64 -d > ${trainFile}"`);

      return {
        content: [{ 
          type: 'text', 
          text: `🚀 Training data generated! ${dataset.length} trajectories exported to ${trainFile}. Ready for VLM fine-tuning.` 
        }]
      };
    } catch (error) {
      return { content: [{ type: 'text', text: `Training data generation failed: ${error.message}` }] };
    }
  }

  async run() {
    // Start HTTP server for MCP endpoint
    const PORT = process.env.MCP_PORT || 3000;

    // MCP endpoint
    app.post('/mcp', async (req, res) => {
      try {
        const { method, params, id } = req.body;

        let result;
        switch (method) {
          case 'initialize':
            result = {
              protocolVersion: "2024-11-05",
              capabilities: {
                tools: { listChanged: true }
              },
              serverInfo: {
                name: 'kali-desktop-mcp',
                version: '2.0.0'
              }
            };
            break;

          case 'tools/list':
            result = this.getToolsList();
            break;

          case 'tools/call':
            result = await this.callTool(params);
            break;

          default:
            throw new Error(`Unknown method: ${method}`);
        }

        res.json({
          jsonrpc: "2.0",
          id: id,
          result: result
        });
      } catch (error) {
        res.status(500).json({
          jsonrpc: "2.0",
          id: req.body.id,
          error: {
            code: -32000,
            message: error.message
          }
        });
      }
    });

    app.listen(PORT, () => {
      console.error(`Kali Desktop MCP HTTP server listening on port ${PORT}`);
    });

    // Also start stdio transport for compatibility
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Kali Desktop MCP server running with visual AI capabilities');
  }

  getToolsList() {
    return {
      tools: [
        {
          name: 'kali_screenshot',
          description: 'Take a screenshot of the Kali desktop with optional OmniParser UI analysis',
          inputSchema: {
            type: 'object',
            properties: {
              analyze: { type: 'boolean', description: 'Use OmniParser to analyze UI elements (default: false)' }
            }
          }
        },
        {
          name: 'kali_click',
          description: 'Click at specific coordinates on the desktop',
          inputSchema: {
            type: 'object',
            properties: {
              x: { type: 'number', description: 'X coordinate' },
              y: { type: 'number', description: 'Y coordinate' },
              button: { type: 'string', enum: ['left', 'right', 'middle'], default: 'left' }
            },
            required: ['x', 'y']
          }
        },
        {
          name: 'kali_click_element',
          description: 'AI-powered click on UI elements using natural language descriptions',
          inputSchema: {
            type: 'object',
            properties: {
              description: { type: 'string', description: 'Natural language description of the element to click' },
              button: { type: 'string', enum: ['left', 'right', 'middle'], default: 'left' }
            },
            required: ['description']
          }
        },
        {
          name: 'kali_hawkeye_pinpoint',
          description: 'Hawkeye-style AI pinpointing for precise element targeting and analysis',
          inputSchema: {
            type: 'object',
            properties: {
              target: { type: 'string', description: 'What to pinpoint (element, text, icon, etc.)' },
              action: { type: 'string', enum: ['locate', 'analyze', 'highlight'], default: 'locate' }
            },
            required: ['target']
          }
        },
        {
          name: 'kali_ai_interact',
          description: 'Advanced AI-powered desktop interaction with intelligent automation',
          inputSchema: {
            type: 'object',
            properties: {
              instruction: { type: 'string', description: 'Natural language instruction for AI to execute' },
              analyze_screen: { type: 'boolean', description: 'Whether to analyze screen before action', default: true }
            },
            required: ['instruction']
          }
        },
        {
          name: 'kali_type',
          description: 'Type text on the desktop',
          inputSchema: {
            type: 'object',
            properties: {
              text: { type: 'string', description: 'Text to type' }
            },
            required: ['text']
          }
        },
        {
          name: 'kali_key',
          description: 'Press keyboard keys or combinations',
          inputSchema: {
            type: 'object',
            properties: {
              keys: { type: 'string', description: 'Key combination (e.g., "ctrl+c", "alt+tab", "Return")' }
            },
            required: ['keys']
          }
        },
        {
          name: 'kali_drag',
          description: 'Drag from one position to another on the desktop',
          inputSchema: {
            type: 'object',
            properties: {
              x1: { type: 'number', description: 'Start X coordinate' },
              y1: { type: 'number', description: 'Start Y coordinate' },
              x2: { type: 'number', description: 'End X coordinate' },
              y2: { type: 'number', description: 'End Y coordinate' },
              button: { type: 'string', enum: ['left', 'right', 'middle'], default: 'left' }
            },
            required: ['x1', 'y1', 'x2', 'y2']
          }
        },
        {
          name: 'kali_execute',
          description: 'Execute a command in the Kali container',
          inputSchema: {
            type: 'object',
            properties: {
              command: { type: 'string', description: 'Command to execute' }
            },
            required: ['command']
          }
        },
        {
          name: 'kali_launch_app',
          description: 'Launch an application on the desktop',
          inputSchema: {
            type: 'object',
            properties: {
              app: { type: 'string', description: 'Application command (e.g., "firefox", "wireshark", "xterm")' }
            },
            required: ['app']
          }
        },
        {
          name: 'kali_security_scan',
          description: 'AI-powered security scanning with automated tool selection and execution',
          inputSchema: {
            type: 'object',
            properties: {
              target: { type: 'string', description: 'Target to scan (IP, domain, network range)' },
              scan_type: { type: 'string', enum: ['quick', 'comprehensive', 'web', 'network', 'wireless'], default: 'quick' },
              tools: { type: 'array', items: { type: 'string' }, description: 'Specific tools to use (optional)' }
            },
            required: ['target']
          }
        },
        {
          name: 'kali_status',
          description: 'Check if Kali desktop is running',
          inputSchema: { type: 'object', properties: {} }
        },
        {
          name: 'kali_read_file',
          description: 'Read a file from the Kali container filesystem',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'File path to read' },
              encoding: { type: 'string', enum: ['utf8', 'base64'], default: 'utf8' }
            },
            required: ['path']
          }
        },
        {
          name: 'kali_write_file',
          description: 'Write content to a file in the Kali container',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'File path to write' },
              content: { type: 'string', description: 'Content to write' },
              encoding: { type: 'string', enum: ['utf8', 'base64'], default: 'utf8' }
            },
            required: ['path', 'content']
          }
        },
        {
          name: 'kali_list_directory',
          description: 'List contents of a directory in the Kali container',
          inputSchema: {
            type: 'object',
            properties: {
              path: { type: 'string', description: 'Directory path to list', default: '/root' }
            }
          }
        },
        {
          name: 'kali_visual_think',
          description: 'Perform visual thinking analysis of the current desktop state',
          inputSchema: {
            type: 'object',
            properties: {
              focus_area: { type: 'string', description: 'Specific area to focus analysis on (optional)' },
              include_context: { type: 'boolean', description: 'Include broader context analysis', default: true }
            }
          }
        },
        {
          name: 'kali_app_status',
          description: 'Check status of running applications with visual confirmation',
          inputSchema: {
            type: 'object',
            properties: {
              app_name: { type: 'string', description: 'Application name to check (optional - checks all if not specified)' }
            }
          }
        },
        {
          name: 'kali_visual_context',
          description: 'Provide comprehensive visual context for LLM understanding',
          inputSchema: {
            type: 'object',
            properties: {
              include_screenshot: { type: 'boolean', description: 'Include screenshot in context', default: true },
              include_running_apps: { type: 'boolean', description: 'Include running applications', default: true },
              include_desktop_state: { type: 'boolean', description: 'Include desktop state analysis', default: true },
              focus_elements: { type: 'array', items: { type: 'string' }, description: 'Specific elements to focus on' }
            }
          }
        },
        {
          name: 'kali_remember',
          description: 'Save a successful workflow or experience to the MCP memory for future learning',
          inputSchema: {
            type: 'object',
            properties: {
              task_id: { type: 'string', description: 'Unique ID for the task' },
              instruction: { type: 'string', description: 'What was the goal?' },
              steps: { type: 'array', items: { type: 'object' }, description: 'Sequence of actions taken' },
              success: { type: 'boolean', description: 'Was the goal achieved?' }
            },
            required: ['instruction', 'steps', 'success']
          }
        },
        {
          name: 'kali_recall',
          description: 'Search memory for past experiences or "skills" that might help with a new task',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'The task description to search for' }
            },
            required: ['query']
          }
        },
        {
          name: 'kali_train_vlm',
          description: 'Prepare training data for Vision-Language Models from collected desktop interactions',
          inputSchema: {
            type: 'object',
            properties: {
              task_category: { type: 'string', description: 'Filter by task type' }
            }
          }
        }
      ]
    };
  }

  async callTool(params) {
    const { name, arguments: args } = params;

    try {
      switch (name) {
        case 'kali_screenshot':
          return await this.takeScreenshot(args);
        case 'kali_click':
          return await this.clickMouse(args);
        case 'kali_click_element':
          return await this.clickElement(args);
        case 'kali_hawkeye_pinpoint':
          return await this.hawkeyePinpoint(args);
        case 'kali_ai_interact':
          return await this.aiInteract(args);
        case 'kali_type':
          return await this.typeText(args);
        case 'kali_key':
          return await this.pressKey(args);
        case 'kali_drag':
          return await this.dragMouse(args);
        case 'kali_execute':
          return await this.executeCommand(args.command);
        case 'kali_launch_app':
          return await this.launchApp(args);
        case 'kali_security_scan':
          return await this.securityScan(args);
        case 'kali_status':
          return await this.checkStatus();
        case 'kali_read_file':
          return await this.readFile(args);
        case 'kali_write_file':
          return await this.writeFile(args);
        case 'kali_list_directory':
          return await this.listDirectory(args);
        case 'kali_visual_think':
          return await this.visualThink(args);
        case 'kali_app_status':
          return await this.appStatus(args);
        case 'kali_visual_context':
          return await this.visualContext(args);
        case 'kali_remember':
          return await this.rememberExperience(args);
        case 'kali_recall':
          return await this.recallExperience(args);
        case 'kali_train_vlm':
          return await this.generateTrainingData(args);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    } catch (error) {
      throw new Error(`Tool execution failed: ${error.message}`);
    }
  }
}

const server = new KaliDesktopMCP();
server.run().catch(console.error);
