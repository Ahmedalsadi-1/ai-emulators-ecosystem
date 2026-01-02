#!/usr/bin/env python3
"""
Quick test of functiongemma's function calling capabilities
"""

import json
import subprocess
import sys


# Define a simple tool/function
def get_weather(city: str) -> dict:
    """Get the current weather for a city."""
    return {"city": city, "temperature": 22, "unit": "celsius", "condition": "sunny"}


def get_time(city: str) -> dict:
    """Get the current time for a city."""
    return {"city": city, "timezone": "UTC", "time": "10:30 AM"}


# Test with function calling
test_messages = [{"role": "user", "content": "What is the weather in Paris?"}]

# Define tools in OpenAI format (compatible with ollama)
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get the current weather for a city",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "The name of the city"}
                },
                "required": ["city"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_time",
            "description": "Get the current time for a city",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "The name of the city"}
                },
                "required": ["city"],
            },
        },
    },
]

print("=" * 60)
print("Testing FunctionGemma - Function Calling Demo")
print("=" * 60)

# Prepare the request
request = {
    "model": "functiongemma",
    "messages": test_messages,
    "tools": tools,
    "stream": False,
}

print(f"\n📝 User Query: {test_messages[0]['content']}")
print(f"\n🔧 Available Tools:")
for tool in tools:
    print(f"  - {tool['function']['name']}: {tool['function']['description']}")

print(f"\n🤖 Sending request to functiongemma...")

# Call ollama API
result = subprocess.run(
    ["ollama", "run", "functiongemma"],
    input=json.dumps(test_messages),
    capture_output=True,
    text=True,
)

if result.returncode == 0:
    print(f"\n✅ Response:")
    print(result.stdout)
else:
    print(f"\n❌ Error: {result.stderr}")

print("\n" + "=" * 60)
print("FunctionGemma is ready for function calling!")
print("=" * 60)
