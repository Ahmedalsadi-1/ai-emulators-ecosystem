#!/usr/bin/env python3
"""
Bytebot Desktop Automation Examples
Demonstrates various automation capabilities using Python libraries
"""

import time
import os
import subprocess
from selenium import webdriver
from selenium.webdriver.firefox.options import Options as FirefoxOptions
from selenium.webdriver.chrome.options import Options as ChromeOptions
import pyautogui
import cv2
import numpy as np
from PIL import Image
import pytesseract
import mss
import requests
import json


class BytebotAutomation:
    def __init__(self, api_url="http://localhost:9990"):
        self.api_url = api_url
        self.display = os.environ.get("DISPLAY", ":1")

        # Configure PyAutoGUI
        pyautogui.FAILSAFE = True
        pyautogui.PAUSE = 1.0

        print("🤖 Bytebot Automation initialized")
        print(f"📺 Display: {self.display}")
        print(f"🔗 API URL: {self.api_url}")

    def api_call(self, action_data):
        """Make API call to Bytebot service"""
        try:
            response = requests.post(
                f"{self.api_url}/computer-use", json=action_data, timeout=10
            )
            return response.json()
        except Exception as e:
            print(f"API call failed: {e}")
            return None

    def mouse_move(self, x, y):
        """Move mouse to coordinates"""
        print(f"🖱️  Moving mouse to ({x}, {y})")
        result = self.api_call(
            {"action": "move_mouse", "coordinates": {"x": x, "y": y}}
        )
        return result

    def mouse_click(self, x, y, button="left", clicks=1):
        """Click mouse at coordinates"""
        print(f"👆 Clicking {button} button {clicks} time(s) at ({x}, {y})")
        result = self.api_call(
            {
                "action": "click_mouse",
                "button": button,
                "coordinates": {"x": x, "y": y},
                "clickCount": clicks,
            }
        )
        return result

    def type_text(self, text, delay=0):
        """Type text"""
        print(f"⌨️  Typing: '{text}'")
        result = self.api_call({"action": "type_text", "text": text, "delay": delay})
        return result

    def press_keys(self, keys):
        """Press keyboard keys"""
        print(f"🔥 Pressing keys: {keys}")
        result = self.api_call({"action": "press_keys", "keys": keys})
        return result

    def take_screenshot(self):
        """Take screenshot via API"""
        print("📸 Taking screenshot via API")
        result = self.api_call({"action": "screenshot"})
        return result

    def get_cursor_position(self):
        """Get current cursor position"""
        result = self.api_call({"action": "cursor_position"})
        if result and "cursor" in result:
            pos = result["cursor"]
            print(f"📍 Cursor at: ({pos['x']}, {pos['y']})")
        return result

    def wait(self, seconds):
        """Wait for specified seconds"""
        print(f"⏱️  Waiting {seconds} seconds")
        result = self.api_call({"action": "wait", "duration": int(seconds * 1000)})
        return result

    def launch_application(self, app_name):
        """Launch application"""
        print(f"🚀 Launching application: {app_name}")
        result = self.api_call({"action": "application", "application": app_name})
        return result

    # PyAutoGUI methods
    def pyautogui_screenshot(self, filename=None):
        """Take screenshot using PyAutoGUI"""
        print("📸 Taking screenshot with PyAutoGUI")
        screenshot = pyautogui.screenshot()
        if filename:
            screenshot.save(filename)
            print(f"💾 Saved to: {filename}")
        return screenshot

    def pyautogui_mouse_move(self, x, y):
        """Move mouse using PyAutoGUI"""
        print(f"🖱️  PyAutoGUI: Moving to ({x}, {y})")
        pyautogui.moveTo(x, y)

    def pyautogui_click(self, x=None, y=None, button="left", clicks=1):
        """Click using PyAutoGUI"""
        print(f"👆 PyAutoGUI: Clicking {button} at ({x}, {y})")
        pyautogui.click(x=x, y=y, button=button, clicks=clicks)

    def pyautogui_type(self, text, interval=0.02):
        """Type text using PyAutoGUI"""
        print(f"⌨️  PyAutoGUI: Typing '{text}'")
        pyautogui.typewrite(text, interval=interval)

    # Selenium methods
    def start_firefox(self, headless=False):
        """Start Firefox browser"""
        print("🦊 Starting Firefox browser")
        options = FirefoxOptions()
        if headless:
            options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")

        driver = webdriver.Firefox(options=options)
        return driver

    def start_chrome(self, headless=False):
        """Start Chrome browser"""
        print("🌐 Starting Chrome browser")
        options = ChromeOptions()
        if headless:
            options.add_argument("--headless")
        options.add_argument("--no-sandbox")
        options.add_argument("--disable-dev-shm-usage")

        driver = webdriver.Chrome(options=options)
        return driver

    # Image processing methods
    def ocr_from_image(self, image_path):
        """Extract text from image using OCR"""
        print(f"👁️  Performing OCR on: {image_path}")
        try:
            image = Image.open(image_path)
            text = pytesseract.image_to_string(image)
            print(f"📝 Extracted text: {text[:100]}...")
            return text
        except Exception as e:
            print(f"OCR failed: {e}")
            return None

    def find_image_on_screen(self, template_path, confidence=0.8):
        """Find image template on screen"""
        print(f"🔍 Looking for template: {template_path}")
        try:
            location = pyautogui.locateOnScreen(template_path, confidence=confidence)
            if location:
                center = pyautogui.center(location)
                print(f"📍 Found at: {center}")
                return center
            else:
                print("❌ Template not found")
                return None
        except Exception as e:
            print(f"Image search failed: {e}")
            return None


