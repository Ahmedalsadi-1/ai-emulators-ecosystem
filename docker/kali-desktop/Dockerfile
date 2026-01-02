FROM kalilinux/kali-rolling:latest

# Update and install desktop environment
RUN apt-get update && apt-get install -y \
    kali-desktop-xfce \
    xfce4 \
    xfce4-goodies \
    tightvncserver \
    novnc \
    websockify \
    supervisor \
    firefox-esr \
    git \
    curl \
    wget \
    python3 \
    python3-pip \
    nodejs \
    npm \
    docker.io \
    && apt-get clean

# Install Kali security tools and multimodal AI dependencies
RUN apt-get install -y \
    nmap \
    sqlmap \
    aircrack-ng \
    wireshark \
    binwalk \
    metasploit-framework \
    nikto \
    dirb \
    hydra \
    john \
    hashcat \
    burpsuite \
    zaproxy \
    && apt-get clean

# Install additional AI and automation tools
RUN apt-get install -y \
    python3-scipy \
    python3-matplotlib \
    python3-seaborn \
    python3-plotly \
    jupyter-notebook \
    jupyter-lab \
    && apt-get clean

# Set up VNC
RUN mkdir /root/.vnc
RUN echo "kali" | vncpasswd -f > /root/.vnc/passwd
RUN chmod 600 /root/.vnc/passwd

# Create VNC startup script
RUN echo '#!/bin/bash\n\
export USER=root\n\
export HOME=/root\n\
export DISPLAY=:1\n\
vncserver -kill :1 || true\n\
vncserver :1 -geometry 1920x1080 -depth 24\n\
' > /root/.vnc/xstartup
RUN chmod +x /root/.vnc/xstartup

# Configure XFCE
RUN echo 'startxfce4 &' >> /root/.vnc/xstartup

# Set up noVNC
RUN ln -s /usr/share/novnc/vnc.html /usr/share/novnc/index.html

# Create supervisor config
RUN echo '[supervisord]\n\
nodaemon=true\n\
user=root\n\
\n\
[program:vncserver]\n\
command=/usr/bin/vncserver :1 -fg -geometry 1920x1080 -depth 24\n\
user=root\n\
autorestart=true\n\
\n\
[program:novnc]\n\
command=websockify --web /usr/share/novnc/ 6080 localhost:5901\n\
user=root\n\
autorestart=true\n\
' > /etc/supervisor/conf.d/supervisord.conf

# Install Python packages for automation (using system packages where possible)
RUN apt-get update && apt-get install -y \
    python3-selenium \
    python3-requests \
    python3-bs4 \
    python3-scapy \
    && apt-get clean

# Install additional packages via pip that aren't available in apt
RUN pip3 install --break-system-packages \
    pyautogui \
    selenium \
    webdriver-manager \
    beautifulsoup4 \
    requests-html \
    scapy \
    pandas \
    jupyter \
    ipython \
    && rm -rf /root/.cache/pip

# Create AI workspace and memory directories
RUN mkdir -p /root/ai-workspace /tmp/kali-memory /tmp/kali-screenshots

# Set up Jupyter configuration
RUN jupyter notebook --generate-config && \
    echo "c.NotebookApp.ip = '0.0.0.0'" >> /root/.jupyter/jupyter_notebook_config.py && \
    echo "c.NotebookApp.open_browser = False" >> /root/.jupyter/jupyter_notebook_config.py && \
    echo "c.NotebookApp.allow_root = True" >> /root/.jupyter/jupyter_notebook_config.py

# Create workspace directory
RUN mkdir -p /root/workspace

# Expose VNC and noVNC ports
EXPOSE 5901 6080

# Set working directory
WORKDIR /root/workspace

# Start supervisor
CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
