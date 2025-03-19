ARG VERSION=latest
FROM --platform=linux/amd64 ghcr.io/browserless/base:$VERSION
LABEL org.opencontainers.image.source=https://github.com/browserless/browserless
LABEL description="Enhanced anti-detection Chromium build with advanced stealth capabilities"

COPY fonts/* /usr/share/fonts/truetype/
COPY src src/
RUN rm -r src/routes/
COPY src/routes/management src/routes/management/
COPY src/routes/chromium src/routes/chromium/

# Install additional dependencies for better anti-detection
RUN echo "ttf-mscorefonts-installer msttcorefonts/accepted-mscorefonts-eula select true" | debconf-set-selections && \
  apt-get -y -qq install software-properties-common &&\
  apt-add-repository "deb http://archive.canonical.com/ubuntu $(lsb_release -sc) partner" && \
  apt-get -y -qq --no-install-recommends install \
  fontconfig \
  fonts-freefont-ttf \
  fonts-gfs-neohellenic \
  fonts-indic \
  fonts-ipafont-gothic \
  fonts-kacst \
  fonts-liberation \
  fonts-noto-cjk \
  fonts-noto-color-emoji \
  fonts-roboto \
  fonts-thai-tlwg \
  fonts-ubuntu \
  fonts-wqy-zenhei \
  fonts-open-sans \
  libxss1 \
  libxtst6 \
  libx11-xcb1 \
  libxcb-dri3-0 \
  libdrm2 \
  libgbm1 \
  libasound2 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  ttf-mscorefonts-installer \
  fonts-liberation \
  fonts-dejavu \
  xdg-utils

# Install advanced stealth plugins
RUN npm install patchright puppeteer-extra puppeteer-extra-plugin-stealth playwright-extra playwright-stealth && \
  ./node_modules/playwright-core/cli.js install --with-deps chromium &&\
  npm run build &&\
  npm run build:function &&\
  npm prune production &&\
  npm run install:debugger &&\
  chown -R blessuser:blessuser $APP_DIR &&\
  fc-cache -f -v && \
  apt-get -qq clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /usr/share/fonts/truetype/noto

# Create stealth scripts directory
RUN mkdir -p /usr/local/share/browserless/preload-scripts

# Create a permissions policy file to fix permissions handling
RUN mkdir -p /etc/opt/chrome/policies/managed && \
    echo '{ \
      "DefaultNotificationsSetting": 2, \
      "DefaultGeolocationSetting": 1, \
      "DefaultMediaStreamSetting": 1, \
      "DefaultWebBluetoothGuardSetting": 2, \
      "DefaultWebUsbGuardSetting": 2, \
      "DefaultFileSystemReadGuardSetting": 1, \
      "DefaultFileSystemWriteGuardSetting": 1, \
      "AutoplayAllowed": true, \
      "AudioCaptureAllowed": true, \
      "VideoCaptureAllowed": true \
    }' > /etc/opt/chrome/policies/managed/policies.json

# Add our browser-based stealth script
COPY scripts/stealth-evasions.js /usr/local/share/browserless/preload-scripts/

# Create a browser fingerprint data directory
RUN mkdir -p /usr/local/share/browserless/fingerprint-data && \
    echo "Providing fingerprint data files to make profiles more consistent" && \
    echo '{"vendorSub":"","productSub":"20030107","vendor":"Google Inc.","maxTouchPoints":0,"hardwareConcurrency":8,"cookieEnabled":true,"appCodeName":"Mozilla","appName":"Netscape","appVersion":"5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36","platform":"Win32","product":"Gecko","userAgent":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36","language":"en-US","languages":["en-US","en"],"onLine":true,"doNotTrack":null,"geolocation":{},"connection":{},"webkitTemporaryStorage":{},"webkitPersistentStorage":{},"deviceMemory":8,"clipboard":{},"credentials":{},"keyboard":{},"mediaDevices":{},"storage":{},"serviceWorker":{},"virtualKeyboard":{},"permissions":{}}' > /usr/local/share/browserless/fingerprint-data/navigator.json

USER blessuser

CMD ["./scripts/start.sh"]
