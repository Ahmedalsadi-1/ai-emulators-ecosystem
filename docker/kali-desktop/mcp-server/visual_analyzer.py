#!/usr/bin/env python3

import cv2
import numpy as np
import base64
import json
import sys
from PIL import Image, ImageDraw
import pytesseract

class VisualAnalyzer:
    def __init__(self):
        self.current_screenshot = None
    
    def load_screenshot(self, image_data):
        """Load screenshot from base64 data"""
        image_bytes = base64.b64decode(image_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        self.current_screenshot = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return self.current_screenshot is not None
    
    def find_text(self, text_to_find):
        """Find text on screen using OCR"""
        if self.current_screenshot is None:
            return None
        
        # Convert to RGB for pytesseract
        rgb_image = cv2.cvtColor(self.current_screenshot, cv2.COLOR_BGR2RGB)
        
        # Extract text with bounding boxes
        data = pytesseract.image_to_data(rgb_image, output_type=pytesseract.Output.DICT)
        
        for i, text in enumerate(data['text']):
            if text_to_find.lower() in text.lower():
                x = data['left'][i]
                y = data['top'][i]
                w = data['width'][i]
                h = data['height'][i]
                
                return {
                    'found': True,
                    'text': text,
                    'x': x + w // 2,  # Center coordinates
                    'y': y + h // 2,
                    'bbox': [x, y, w, h]
                }
        
        return {'found': False}
    
    def find_button(self, button_text):
        """Find button by text"""
        result = self.find_text(button_text)
        if result and result['found']:
            # Buttons are typically clickable, so return center coordinates
            return {
                'found': True,
                'click_x': result['x'],
                'click_y': result['y'],
                'text': result['text']
            }
        return {'found': False}
    
    def find_window(self, window_title):
        """Find window by title"""
        return self.find_text(window_title)
    
    def detect_ui_elements(self):
        """Detect common UI elements like buttons, text fields, etc."""
        if self.current_screenshot is None:
            return []
        
        # Convert to grayscale
        gray = cv2.cvtColor(self.current_screenshot, cv2.COLOR_BGR2GRAY)
        
        # Find rectangles (potential buttons/text fields)
        contours, _ = cv2.findContours(gray, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        elements = []
        for contour in contours:
            x, y, w, h = cv2.boundingRect(contour)
            
            # Filter by size (likely UI elements)
            if 20 < w < 300 and 10 < h < 100:
                elements.append({
                    'type': 'rectangle',
                    'x': x + w // 2,
                    'y': y + h // 2,
                    'width': w,
                    'height': h,
                    'bbox': [x, y, w, h]
                })
        
        return elements
    
    def get_screen_text(self):
        """Extract all text from screen"""
        if self.current_screenshot is None:
            return ""
        
        rgb_image = cv2.cvtColor(self.current_screenshot, cv2.COLOR_BGR2RGB)
        return pytesseract.image_to_string(rgb_image)

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 visual_analyzer.py <command> [args...]")
        sys.exit(1)
    
    analyzer = VisualAnalyzer()
    command = sys.argv[1]
    
    if command == "find_text":
        if len(sys.argv) < 4:
            print("Usage: find_text <image_base64> <text_to_find>")
            sys.exit(1)
        
        image_data = sys.argv[2]
        text_to_find = sys.argv[3]
        
        if analyzer.load_screenshot(image_data):
            result = analyzer.find_text(text_to_find)
            print(json.dumps(result))
        else:
            print(json.dumps({'error': 'Failed to load image'}))
    
    elif command == "find_button":
        if len(sys.argv) < 4:
            print("Usage: find_button <image_base64> <button_text>")
            sys.exit(1)
        
        image_data = sys.argv[2]
        button_text = sys.argv[3]
        
        if analyzer.load_screenshot(image_data):
            result = analyzer.find_button(button_text)
            print(json.dumps(result))
        else:
            print(json.dumps({'error': 'Failed to load image'}))
    
    elif command == "get_text":
        if len(sys.argv) < 3:
            print("Usage: get_text <image_base64>")
            sys.exit(1)
        
        image_data = sys.argv[2]
        
        if analyzer.load_screenshot(image_data):
            text = analyzer.get_screen_text()
            print(json.dumps({'text': text}))
        else:
            print(json.dumps({'error': 'Failed to load image'}))
    
    else:
        print(f"Unknown command: {command}")
        sys.exit(1)

if __name__ == "__main__":
    main()
