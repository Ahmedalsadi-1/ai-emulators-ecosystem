# TURIX_APP_COMMAND - Quick Reference Guide

## Overview

The Turix application launch functionality now supports proper command string parsing and execution across both macOS and Linux platforms.

## Environment Variables

### `TURIX_APP_COMMAND`

**Description:** Full command to launch the Turix application

**Default:** `open -a "Turix"` (macOS)

**Format:** Command string with optional arguments

**Examples:**

```bash
# macOS - Using open command (default)
TURIX_APP_COMMAND='open -a "Turix"'

# macOS - Using custom path
TURIX_APP_COMMAND='/Applications/Turix.app/Contents/MacOS/Turix'

# Linux - Direct executable
TURIX_APP_COMMAND='/usr/local/bin/turix'

# Linux - With arguments
TURIX_APP_COMMAND='/usr/local/bin/turix --config=/path/to/config.json --debug'

# Linux - With background flag
TURIX_APP_COMMAND='nohup /usr/local/bin/turix > /tmp/turix.log 2>&1 &'
```

### `TURIX_APP_WMCLASS`

**Description:** Window class/identifier used for window management and detection

**Default:** `Turix`

**Examples:**

```bash
# Default
TURIX_APP_WMCLASS='Turix'

# Linux full window class format
TURIX_APP_WMCLASS='Turix.Turix'

# Custom window class
TURIX_APP_WMCLASS='com.turix.Turix'
```

## Command String Format Rules

### Supported Syntax

1. **Simple command with no arguments:**
   ```
   turix
   ```
   → `{ command: "turix", args: [] }`

2. **Command with arguments:**
   ```
   turix --arg1 --arg2 value
   ```
   → `{ command: "turix", args: ["--arg1", "--arg2", "value"] }`

3. **Command with double-quoted arguments:**
   ```
   open -a "Turix"
   ```
   → `{ command: "open", args: ["-a", "Turix"] }`

4. **Command with single-quoted arguments:**
   ```
   open -a 'Turix'
   ```
   → `{ command: "open", args: ["-a", "Turix"] }`

5. **Command with mixed quotes:**
   ```
   turix --name "My App" --config '/path/to/config file'
   ```
   → `{ command: "turix", args: ["--name", "My App", "--config", "/path/to/config file"] }`

6. **Command with escaped quotes:**
   ```
   turix --message 'He said "Hello"'
   ```
   → `{ command: "turix", args: ["--message", 'He said "Hello"'] }`

### Escape Sequences

- `\"` - Escaped double quote inside double-quoted string
- `\'` - Escaped single quote inside single-quoted string
- `\` followed by a space - Preserves the space

## Platform-Specific Behavior

### macOS

**Default Setup:**
```bash
TURIX_APP_COMMAND='open -a "Turix"'
TURIX_APP_WMCLASS='Turix'
```

**Behavior:**
- Uses macOS `open` command to launch applications
- Automatically activates existing instances
- Uses AppleScript (osascript) for window management
- No sudo required for user applications

**Custom Executable Example:**
```bash
TURIX_APP_COMMAND='/Applications/CustomTurix.app/Contents/MacOS/CustomTurix'
TURIX_APP_WMCLASS='CustomTurix'
```

### Linux

**Default Setup:**
```bash
TURIX_APP_COMMAND='/usr/local/bin/turix'
TURIX_APP_WMCLASS='Turix'
```

**Behavior:**
- Uses `nohup` to launch applications in background
- Requires `wmctrl` for window management (install with: `sudo apt install wmctrl`)
- Uses sudo to run as the 'user' user
- Each launch creates a new instance unless detected

**With Arguments Example:**
```bash
TURIX_APP_COMMAND='/usr/local/bin/turix --config=/etc/turix/config.json'
TURIX_APP_WMCLASS='Turix.Turix'
```

## Usage Examples

### 1. Launch Turix Application

**Request:**
```bash
curl -X POST http://localhost:9990/computer-use/action \
  -H "Content-Type: application/json" \
  -d '{
    "action": "application",
    "application": "turix"
  }'
