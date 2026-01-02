#!/usr/bin/env python3
"""
Unified Service Communication Client
Provides standardized communication between ecosystem services
"""

import requests
import json
import logging
import time
from typing import Dict, Any, Optional, List
import yaml
import os


class UnifiedServiceClient:
    """Client for communicating with unified ecosystem services"""

    def __init__(self, config_path: str = "unified-ecosystem-config.yaml"):
        self.config = self._load_config(config_path)
        self.logger = logging.getLogger(__name__)
        self.session = requests.Session()
        self.session.timeout = (
            self.config.get("communication", {})
            .get("api_interfaces", {})
            .get("llm_proxy", {})
            .get("timeout", 30)
        )

    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load unified ecosystem configuration"""
        try:
            with open(config_path, "r") as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            self.logger.warning(f"Config file {config_path} not found, using defaults")
            return self._get_default_config()
        except Exception as e:
            self.logger.error(f"Error loading config: {e}")
            return self._get_default_config()

    def _get_default_config(self) -> Dict[str, Any]:
        """Get default configuration"""
        return {
            "services": {
                "bytebot-llm-proxy": {
                    "url": os.getenv("BYTEBOT_PROXY_URL", "http://localhost:4000"),
                    "endpoints": {
                        "chat": "/chat/completions",
                        "models": "/v1/models",
                        "health": "/health",
                    },
                }
            },
            "communication": {
                "api_interfaces": {"llm_proxy": {"timeout": 30, "retry_attempts": 3}}
            },
        }

    def call_llm_proxy(
        self, endpoint: str, data: Dict[str, Any], **kwargs
    ) -> Dict[str, Any]:
        """Call ByteBot LLM proxy endpoint"""
        proxy_config = self.config["services"]["bytebot-llm-proxy"]
        base_url = proxy_config["url"]
        full_url = f"{base_url}{endpoint}"

        headers = kwargs.get("headers", {"Content-Type": "application/json"})

        retry_attempts = (
            self.config.get("communication", {})
            .get("api_interfaces", {})
            .get("llm_proxy", {})
            .get("retry_attempts", 3)
        )

        for attempt in range(retry_attempts):
            try:
                self.logger.debug(
                    f"Calling LLM proxy: {full_url} (attempt {attempt + 1})"
                )

                response = self.session.post(
                    full_url, json=data, headers=headers, timeout=self.session.timeout
                )

                response.raise_for_status()
                return response.json()

            except requests.exceptions.Timeout:
                self.logger.warning(
                    f"Timeout calling {full_url} (attempt {attempt + 1})"
                )
                if attempt == retry_attempts - 1:
                    raise
            except requests.exceptions.RequestException as e:
                self.logger.error(f"Request error calling {full_url}: {e}")
                if attempt == retry_attempts - 1:
                    raise

        raise Exception(f"Failed to call {full_url} after {retry_attempts} attempts")

    def get_available_models(self) -> List[str]:
        """Get list of available models from LLM proxy"""
        try:
            response = self.call_llm_proxy("/v1/models", {})
            return [model["id"] for model in response.get("data", [])]
        except Exception as e:
            self.logger.error(f"Failed to get available models: {e}")
            return []

    def check_service_health(self, service_name: str) -> bool:
        """Check health of a specific service"""
        if service_name not in self.config.get("services", {}):
            return False

        service_config = self.config["services"][service_name]
        health_endpoint = service_config.get("endpoints", {}).get("health", "/health")
        base_url = service_config["url"]
        full_url = f"{base_url}{health_endpoint}"

        try:
            response = self.session.get(full_url, timeout=5)
            return response.status_code == 200
        except Exception as e:
            self.logger.error(f"Health check failed for {service_name}: {e}")
            return False

    def chat_completion(
        self, messages: List[Dict[str, str]], model: str = "grok-code", **kwargs
    ) -> Dict[str, Any]:
        """Make a chat completion request"""
        data = {"model": model, "messages": messages, **kwargs}

        return self.call_llm_proxy("/chat/completions", data)


# Global client instance
_client_instance = None


def get_unified_client() -> UnifiedServiceClient:
    """Get or create unified service client instance"""
    global _client_instance
    if _client_instance is None:
        _client_instance = UnifiedServiceClient()
    return _client_instance


# Convenience functions for Open-Interface
def call_llm(messages: List[Dict[str, str]], model: str = "grok-code", **kwargs) -> str:
    """Convenience function to call LLM and get response text"""
    client = get_unified_client()
    try:
        response = client.chat_completion(messages, model, **kwargs)
        choices = response.get("choices", [])
        if choices:
            return choices[0].get("message", {}).get("content", "")
        return ""
    except Exception as e:
        logging.error(f"LLM call failed: {e}")
        return f"Error: {str(e)}"


def get_available_models() -> List[str]:
    """Get available models"""
    client = get_unified_client()
    return client.get_available_models()


if __name__ == "__main__":
    # Test the client
    logging.basicConfig(level=logging.INFO)
    client = get_unified_client()

    print("Testing unified service client...")

    # Test health check
    health = client.check_service_health("bytebot-llm-proxy")
    print(f"ByteBot proxy health: {health}")

    # Test models
    models = client.get_available_models()
    print(f"Available models: {models}")

    # Test chat completion
    if models:
        try:
            response = client.chat_completion(
                [{"role": "user", "content": "Hello, test message"}],
                model=models[0] if models else "grok-code",
            )
            print(f"Test response: {response}")
        except Exception as e:
            print(f"Chat completion test failed: {e}")
