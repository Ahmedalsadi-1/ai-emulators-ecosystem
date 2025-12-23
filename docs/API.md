# AI Emulators Ecosystem - API Documentation

## Table of Contents

1. [API Overview](#api-overview)
2. [Service Endpoints](#service-endpoints)
3. [MCP Tool Specifications](#mcp-tool-specifications)
4. [Authentication](#authentication)
5. [Integration Examples](#integration-examples)
6. [SDK Usage Guides](#sdk-usage-guides)
7. [API Reference](#api-reference)

## API Overview

The AI Emulators Ecosystem provides multiple APIs for different interaction patterns:

- **REST APIs**: Traditional HTTP endpoints for service management
- **WebSocket APIs**: Real-time communication for streaming data
- **MCP APIs**: Model Context Protocol for AI agent tool integration
- **GraphQL APIs**: Flexible querying for complex data relationships

### API Design Principles

- **RESTful Design**: Standard HTTP methods and status codes
- **Versioning**: API versioning through URL paths (`/api/v1/`)
- **Consistent Response Format**: Standardized JSON responses
- **Comprehensive Error Handling**: Detailed error messages and codes
- **Rate Limiting**: Request throttling with clear limits
- **Pagination**: Cursor-based pagination for large datasets
- **Filtering and Sorting**: Query parameter support
- **HATEOAS**: Hypermedia links in responses

### Base URL

```
Production: https://api.ai-ecosystem.com/api/v1
Development: http://localhost:8000/api/v1
```

## Service Endpoints

### AIOS (AI Operating System) API

#### Core AI Operations

**POST /api/v1/ai/generate**
Generate AI responses using configured models

```http
POST /api/v1/ai/generate
Content-Type: application/json
Authorization: Bearer <token>

{
  "prompt": "Explain quantum computing",
  "model": "gpt-4-turbo-preview",
  "max_tokens": 1000,
  "temperature": 0.7,
  "stream": false
}
```

**Response:**
```json
{
  "id": "gen_1234567890",
  "object": "text_completion",
  "created": 1677610602,
  "model": "gpt-4-turbo-preview",
  "choices": [
    {
      "text": "Quantum computing uses quantum mechanics...",
      "index": 0,
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 4,
    "completion_tokens": 150,
    "total_tokens": 154
  }
}
```

**POST /api/v1/ai/chat**
Multi-turn conversation with context management

```http
POST /api/v1/ai/chat
Content-Type: application/json
Authorization: Bearer <token>

{
  "messages": [
    {"role": "system", "content": "You are a helpful assistant"},
    {"role": "user", "content": "Hello!"}
  ],
  "model": "gpt-4-turbo-preview",
  "stream": true
}
```

**Streaming Response:**
```json
{
  "id": "chatcmpl_123",
  "object": "chat.completion.chunk",
  "created": 1677652288,
  "model": "gpt-4-turbo-preview",
  "choices": [
    {
      "index": 0,
      "delta": {"content": "Hello"},
      "finish_reason": null
    }
  ]
}
```

#### Memory Management

**GET /api/v1/memory/{session_id}**
Retrieve conversation memory

```http
GET /api/v1/memory/session_123
Authorization: Bearer <token>
```

**Response:**
```json
{
  "session_id": "session_123",
  "messages": [
    {
      "role": "user",
      "content": "Hello",
      "timestamp": "2024-01-01T10:00:00Z"
    },
    {
      "role": "assistant",
      "content": "Hi there!",
      "timestamp": "2024-01-01T10:00:01Z"
    }
  ],
  "metadata": {
    "created": "2024-01-01T09:59:00Z",
    "last_updated": "2024-01-01T10:00:01Z",
    "message_count": 2
  }
}
```

**POST /api/v1/memory/{session_id}/search**
Search through conversation history

```http
POST /api/v1/memory/session_123/search
Content-Type: application/json
Authorization: Bearer <token>

{
  "query": "quantum computing",
  "limit": 10,
  "similarity_threshold": 0.7
}
```

### Computer Control APIs

#### Bytebot API

**POST /api/v1/computer/screenshot**
Capture desktop screenshot

```http
POST /api/v1/computer/screenshot
Content-Type: application/json
Authorization: Bearer <token>

{
  "display": ":0",
  "quality": 80,
  "format": "png"
}
```

**Response:**
```json
{
  "screenshot_id": "scr_123456",
  "timestamp": "2024-01-01T10:00:00Z",
  "dimensions": {
    "width": 1920,
    "height": 1080
  },
  "size_bytes": 245760,
  "data_url": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}
```

**POST /api/v1/computer/click**
Simulate mouse click

```http
POST /api/v1/computer/click
Content-Type: application/json
Authorization: Bearer <token>

{
  "x": 100,
  "y": 200,
  "button": "left",
  "display": ":0"
}
```

#### Open-Interface API

**GET /api/v1/interface/windows**
List open windows

```http
GET /api/v1/interface/windows
Authorization: Bearer <token>
```

**Response:**
```json
{
  "windows": [
    {
      "id": "win_123",
      "title": "Terminal",
      "application": "gnome-terminal",
      "bounds": {
        "x": 100,
        "y": 100,
        "width": 800,
        "height": 600
      },
      "focused": true
    }
  ]
}
```

**POST /api/v1/interface/keyboard**
Send keyboard input

```http
POST /api/v1/interface/keyboard
Content-Type: application/json
Authorization: Bearer <token>

{
  "text": "Hello World",
  "window_id": "win_123"
}
```

### Social Media APIs

#### Postiz API

**GET /api/v1/social/posts**
List scheduled posts

```http
GET /api/v1/social/posts?status=scheduled&limit=20
Authorization: Bearer <token>
```

**Response:**
```json
{
  "posts": [
    {
      "id": "post_123",
      "content": "Exciting new AI developments! #AI #Tech",
      "platforms": ["twitter", "linkedin"],
      "scheduled_time": "2024-01-02T10:00:00Z",
      "status": "scheduled",
      "created_at": "2024-01-01T09:00:00Z"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 0,
    "has_more": true
  }
}
```

**POST /api/v1/social/posts**
Create new scheduled post

```http
POST /api/v1/social/posts
Content-Type: application/json
Authorization: Bearer <token>

{
  "content": "New AI breakthrough announced! #AI #Innovation",
  "platforms": ["twitter", "facebook"],
  "scheduled_time": "2024-01-05T14:00:00Z",
  "media_urls": [
    "https://example.com/ai-breakthrough.png"
  ]
}
```

#### OnlySnarf API

**GET /api/v1/onlysnarf/content**
List content items

```http
GET /api/v1/onlysnarf/content?status=published&type=image
Authorization: Bearer <token>
```

**POST /api/v1/onlysnarf/upload**
Upload content

```http
POST /api/v1/onlysnarf/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

--boundary
Content-Disposition: form-data; name="file"; filename="content.jpg"
Content-Type: image/jpeg

<file_data>
--boundary
Content-Disposition: form-data; name="metadata"

{
  "title": "Exclusive AI Content",
  "description": "Behind the scenes AI development",
  "price": 9.99,
  "tags": ["AI", "exclusive"]
}
--boundary--
```

### Content Generation APIs

#### Wan2GP API

**POST /api/v1/video/generate**
Generate video from text prompt

```http
POST /api/v1/video/generate
Content-Type: application/json
Authorization: Bearer <token>

{
  "prompt": "A futuristic city with flying cars and AI robots",
  "duration": 10,
  "resolution": "1920x1080",
  "style": "cinematic",
  "audio": {
    "enabled": true,
    "voiceover": "Welcome to the future of AI",
    "background_music": "electronic"
  }
}
```

**Response:**
```json
{
  "generation_id": "gen_video_123",
  "status": "processing",
  "estimated_duration": 300,
  "progress_url": "/api/v1/video/generation/gen_video_123/progress",
  "result_url": "/api/v1/video/generation/gen_video_123/result",
  "created_at": "2024-01-01T10:00:00Z"
}
```

**GET /api/v1/video/generation/{id}/progress**
Check generation progress

```http
GET /api/v1/video/generation/gen_video_123/progress
Authorization: Bearer <token>
```

**Response:**
```json
{
  "generation_id": "gen_video_123",
  "status": "completed",
  "progress": 100,
  "stage": "finalizing",
  "estimated_time_remaining": 0,
  "download_url": "https://cdn.ai-ecosystem.com/videos/gen_video_123.mp4"
}
```

## MCP Tool Specifications

### Core MCP Tool Schema

All MCP tools follow this base schema:

```typescript
interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

interface MCPToolResponse {
  content: Array<{
    type: "text" | "image" | "data";
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}
```

### Kali Desktop Tools

#### kali_screenshot
```typescript
const kaliScreenshotTool: MCPTool = {
  name: "kali_screenshot",
  description: "Take a screenshot of the Kali desktop with optional UI analysis",
  inputSchema: {
    type: "object",
    properties: {
      analyze: {
        type: "boolean",
        description: "Use OmniParser to analyze UI elements",
        default: false
      },
      quality: {
        type: "number",
        description: "Screenshot quality (1-100)",
        minimum: 1,
        maximum: 100,
        default: 80
      }
    }
  }
};

// Example usage
const result = await callTool("kali_screenshot", { analyze: true });
/*
{
  content: [
    { type: "text", text: "Screenshot captured successfully" },
    { type: "image", data: "base64...", mimeType: "image/png" },
    { type: "text", text: "OmniParser Analysis:\nFound 15 UI elements..." }
  ]
}
*/
```

#### kali_click
```typescript
const kaliClickTool: MCPTool = {
  name: "kali_click",
  description: "Click at specific coordinates on the desktop",
  inputSchema: {
    type: "object",
    properties: {
      x: { type: "number", description: "X coordinate" },
      y: { type: "number", description: "Y coordinate" },
      button: {
        type: "string",
        enum: ["left", "right", "middle"],
        default: "left",
        description: "Mouse button to use"
      }
    },
    required: ["x", "y"]
  }
};
```

#### kali_type
```typescript
const kaliTypeTool: MCPTool = {
  name: "kali_type",
  description: "Type text on the desktop",
  inputSchema: {
    type: "object",
    properties: {
      text: { type: "string", description: "Text to type" },
      delay: {
        type: "number",
        description: "Delay between keystrokes (ms)",
        default: 50
      }
    },
    required: ["text"]
  }
};
```

#### kali_execute
```typescript
const kaliExecuteTool: MCPTool = {
  name: "kali_execute",
  description: "Execute a command in the Kali container",
  inputSchema: {
    type: "object",
    properties: {
      command: { type: "string", description: "Shell command to execute" },
      timeout: {
        type: "number",
        description: "Command timeout in seconds",
        default: 30
      },
      working_directory: {
        type: "string",
        description: "Working directory for command execution"
      }
    },
    required: ["command"]
  }
};
```

### Computer Control Tools

#### screenshot
```typescript
const screenshotTool: MCPTool = {
  name: "computer_screenshot",
  description: "Capture a screenshot of the computer screen",
  inputSchema: {
    type: "object",
    properties: {
      display: {
        type: "string",
        description: "Display identifier",
        default: ":0"
      },
      region: {
        type: "object",
        description: "Region to capture",
        properties: {
          x: { type: "number" },
          y: { type: "number" },
          width: { type: "number" },
          height: { type: "number" }
        }
      }
    }
  }
};
```

#### click
```typescript
const clickTool: MCPTool = {
  name: "computer_click",
  description: "Perform mouse click at coordinates",
  inputSchema: {
    type: "object",
    properties: {
      x: { type: "number", description: "X coordinate" },
      y: { type: "number", description: "Y coordinate" },
      button: {
        type: "string",
        enum: ["left", "right", "middle"],
        default: "left"
      },
      double_click: {
        type: "boolean",
        description: "Perform double click",
        default: false
      }
    },
    required: ["x", "y"]
  }
};
```

### Social Media Tools

#### post_content
```typescript
const postContentTool: MCPTool = {
  name: "social_post",
  description: "Post content to social media platforms",
  inputSchema: {
    type: "object",
    properties: {
      content: { type: "string", description: "Post content" },
      platforms: {
        type: "array",
        items: {
          type: "string",
          enum: ["twitter", "facebook", "instagram", "linkedin"]
        },
        description: "Target platforms"
      },
      media_urls: {
        type: "array",
        items: { type: "string" },
        description: "Media URLs to attach"
      },
      scheduled_time: {
        type: "string",
        format: "date-time",
        description: "Schedule post for later"
      }
    },
    required: ["content", "platforms"]
  }
};
```

### Video Generation Tools

#### generate_video
```typescript
const generateVideoTool: MCPTool = {
  name: "video_generate",
  description: "Generate video from text prompt using AI",
  inputSchema: {
    type: "object",
    properties: {
      prompt: {
        type: "string",
        description: "Text description of desired video"
      },
      duration: {
        type: "number",
        description: "Video duration in seconds",
        minimum: 5,
        maximum: 300,
        default: 10
      },
      style: {
        type: "string",
        enum: ["realistic", "animated", "cinematic", "abstract"],
        default: "cinematic"
      },
      resolution: {
        type: "string",
        enum: ["720p", "1080p", "4K"],
        default: "1080p"
      },
      audio: {
        type: "object",
        description: "Audio settings",
        properties: {
          enabled: { type: "boolean", default: true },
          voiceover: { type: "string" },
          background_music: { type: "string" }
        }
      }
    },
    required: ["prompt"]
  }
};
```

## Authentication

### JWT Token Authentication

#### Obtaining Access Tokens

**POST /api/v1/auth/login**
```http
POST /api/v1/auth/login
Content-Type: application/json

{
  "username": "user@example.com",
  "password": "secure_password"
}
```

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_token_here"
}
```

#### Using Tokens in Requests

```bash
curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
     http://localhost:8000/api/v1/ai/generate
```

#### Token Refresh

**POST /api/v1/auth/refresh**
```http
POST /api/v1/auth/refresh
Content-Type: application/json

{
  "refresh_token": "refresh_token_here"
}
```

### API Key Authentication

#### Creating API Keys

**POST /api/v1/auth/api-keys**
```http
POST /api/v1/auth/api-keys
Content-Type: application/json
Authorization: Bearer <token>

{
  "name": "My Application",
  "permissions": ["ai:read", "computer:write"],
  "expires_at": "2024-12-31T23:59:59Z"
}
```

#### Using API Keys

```bash
curl -H "X-API-Key: your_api_key_here" \
     http://localhost:8000/api/v1/ai/generate
```

### OAuth2 Authentication

#### Authorization Code Flow

1. **Redirect to authorization endpoint**
   ```
   GET /api/v1/auth/oauth/authorize?client_id=client123&redirect_uri=https://app.example.com/callback&scope=ai:read&response_type=code
   ```

2. **Exchange code for tokens**
   ```http
   POST /api/v1/auth/oauth/token
   Content-Type: application/x-www-form-urlencoded

   grant_type=authorization_code&code=auth_code_here&redirect_uri=https://app.example.com/callback&client_id=client123&client_secret=secret123
   ```

## Integration Examples

### Python SDK Integration

```python
from ai_ecosystem_sdk import AIEcosystemClient

# Initialize client
client = AIEcosystemClient(
    api_key="your_api_key",
    base_url="https://api.ai-ecosystem.com/api/v1"
)

# AI text generation
response = client.ai.generate(
    prompt="Explain machine learning",
    model="gpt-4-turbo-preview",
    max_tokens=500
)
print(response.choices[0].text)

# Computer automation
screenshot = client.computer.screenshot(display=":0")
print(f"Captured screenshot: {screenshot.screenshot_id}")

# Social media posting
post = client.social.create_post(
    content="Exciting AI developments! #AI",
    platforms=["twitter", "linkedin"],
    scheduled_time="2024-01-02T10:00:00Z"
)
print(f"Post scheduled: {post.id}")

# Video generation
video = client.video.generate(
    prompt="A beautiful sunset over mountains",
    duration=15,
    style="cinematic"
)
print(f"Video generation started: {video.generation_id}")
```

### JavaScript/Node.js Integration

```javascript
const { AIEcosystemAPI } = require('ai-ecosystem-sdk');

async function main() {
    const api = new AIEcosystemAPI({
        apiKey: 'your_api_key',
        baseURL: 'https://api.ai-ecosystem.com/api/v1'
    });

    // AI chat completion
    const chatResponse = await api.ai.chat({
        messages: [
            { role: 'system', content: 'You are a helpful assistant' },
            { role: 'user', content: 'Hello!' }
        ],
        model: 'gpt-4-turbo-preview',
        stream: true
    });

    for await (const chunk of chatResponse) {
        process.stdout.write(chunk.choices[0].delta.content || '');
    }

    // MCP tool usage
    const mcpClient = api.mcp.connect('kali-desktop');

    const screenshot = await mcpClient.callTool('kali_screenshot', {
        analyze: true
    });

    console.log('Screenshot captured:', screenshot.content[0].text);

    // Batch operations
    const results = await Promise.all([
        api.computer.click({ x: 100, y: 200 }),
        api.computer.type({ text: 'Hello World' }),
        api.computer.screenshot()
    ]);

    console.log('Batch operations completed');
}

main().catch(console.error);
```

### MCP Protocol Integration

```javascript
// MCP Client implementation
const { MCPClient } = require('@ai-ecosystem/mcp-client');

async function useMCPServices() {
    const client = new MCPClient({
        registryURL: 'http://localhost:8002',
        authToken: 'your_jwt_token'
    });

    // Discover available tools
    const tools = await client.discoverTools();
    console.log('Available tools:', tools.map(t => t.name));

    // Use Kali desktop tools
    const screenshot = await client.callTool('kali_screenshot', {
        analyze: true
    });

    // Use computer control
    await client.callTool('computer_click', { x: 500, y: 300 });
    await client.callTool('computer_type', { text: 'Automation test' });

    // Use social media tools
    await client.callTool('social_post', {
        content: 'AI automation in action! 🤖',
        platforms: ['twitter']
    });

    // Batch tool execution
    const batchResults = await client.batchTools([
        { name: 'kali_screenshot', args: {} },
        { name: 'computer_screenshot', args: { display: ':0' } },
        { name: 'video_generate', args: {
            prompt: 'AI robots working',
            duration: 10
        }}
    ]);

    console.log('Batch results:', batchResults);
}
```

### Webhook Integration

```javascript
// Webhook handler for real-time updates
const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

// Webhook signature verification
function verifyWebhookSignature(req, secret) {
    const signature = req.headers['x-webhook-signature'];
    const expectedSignature = crypto
        .createHmac('sha256', secret)
        .update(JSON.stringify(req.body))
        .digest('hex');

    return crypto.timingSafeEqual(
        Buffer.from(signature, 'hex'),
        Buffer.from(expectedSignature, 'hex')
    );
}

app.post('/webhooks/video-complete', (req, res) => {
    if (!verifyWebhookSignature(req, process.env.WEBHOOK_SECRET)) {
        return res.status(401).json({ error: 'Invalid signature' });
    }

    const { generation_id, status, download_url } = req.body;

    if (status === 'completed') {
        console.log(`Video ${generation_id} completed: ${download_url}`);
        // Process completed video
        processVideoCompletion(generation_id, download_url);
    }

    res.json({ received: true });
});

app.post('/webhooks/social-post', (req, res) => {
    const { post_id, platform, status, engagement } = req.body;

    console.log(`Post ${post_id} on ${platform}: ${status}`);
    console.log('Engagement:', engagement);

    res.json({ received: true });
});

app.listen(3000, () => {
    console.log('Webhook server listening on port 3000');
});
```

## SDK Usage Guides

### Installation

```bash
# Python SDK
pip install ai-ecosystem-sdk

# Node.js SDK
npm install @ai-ecosystem/sdk

# Go SDK
go get github.com/ai-ecosystem/go-sdk

# Java SDK
<dependency>
    <groupId>com.ai-ecosystem</groupId>
    <artifactId>sdk</artifactId>
    <version>1.0.0</version>
</dependency>
```

### Python SDK Usage

```python
from ai_ecosystem_sdk import AIEcosystemClient
import asyncio

async def main():
    # Initialize client
    client = AIEcosystemClient(
        api_key="your_api_key",
        base_url="https://api.ai-ecosystem.com/api/v1"
    )

    # AI Operations
    response = await client.ai.generate_completion(
        prompt="Write a Python function to calculate fibonacci numbers",
        model="gpt-4-turbo-preview",
        temperature=0.3
    )

    # Streaming responses
    async for chunk in client.ai.stream_completion(
        prompt="Tell me a story",
        model="gpt-4-turbo-preview"
    ):
        print(chunk.content, end="")

    # Computer automation
    screenshot = await client.computer.capture_screenshot()
    click_result = await client.computer.click_at(100, 200)

    # Social media management
    posts = await client.social.get_scheduled_posts(limit=10)
    new_post = await client.social.schedule_post(
        content="AI breakthrough! #AI #Tech",
        platforms=["twitter", "linkedin"],
        scheduled_time="2024-01-02T10:00:00Z"
    )

    # Video generation
    video_job = await client.video.generate_video(
        prompt="A serene mountain landscape at sunset",
        duration=30,
        style="cinematic"
    )

    # Wait for completion
    status = await client.video.wait_for_completion(video_job.id)
    if status.status == "completed":
        download_url = status.download_url

if __name__ == "__main__":
    asyncio.run(main())
```

### Node.js SDK Usage

```javascript
const { AIEcosystemClient } = require('@ai-ecosystem/sdk');

async function main() {
    const client = new AIEcosystemClient({
        apiKey: 'your_api_key',
        baseURL: 'https://api.ai-ecosystem.com/api/v1'
    });

    // AI chat with memory
    const conversation = client.ai.createConversation();

    const response1 = await conversation.sendMessage(
        'Hello, I need help with a project'
    );

    const response2 = await conversation.sendMessage(
        'What did I just say I needed help with?'
    );

    // Tool chaining
    const tools = client.tools.createChain([
        'computer_screenshot',
        'kali_screenshot',
        'video_generate'
    ]);

    const result = await tools.execute({
        screenshot: { display: ':0' },
        video: {
            prompt: 'Create a video based on the screenshot',
            duration: 15
        }
    });

    // Real-time monitoring
    const monitor = client.monitor.createMonitor({
        services: ['aios', 'kali-desktop', 'wan2gp'],
        interval: 5000
    });

    monitor.on('status_change', (service, status) => {
        console.log(`${service} status: ${status}`);
    });

    monitor.on('metric_alert', (metric, value, threshold) => {
        console.log(`Alert: ${metric} = ${value} (threshold: ${threshold})`);
    });

    // Batch operations
    const batch = client.batch.create();

    batch.add(client.ai.generateCompletion({
        prompt: 'Write code',
        model: 'gpt-4'
    }));

    batch.add(client.computer.clickAt(500, 300));
    batch.add(client.social.schedulePost({ ... }));

    const results = await batch.execute();

    // Error handling
    try {
        await client.video.generateVideo({
            prompt: 'Invalid prompt that might fail'
        });
    } catch (error) {
        if (error.code === 'INVALID_PROMPT') {
            console.log('Please provide a more detailed prompt');
        } else {
            console.error('Video generation failed:', error.message);
        }
    }
}

main().catch(console.error);
```

### Advanced Integration Patterns

#### Circuit Breaker Pattern

```javascript
class CircuitBreaker {
    constructor(client, options = {}) {
        this.client = client;
        this.failureThreshold = options.failureThreshold || 5;
        this.resetTimeout = options.resetTimeout || 60000;
        this.failures = 0;
        this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
        this.nextAttempt = 0;
    }

    async call(method, ...args) {
        if (this.state === 'OPEN') {
            if (Date.now() < this.nextAttempt) {
                throw new Error('Circuit breaker is OPEN');
            }
            this.state = 'HALF_OPEN';
        }

        try {
            const result = await this.client[method](...args);
            this.onSuccess();
            return result;
        } catch (error) {
            this.onFailure();
            throw error;
        }
    }

    onSuccess() {
        this.failures = 0;
        this.state = 'CLOSED';
    }

    onFailure() {
        this.failures++;
        if (this.failures >= this.failureThreshold) {
            this.state = 'OPEN';
            this.nextAttempt = Date.now() + this.resetTimeout;
        }
    }
}

// Usage
const breaker = new CircuitBreaker(client.ai, {
    failureThreshold: 3,
    resetTimeout: 30000
});

const response = await breaker.call('generateCompletion', {
    prompt: 'Hello world',
    model: 'gpt-4'
});
```

#### Retry with Exponential Backoff

```javascript
class RetryClient {
    constructor(client, options = {}) {
        this.client = client;
        this.maxRetries = options.maxRetries || 3;
        this.baseDelay = options.baseDelay || 1000;
        this.maxDelay = options.maxDelay || 30000;
    }

    async callWithRetry(method, args, retryCount = 0) {
        try {
            return await this.client[method](...args);
        } catch (error) {
            if (retryCount < this.maxRetries && this.isRetryable(error)) {
                const delay = Math.min(
                    this.baseDelay * Math.pow(2, retryCount),
                    this.maxDelay
                );

                await new Promise(resolve => setTimeout(resolve, delay));
                return this.callWithRetry(method, args, retryCount + 1);
            }
            throw error;
        }
    }

    isRetryable(error) {
        // Retry on network errors, 5xx responses, rate limits
        return error.code === 'NETWORK_ERROR' ||
               error.status >= 500 ||
               error.status === 429;
    }
}

// Usage
const retryClient = new RetryClient(client.ai);
const response = await retryClient.callWithRetry('generateCompletion', [{
    prompt: 'Complex analysis that might timeout',
    model: 'gpt-4-turbo-preview',
    max_tokens: 2000
}]);
```

## API Reference

### Common Response Format

All API responses follow this structure:

```json
{
  "success": true,
  "data": {
    // Response-specific data
  },
  "metadata": {
    "request_id": "req_1234567890",
    "timestamp": "2024-01-01T10:00:00Z",
    "version": "v1",
    "processing_time_ms": 150
  },
  "pagination": {
    "total": 100,
    "limit": 20,
    "offset": 0,
    "has_more": true,
    "next_url": "/api/v1/items?offset=20",
    "prev_url": null
  },
  "links": {
    "self": "/api/v1/items/123",
    "related": "/api/v1/items/123/related"
  }
}
```

### Error Response Format

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input parameters",
    "details": {
      "field": "prompt",
      "issue": "cannot be empty"
    },
    "request_id": "req_1234567890",
    "timestamp": "2024-01-01T10:00:00Z"
  },
  "metadata": {
    "version": "v1"
  }
}
```

### HTTP Status Codes

- **200 OK**: Successful request
- **201 Created**: Resource created successfully
- **202 Accepted**: Request accepted for processing
- **400 Bad Request**: Invalid request parameters
- **401 Unauthorized**: Authentication required
- **403 Forbidden**: Insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict
- **422 Unprocessable Entity**: Validation error
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server error
- **502 Bad Gateway**: Gateway error
- **503 Service Unavailable**: Service temporarily unavailable
- **504 Gateway Timeout**: Request timeout

### Rate Limiting

API requests are rate limited based on user tier:

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1640995200
X-RateLimit-Retry-After: 60
```

### Pagination

```http
# Cursor-based pagination
GET /api/v1/items?limit=20&cursor=eyJpZCI6MTIzLCJjcmVhdGVkX2F0IjoiMjAyNC0wMS0wMVQxMDowMDowMFoifQ%3D%3D

# Offset-based pagination
GET /api/v1/items?limit=20&offset=40

# Response with pagination info
{
  "data": [...],
  "pagination": {
    "total": 150,
    "limit": 20,
    "offset": 40,
    "has_more": true,
    "next_cursor": "next_cursor_value"
  }
}
```

### Filtering and Sorting

```http
# Filtering
GET /api/v1/posts?status=published&platform=twitter&created_after=2024-01-01

# Sorting
GET /api/v1/posts?sort=created_at:desc,engagement:asc

# Field selection
GET /api/v1/posts?fields=id,content,created_at,engagement

# Search
GET /api/v1/posts?search=quantum+computing&search_fields=content,tags
```

---

For authentication details, see [AUTHENTICATION.md](./AUTHENTICATION.md)
For SDK documentation, see [SDK.md](./SDK.md)
For webhook documentation, see [WEBHOOKS.md](./WEBHOOKS.md)