def demo_basic_automation():
    """Demonstrate basic automation capabilities"""
    bot = BytebotAutomation()

    print("\n🎯 Basic Automation Demo")
    print("=" * 40)

    # Basic mouse and keyboard operations
    bot.mouse_move(100, 100)
    bot.wait(1)

    bot.mouse_click(100, 100)
    bot.wait(1)

    bot.type_text("Hello from Bytebot Python automation!")
    bot.wait(1)

    bot.press_keys(["Return"])
    bot.wait(2)

    # Take screenshot
    bot.take_screenshot()
    bot.wait(1)

    # Launch Firefox
    bot.launch_application("firefox")
    bot.wait(5)

    print("✅ Basic automation demo completed!")


def demo_browser_automation():
    """Demonstrate browser automation with Selenium"""
    print("\n🌐 Browser Automation Demo")
    print("=" * 40)

    bot = BytebotAutomation()

    try:
        # Start browser
        driver = bot.start_firefox()
        driver.get("https://example.com")
        print(f"📄 Page title: {driver.title}")

        # Interact with page
        bot.wait(2)
        bot.pyautogui_click(400, 300)  # Click somewhere on the page

        bot.wait(3)
        driver.quit()

        print("✅ Browser automation demo completed!")

    except Exception as e:
        print(f"❌ Browser automation failed: {e}")


def demo_image_processing():
    """Demonstrate image processing capabilities"""
    print("\n🖼️  Image Processing Demo")
    print("=" * 40)

    bot = BytebotAutomation()

    # Take screenshot
    screenshot = bot.pyautogui_screenshot("/tmp/demo_screenshot.png")

    if screenshot:
        # Perform OCR
        text = bot.ocr_from_image("/tmp/demo_screenshot.png")
        if text:
            print(f"📝 Found text in screenshot: {len(text)} characters")

        print("✅ Image processing demo completed!")
    else:
        print("❌ Screenshot failed")


if __name__ == "__main__":
    print("🤖 Bytebot Desktop Automation Python Examples")
    print("=" * 50)

    # Run demos
    demo_basic_automation()
    demo_browser_automation()
    demo_image_processing()

    print("\n🎉 All demos completed!")
    print("\n💡 Tips:")
    print("  - Adjust coordinates for your screen resolution")
    print("  - Use DISPLAY=:1 for virtual display")
    print("  - Combine API calls with PyAutoGUI for advanced automation")
    print("  - See README.md for more examples and API reference")
