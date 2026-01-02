#!/usr/bin/env python3
"""
Unified Ecosystem Health Monitor
Provides real-time monitoring and status reporting for all services
"""

import asyncio
import json
import logging
import time
from datetime import datetime, timedelta
from typing import Dict, Any, List
import yaml
import requests
import threading
import sys
import os

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from unified_service_client import UnifiedServiceClient


class HealthMonitor:
    """Unified health monitoring system for ecosystem services"""

    def __init__(self, config_path: str = "unified-ecosystem-config.yaml"):
        self.config = self._load_config(config_path)
        self.logger = logging.getLogger(__name__)
        self.status_history: Dict[str, List[Dict[str, Any]]] = {}
        self.current_status: Dict[str, Dict[str, Any]] = {}
        self.monitoring_active = False
        self.check_interval = self.config.get("health_monitoring", {}).get(
            "check_interval", 30
        )

        # Initialize status for all services
        for service_name in self.config.get("services", {}):
            self.status_history[service_name] = []
            self.current_status[service_name] = {
                "status": "unknown",
                "last_check": None,
                "uptime": 0,
                "downtime": 0,
                "response_time": None,
                "error_count": 0,
                "last_error": None,
            }

    def _load_config(self, config_path: str) -> Dict[str, Any]:
        """Load monitoring configuration"""
        try:
            with open(config_path, "r") as f:
                return yaml.safe_load(f)
        except Exception as e:
            self.logger.error(f"Failed to load config: {e}")
            return self._get_default_config()

    def _get_default_config(self) -> Dict[str, Any]:
        """Get default monitoring configuration"""
        return {
            "health_monitoring": {
                "check_interval": 30,
                "services": {
                    "bytebot-llm-proxy": {
                        "endpoint": "/health",
                        "expected_status": 200,
                        "timeout": 5,
                    },
                    "open-interface": {
                        "endpoint": "/status",
                        "expected_status": 200,
                        "timeout": 5,
                    },
                },
            }
        }

    async def check_service_health(self, service_name: str) -> Dict[str, Any]:
        """Check health of a specific service"""
        service_config = self.config.get("services", {}).get(service_name, {})
        health_config = (
            self.config.get("health_monitoring", {})
            .get("services", {})
            .get(service_name, {})
        )

        if not service_config:
            return {
                "status": "unknown",
                "error": f"Service {service_name} not configured",
            }

        base_url = service_config.get("url", "")
        health_endpoint = health_config.get("endpoint", "/health")
        expected_status = health_config.get("expected_status", 200)
        timeout = health_config.get("timeout", 5)

        check_time = datetime.now()
        start_time = time.time()

        try:
            response = requests.get(f"{base_url}{health_endpoint}", timeout=timeout)

            response_time = time.time() - start_time

            if response.status_code == expected_status:
                status = "healthy"
                error = None
            else:
                status = "unhealthy"
                error = f"Unexpected status code: {response.status_code}"

        except requests.exceptions.Timeout:
            status = "unhealthy"
            error = "Timeout"
            response_time = timeout
        except requests.exceptions.ConnectionError:
            status = "unhealthy"
            error = "Connection failed"
            response_time = None
        except Exception as e:
            status = "unhealthy"
            error = str(e)
            response_time = None

        result = {
            "status": status,
            "timestamp": check_time.isoformat(),
            "response_time": response_time,
            "error": error,
        }

        # Update current status
        current = self.current_status[service_name]
        current["last_check"] = check_time
        current["response_time"] = response_time

        if status == "healthy":
            current["status"] = "healthy"
            current["error_count"] = 0
            current["last_error"] = None
        else:
            current["status"] = "unhealthy"
            current["error_count"] += 1
            current["last_error"] = error

        # Add to history
        self.status_history[service_name].append(result)

        # Keep only last 100 checks
        if len(self.status_history[service_name]) > 100:
            self.status_history[service_name] = self.status_history[service_name][-100:]

        return result

    async def check_all_services(self) -> Dict[str, Dict[str, Any]]:
        """Check health of all services"""
        tasks = []
        for service_name in self.config.get("services", {}):
            tasks.append(self.check_service_health(service_name))

        results = await asyncio.gather(*tasks, return_exceptions=True)

        status_report = {}
        for i, service_name in enumerate(self.config.get("services", {})):
            if isinstance(results[i], Exception):
                status_report[service_name] = {
                    "status": "error",
                    "error": str(results[i]),
                }
            else:
                status_report[service_name] = results[i]

        return status_report

    def get_status_report(self) -> Dict[str, Any]:
        """Get comprehensive status report"""
        report = {
            "timestamp": datetime.now().isoformat(),
            "services": {},
            "overall_status": "healthy",
            "summary": {
                "total_services": len(self.current_status),
                "healthy_services": 0,
                "unhealthy_services": 0,
                "unknown_services": 0,
            },
        }

        for service_name, status in self.current_status.items():
            service_report = dict(status)
            service_report["history"] = self.status_history[service_name][
                -10:
            ]  # Last 10 checks

            # Calculate uptime percentage
            if self.status_history[service_name]:
                healthy_checks = sum(
                    1
                    for check in self.status_history[service_name]
                    if check["status"] == "healthy"
                )
                uptime_percentage = (
                    healthy_checks / len(self.status_history[service_name])
                ) * 100
                service_report["uptime_percentage"] = round(uptime_percentage, 2)

            report["services"][service_name] = service_report

            # Update summary
            if status["status"] == "healthy":
                report["summary"]["healthy_services"] += 1
            elif status["status"] == "unhealthy":
                report["summary"]["unhealthy_services"] += 1
                report["overall_status"] = "unhealthy"
            else:
                report["summary"]["unknown_services"] += 1
                if report["overall_status"] == "healthy":
                    report["overall_status"] = "degraded"

        return report

    async def monitoring_loop(self):
        """Main monitoring loop"""
        self.monitoring_active = True
        self.logger.info(
            f"Starting health monitoring (interval: {self.check_interval}s)"
        )

        while self.monitoring_active:
            try:
                await self.check_all_services()
                self.logger.debug("Health check completed")
            except Exception as e:
                self.logger.error(f"Error in monitoring loop: {e}")

            await asyncio.sleep(self.check_interval)

    def start_monitoring(self):
        """Start the monitoring system"""

        def run_loop():
            asyncio.run(self.monitoring_loop())

        thread = threading.Thread(target=run_loop, daemon=True)
        thread.start()
        self.logger.info("Health monitoring started")

    def stop_monitoring(self):
        """Stop the monitoring system"""
        self.monitoring_active = False
        self.logger.info("Health monitoring stopped")

    def get_service_metrics(self, service_name: str) -> Dict[str, Any]:
        """Get detailed metrics for a specific service"""
        if service_name not in self.current_status:
            return {"error": f"Service {service_name} not found"}

        status = self.current_status[service_name]
        history = self.status_history[service_name]

        metrics = {
            "current_status": status["status"],
            "last_check": status["last_check"].isoformat()
            if status["last_check"]
            else None,
            "total_checks": len(history),
            "error_count": status["error_count"],
            "last_error": status["last_error"],
            "average_response_time": None,
            "uptime_percentage": 0,
        }

        if history:
            # Calculate average response time
            response_times = [
                h["response_time"] for h in history if h["response_time"] is not None
            ]
            if response_times:
                metrics["average_response_time"] = round(
                    sum(response_times) / len(response_times), 3
                )

            # Calculate uptime
            healthy_checks = sum(1 for h in history if h["status"] == "healthy")
            metrics["uptime_percentage"] = round(
                (healthy_checks / len(history)) * 100, 2
            )

        return metrics


