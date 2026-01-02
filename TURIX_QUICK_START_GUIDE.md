# Turix Configuration - Quick Start Guide

## For Users

### Setting Up Turix

1. **Open Settings Page**
   - Navigate to the Settings page in Bytebot UI
   - You'll see the "Turix Configuration" section at the top

2. **Configure API URL**
   - Enter your Turix API URL in the input field
   - Default: `http://localhost:3000`
   - Example: `http://192.168.1.100:3000` (for remote Turix)
   - Example: `https://turix.example.com` (for production Turix)

3. **Check Health Status**
   - The health check runs automatically every 12 seconds
   - Status updates show:
     - 🟢 **Connected**: Turix is running and responding
     - ⚫ **Offline**: Turix is not responding
     - 🟡 **Checking**: Currently checking connection
     - 🟡 **Unknown**: No checks performed yet

4. **Manual Refresh**
   - Click the refresh button (↻) to check status immediately
   - Button spins while checking
   - Status updates within 5 seconds

5. **View Details**
   - Hover over the status indicator to see details
   - Error messages explain connection issues
   - Timestamp shows when last check occurred

### Troubleshooting

**"Connection refused"**
- Verify Turix is running: Check that Turix app is launched
- Check port number: Ensure Turix is using port 3000 (or update URL)
- Check network: Ensure you can reach the Turix host

**"Connection timeout"**
- Slow network: Increase timeout (requires code change)
- Firewall: Check firewall settings
- Network issues: Check your internet connection

**"Host not found"**
- Check URL spelling: Verify the API URL is correct
- DNS issues: Try using IP address instead of hostname
- Offline host: Ensure Turix host is reachable

**Status always "Unknown"**
- JavaScript disabled: Enable JavaScript in browser
- Browser issues: Try a different browser
- CORS issues: Check Turix CORS configuration

## For Developers

### Adding Turix Configuration to Other Pages

```tsx
import { turixService, TurixHealthStatus } from '@/services/TurixService';

function MyComponent() {
  const [status, setStatus] = useState<TurixHealthStatus>('unknown');

  useEffect(() => {
    const unsubscribe = turixService.subscribe((result) => {
      setStatus(result.status);
      console.log('Turix status:', result);
    });

    return () => unsubscribe();
  }, []);

  // Manual health check
  const checkTurix = async () => {
    const result = await turixService.checkHealth();
    console.log('Health check result:', result);
  };

  return <div>Status: {status}</div>;
}
```

### API Configuration

```typescript
// Get current API URL
const apiUrl = turixService.getApiUrl();

// Set new API URL
turixService.setApiUrl('http://localhost:3000');

// Get current status
const status = turixService.getCurrentStatus();

// Get last checked timestamp
const lastChecked = turixService.getLastChecked();
```

### Starting/Stopping Health Checks

```typescript
// Start health checks (12-second intervals)
turixService.startHealthChecks(12000);

// Stop health checks
turixService.stopHealthChecks();

// Check health once
const result = await turixService.checkHealth();
```

### Custom Health Check Interval

```typescript
// Check every 30 seconds instead of 12
turixService.startHealthChecks(30000);

// Check every 5 seconds (not recommended - high load)
turixService.startHealthChecks(5000);
```

### Integrating with Turix Backend

Ensure your Turix application exposes a health check endpoint:

```typescript
// Turix backend example (Express)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    message: 'All systems operational',
    timestamp: new Date().toISOString()
  });
});
```

### Error Handling

```typescript
try {
  const result = await turixService.checkHealth();
  if (result.status === 'connected') {
    console.log('Success:', result.message);
  } else {
    console.error('Error:', result.message);
  }
} catch (error) {
  console.error('Unexpected error:', error);
}
```

### Testing Health Checks

```typescript
// Test with mock server (for development)
const mockTurix = http.createServer((req, res) => {
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ message: 'Mock healthy' }));
  }
});

// Set mock server URL
turixService.setApiUrl('http://localhost:8080');

// Test health check
const result = await turixService.checkHealth();
console.log('Test result:', result);
```

### localStorage Management

