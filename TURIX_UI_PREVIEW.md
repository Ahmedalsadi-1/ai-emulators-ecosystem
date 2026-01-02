# Turix Configuration UI Preview

## Settings Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│  [Floating Nav]                                              │
│                                                             │
│                         Settings                            │
│          Configure your AI providers and preferences        │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ 🔵 Turix Configuration                              │  │
│  │                                                     │  │
│  │ Turix API URL                                       │  │
│  │ ┌──────────────────────────────────────────────┐  │  │
│  │ │ http://localhost:3000                         │  │  │
│  │ └──────────────────────────────────────────────┘  │  │
│  │                                                   [↻] │
│  │ Configure the connection to your Turix host        │  │
│  │ application                                          │  │
│  │                                                     │  │
│  │ ┌───────────────────────────────────────────────┐  │  │
│  │ │  ✓  Connected                                │  │  │
│  │ │     All systems operational                   │  │  │
│  │ │                                    Last checked│  │  │
│  │ │                                          5s ago │  │  │
│  │ └───────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐  │
│  │ Model Configuration                                  │  │
│  │                                                     │  │
│  │ 🟢 OpenAI                                          │  │
│  │                                                     │  │
│  │ API Key:                                            │  │
│  │ ┌──────────────────────────────────────────────┐  │  │
│  │ │ ********                                       │  │  │
│  │ └──────────────────────────────────────────────┘  │  │
│  │                                                     │  │
│  │ Model Name:                                         │  │
│  │ ┌──────────────────────────────────────────────┐  │  │
│  │ │ gpt-4o                                        │  │  │
│  │ └──────────────────────────────────────────────┘  │  │
│  │                                                     │  │
│  │ Endpoint URL:                                       │  │
│  │ ┌──────────────────────────────────────────────┐  │  │
│  │ │ https://api.openai.com/v1                    │  │  │
│  │ └──────────────────────────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────┘  │
│                                                             │
│                      [ Save Changes ]                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Health Status States

### Connected State
```
┌─────────────────────────────────────────────────────────┐
│  ┌───┐  Connected                                     │
│  │ ✓ │  All systems operational                      │
│  └───┘                                      5s ago     │
└─────────────────────────────────────────────────────────┘
  Green background circle
  Green checkmark icon
  "Connected" text in white
  Success message in white/60
  Timestamp on right side
```

### Offline State
```
┌─────────────────────────────────────────────────────────┐
│  ┌───┐  Offline                                        │
│  │ ✗ │  Connection refused                          │
│  └───┘                                      2m ago     │
└─────────────────────────────────────────────────────────┘
  Gray background circle
  Gray X-mark icon
  "Offline" text in white
  Error message in white/60
  Timestamp on right side
```

### Checking State
```
┌─────────────────────────────────────────────────────────┐
│  ┌───┐  Checking...                                     │
│  │ ↻ │  Checking...                                    │
│  └───┘                                      Now         │
└─────────────────────────────────────────────────────────┘
  Yellow pulsing background circle
  Yellow spinning refresh icon
  "Checking..." text in white
  Loading message in white/60
  "Now" timestamp
```

### Unknown State
```
┌─────────────────────────────────────────────────────────┐
│  ┌───┐  Unknown                                        │
│  │ ? │  No checks performed yet                       │
│  └───┘                                      Never      │
└─────────────────────────────────────────────────────────┘
  Yellow background circle
  Yellow question mark icon
  "Unknown" text in white
  Info message in white/60
  "Never" timestamp
```

## Color Scheme

### Turix Section (New)
- **Primary**: Sky-blue (`sky-400`, `sky-500`)
- **Icon**: Globe with sky-blue accent
- **Focus States**: `border-sky-500/50`
- **Hover States**: `hover:border-sky-500/50 hover:bg-sky-500/10`

### Status Indicators
- **Connected**: Emerald green (`bg-emerald-500`, `text-emerald-400`)
- **Offline**: Slate gray (`bg-slate-500`, `text-slate-400`)
- **Checking/Unknown**: Yellow (`bg-yellow-500`, `text-yellow-400`)

### Existing Section (Model Configuration)
- **Primary**: Emerald/Teal gradient (`from-emerald-500 to-teal-500`)
- **Focus States**: `border-emerald-500/50`
- **Hover States**: `hover:border-emerald-500/50 hover:bg-emerald-500/10`

