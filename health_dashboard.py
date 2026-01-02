#!/usr/bin/env python3
"""
Health Monitoring Dashboard
Simple CLI dashboard for monitoring ecosystem services
"""

import json
import time
import os
import sys
from datetime import datetime
from typing import Dict, Any

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    from health_monitor import get_health_monitor, start_health_monitoring
except ImportError:
    print("❌ Health monitor not available")
    sys.exit(1)


def clear_screen():
    """Clear the terminal screen"""
    os.system("clear" if os.name == "posix" else "cls")


def format_status(status: str) -> str:
    """Format status with colors"""
    if status == "healthy":
        return "🟢 HEALTHY"
    elif status == "unhealthy":
        return "🔴 UNHEALTHY"
    else:
        return f"🟡 {status.upper()}"


def format_time(timestamp: str) -> str:
    """Format timestamp for display"""
    try:
        dt = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        return dt.strftime("%H:%M:%S")
    except:
        return timestamp


def display_dashboard():
    """Display the health monitoring dashboard"""
    monitor = get_health_monitor()

    while True:
        clear_screen()

        # Get current status
        status_report = monitor.get_status_report()

        print("🚀 Unified Ecosystem Health Dashboard")
        print("=" * 50)
        print(f"📅 Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print(f"📊 Overall Status: {format_status(status_report['overall_status'])}")
        print()

        # Summary
        summary = status_report["summary"]
        print("📈 Summary:")
        print(f"   Total Services: {summary['total_services']}")
        print(f"   Healthy: {summary['healthy_services']}")
        print(f"   Unhealthy: {summary['unhealthy_services']}")
        print(f"   Unknown: {summary['unknown_services']}")
        print()

        # Service status
        print("🔍 Service Status:")
        print("-" * 50)

        for service_name, service_data in status_report["services"].items():
            status = service_data.get("status", "unknown")
            last_check = service_data.get("last_check")

            print(f"🏥 {service_name}")
            print(f"   Status: {format_status(status)}")
            print(
                f"   Last Check: {format_time(last_check) if last_check else 'Never'}"
            )

            if "response_time" in service_data and service_data["response_time"]:
                print(f"   Response Time: {service_data['response_time']:.3f}s")
            if "uptime_percentage" in service_data:
                print(f"   Uptime: {service_data['uptime_percentage']}%")

            if "error_count" in service_data and service_data["error_count"] > 0:
                print(f"   Errors: {service_data['error_count']}")

            if "last_error" in service_data and service_data["last_error"]:
                print(f"   Last Error: {service_data['last_error']}")

            print()

        print("🔄 Refreshing in 5 seconds... (Ctrl+C to exit)")
        time.sleep(5)


if __name__ == "__main__":
    try:
        print("Starting health monitoring dashboard...")
        monitor = start_health_monitoring()
        display_dashboard()
    except KeyboardInterrupt:
        print("\n👋 Dashboard stopped")
    except Exception as e:
        print(f"❌ Dashboard error: {e}")
        import traceback

        traceback.print_exc()
