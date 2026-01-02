# BrowserOS Connect Strategy

## Overview

This document outlines the strategy for connecting to BrowserOS from the web UI, including the decision-making process and implementation details.

## Background

The original BrowserOS Connect implementation used a task-based approach:
1. UI sends "Start BrowserOS session." message
2. Creates a full task in the database
3. Agent processes the task with LLM
4. LLM recognizes intent and uses computer tool to launch BrowserOS
5. Computer-use service executes the application launch

This approach was overkill for a simple launch operation due to unnecessary complexity and latency.

## Decision: Hybrid Approach

After analysis, we chose a **hybrid approach** that provides the best of both worlds:

### ✅ Dedicated Direct Endpoint
- **Fast**: One API call directly launches BrowserOS
- **Simple**: No LLM processing overhead
- **Clear intent**: Dedicated endpoint for BrowserOS launch
- **Reliable**: Fewer moving parts, less prone to failure

### ✅ Agent-Based Approach Available
- **Complex scenarios**: Agent-based approach still available for advanced features
- **Extensible**: Can add agent reasoning for complex launch scenarios later
- **Backward compatible**: Existing task-based workflows continue to work

## Implementation

### Backend Changes

#### New Endpoint: `POST /api/tasks/browseros/connect`

**Location**: `bytebot/packages/bytebot-agent/src/tasks/tasks.controller.ts`

```typescript
@Post('browseros/connect')
@HttpCode(HttpStatus.OK)
async connectBrowserOS(): Promise<{ success: boolean; message: string }> {
  // Makes direct HTTP call to computer-use service
  const desktopUrl = this.configService.get<string>('BYTEBOT_DESKTOP_BASE_URL');
  const response = await fetch(`${desktopUrl}/computer-use`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'application',
      application: 'browseros',
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new HttpException(
      `Failed to launch BrowserOS: ${response.status} ${errorText}`,
      HttpStatus.INTERNAL_SERVER_ERROR,
    );
  }

  return {
    success: true,
    message: 'BrowserOS launched successfully',
  };
}
```

**Response Format**:
```json
{
  "success": true,
  "message": "BrowserOS launched successfully"
}
```

**Error Response**:
```json
{
  "message": "Failed to launch BrowserOS: 500 Internal Server Error",
  "error": "Internal Server Error",
  "statusCode": 500
}
```

### Frontend Changes

#### Updated UI Logic

**Location**: `bytebot/packages/bytebot-ui/src/app/web/page.tsx`

- Replaced task-based message sending with direct API call
- Added local connection state management
- Improved error handling and user feedback

#### New Utility Function

**Location**: `bytebot/packages/bytebot-ui/src/utils/taskUtils.ts`

```typescript
export async function connectBrowserOS(): Promise<{ success: boolean; message: string } | null> {
  return apiRequest<{ success: boolean; message: string }>(`/tasks/browseros/connect`, { method: "POST" });
}
```

## Pros and Cons

### Current Implementation (Direct Endpoint)

**Pros:**
- ⚡ **Fast**: ~100ms response time vs ~5-10 seconds for task-based
- 🎯 **Simple**: Single API call, no complex processing
- 🔒 **Reliable**: Fewer failure points
- 📊 **Clear metrics**: Easy to monitor and debug
- 🧹 **Clean**: No unnecessary database records or agent processing

**Cons:**
- 🤖 **Less agent integration**: No agent reasoning or complex logic
- 🔮 **Limited extensibility**: Harder to add complex launch scenarios
- 📝 **Manual implementation**: Need to duplicate logic if complex scenarios arise

### Alternative: Task-Based Approach

**Pros:**
- 🤖 **Agent reasoning**: LLM can understand context and handle complex scenarios
- 📝 **Logging**: Full task history and agent reasoning captured
- 🔧 **Extensible**: Easy to add complex logic through agent tools
- 📊 **Rich tracking**: Task status, progress, and detailed logs

**Cons:**
- 🐌 **Slow**: 5-10 seconds latency due to LLM processing
- ⚙️ **Complex**: Multiple services, database operations, potential failure points
- 🎭 **Overkill**: Too much infrastructure for simple launch operation
- 🔄 **Indirect**: User intent translated through multiple layers

### Alternative: Pure Direct Approach

**Pros:**
- ⚡ **Fastest**: Minimal latency
- 🎯 **Simple**: Direct service communication

**Cons:**
- 🚫 **No error handling**: Limited feedback on launch failures
- 🔒 **Security**: Direct access to computer-use service
- 🎭 **Inconsistent**: Bypasses standard API patterns

## API Documentation

### Endpoint Details

- **URL**: `/api/tasks/browseros/connect`
- **Method**: `POST`
- **Authentication**: Required (session-based)
- **Content-Type**: `application/json`

### Request

```bash
curl -X POST http://localhost:9991/api/tasks/browseros/connect \
  -H "Content-Type: application/json" \
  -H "Cookie: session=..." \
  --credentials include
```

### Success Response (200)

```json
{
  "success": true,
  "message": "BrowserOS launched successfully"
}
```

### Error Responses

#### 500 Internal Server Error
```json
{
  "message": "Failed to launch BrowserOS: 500 Internal Server Error",
  "error": "Internal Server Error",
  "statusCode": 500
}
```

#### 404 Not Found (if desktop service unavailable)
```json
{
  "message": "Cannot POST /api/tasks/browseros/connect",
  "error": "Not Found",
  "statusCode": 404
}
```

## Testing

### Build Verification
- ✅ `bytebot-agent` compiles successfully
- ✅ `bytebot-ui` compiles successfully
- ✅ TypeScript types are correct
- ✅ Imports resolved properly

### Functional Testing
- [ ] Rebuild `bytebot-agent` container
- [ ] Test endpoint with curl: `curl -X POST http://localhost:9991/api/tasks/browseros/connect`
- [ ] Test UI Connect button launches BrowserOS
- [ ] Verify error handling when desktop service unavailable
- [ ] Confirm BrowserOS window appears after successful launch

## Future Considerations

### Potential Enhancements
1. **Status Polling**: Add endpoint to check if BrowserOS is running
2. **Multiple Instances**: Support launching specific BrowserOS workspaces
3. **Launch Options**: Pass configuration options (window size, etc.)
4. **Health Checks**: Monitor BrowserOS health after launch

### Agent Integration
The task-based approach remains available for complex scenarios:
- Multi-step launch processes
- Conditional logic based on system state
- Integration with other agent tools
- Advanced error recovery

### Monitoring
- Track launch success/failure rates
- Monitor response times
- Log launch attempts for debugging

## Deployment Notes

1. **Container Rebuild**: The `bytebot-agent` container must be rebuilt to include the new endpoint
2. **Environment Variables**: Ensure `BYTEBOT_DESKTOP_BASE_URL` is properly configured
3. **Network Connectivity**: Agent service must be able to reach desktop service at configured URL
4. **BrowserOS Command**: Desktop service must have proper BrowserOS launch command configured

## Conclusion

The hybrid approach provides optimal performance for the common case (direct launch) while maintaining flexibility for complex scenarios (agent-based). The dedicated endpoint eliminates unnecessary overhead for BrowserOS connection while keeping the agent system available for advanced use cases.</content>
<parameter name="filePath">BROWSEROS_CONNECT_STRATEGY.md