## Animations

### Entrance Animations
- Turix Configuration: `delay: 0.1s` (slides in from top)
- Model Configuration: `delay: 0.2s` (slides in from top)
- Save Button: `delay: 0.4s` (slides in from top)

### Hover Effects
- Refresh Button: `scale: 1.05` on hover, `scale: 0.95` on tap
- Status indicators: Smooth color transitions
- Inputs: Border color and background color transitions

### Loading States
- Refresh icon: `animate-spin` when checking
- Checking status: `animate-pulse` on background circle

## Responsive Behavior

### Desktop (≥ 768px)
- Full-width input field
- Refresh button to the right of input
- Health status card spans full width
- Maximum width: 4xl (896px)

### Mobile (< 768px)
- Input and refresh button stack vertically
- Health status card maintains full width
- Reduced padding on smaller screens

## Accessibility

### Keyboard Navigation
- Input field: Focus with Tab
- Refresh button: Focus with Tab, activate with Enter/Space
- Save button: Focus with Tab, activate with Enter/Space

### Screen Readers
- Status indicators use semantic colors and icons
- Health status messages are descriptive
- Error messages provide specific information
- Timestamps provide relative time context

### Visual Hierarchy
- Section headers are clearly labeled with icons
- Form labels are bold and prominent
- Status indicators use both color and icons
- Error messages have distinct styling

## User Flow

1. **Initial Load**
   - Settings page opens with Turix Configuration section
   - API URL loaded from localStorage (default: http://localhost:3000)
   - Health check automatically starts
   - Status shows "Checking..." then updates to "Connected" or "Offline"

2. **Configure API URL**
   - User clicks in API URL input field
   - User types or pastes Turix API URL
   - Health check automatically triggers after URL change
   - Status updates within 5 seconds

3. **Manual Refresh**
   - User clicks refresh button (↻)
   - Button spins and health check triggers
   - Status updates within 5 seconds
   - Timestamp updates to "Now"

4. **Health Check Cycle**
   - Automatic health check every 12 seconds
   - Status updates automatically
   - Timestamp shows relative time (5s ago, 2m ago, etc.)
   - Background monitoring continues while user interacts with other settings

5. **Page Reload**
   - API URL persists in localStorage
   - Health checks restart automatically
   - Last checked timestamp resets

## Error Scenarios

### Connection Timeout (5 seconds)
```
Status: Offline
Message: Connection timeout
Icon: ✗ (gray)
```

### Host Not Found
```
Status: Offline
Message: Host not found
Icon: ✗ (gray)
```

### Connection Refused
```
Status: Offline
Message: Connection refused
Icon: ✗ (gray)
```

### HTTP 404 Not Found
```
Status: Offline
Message: HTTP 404: Not Found
Icon: ✗ (gray)
```

### HTTP 500 Internal Server Error
```
Status: Offline
Message: HTTP 500: Internal Server Error
Icon: ✗ (gray)
```

### Network Error
```
Status: Offline
Message: Connection failed
Icon: ✗ (gray)
```

## Design Principles

1. **Visual Clarity**: Status indicators use both color and icons for accessibility
2. **Immediate Feedback**: Health checks trigger immediately on URL change
3. **Minimal Friction**: Default URL pre-filled, simple input field
4. **Progressive Disclosure**: Error messages only show when relevant
5. **Consistency**: Matches existing Bytebot UI patterns and styling
6. **Performance**: Lightweight, efficient health checks with timeout handling
7. **Reliability**: Singleton pattern ensures single source of truth
8. **User Control**: Manual refresh button for on-demand checks
9. **Persistence**: localStorage saves user configuration
10. **Responsive**: Works well on all screen sizes

## Integration Points

### Bytebot Backend
- Settings page communicates with bytebotd backend
- Turix API health checks are client-side (browser to Turix)
- No server-side integration required for health checks

### Turix Application
- Must expose `/api/health` endpoint
- Should return JSON with optional `message` field
- Should support CORS if running on different domain/port

### localStorage
- Key: `turix:apiUrl`
- Value: API URL string (e.g., "http://localhost:3000")
- Persistence: Browser-specific, persists across sessions
