# Open-Interface Settings Configuration

This document describes the configuration options available for the Open-Interface screen controller in Bytebot.

## Configuration File Location

Settings are stored in: `config/open-interface-settings.json`

## Available Settings

### API Configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `api_key` | string | - | Your OpenAI or Gemini API key |
| `base_url` | string | "https://api.openai.com/v1" | API base URL for custom endpoints |
| `model` | string | "gpt-4o" | AI model to use for computer control |

### UI Configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `theme` | string | "superhero" | ttkbootstrap theme for the interface |
| `custom_llm_instructions` | string | - | Custom instructions for the AI |

### Application Configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `default_browser` | string | "Safari" | Default browser for web actions |
| `play_ding_on_completion` | boolean | true | Play sound when actions complete |

### Advanced Configuration

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `temperature` | number | 0.1 | AI creativity (0.0-2.0) |
| `max_tokens` | number | 1000 | Maximum response length |
| `screenshot_quality` | number | 85 | Screenshot JPEG quality (1-100) |
| `screenshot_format` | string | "png" | Screenshot format: "png", "jpeg", "webp" |

### Open-Interface Specific Settings

| Setting | Type | Default | Description |
|---------|------|---------|-------------|
| `enable_voice_input` | boolean | false | Enable voice input (requires pyaudio) |
| `screenshot_before_actions` | boolean | true | Take screenshot before each action |
| `action_confirmation` | boolean | false | Require confirmation for actions |
| `debug_mode` | boolean | false | Enable debug logging |

## Supported Models

### OpenAI Models
- `gpt-4o` (Recommended - Best balance)
- `gpt-4o-mini` (Cheapest, fastest)
- `gpt-4-vision-preview` (Deprecated)
- `gpt-4-turbo` (Less accurate, fast)

### Gemini Models
- `gemini-2.0-flash` (Free, fast)
- `gemini-2.0-flash-lite` (Lightweight)
- `gemini-2.0-flash-thinking-exp` (Experimental)
- `gemini-2.0-pro-exp-02-05` (Experimental)

## Example Configuration

```json
{
  "api_key": "sk-your-openai-api-key-here",
  "base_url": "https://api.openai.com/v1",
  "model": "gpt-4o",
  "theme": "superhero",
  "default_browser": "Chrome",
  "play_ding_on_completion": true,
  "temperature": 0.1,
  "max_tokens": 1000,
  "screenshot_quality": 85,
  "screenshot_format": "png",
  "enable_voice_input": false,
  "screenshot_before_actions": true,
  "action_confirmation": false,
  "debug_mode": false
}
```

## API Endpoints

### Get Settings
```
GET /screen-controllers/open-interface/settings
```

### Update Settings
```
POST /screen-controllers/open-interface/settings
Content-Type: application/json

{
  "model": "gpt-4o-mini",
  "temperature": 0.2
}
```

### Validate Settings
```
POST /screen-controllers/open-interface/settings/validate
Content-Type: application/json

{
  "model": "invalid-model",
  "temperature": 5.0
}
```

### Reset to Defaults
```
POST /screen-controllers/open-interface/settings/reset
```

### Export Settings
```
GET /screen-controllers/open-interface/settings/export
```

### Import Settings
```
POST /screen-controllers/open-interface/settings/import
Content-Type: application/json

{
  "settings": "{\"model\": \"gpt-4o\", \"temperature\": 0.1}"
}
```

## Environment Variables

The following environment variables are set based on settings:

- `OPENAI_API_KEY`: From `api_key` setting
- `OPENAI_BASE_URL`: From `base_url` setting
- `DEFAULT_MODEL`: From `model` setting
- `DEBUG_MODE`: From `debug_mode` setting

## Validation

Settings are automatically validated when updated:

- **API Key**: Must match provider format (OpenAI: `sk-...`)
- **Base URL**: Must be valid HTTP/HTTPS URL
- **Model**: Must be known model name
- **Temperature**: Must be 0.0-2.0
- **Max Tokens**: Must be 1-32768
- **Screenshot Quality**: Must be 1-100

## Security Notes

- API keys are never exported in settings backups
- Settings file should be excluded from version control
- Consider using environment variables for sensitive settings in production