import cv2
import numpy as np
import json
import subprocess
import os
import re
import sys


def analyze(image_path):
    # Load image
    img = cv2.imread(image_path)
    if img is None:
        return {"error": "Could not load image"}

    height, width = img.shape[:2]

    # Convert to different color spaces for better detection
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)

    # Multiple detection strategies
    elements = []

    # Strategy 1: Edge detection for UI boundaries
    edges = cv2.Canny(gray, 50, 150)
    contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        area = cv2.contourArea(contour)
        if area > 50 and w > 10 and h > 10 and w < width * 0.9 and h < height * 0.9:
            elements.append(
                {
                    "type": "edge_detected",
                    "bounds": {
                        "x": int(x),
                        "y": int(y),
                        "width": int(w),
                        "height": int(h),
                    },
                    "area": int(area),
                    "center": {"x": int(x + w / 2), "y": int(y + h / 2)},
                    "confidence": min(1.0, area / 10000),
                }
            )

    # Strategy 2: Color-based detection
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    laplacian = cv2.Laplacian(blur, cv2.CV_64F)
    laplacian = np.absolute(laplacian)
    laplacian = np.uint8(laplacian)
    _, thresh = cv2.threshold(laplacian, 30, 255, cv2.THRESH_BINARY)
    contours2, _ = cv2.findContours(thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    for contour in contours2:
        x, y, w, h = cv2.boundingRect(contour)
        area = cv2.contourArea(contour)
        if area > 100 and w > 15 and h > 15:
            overlap = False
            for elem in elements:
                if (
                    abs(elem["center"]["x"] - (x + w / 2)) < 20
                    and abs(elem["center"]["y"] - (y + h / 2)) < 20
                ):
                    overlap = True
                    break
            if not overlap:
                elements.append(
                    {
                        "type": "contrast_detected",
                        "bounds": {
                            "x": int(x),
                            "y": int(y),
                            "width": int(w),
                            "height": int(h),
                        },
                        "area": int(area),
                        "center": {"x": int(x + w / 2), "y": int(y + h / 2)},
                        "confidence": min(1.0, area / 5000),
                    }
                )

    # Strategy 3: OCR for semantic labeling
    ocr_data = []
    try:
        subprocess.run(
            ["tesseract", image_path, "/tmp/ocr_result", "hocr"],
            check=True,
            capture_output=True,
        )
        if os.path.exists("/tmp/ocr_result.hocr"):
            with open("/tmp/ocr_result.hocr", "r") as f:
                hocr = f.read()
            word_matches = re.finditer(
                r"title='bbox (\d+) (\d+) (\d+) (\d+);.*?'>\s*(.*?)\s*</span>", hocr
            )
            for match in word_matches:
                x1, y1, x2, y2, text = (
                    int(match.group(1)),
                    int(match.group(2)),
                    int(match.group(3)),
                    int(match.group(4)),
                    match.group(5),
                )
                clean_text = re.sub("<[^<]+?>", "", text).strip()
                if clean_text and len(clean_text) > 1:
                    ocr_data.append(
                        {
                            "text": clean_text,
                            "bounds": {
                                "x": x1,
                                "y": y1,
                                "width": x2 - x1,
                                "height": y2 - y1,
                            },
                            "center": {"x": (x1 + x2) // 2, "y": (y1 + y2) // 2},
                        }
                    )
    except Exception:
        pass

    # Sort and filter
    elements.sort(key=lambda x: x["confidence"], reverse=True)

    return {
        "total_elements": len(elements),
        "image_info": {"width": int(width), "height": int(height)},
        "elements": elements[:15],
        "ocr_elements": ocr_data[:30],
        "detection_methods": ["edge_detection", "contrast_analysis", "tesseract_ocr"],
    }


if __name__ == "__main__":
    path = sys.argv[1] if len(sys.argv) > 1 else "/tmp/kali-screenshot.png"
    print(json.dumps(analyze(path)))