# Global monitor instance
_monitor_instance = None


def get_health_monitor() -> HealthMonitor:
    """Get or create health monitor instance"""
    global _monitor_instance
    if _monitor_instance is None:
        _monitor_instance = HealthMonitor()
    return _monitor_instance


def start_health_monitoring():
    """Start the health monitoring system"""
    monitor = get_health_monitor()
    monitor.start_monitoring()
    return monitor


def get_system_status() -> Dict[str, Any]:
    """Get current system status"""
    monitor = get_health_monitor()
    return monitor.get_status_report()


if __name__ == "__main__":
    # CLI for health monitoring
    import argparse

    parser = argparse.ArgumentParser(description="Unified Ecosystem Health Monitor")
    parser.add_argument("--start", action="store_true", help="Start monitoring")
    parser.add_argument("--status", action="store_true", help="Get current status")
    parser.add_argument("--check", type=str, help="Check specific service")
    parser.add_argument("--metrics", type=str, help="Get metrics for service")

    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s"
    )

    monitor = get_health_monitor()

    if args.start:
        print("Starting health monitoring...")
        monitor.start_monitoring()
        try:
            while True:
                time.sleep(1)
        except KeyboardInterrupt:
            print("\nStopping monitoring...")
            monitor.stop_monitoring()

    elif args.status:
        status = monitor.get_status_report()
        print(json.dumps(status, indent=2, default=str))

    elif args.check:

        async def check():
            result = await monitor.check_service_health(args.check)
            print(json.dumps(result, indent=2, default=str))

        asyncio.run(check())

    elif args.metrics:
        metrics = monitor.get_service_metrics(args.metrics)
        print(json.dumps(metrics, indent=2, default=str))

    else:
        print(
            "Use --start to start monitoring, --status to get status, --check <service> to check a service, or --metrics <service> to get metrics"
        )
