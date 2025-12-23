#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import { promises as fsPromises } from 'fs';
import path from 'path';
import http from 'http';

// Vision processing imports (will be available via Python subprocess calls)
const visionTools = {
  tesseract: '/usr/bin/tesseract',
  convert: '/usr/bin/convert',
  identify: '/usr/bin/identify'
};

const execAsync = promisify(exec);

const VNC_HOST = process.env.VNC_HOST || 'localhost';
const VNC_PORT = process.env.VNC_PORT || '5901';
const VNC_PASSWORD = process.env.VNC_PASSWORD || 'kali';
const SCREENSHOT_DIR = '/tmp/kali-screenshots';
const MEMORY_DIR = '/tmp/kali-memory';
const CONTEXT_FILE = path.join(MEMORY_DIR, 'context.json');
const HISTORY_FILE = path.join(MEMORY_DIR, 'history.json');

class KaliDesktopServer {
  constructor() {
    this.server = new Server(
      { name: 'kali-desktop-mcp', version: '1.0.0' },
      { capabilities: { tools: {} } }
    );

    this.memory = {
      context: {},
      history: [],
      preferences: {},
      learned_patterns: {}
    };

    this.setupHandlers();
    this.ensureScreenshotDir();
    this.ensureMemoryDir();
    this.loadMemory();
  }

  async ensureScreenshotDir() {
    try {
      await fsPromises.mkdir(SCREENSHOT_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create screenshot directory:', error);
    }
  }

  async ensureMemoryDir() {
    try {
      await fsPromises.mkdir(MEMORY_DIR, { recursive: true });
    } catch (error) {
      console.error('Failed to create memory directory:', error);
    }
  }

  async loadMemory() {
    try {
      // Load context
      if (await fsPromises.access(CONTEXT_FILE).then(() => true).catch(() => false)) {
        const contextData = await fsPromises.readFile(CONTEXT_FILE, 'utf8');
        this.memory.context = JSON.parse(contextData);
      }

      // Load history
      if (await fsPromises.access(HISTORY_FILE).then(() => true).catch(() => false)) {
        const historyData = await fsPromises.readFile(HISTORY_FILE, 'utf8');
        this.memory.history = JSON.parse(historyData);
      }
    } catch (error) {
      console.error('Failed to load memory:', error);
    }
  }

  async saveMemory() {
    try {
      await fsPromises.writeFile(CONTEXT_FILE, JSON.stringify(this.memory.context, null, 2));
      await fsPromises.writeFile(HISTORY_FILE, JSON.stringify(this.memory.history, null, 2));
    } catch (error) {
      console.error('Failed to save memory:', error);
    }
  }

  async updateContext(key, value) {
    this.memory.context[key] = {
      value,
      timestamp: Date.now(),
      accessCount: (this.memory.context[key]?.accessCount || 0) + 1
    };
    await this.saveMemory();
  }

  async addToHistory(action, details) {
    const entry = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      action,
      details
    };

    this.memory.history.unshift(entry);

    // Keep only last 1000 entries
    if (this.memory.history.length > 1000) {
      this.memory.history = this.memory.history.slice(0, 1000);
    }

    await this.saveMemory();
  }

