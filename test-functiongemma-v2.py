#!/usr/bin/env python3
"""
Test functiongemma with proper function calling using ollama library
"""

import json

try:
    from ollama import chat
except ImportError:
    print("Installing ollama library...")
    import subprocess

    subprocess.run(["pip3", "install", "ollama"], check=True)
    from ollama import chat


# Define tools
def get_weather(city: str) -> str:
    """Get the current weather for a city."""
    return json.dumps(
        {"city": city, "temperature": 22, "unit": "celsius", "condition": "sunny"}
    )


def get_time(city: str) -> str:
    """Get the current time for a city."""
    return json.dumps({"city": city, "timezone": "UTC", "time": "10:30 AM"})


print("=" * 70)
print("FunctionGemma - Function Calling Test")
print("=" * 70)

# Test case 1: Simple function call
print("\n📋 Test 1: Simple weather query")
print("-" * 70)

messages = [{"role": "user", "content": "What is the weather in Paris?"}]
print(f"User: {messages[0]['content']}")

try:
    response = chat("functiongemma", messages=messages, tools=[get_weather])
    print(f"\nModel Response:")
    if hasattr(response, "message"):
        msg = response.message
        print(f"  Content: {msg.get('content', 'N/A')}")
        if "tool_calls" in msg:
            print(f"  Tool Calls: {msg['tool_calls']}")
    else:
        print(response)
except Exception as e:
    print(f"Error: {e}")

# Test case 2: Multiple tools
print("\n\n📋 Test 2: Multiple tools available")
print("-" * 70)

messages = [{"role": "user", "content": "What time is it in Tokyo?"}]
print(f"User: {messages[0]['content']}")

try:
    response = chat("functiongemma", messages=messages, tools=[get_weather, get_time])
    print(f"\nModel Response:")
    if hasattr(response, "message"):
        msg = response.message
        print(f"  Content: {msg.get('content', 'N/A')}")
        if "tool_calls" in msg:
            print(f"  Tool Calls: {msg['tool_calls']}")
    else:
        print(response)
except Exception as e:
    print(f"Error: {e}")

# Test case 3: Direct chat (no tools)
print("\n\n📋 Test 3: Regular chat (no tools)")
print("-" * 70)

messages = [{"role": "user", "content": "Hello, how are you?"}]
print(f"User: {messages[0]['content']}")

try:
    response = chat("functiongemma", messages=messages)
    print(f"\nModel Response: {response['message']['content']}")
except Exception as e:
    print(f"Error: {e}")

print("\n" + "=" * 70)
print("Tests completed!")
print("=" * 70)
