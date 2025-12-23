FROM node:18-slim

# Install system dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    imagemagick \
    xdotool \
    tesseract-ocr \
    tesseract-ocr-eng \
    tigervnc-viewer \
    libopencv-dev \
    python3-opencv \
    python3-numpy \
    python3-pil \
    python3-tk \
    scrot \
    espeak-ng \
    alsa-utils \
    portaudio19-dev \
    python3-pyaudio \
    && apt-get clean

# Create app directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node.js dependencies
RUN npm install

# Copy application code
COPY . .

# Make test script executable
RUN chmod +x test_suite.js

# Install Python dependencies for image processing, speech, and AI
RUN pip3 install --break-system-packages \
    opencv-python \
    pillow \
    numpy \
    pytesseract \
    scikit-image \
    matplotlib \
    torch \
    torchvision \
    transformers \
    easyocr \
    speechrecognition \
    pyaudio \
    gtts \
    playsound \
    openai \
    anthropic \
    google-generativeai \
    requests \
    aiohttp

# Expose MCP server port
EXPOSE 9991

# Start the MCP server
CMD ["node", "index.js"]
