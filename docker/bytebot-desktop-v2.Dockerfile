# bytebot-desktop:edge with GBox Integration for Android + Browser
# Used for all 3 desktop selections with dynamic configuration

FROM ghcr.io/bytebot-ai/bytebot-desktop:edge

# Desktop type: primary, debian, or kali
ARG DESKTOP_TYPE=primary
ENV DESKTOP_TYPE=${DESKTOP_TYPE}

# Desktop-specific packages
RUN if [ "$DESKTOP_TYPE" = "primary" ]; then \
    apt-get update && apt-get install -y vim git htop wget unzip && \
    apt-get clean && rm -rf /var/lib/apt/lists/*; \
elif [ "$DESKTOP_TYPE" = "debian" ]; then \
    apt-get update && apt-get install -y curl wget && \
    apt-get clean && rm -rf /var/lib/apt/lists/*; \
elif [ "$DESKTOP_TYPE" = "kali" ]; then \
    apt-get update && apt-get install -y kali-tools-top10 nmap && \
    apt-get clean && rm -rf /var/lib/apt/lists/*; \
fi

# GBox CLI for Android emulator + Chromium browser
ENV GBOX_VERSION=latest
ENV GBOX_INSTALL_DIR=/usr/local/gbox
ENV PATH="${GBOX_INSTALL_DIR}/bin:${PATH}"

RUN mkdir -p ${GBOX_INSTALL_DIR} && \
    curl -fsSL "https://raw.githubusercontent.com/babelcloud/gbox/main/install.sh" | bash -s -- --install-dir=${GBOX_INSTALL_DIR} --bin-dir=${GBOX_INSTALL_DIR}/bin && \
    chmod +x ${GBOX_INSTALL_DIR}/bin/*

# GBox directories
ENV GBOX_DATA_DIR=/root/.local/share/gbox
ENV GBOX_LOG_DIR=/var/log/gbox
ENV GBOX_CACHE_DIR=/root/.cache/gbox
RUN mkdir -p ${GBOX_DATA_DIR} ${GBOX_LOG_DIR} ${GBOX_CACHE_DIR}

# Android SDK for GBox Android support
ENV ANDROID_HOME=/opt/android-sdk
ENV ANDROID_SDK_ROOT=${ANDROID_HOME}
ENV PATH="${ANDROID_HOME}/cmdline-tools/latest/bin:${ANDROID_HOME}/platform-tools:${PATH}"

RUN if [ ! -d "${ANDROID_HOME}" ]; then \
    mkdir -p ${ANDROID_HOME} && \
    cd ${ANDROID_HOME} && \
    wget -q https://dl.google.com/android/repository/commandlinetools-linux-11076708_latest.zip && \
    unzip -q commandlinetools-linux-11076708_latest.zip && \
    mkdir -p cmdline-tools/latest && \
    mv cmdline-tools/* cmdline-tools/latest/ 2>/dev/null || true && \
    rm commandlinetools-linux-11076708_latest.zip && \
    yes | sdkmanager --licenses > /dev/null 2>&1 || true && \
    sdkmanager "platform-tools" "platforms;android-34" "build-tools;34.0.0" > /dev/null 2>&1 || true; \
    fi

# Chromium browser (replaces BrowserOS)
ENV CHROMIUM_PATH=/usr/bin/chromium
RUN apt-get update && apt-get install -y chromium chromium-driver && \
    apt-get clean && rm -rf /var/lib/apt/lists/*

EXPOSE 9990 6080

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD nc -z localhost 9990 || exit 1

CMD ["/usr/bin/supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf", "-n"]
