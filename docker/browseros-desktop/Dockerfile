FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    xfce4 \
    xfce4-goodies \
    tightvncserver \
    novnc \
    websockify \
    supervisor \
    curl \
    ca-certificates \
    libnss3 \
    libasound2 \
    libgbm1 \
    libgtk-3-0 \
    libx11-xcb1 \
    libxss1 \
    libxdamage1 \
    libxcomposite1 \
    libxrandr2 \
    libxshmfence1 \
    libxkbcommon0 \
    libxfixes3 \
    libxext6 \
    libxrender1 \
    libxi6 \
    libxtst6 \
    libfuse2 \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# VNC setup
RUN mkdir -p /root/.vnc
RUN echo "browseros" | vncpasswd -f > /root/.vnc/passwd
RUN chmod 600 /root/.vnc/passwd

COPY xstartup /root/.vnc/xstartup
RUN chmod +x /root/.vnc/xstartup

# noVNC entrypoint
RUN ln -s /usr/share/novnc/vnc.html /usr/share/novnc/index.html

# Download BrowserOS AppImage
RUN mkdir -p /opt/browseros
RUN curl -L -o /opt/browseros/BrowserOS.AppImage https://files.browseros.com/download/BrowserOS.AppImage \
    && chmod +x /opt/browseros/BrowserOS.AppImage

# Autostart BrowserOS in the XFCE session
RUN mkdir -p /root/.config/autostart
COPY browseros.desktop /root/.config/autostart/browseros.desktop

COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf

EXPOSE 5901 6080

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
