#!/usr/bin/env python3
"""
OpenCode API Debug Script
Tests the OpenCode API directly to identify connection issues
"""

import json
import logging
import os
import time

import requests

# Set up logging
logging.basicConfig(
    level=logging.DEBUG, format="%(asctime)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)


def test_opencode_api():
    """Test the OpenCode API directly"""
    url = "https://opencode.ai/zen/v1/chat/completions"
    api_key = os.getenv("OPENCODE_API_KEY")
    if not api_key:
        try:
            with open("secrets/opencode_api_key.txt", "r", encoding="utf-8") as secret_file:
                api_key = secret_file.read().strip()
        except FileNotFoundError:
            api_key = None

    if not api_key:
        logger.error("OPENCODE_API_KEY not set; skipping direct API test")
        return

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
    }

    data = {
        "model": "grok-code",
        "messages": [{"role": "user", "content": "Hello, test message"}],
        "max_tokens": 100,
        "temperature": 0.7,
    }

    logger.info(f"Testing OpenCode API at {url}")
    logger.debug(f"Headers: {{'Authorization': 'Bearer ***', 'Content-Type': 'application/json'}}")
    logger.debug(f"Data: {data}")

    try:
        # Test basic connectivity first
        logger.info("Testing basic connectivity...")
        response = requests.get("https://opencode.ai", timeout=10)
        logger.info(f"Basic connectivity test: {response.status_code}")

        # Test API endpoint
        logger.info("Testing API endpoint...")
        response = requests.post(url, headers=headers, json=data, timeout=30)
        logger.info(f"API Response Status: {response.status_code}")
        logger.info(f"API Response Headers: {dict(response.headers)}")

        if response.status_code == 200:
            result = response.json()
            logger.info(f"API Response Success: {json.dumps(result, indent=2)}")
        else:
            logger.error(f"API Response Error: {response.text}")

    except requests.exceptions.Timeout as e:
        logger.error(f"Timeout error: {e}")
    except requests.exceptions.ConnectionError as e:
        logger.error(f"Connection error: {e}")
    except requests.exceptions.HTTPError as e:
        logger.error(f"HTTP error: {e}")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")


def test_litellm_proxy():
    """Test the LiteLLM proxy with OpenCode models"""
    url = "http://localhost:4000/chat/completions"
    headers = {
        "Content-Type": "application/json",
    }

    data = {
        "model": "grok-code",
        "messages": [{"role": "user", "content": "Hello, test message"}],
        "max_tokens": 100,
        "temperature": 0.7,
    }

    logger.info(f"Testing LiteLLM proxy at {url}")
    logger.debug(f"Data: {data}")

    try:
        response = requests.post(url, headers=headers, json=data, timeout=30)
        logger.info(f"Proxy Response Status: {response.status_code}")
        logger.info(f"Proxy Response Headers: {dict(response.headers)}")

        if response.status_code == 200:
            result = response.json()
            logger.info(f"Proxy Response Success: {json.dumps(result, indent=2)}")
        else:
            logger.error(f"Proxy Response Error: {response.text}")

    except requests.exceptions.Timeout as e:
        logger.error(f"Proxy timeout error: {e}")
    except requests.exceptions.ConnectionError as e:
        logger.error(f"Proxy connection error: {e}")
    except requests.exceptions.HTTPError as e:
        logger.error(f"Proxy HTTP error: {e}")
    except Exception as e:
        logger.error(f"Proxy unexpected error: {e}")


if __name__ == "__main__":
    logger.info("Starting OpenCode API debugging...")

    logger.info("=== Testing OpenCode API Directly ===")
    test_opencode_api()

    logger.info("\n=== Testing LiteLLM Proxy ===")
    # Note: This assumes the proxy is running on localhost:4000
    test_litellm_proxy()

    logger.info("Debugging complete.")
