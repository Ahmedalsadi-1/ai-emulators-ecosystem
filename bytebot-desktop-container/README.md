# Bytebot Desktop Automation Container

A standalone Docker container that provides desktop automation capabilities with VNC access and REST API endpoints for computer control operations.

## Features

- **Desktop Environment**: Full Linux desktop with Openbox window manager
- **VNC Server**: Remote desktop access via VNC (port 5900) and noVNC web interface (port 6080)
- **Browser Automation**: Pre-installed Firefox and Chromium with Selenium support
- **REST API**: Computer control endpoints on port 9990
- **Screenshot & OCR**: Image capture and text recognition capabilities
- **Mouse & Keyboard Control**: Programmatic control of input devices

## Quick Start

### Build and Run

```bash
# Clone or navigate to the bytebot-desktop-container directory
cd bytebot-desktop-container

# Build the container
docker-compose build

# Start the container
docker-compose up -d

# Check logs
docker-compose logs -f
```

### Access Points

- **API Endpoint**: http://localhost:9990
- **VNC Web Interface**: http://localhost:6080 (password: bytebot)
- **Direct VNC**: localhost:5900 (password: bytebot)

## API Endpoints

The container exposes a REST API for computer control operations:

### Health Check
```bash
curl http://localhost:9990/health
```

### Computer Control Actions

All computer control actions are sent as POST requests to `/computer-use`:

#### Mouse Operations
```bash
# Move mouse
curl -X POST http://localhost:9990/computer-use \
  -H "Content-Type: application/json" \
  -d '{"action": "move_mouse", "coordinates": {"x": 100, "y": 200}}'

# Click mouse
curl -X POST http://localhost:9990/computer-use \
  -H "Content-Type: application/json" \
  -d '{"action": "click_mouse", "button": "left", "coordinates": {"x": 100, "y": 200}, "clickCount": 1}'

# Drag mouse
curl -X POST http://localhost:9990/computer-use \
  -H "Content-Type: application/json" \
  -d '{"action": "drag_mouse", "path": [{"x": 100, "y": 200}, {"x": 200, "y": 300}], "button": "left"}'
```

#### Keyboard Operations
```bash
# Type text
curl -X POST http://localhost:9990/computer-use \
  -H "Content-Type: application/json" \
  -d '{"action": "type_text", "text": "Hello World"}'

# Press keys
curl -X POST http://localhost:9990/computer-use \
  -H "Content-Type: application/json" \
  -d '{"action": "press_keys", "keys": ["Control_L", "c"]}'

# Type individual keys
curl -X POST http://localhost:9990/computer-use \
  -H "Content-Type: application/json" \
  -d '{"action": "type_keys", "keys": ["H", "e", "l", "l", "o"]}'
```

#### Screen Operations
```bash
# Take screenshot
curl -X POST http://localhost:9990/computer-use \
  -H "Content-Type: application/json" \
  -d '{"action": "screenshot"}'

# Get cursor position
curl -X POST http://localhost:9990/computer-use \
  -H "Content-Type: application/json" \
  -d '{"action": "cursor_position"}'
```

#### File Operations
```bash
# Read file
curl -X POST http://localhost:9990/computer-use \
  -H "Content-Type: application/json" \
  -d '{"action": "read_file", "path": "/home/bytebot/Desktop/test.txt"}'

# Write file (base64 encoded)
curl -X POST http://localhost:9990/computer-use \
  -H "Content-Type: application/json" \
  -d '{"action": "write_file", "path": "/home/bytebot/Desktop/test.txt", "data": "SGVsbG8gV29ybGQ="}'
```

#### Application Control
```bash
# Open application
curl -X POST http://localhost:9990/computer-use \
  -H "Content-Type: application/json" \
  -d '{"action": "application", "application": "firefox"}'
```

#### Timing Controls
```bash
# Wait/delay
curl -X POST http://localhost:9990/computer-use \
  -H "Content-Type: application/json" \
  -d '{"action": "wait", "duration": 2000}'
```

## Automation Tools Included

### Browser Automation
- **Firefox ESR**: Full browser with automation support
- **Chromium**: Headless browser capabilities
- **ChromeDriver**: Selenium WebDriver for automated testing
- **Selenium Python**: Browser automation library

### Screen & Image Processing
- **scrot**: Command-line screenshot tool
- **ImageMagick**: Image manipulation utilities
- **Pillow**: Python imaging library
- **OpenCV**: Computer vision library
- **Tesseract OCR**: Text recognition from images

### Input Control
- **xdotool**: Command-line X11 automation tool
- **wmctrl**: Window management tool
- **PyAutoGUI**: Python cross-platform GUI automation
- **pynput**: Python library for controlling input devices

## Development & Testing

### Interactive Shell
```bash
# Access container shell
docker-compose exec bytebot-desktop sh

# Run as bytebot user
docker-compose exec --user bytebot bytebot-desktop sh
```

### Python Automation Scripts
The container includes Python with automation libraries. You can create scripts like:

```python
import pyautogui
import time

# Move mouse and click
pyautogui.moveTo(100, 100)
pyautogui.click()

# Type text
pyautogui.typewrite("Hello from automation!")

# Take screenshot
screenshot = pyautogui.screenshot()
screenshot.save('/home/bytebot/Desktop/screenshot.png')
```

### Selenium Browser Automation
```python
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

options = Options()
options.add_argument('--no-sandbox')
options.add_argument('--disable-dev-shm-usage')

driver = webdriver.Chrome(options=options)
driver.get('https://example.com')
print(driver.title)
driver.quit()
```

## Configuration

### Environment Variables
- `DISPLAY=:1`: X11 display number
- `VNC_PORT=5900`: VNC server port
- `NOVNC_PORT=6080`: noVNC web interface port
- `BYTEBOT_DESKTOP_PORT=9990`: API server port

### Volumes
- `bytebot_desktop_data`: Desktop files and documents
- `bytebot_downloads`: Downloaded files

## Troubleshooting

### Common Issues

1. **Container fails to start**
   - Check if privileged mode is enabled
   - Ensure sufficient memory (4GB minimum)
   - Check logs: `docker-compose logs bytebot-desktop`

2. **VNC connection fails**
   - Verify port 5900/6080 are not in use
   - Check VNC password: "bytebot"
   - Try accessing via web interface first

3. **API calls fail**
   - Ensure container is healthy: `docker-compose ps`
   - Check API endpoint: `curl http://localhost:9990/health`
   - Verify JSON payload format

4. **Browser automation issues**
   - Ensure DISPLAY environment is set correctly
   - Check if Xvfb is running: `ps aux | grep Xvfb`

### Logs and Debugging
```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f bytebot-desktop

# Restart services
docker-compose restart
```

## Architecture

The container runs multiple services orchestrated by Supervisor:

1. **Xvfb**: Virtual X11 display server
2. **Openbox**: Lightweight window manager
3. **x11vnc**: VNC server for remote access
4. **websockify**: WebSocket proxy for noVNC
5. **bytebotd**: Node.js API server for computer control

## Security Considerations

- Default VNC password is "bytebot" - change in production
- Container runs with privileged access for X11 control
- Network isolation recommended for production use
- API endpoints should be protected with authentication

## Performance Tuning

- **Memory**: 2-4GB recommended for smooth operation
- **CPU**: 1-2 cores sufficient for most automation tasks
- **Disk**: Minimal storage requirements beyond base image
- **Network**: Low bandwidth usage except for VNC streaming