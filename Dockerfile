# Kali Desktop MCP Server Dockerfile
FROM kalilinux/kali-rolling:latest

# Install system dependencies
RUN apt-get update && apt-get install -y \
    wget \
    curl \
    git \
    python3 \
    python3-pip \
    python3-opencv \
    nodejs \
    npm \
    xfce4 \
    xfce4-goodies \
    tightvncserver \
    novnc \
    websockify \
    imagemagick \
    net-tools \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js dependencies
RUN npm install -g @modelcontextprotocol/sdk

# Install Python dependencies for AI analysis
RUN pip3 install opencv-python numpy --break-system-packages

# Create application directory
WORKDIR /app

# Copy application files
COPY kali-mcp-server.js package.json ./

# Install application dependencies
RUN npm install

# Create VNC directory and set up VNC
RUN mkdir -p /root/.vnc
RUN echo "password" | vncpasswd -f > /root/.vnc/passwd
RUN chmod 600 /root/.vnc/passwd

# Create VNC control script
RUN mkdir -p /usr/local/bin
COPY vnc_control.py /usr/local/bin/
RUN chmod +x /usr/local/bin/vnc_control.py

# Set up VNC server
RUN echo "#!/bin/sh\n\
xrdb \$HOME/.Xresources\n\
xsetroot -solid grey\n\
x-terminal-emulator -geometry 80x24+10+10 -ls -title \"\$VNCDESKTOP Desktop\" &\n\
xfce4-session &\n\
" > /root/.vnc/xstartup

RUN chmod +x /root/.vnc/xstartup

# Expose ports
EXPOSE 5901 6080

# Create startup script
RUN echo "#!/bin/bash\n\
# Start VNC server\n\
vncserver :1 -geometry 1280x720\n\
\n\
# Start noVNC web interface\n\
websockify --web=/usr/share/novnc/ 6080 localhost:5901 &\n\
\n\
# Wait for services to start\n\
sleep 5\n\
\n\
# Start MCP server\n\
cd /app\n\
node kali-mcp-server.js\n\
" > /app/start.sh

RUN chmod +x /app/start.sh

# Default command
CMD ["/app/start.sh"]