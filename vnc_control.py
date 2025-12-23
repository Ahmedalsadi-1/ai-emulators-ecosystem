#!/usr/bin/env python3
"""
Enhanced VNC Control Script for Kali Desktop MCP Server
Provides AI-powered desktop control with OmniParser integration
"""

import sys
import json
import subprocess
import time
import os


class EnhancedVNCController:
    def __init__(self, display=":1"):
        self.display = display
        self.xdotool_available = self.check_xdotool()

    def check_xdotool(self):
        """Check if xdotool is available"""
        try:
            result = subprocess.run(
                ["which", "xdotool"], capture_output=True, text=True
            )
            return result.returncode == 0
        except:
            return False

    def run_xdotool(self, command, timeout=10):
        """Execute xdotool command with proper environment"""
        try:
            env = os.environ.copy()
            env["DISPLAY"] = self.display

            full_command = f"xdotool {command}"
            result = subprocess.run(
                full_command,
                shell=True,
                capture_output=True,
                text=True,
                timeout=timeout,
                env=env,
            )
            return {
                "success": result.returncode == 0,
                "output": result.stdout.strip(),
                "error": result.stderr.strip(),
                "returncode": result.returncode,
            }
        except subprocess.TimeoutExpired:
            return {"success": False, "error": "Command timed out", "returncode": -1}
        except Exception as e:
            return {"success": False, "error": str(e), "returncode": -1}

    def click(self, x, y, button="left"):
        """Click at coordinates with intelligent timing"""
        if not self.xdotool_available:
            return {"success": False, "error": "xdotool not available"}

        button_map = {"left": 1, "middle": 2, "right": 3}
        button_num = button_map.get(button, 1)

        # Add small delay for UI stability
        time.sleep(0.2)

        result = self.run_xdotool(f"mousemove {x} {y}")
        if not result["success"]:
            return result

        time.sleep(0.1)
        result = self.run_xdotool(f"click {button_num}")

        return result

    def type_text(self, text):
        """Type text with proper escaping and timing"""
        if not self.xdotool_available:
            return {"success": False, "error": "xdotool not available"}

        # Escape special characters for shell
        escaped_text = text.replace('"', '\\"').replace("'", "\\'").replace("`", "\\`")

        # Type with proper timing for UI elements
        time.sleep(0.2)
        result = self.run_xdotool(f"type '{escaped_text}'")

        return result

    def press_key(self, keys):
        """Press key combination"""
        if not self.xdotool_available:
            return {"success": False, "error": "xdotool not available"}

        time.sleep(0.1)
        result = self.run_xdotool(f"key {keys}")

        return result

    def drag(self, x1, y1, x2, y2, button="left"):
        """Drag from one position to another with smooth motion"""
        if not self.xdotool_available:
            return {"success": False, "error": "xdotool not available"}

        button_map = {"left": 1, "middle": 2, "right": 3}
        button_num = button_map.get(button, 1)

        # Move to start position
        time.sleep(0.2)
        result = self.run_xdotool(f"mousemove {x1} {y1}")
        if not result["success"]:
            return result

        # Press and hold
        time.sleep(0.1)
        result = self.run_xdotool(f"mousedown {button_num}")
        if not result["success"]:
            return result

        # Smooth drag motion
        steps = 10
        for i in range(1, steps + 1):
            current_x = x1 + (x2 - x1) * i // steps
            current_y = y1 + (y2 - y1) * i // steps
            self.run_xdotool(f"mousemove {current_x} {current_y}")
            time.sleep(0.02)

        # Release
        time.sleep(0.1)
        result = self.run_xdotool(f"mouseup {button_num}")

        return result

    def get_window_info(self):
        """Get information about current windows"""
        if not self.xdotool_available:
            return {"success": False, "error": "xdotool not available"}

        result = self.run_xdotool("getwindowgeometry $(xdotool getactivewindow)")
        return result

    def get_mouse_location(self):
        """Get current mouse location"""
        if not self.xdotool_available:
            return {"success": False, "error": "xdotool not available"}

        result = self.run_xdotool("getmouselocation")
        if result["success"]:
            # Parse output like "x:123 y:456 screen:0 window:123456"
            output = result["output"]
            try:
                x_part = output.split("x:")[1].split()[0]
                y_part = output.split("y:")[1].split()[0]
                return {
                    "success": True,
                    "x": int(x_part),
                    "y": int(y_part),
                    "output": output,
                }
            except:
                return {"success": False, "error": "Failed to parse mouse location"}

        return result

    def wait_for_window(self, window_name, timeout=10):
        """Wait for a window to appear"""
        if not self.xdotool_available:
            return {"success": False, "error": "xdotool not available"}

        start_time = time.time()
        while time.time() - start_time < timeout:
            result = self.run_xdotool(f"search --name '{window_name}'")
            if result["success"] and result["output"].strip():
                return {"success": True, "window_id": result["output"].strip()}
            time.sleep(0.5)

        return {
            "success": False,
            "error": f"Window '{window_name}' not found within {timeout}s",
        }

    def focus_window(self, window_name):
        """Focus a window by name"""
        if not self.xdotool_available:
            return {"success": False, "error": "xdotool not available"}

        result = self.run_xdotool(f"search --name '{window_name}' windowfocus")
        return result