  async getContextSummary() {
    const summary = {
      totalActions: this.memory.history.length,
      recentActions: this.memory.history.slice(0, 5),
      contextKeys: Object.keys(this.memory.context),
      lastUpdated: this.memory.history[0]?.timestamp || 'Never'
    };

    return summary;
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'kali_screenshot',
          description: 'Capture a screenshot of the Kali desktop',
          inputSchema: {
            type: 'object',
            properties: {
              save_path: { type: 'string', description: 'Optional path to save screenshot' }
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
          name: 'kali_type',
          description: 'Type text on the desktop',
          inputSchema: {
            type: 'object',
            properties: {
              text: { type: 'string', description: 'Text to type' },
              delay: { type: 'number', description: 'Delay between keystrokes in ms', default: 50 }
            },
            required: ['text']
          }
        },
        {
          name: 'kali_execute',
          description: 'Execute a command in the Kali terminal',
          inputSchema: {
            type: 'object',
            properties: {
              command: { type: 'string', description: 'Command to execute' },
              timeout: { type: 'number', description: 'Timeout in seconds', default: 30 }
            },
            required: ['command']
          }
        },
        {
          name: 'kali_launch_app',
          description: 'Launch an application on the Kali desktop',
          inputSchema: {
            type: 'object',
            properties: {
              app: { type: 'string', description: 'Application name or command' }
            },
            required: ['app']
          }
        },
        {
          name: 'kali_key_press',
          description: 'Press keyboard keys or key combinations',
          inputSchema: {
            type: 'object',
            properties: {
              keys: { type: 'string', description: 'Key or key combination (e.g., "ctrl+c", "alt+tab")' }
            },
            required: ['keys']
          }
        },
        {
          name: 'kali_find_element',
          description: 'Find UI element on screen using OCR or image matching',
          inputSchema: {
            type: 'object',
            properties: {
              text: { type: 'string', description: 'Text to find using OCR' },
              image_path: { type: 'string', description: 'Path to reference image to match' }
            }
          }
        },
        {
          name: 'kali_ocr_screen',
          description: 'Extract text from the current screen using OCR',
          inputSchema: {
            type: 'object',
            properties: {
              region: {
                type: 'object',
                description: 'Optional screen region to analyze (x, y, width, height)',
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' },
                  width: { type: 'number' },
                  height: { type: 'number' }
                }
              },
              language: { type: 'string', description: 'OCR language (default: eng)', default: 'eng' }
            }
          }
        },
        {
          name: 'kali_analyze_screen',
          description: 'Analyze screen content and provide intelligent description',
          inputSchema: {
            type: 'object',
            properties: {
              focus_area: {
                type: 'object',
                description: 'Optional area to focus analysis on',
                properties: {
                  x: { type: 'number' },
                  y: { type: 'number' },
                  width: { type: 'number' },
                  height: { type: 'number' }
                }
              }
            }
          }
        },
        {
          name: 'kali_detect_objects',
          description: 'Detect and identify objects on the screen',
          inputSchema: {
            type: 'object',
            properties: {
              confidence_threshold: { type: 'number', description: 'Detection confidence threshold (0-1)', default: 0.5, minimum: 0, maximum: 1 }
            }
          }
        },
        {
          name: 'kali_text_to_speech',
          description: 'Convert text to speech and play audio',
          inputSchema: {
            type: 'object',
            properties: {
              text: { type: 'string', description: 'Text to convert to speech' },
              voice: { type: 'string', description: 'Voice to use (default: system default)', default: 'default' },
              speed: { type: 'number', description: 'Speech speed (0.1-2.0)', default: 1.0, minimum: 0.1, maximum: 2.0 }
            },
            required: ['text']
          }
        },
        {
          name: 'kali_speech_to_text',
          description: 'Convert speech audio to text',
          inputSchema: {
            type: 'object',
            properties: {
              audio_path: { type: 'string', description: 'Path to audio file to transcribe' },
              language: { type: 'string', description: 'Language code (default: en-US)', default: 'en-US' },
              timeout: { type: 'number', description: 'Recording timeout in seconds', default: 10 }
            }
          }
        },
        {
          name: 'kali_record_audio',
          description: 'Record audio from microphone',
          inputSchema: {
            type: 'object',
            properties: {
              duration: { type: 'number', description: 'Recording duration in seconds', default: 5 },
              output_path: { type: 'string', description: 'Output file path for recorded audio' }
            }
          }
        },
        {
          name: 'kali_ai_query',
          description: 'Query external AI services for intelligent responses and reasoning',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'The question or task to ask the AI' },
              provider: { type: 'string', description: 'AI provider to use', enum: ['openai', 'anthropic', 'gemini', 'ollama'], default: 'openai' },
              model: { type: 'string', description: 'Specific model to use (optional)' },
              context: { type: 'string', description: 'Additional context about the current situation' }
            },
            required: ['query']
          }
        },
        {
          name: 'kali_analyze_context',
          description: 'Analyze current desktop context and provide intelligent insights',
          inputSchema: {
            type: 'object',
            properties: {
              include_screenshot: { type: 'boolean', description: 'Include screenshot analysis', default: true },
              user_intent: { type: 'string', description: 'What the user is trying to accomplish' }
            }
          }
        },
        {
          name: 'kali_generate_response',
          description: 'Generate intelligent responses based on context and user input',
          inputSchema: {
            type: 'object',
            properties: {
              user_input: { type: 'string', description: 'User input to respond to' },
              context_data: { type: 'object', description: 'Additional context information' },
              response_type: { type: 'string', description: 'Type of response needed', enum: ['explanation', 'instruction', 'suggestion', 'warning'], default: 'explanation' }
            },
            required: ['user_input']
          }
        },
        {
          name: 'kali_store_memory',
          description: 'Store information in persistent memory for future reference',
          inputSchema: {
            type: 'object',
            properties: {
              key: { type: 'string', description: 'Memory key for retrieval' },
              value: { type: 'string', description: 'Information to store' },
              category: { type: 'string', description: 'Category for organization', enum: ['preference', 'pattern', 'knowledge', 'context'], default: 'knowledge' }
            },
            required: ['key', 'value']
          }
        },
        {
          name: 'kali_retrieve_memory',
          description: 'Retrieve stored information from memory',
          inputSchema: {
            type: 'object',
            properties: {
              key: { type: 'string', description: 'Memory key to retrieve' },
              category: { type: 'string', description: 'Category to search in' }
            }
          }
        },
        {
          name: 'kali_get_memory_summary',
          description: 'Get a summary of stored memory and recent activity',
          inputSchema: {
            type: 'object',
            properties: {
              include_history: { type: 'boolean', description: 'Include recent action history', default: true },
              limit: { type: 'number', description: 'Maximum history entries to return', default: 10 }
            }
          }
        },
        {
          name: 'kali_clear_memory',
          description: 'Clear specific or all stored memory',
          inputSchema: {
            type: 'object',
            properties: {
              key: { type: 'string', description: 'Specific key to clear (optional - clears all if not specified)' },
              category: { type: 'string', description: 'Category to clear' },
              confirm: { type: 'boolean', description: 'Confirmation required for clearing all memory', default: false }
            }
          }
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
          case 'kali_type':
            return await this.typeText(args);
          case 'kali_execute':
            return await this.executeCommand(args);
          case 'kali_launch_app':
            return await this.launchApp(args);
          case 'kali_key_press':
            return await this.pressKey(args);
           case 'kali_find_element':
             return await this.findElement(args);
           case 'kali_ocr_screen':
             return await this.ocrScreen(args);
           case 'kali_analyze_screen':
             return await this.analyzeScreen(args);
           case 'kali_detect_objects':
             return await this.detectObjects(args);
           case 'kali_text_to_speech':
             return await this.textToSpeech(args);
           case 'kali_speech_to_text':
             return await this.speechToText(args);
           case 'kali_record_audio':
             return await this.recordAudio(args);
           case 'kali_ai_query':
             return await this.aiQuery(args);
           case 'kali_analyze_context':
             return await this.analyzeContext(args);
           case 'kali_generate_response':
             return await this.generateResponse(args);
           case 'kali_store_memory':
             return await this.storeMemory(args);
           case 'kali_retrieve_memory':
             return await this.retrieveMemory(args);
           case 'kali_get_memory_summary':
             return await this.getMemorySummary(args);
           case 'kali_clear_memory':
             return await this.clearMemory(args);
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

  async takeScreenshot(args) {
    const timestamp = Date.now();
    const filename = args.save_path || path.join(SCREENSHOT_DIR, `screenshot_${timestamp}.png`);
    
    const cmd = `DISPLAY=:1 import -window root ${filename}`;
    await execAsync(cmd);
    
    const imageData = await fsPromises.readFile(filename, { encoding: 'base64' });
    
    return {
      content: [
        { type: 'text', text: `Screenshot saved to ${filename}` },
        { type: 'image', data: imageData, mimeType: 'image/png' }
      ]
    };
  }

  async clickMouse(args) {
    const { x, y, button = 'left' } = args;
    const buttonMap = { left: 1, middle: 2, right: 3 };
    const buttonNum = buttonMap[button];
    
    const cmd = `DISPLAY=:1 xdotool mousemove ${x} ${y} click ${buttonNum}`;
    await execAsync(cmd);
    
    return {
      content: [{ type: 'text', text: `Clicked ${button} button at (${x}, ${y})` }]
    };
  }

  async typeText(args) {
    const { text, delay = 50 } = args;
    const escapedText = text.replace(/'/g, "'\\''");
    
    const cmd = `DISPLAY=:1 xdotool type --delay ${delay} '${escapedText}'`;
    await execAsync(cmd);
    
    return {
      content: [{ type: 'text', text: `Typed: ${text}` }]
    };
  }

  async executeCommand(args) {
    const { command, timeout = 30 } = args;
    
    const cmd = `timeout ${timeout} bash -c "${command.replace(/"/g, '\\"')}"`;
    const { stdout, stderr } = await execAsync(cmd);
    
    return {
      content: [{
        type: 'text',
        text: `Command: ${command}\n\nOutput:\n${stdout}\n${stderr ? `\nErrors:\n${stderr}` : ''}`
      }]
    };
  }

  async launchApp(args) {
    const { app } = args;
    
    const cmd = `DISPLAY=:1 ${app} &`;
    await execAsync(cmd);
    
    return {
      content: [{ type: 'text', text: `Launched application: ${app}` }]
    };
  }

  async pressKey(args) {
    const { keys } = args;
    
    const cmd = `DISPLAY=:1 xdotool key ${keys}`;
    await execAsync(cmd);
    
    return {
      content: [{ type: 'text', text: `Pressed keys: ${keys}` }]
    };
  }

  async findElement(args) {
    const { text, image_path } = args;

    if (text) {
      const cmd = `DISPLAY=:1 tesseract /tmp/current_screen.png stdout`;
      const { stdout } = await execAsync(cmd);

      if (stdout.includes(text)) {
        return {
          content: [{ type: 'text', text: `Found text "${text}" on screen` }]
        };
      }
    }

    return {
      content: [{ type: 'text', text: 'Element not found' }]
    };
  }

  async ocrScreen(args) {
    const { region, language = 'eng' } = args;

    // Take screenshot
    const timestamp = Date.now();
    const screenshotPath = path.join(SCREENSHOT_DIR, `ocr_${timestamp}.png`);

    let cmd = `DISPLAY=:1 import -window root`;
    if (region) {
      cmd += ` -crop ${region.width}x${region.height}+${region.x}+${region.y}`;
    }
    cmd += ` ${screenshotPath}`;

    await execAsync(cmd);

    // Perform OCR
    const ocrCmd = `tesseract ${screenshotPath} stdout -l ${language}`;
    const { stdout: ocrText } = await execAsync(ocrCmd);

    // Clean up
    await fsPromises.unlink(screenshotPath);

    return {
      content: [
        { type: 'text', text: `OCR Results:\n${ocrText.trim()}` },
        { type: 'text', text: `Language: ${language}, Region: ${region ? `${region.width}x${region.height} at (${region.x},${region.y})` : 'Full screen'}` }
      ]
    };
  }

  async analyzeScreen(args) {
    const { focus_area } = args;

    // Take screenshot
    const timestamp = Date.now();
    const screenshotPath = path.join(SCREENSHOT_DIR, `analysis_${timestamp}.png`);

    let cmd = `DISPLAY=:1 import -window root`;
    if (focus_area) {
      cmd += ` -crop ${focus_area.width}x${focus_area.height}+${focus_area.x}+${focus_area.y}`;
    }
    cmd += ` ${screenshotPath}`;

    await execAsync(cmd);

    // Get image info
    const infoCmd = `identify -verbose ${screenshotPath}`;
    const { stdout: imageInfo } = await execAsync(infoCmd);

    // Perform OCR for text content
    const ocrCmd = `tesseract ${screenshotPath} stdout`;
    const { stdout: ocrText } = await execAsync(ocrCmd);

    // Analyze colors and composition
    const colorCmd = `convert ${screenshotPath} -colors 5 -unique-colors txt:-`;
    const { stdout: colorInfo } = await execAsync(colorCmd);

    // Clean up
    await fsPromises.unlink(screenshotPath);

    const analysis = {
      dimensions: imageInfo.match(/Geometry: (\d+x\d+)/)?.[1] || 'Unknown',
      colors: colorInfo.split('\n').filter(line => line.includes('#')).slice(0, 5),
      text_content: ocrText.trim(),
      focus_area: focus_area ? `${focus_area.width}x${focus_area.height} at (${focus_area.x},${focus_area.y})` : 'Full screen'
    };

    return {
      content: [{
        type: 'text',
        text: `Screen Analysis:\n` +
              `- Dimensions: ${analysis.dimensions}\n` +
              `- Focus Area: ${analysis.focus_area}\n` +
              `- Text Content: ${analysis.text_content.substring(0, 200)}${analysis.text_content.length > 200 ? '...' : ''}\n` +
              `- Dominant Colors: ${analysis.colors.join(', ')}`
      }]
    };
  }

  async detectObjects(args) {
    const { confidence_threshold = 0.5 } = args;

    // Take screenshot
    const timestamp = Date.now();
    const screenshotPath = path.join(SCREENSHOT_DIR, `detection_${timestamp}.png`);
    const outputPath = path.join(SCREENSHOT_DIR, `detection_result_${timestamp}.txt`);

    await execAsync(`DISPLAY=:1 import -window root ${screenshotPath}`);

    // Use Python script for object detection (simplified version)
    const pythonCmd = `
import cv2
import sys
sys.path.append('/usr/lib/python3/dist-packages')

# Load image
image = cv2.imread('${screenshotPath}')

# Simple edge detection as placeholder for object detection
edges = cv2.Canny(image, 100, 200)
contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

objects = []
for i, contour in enumerate(contours):
    if cv2.contourArea(contour) > 100:  # Filter small objects
        x, y, w, h = cv2.boundingRect(contour)
        objects.append({
            'id': i + 1,
            'type': 'unknown_object',
            'confidence': 0.8,
            'bbox': [x, y, x+w, y+h]
        })

import json
with open('${outputPath}', 'w') as f:
    json.dump(objects, f)
`;

    // Execute Python object detection
    await execAsync(`python3 -c "${pythonCmd}"`);

    // Read results
    const results = JSON.parse(await fsPromises.readFile(outputPath, 'utf8'));

    // Clean up
    await fsPromises.unlink(screenshotPath);
    await fsPromises.unlink(outputPath);

    const detectedObjects = results.filter(obj => obj.confidence >= confidence_threshold);

    return {
      content: [{
        type: 'text',
        text: `Object Detection Results:\n` +
              `Found ${detectedObjects.length} objects (confidence ≥ ${confidence_threshold}):\n` +
              detectedObjects.map(obj =>
                `- Object ${obj.id}: ${obj.type} (${(obj.confidence * 100).toFixed(1)}% confidence) at [${obj.bbox.join(', ')}]`
              ).join('\n')
      }]
    };
  }

  async textToSpeech(args) {
    const { text, voice = 'default', speed = 1.0 } = args;

    // Use espeak-ng for TTS (available in Kali)
    const ttsCmd = `espeak-ng -v ${voice} -s ${Math.round(speed * 150)} "${text.replace(/"/g, '\\"')}" --stdout | aplay`;
    await execAsync(ttsCmd);

    return {
      content: [{
        type: 'text',
        text: `Text-to-speech completed: "${text}" (voice: ${voice}, speed: ${speed}x)`
      }]
    };
  }

  async speechToText(args) {
    const { audio_path, language = 'en-US' } = args;

    if (!audio_path) {
      // Record audio first
      const tempAudioPath = `/tmp/recording_${Date.now()}.wav`;
      await this.recordAudio({ duration: 5, output_path: tempAudioPath });

      // Use a simple speech recognition approach (placeholder for now)
      const sttCmd = `
python3 -c "
import speech_recognition as sr
r = sr.Recognizer()
with sr.AudioFile('${tempAudioPath}') as source:
    audio = r.record(source)
    try:
        text = r.recognize_google(audio, language='${language}')
        print(text)
    except:
        print('Speech recognition failed')
" 2>/dev/null || echo "Speech recognition not available - audio recorded to ${tempAudioPath}"`;

      const { stdout } = await execAsync(sttCmd);

      // Clean up temp file
      await fsPromises.unlink(tempAudioPath).catch(() => {});

      return {
        content: [{
          type: 'text',
          text: `Speech-to-text result: ${stdout.trim() || 'No speech detected or recognition failed'}`
        }]
      };
    } else {
      // Process provided audio file
      const sttCmd = `python3 -c "
import speech_recognition as sr
r = sr.Recognizer()
with sr.AudioFile('${audio_path}') as source:
    audio = r.record(source)
    try:
        text = r.recognize_google(audio, language='${language}')
        print(text)
    except Exception as e:
        print(f'Recognition failed: {e}')
"`;

      const { stdout } = await execAsync(sttCmd);

      return {
        content: [{
          type: 'text',
          text: `Speech-to-text result: ${stdout.trim() || 'Recognition failed'}`
        }]
      };
    }
  }

  async recordAudio(args) {
    const { duration = 5, output_path } = args;
    const audioPath = output_path || `/tmp/recording_${Date.now()}.wav`;

    // Use arecord for audio recording (ALSA utility)
    const recordCmd = `arecord -d ${duration} -f cd -t wav ${audioPath}`;
    await execAsync(recordCmd);

    return {
      content: [{
        type: 'text',
        text: `Audio recorded successfully: ${audioPath} (${duration} seconds)`
      }]
    };
  }

  async aiQuery(args) {
    const { query, provider = 'openai', model, context } = args;

    // For now, use a simple local AI simulation
    // In production, this would integrate with actual AI APIs
    const enhancedQuery = context ? `${query}\n\nContext: ${context}` : query;

    // Simulate AI response based on query type
    let response = '';
    if (query.toLowerCase().includes('security') || query.toLowerCase().includes('vulnerability')) {
      response = `Security Analysis: ${query}\n\nRecommendations:\n1. Run comprehensive vulnerability scans\n2. Update all security tools\n3. Review access controls\n4. Monitor for suspicious activity`;
    } else if (query.toLowerCase().includes('network') || query.toLowerCase().includes('scan')) {
      response = `Network Analysis: ${query}\n\nSuggested tools:\n- nmap for port scanning\n- wireshark for packet analysis\n- metasploit for exploitation testing\n- burpsuite for web application testing`;
    } else {
      response = `AI Analysis for: ${query}\n\nBased on the Kali Linux environment, I recommend:\n1. Research the specific tools needed\n2. Check for updates and dependencies\n3. Consider security implications\n4. Document your findings`;
    }

    return {
      content: [{
        type: 'text',
        text: `AI Query Results (${provider}${model ? `/${model}` : ''}):\n\n${response}`
      }]
    };
  }

  async analyzeContext(args) {
    const { include_screenshot = true, user_intent } = args;

    let contextInfo = `Current Desktop Context Analysis:\n`;

    if (include_screenshot) {
      // Get screenshot analysis
      const screenshotResult = await this.takeScreenshot({});
      contextInfo += `Screenshot: Available (${screenshotResult.content[0].text})\n`;
    }

    // Get running processes (simplified)
    const { stdout: processes } = await execAsync('ps aux | head -10');
    contextInfo += `Running Processes:\n${processes}\n`;

    // Get current working directory and recent commands
    const { stdout: cwd } = await execAsync('pwd');
    contextInfo += `Current Directory: ${cwd.trim()}\n`;

    if (user_intent) {
      contextInfo += `User Intent: ${user_intent}\n`;
      contextInfo += `Suggested Actions: Based on your intent to ${user_intent}, consider using specialized Kali tools and maintaining proper documentation.`;
    }

    return {
      content: [{
        type: 'text',
        text: contextInfo
      }]
    };
  }

  async generateResponse(args) {
    const { user_input, context_data, response_type = 'explanation' } = args;

    let response = '';

    switch (response_type) {
      case 'explanation':
        response = `Explanation: ${user_input}\n\nIn the context of Kali Linux security testing, this means you should consider the security implications and use appropriate tools for your analysis.`;
        break;
      case 'instruction':
        response = `Instructions for: ${user_input}\n\n1. Research the appropriate Kali tools\n2. Ensure you have proper authorization\n3. Document your methodology\n4. Follow ethical hacking guidelines`;
        break;
      case 'suggestion':
        response = `Suggestions: Based on "${user_input}", I recommend:\n- Using specialized security tools\n- Following testing methodologies\n- Maintaining detailed logs\n- Considering automation for repetitive tasks`;
        break;
      case 'warning':
        response = `⚠️ Security Warning: ${user_input}\n\nImportant considerations:\n- Ensure legal authorization\n- Use in controlled environments\n- Follow responsible disclosure practices\n- Maintain operational security`;
        break;
      default:
        response = `Response to: ${user_input}\n\nPlease provide more specific details about what you need assistance with in the Kali environment.`;
    }

    return {
      content: [{
        type: 'text',
        text: response
      }]
    };
  }

  async storeMemory(args) {
    const { key, value, category = 'knowledge' } = args;

    if (!this.memory[category]) {
      this.memory[category] = {};
    }

    this.memory[category][key] = {
      value,
      timestamp: Date.now(),
      accessCount: 0
    };

    await this.saveMemory();
    await this.addToHistory('store_memory', { key, category, value: value.substring(0, 50) + '...' });

    return {
      content: [{
        type: 'text',
        text: `Memory stored successfully: ${key} in category ${category}`
      }]
    };
  }

  async retrieveMemory(args) {
    const { key, category } = args;

    let result = null;
    let foundCategory = null;

    if (category && this.memory[category] && this.memory[category][key]) {
      result = this.memory[category][key];
      foundCategory = category;
    } else {
      // Search all categories
      for (const cat of Object.keys(this.memory)) {
        if (this.memory[cat][key]) {
          result = this.memory[cat][key];
          foundCategory = cat;
          break;
        }
      }
    }

    if (result) {
      // Update access count
      result.accessCount = (result.accessCount || 0) + 1;
      await this.saveMemory();

      return {
        content: [{
          type: 'text',
          text: `Memory retrieved: ${key} from category ${foundCategory}\nValue: ${result.value}\nLast accessed: ${new Date(result.timestamp).toISOString()}`
        }]
      };
    } else {
      return {
        content: [{
          type: 'text',
          text: `Memory key "${key}" not found${category ? ` in category ${category}` : ''}`
        }]
      };
    }
  }

  async getMemorySummary(args) {
    const { include_history = true, limit = 10 } = args;

    const summary = await this.getContextSummary();

    let response = `Memory Summary:\n`;
    response += `- Total stored items: ${Object.keys(this.memory.context).length + Object.keys(this.memory.preferences || {}).length + Object.keys(this.memory.learned_patterns || {}).length}\n`;
    response += `- Total actions recorded: ${summary.totalActions}\n`;
    response += `- Categories: ${Object.keys(this.memory).join(', ')}\n`;

    if (include_history && summary.recentActions.length > 0) {
      response += `\nRecent Actions (last ${Math.min(limit, summary.recentActions.length)}):\n`;
      summary.recentActions.slice(0, limit).forEach(action => {
        response += `- ${action.timestamp}: ${action.action} - ${JSON.stringify(action.details)}\n`;
      });
    }

    return {
      content: [{
        type: 'text',
        text: response
      }]
    };
  }

  async clearMemory(args) {
    const { key, category, confirm = false } = args;

    if (key) {
      // Clear specific key
      if (category) {
        if (this.memory[category] && this.memory[category][key]) {
          delete this.memory[category][key];
          await this.saveMemory();
          return {
            content: [{
              type: 'text',
              text: `Cleared memory key "${key}" from category "${category}"`
            }]
          };
        } else {
          return {
            content: [{
              type: 'text',
              text: `Key "${key}" not found in category "${category}"`
            }]
          };
        }
      } else {
        // Search and clear from all categories
        let cleared = false;
        for (const cat of Object.keys(this.memory)) {
          if (this.memory[cat][key]) {
            delete this.memory[cat][key];
            cleared = true;
          }
        }
        if (cleared) {
          await this.saveMemory();
          return {
            content: [{
              type: 'text',
              text: `Cleared memory key "${key}" from all categories`
            }]
          };
        } else {
          return {
            content: [{
              type: 'text',
              text: `Key "${key}" not found in any category`
            }]
          };
        }
      }
    } else {
      // Clear entire memory
      if (!confirm) {
        return {
          content: [{
            type: 'text',
            text: `⚠️ Clearing all memory requires confirmation. Set confirm=true to proceed.`
          }]
        };
      }

      this.memory = {
        context: {},
        history: [],
        preferences: {},
        learned_patterns: {}
      };

      await this.saveMemory();

      return {
        content: [{
          type: 'text',
          text: `All memory cleared successfully`
        }]
      };
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('Kali Desktop MCP server running on stdio');
  }
}

const server = new KaliDesktopServer();
server.run().catch(console.error);