```typescript
// Direct localStorage access (if needed)
const apiUrl = localStorage.getItem('turix:apiUrl');

// Set new URL (also triggers health check)
localStorage.setItem('turix:apiUrl', 'http://localhost:3000');
turixService.setApiUrl('http://localhost:3000');

// Clear stored URL
localStorage.removeItem('turix:apiUrl');
```

## Advanced Usage

### Multiple Listeners

```typescript
// Multiple components can subscribe to Turix status updates
useEffect(() => {
  const unsubscribe = turixService.subscribe((result) => {
    // Component 1: Update UI
    setStatus(result.status);
  });
  return () => unsubscribe();
}, []);

useEffect(() => {
  const unsubscribe = turixService.subscribe((result) => {
    // Component 2: Log analytics
    trackHealthCheck(result.status, result.timestamp);
  });
  return () => unsubscribe();
}, []);
```

### Custom Error Messages

```typescript
const customStatusMap: Record<TurixHealthStatus, string> = {
  connected: '✅ Turix is online and ready',
  offline: '❌ Turix is offline or unreachable',
  checking: '⏳ Checking Turix connection...',
  unknown: '❓ Turix status unknown'
};

const getStatusMessage = (status: TurixHealthStatus) => {
  return customStatusMap[status];
};
```

### Integrating with Notifications

```typescript
useEffect(() => {
  const unsubscribe = turixService.subscribe((result) => {
    if (result.status === 'offline') {
      // Show notification when Turix goes offline
      showNotification({
        type: 'error',
        title: 'Turix Disconnected',
        message: result.message || 'Connection lost'
      });
    } else if (result.status === 'connected') {
      // Show notification when Turix comes back online
      showNotification({
        type: 'success',
        title: 'Turix Connected',
        message: 'Connection restored'
      });
    }
  });

  return () => unsubscribe();
}, []);
```

## Best Practices

1. **Health Check Interval**: Use 10-15 seconds for production (avoid excessive checks)
2. **Error Handling**: Always handle the promise rejection from `checkHealth()`
3. **Cleanup**: Always unsubscribe from status updates in useEffect cleanup
4. **User Feedback**: Show loading states during health checks
5. **Error Messages**: Display user-friendly error messages (not technical ones)
6. **Timestamps**: Show relative time (5s ago, 2m ago) for better UX
7. **Manual Refresh**: Provide manual refresh button for on-demand checks
8. **localStorage**: Persist user configuration but validate before use
9. **Timeouts**: Use reasonable timeouts (5 seconds recommended)
10. **Testing**: Test with offline Turix, invalid URLs, and network errors

## Security Considerations

1. **URL Validation**: Validate user input before setting API URL
2. **HTTPS**: Use HTTPS for production Turix instances
3. **CORS**: Configure CORS properly on Turix backend
4. **Authentication**: Add API keys if Turix requires authentication
5. **Error Messages**: Don't expose sensitive information in error messages

## Performance Tips

1. **Debounce URL Changes**: Debounce rapid URL changes to avoid excessive health checks
2. **Memoize Components**: Use React.memo for components that display status
3. **Conditional Rendering**: Only render health status when visible
4. **Cleanup Intervals**: Always stop health checks when component unmounts
5. **Batch Updates**: Batch multiple status updates if using multiple listeners

## Future Enhancements

1. **Health Check History**: Store and display historical health check data
2. **Latency Metrics**: Show connection latency/ping time
3. **Configurable Endpoint**: Allow customizing health check endpoint path
4. **Multiple Turix Instances**: Support configuring multiple Turix instances
5. **Connection Retry**: Implement automatic retry with exponential backoff
6. **WebSocket Integration**: Real-time status updates via WebSocket
7. **Health Check Details**: Show detailed system status from Turix
8. **Notification Settings**: Allow users to customize notification preferences
9. **Connection Quality**: Visual indicator of connection quality (excellent/good/poor)
10. **Automatic Failover**: Switch to backup Turix instance if primary fails

## Support

If you encounter any issues or need further assistance:
1. Check the [Implementation Summary](./TURIX_CONFIG_IMPLEMENTATION_SUMMARY.md)
2. Review the [UI Preview](./TURIX_UI_PREVIEW.md)
3. Check browser console for errors
4. Verify Turix API endpoint is accessible
5. Test with curl or Postman: `curl http://localhost:3000/api/health`