def main():
    if len(sys.argv) < 2:
        print(
            json.dumps(
                {
                    "success": False,
                    "error": "Usage: vnc_control.py <command> [args...]",
                    "available_commands": [
                        "click",
                        "type",
                        "key",
                        "drag",
                        "window",
                        "mouse",
                        "wait_window",
                        "focus_window",
                    ],
                }
            )
        )
        sys.exit(1)

    controller = EnhancedVNCController()
    command = sys.argv[1]

    try:
        if command == "click":
            if len(sys.argv) < 4:
                print(
                    json.dumps(
                        {"success": False, "error": "click requires x y coordinates"}
                    )
                )
                sys.exit(1)
            x, y = int(sys.argv[2]), int(sys.argv[3])
            button = sys.argv[4] if len(sys.argv) > 4 else "left"
            result = controller.click(x, y, button)
            result.update({"action": "click", "x": x, "y": y, "button": button})

        elif command == "type":
            if len(sys.argv) < 3:
                print(
                    json.dumps(
                        {"success": False, "error": "type requires text argument"}
                    )
                )
                sys.exit(1)
            text = " ".join(sys.argv[2:])
            result = controller.type_text(text)
            result.update({"action": "type", "text": text})

        elif command == "key":
            if len(sys.argv) < 3:
                print(
                    json.dumps({"success": False, "error": "key requires key argument"})
                )
                sys.exit(1)
            key = sys.argv[2]
            result = controller.press_key(key)
            result.update({"action": "key", "key": key})

        elif command == "drag":
            if len(sys.argv) < 6:
                print(
                    json.dumps(
                        {
                            "success": False,
                            "error": "drag requires x1 y1 x2 y2 coordinates",
                        }
                    )
                )
                sys.exit(1)
            x1, y1, x2, y2 = (
                int(sys.argv[2]),
                int(sys.argv[3]),
                int(sys.argv[4]),
                int(sys.argv[5]),
            )
            button = sys.argv[6] if len(sys.argv) > 6 else "left"
            result = controller.drag(x1, y1, x2, y2, button)
            result.update(
                {
                    "action": "drag",
                    "x1": x1,
                    "y1": y1,
                    "x2": x2,
                    "y2": y2,
                    "button": button,
                }
            )

        elif command == "window":
            result = controller.get_window_info()
            result.update({"action": "get_window_info"})

        elif command == "mouse":
            result = controller.get_mouse_location()
            result.update({"action": "get_mouse_location"})

        elif command == "wait_window":
            if len(sys.argv) < 3:
                print(
                    json.dumps(
                        {"success": False, "error": "wait_window requires window name"}
                    )
                )
                sys.exit(1)
            window_name = sys.argv[2]
            timeout = int(sys.argv[3]) if len(sys.argv) > 3 else 10
            result = controller.wait_for_window(window_name, timeout)
            result.update(
                {
                    "action": "wait_for_window",
                    "window_name": window_name,
                    "timeout": timeout,
                }
            )

        elif command == "focus_window":
            if len(sys.argv) < 3:
                print(
                    json.dumps(
                        {"success": False, "error": "focus_window requires window name"}
                    )
                )
                sys.exit(1)
            window_name = sys.argv[2]
            result = controller.focus_window(window_name)
            result.update({"action": "focus_window", "window_name": window_name})

        else:
            print(
                json.dumps(
                    {
                        "success": False,
                        "error": f"Unknown command: {command}",
                        "available_commands": [
                            "click",
                            "type",
                            "key",
                            "drag",
                            "window",
                            "mouse",
                            "wait_window",
                            "focus_window",
                        ],
                    }
                )
            )
            sys.exit(1)

        print(json.dumps(result))

    except ValueError as e:
        print(json.dumps({"success": False, "error": f"Invalid numeric argument: {e}"}))
        sys.exit(1)
    except Exception as e:
        print(json.dumps({"success": False, "error": f"Unexpected error: {e}"}))
        sys.exit(1)


if __name__ == "__main__":
    main()