```

**Expected Behavior:**
- First call: Launches new Turix instance
- Subsequent calls: Activates and maximizes existing window

### 2. Debug Launch Process

**Enable debug logging:**
```bash
# In .env file
LOG_LEVEL=debug
```

**Example log output:**
```
[Nest] 12345  INFO  [ComputerUseService] Platform: darwin (macOS: true, Linux: false)
[Nest] 12345  DEBUG [ComputerUseService] Turix command: open -a "Turix", wmclass: Turix
[Nest] 12345  DEBUG [ComputerUseService] Checking if turix is open (identifier: Turix)
[Nest] 12345  DEBUG [ComputerUseService] macOS check result: appOpen=false, appName=Turix, stdout=
[Nest] 12345  INFO  [ComputerUseService] Launching turix with command: open -a "Turix"
[Nest] 12345  DEBUG [ComputerUseService] Parsed command: open, args: [-a, Turix]
[Nest] 12345  INFO  [ComputerUseService] Application turix launched successfully
```

### 3. Test with Custom Command

**Set custom environment:**
```bash
export TURIX_APP_COMMAND='/usr/local/bin/turix --debug --port=8080'
export TURIX_APP_WMCLASS='Turix'
```

**Verify parsing:**
```
[Nest] 12345  DEBUG [ComputerUseService] Parsed command: /usr/local/bin/turix, args: [--debug, --port=8080]
```

## Troubleshooting

### Issue: Command not found

**Symptom:** `Failed to launch application turix: spawn /path/to/turix ENOENT`

**Solution:**
- Verify the command path is correct
- Use absolute path instead of relative path
- Check that the executable has execute permissions

### Issue: App won't launch on Linux

**Symptom:** Nothing happens when launching Turix

**Solution:**
- Install wmctrl: `sudo apt install wmctrl` or `sudo yum install wmctrl`
- Check if the 'user' user exists on the system
- Verify sudo permissions for the 'user' user

### Issue: Window not maximizing on macOS

**Symptom:** Turix launches but window is not maximized

**Solution:**
- Ensure AppleScript has accessibility permissions
- Check System Settings > Privacy & Security > Accessibility
- Allow the terminal or IDE to control your computer

### Issue: Multiple instances launching

**Symptom:** Each launch creates a new Turix window instead of activating existing one

**Solution:**
- Verify `TURIX_APP_WMCLASS` matches the actual window class
- Check window class using Linux: `wmctrl -lx`
- Check window class using macOS: `osascript -e 'tell application "System Events" to get name of every process'`

## Development Tips

### 1. Test Command Parsing

Create a test script to verify command parsing:

```bash
# Test 1: Simple command
echo 'open -a "Turix"' | node -e "
  const parseCommand = (s) => {
    const tokens = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = '';
    for (let i = 0; i < s.length; i++) {
      const char = s[i];
      const prev = s[i-1] || '';
      if (inQuotes) {
        if (char === quoteChar && prev !== '\\\\') {
          inQuotes = false;
          quoteChar = '';
        } else {
          current += char;
        }
      } else if (char === '\"' || char === \"'\") {
        inQuotes = true;
        quoteChar = char;
      } else if (char === ' ') {
        if (current) { tokens.push(current); current = ''; }
      } else {
        current += char;
      }
    }
    if (current) tokens.push(current);
    console.log({ command: tokens[0], args: tokens.slice(1) });
  };
  parseCommand(require('fs').readFileSync(0, 'utf-8').trim());
"
```

### 2. Monitor Window Events

```bash
# Linux - Monitor window events
watch -n 1 "wmctrl -lx | grep -i turix"

# macOS - Monitor process events
watch -n 1 "ps aux | grep -i turix"
```

### 3. Enable Verbose Logging

```bash
# In .env file
LOG_LEVEL=debug

# Or set temporarily
export LOG_LEVEL=debug
npm run start:dev
```

## API Reference

### Application Action

**Endpoint:** `POST /computer-use/action`

**Request Body:**
```json
{
  "action": "application",
  "application": "turix"
}
```

**Response:** `204 No Content` (success)

**Environment Variables Required:**
- `TURIX_APP_COMMAND` - Command to launch Turix
- `TURIX_APP_WMCLASS` - Window class identifier

## See Also

- [TURIX_APP_COMMAND_FIX_SUMMARY.md](./TURIX_APP_COMMAND_FIX_SUMMARY.md) - Implementation details
- [AGENTS.md](./AGENTS.md) - Build, lint, and test commands
- [README.md](./README.md) - Project documentation

---

**Last Updated:** December 27, 2025
