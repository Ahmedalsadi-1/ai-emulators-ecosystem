# Standalone Bytebot Desktop Automation Container
# Multi-stage production-ready Dockerfile for ByteBot desktop automation

ARG NODE_VERSION=20-alpine
ARG PYTHON_VERSION=3.11

# ============================================================================
# Base stage
# ============================================================================
FROM node:${NODE_VERSION} AS base
LABEL maintainer="bytebot-team" \
      version="1.0" \
      description="ByteBot Desktop Automation Container with VNC and API endpoints"

# Install system dependencies
RUN apk add --no-cache \
    # Build tools
    build-base \
    python3 \
    python3-dev \
    py3-pip \
    # Runtime dependencies
    git \
    curl \
    wget \
    supervisor \
    xvfb \
    x11vnc \
    novnc \
    websockify \
    # Desktop environment
    firefox-esr \
    # Security and monitoring
    ca-certificates \
    # Additional browser automation tools
    chromium \
    chromium-chromedriver \
    && rm -rf /var/cache/apk/*

# Create non-root user
RUN addgroup -g 1001 bytebot && \
    adduser -D -s /bin/sh -u 1001 -G bytebot bytebot

# ============================================================================
# Desktop automation stage
# ============================================================================
FROM base AS desktop

# Install desktop dependencies and automation tools
RUN apk add --no-cache \
    # Display server and desktop
    xorg-server \
    xf86-video-fbdev \
    openbox \
    lxterminal \
    pcmanfm \
    # Additional applications for automation
    vim \
    nano \
    htop \
    # Build dependencies for native modules
    cmake \
    libx11-dev \
    libxtst-dev \
    libxinerama-dev \
    libxi-dev \
    libxt-dev \
    libxrandr-dev \
    libxkbcommon-dev \
    xclip \
    build-base \
    git \
    linux-headers \
    # Runtime X11 libraries for native modules
    libxt \
    libx11 \
    libxrandr \
    # Python automation libraries
    py3-pillow \
    # Additional tools
    scrot \
    imagemagick \
    xdotool \
    && rm -rf /var/cache/apk/*

# Install Python automation packages (excluding heavy packages for faster build)
RUN pip3 install --no-cache-dir --break-system-packages \
    selenium \
    pyautogui \
    pynput \
    mss \
    pytesseract
# Note: opencv-python and pillow are already installed via apk

# Install TypeScript compiler globally for building
RUN npm install -g typescript

# Create VNC configuration
RUN mkdir -p /home/bytebot/.vnc && \
    x11vnc -storepasswd "bytebot" /home/bytebot/.vnc/passwd && \
    chmod 600 /home/bytebot/.vnc/passwd && \
    chown -R bytebot:bytebot /home/bytebot/.vnc

# Create desktop directories and configs
RUN mkdir -p /home/bytebot/Desktop /home/bytebot/Downloads /home/bytebot/.config/openbox && \
    chown -R bytebot:bytebot /home/bytebot

# Copy Openbox configuration for minimal desktop
RUN echo '\
<openbox_config>\
  <theme>\
    <name>Bear2</name>\
  </theme>\
  <desktops>\
    <number>1</number>\
    <firstdesk>1</firstdesk>\
  </desktops>\
  <keyboard>\
    <chainQuitKey>C-g</chainQuitKey>\
  </keyboard>\
  <mouse>\
    <dragThreshold>8</dragThreshold>\
    <doubleClickTime>200</doubleClickTime>\
  </mouse>\
</openbox_config>' > /home/bytebot/.config/openbox/rc.xml

# Copy supervisor configuration
COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# Copy bytebot application code
COPY --chown=bytebot:bytebot packages/shared/ /app/shared/
COPY --chown=bytebot:bytebot packages/bytebotd/ /app/bytebotd/

# Install bytebotd dependencies
WORKDIR /app/bytebotd
RUN npm install --production && \
    npm run build

# Set ownership
RUN chown -R bytebot:bytebot /home/bytebot /app

# Create health check script
RUN echo '#!/bin/sh' > /healthcheck.sh && \
    echo 'curl -f http://localhost:9990/health || exit 1' >> /healthcheck.sh && \
    chmod +x /healthcheck.sh

# Expose ports: VNC, noVNC, API
EXPOSE 5900 6080 9990

# Switch to bytebot user
USER bytebot
WORKDIR /home/bytebot

# Environment variables
ENV DISPLAY=:1 \
    VNC_PORT=5900 \
    NOVNC_PORT=6080 \
    BYTEBOT_DESKTOP_PORT=9990 \
    PYTHONPATH=/usr/lib/python3.11/site-packages

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD /healthcheck.sh

# Start supervisor to manage all services
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]