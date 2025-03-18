ARG VERSION=latest
FROM ghcr.io/browserless/base:$VERSION
LABEL org.opencontainers.image.source https://github.com/browserless/browserless
LABEL description="Custom Chromium build with stealth mode support for both Puppeteer and Playwright"

# Copy fonts and source files
COPY fonts/* /usr/share/fonts/truetype/
COPY src src/
RUN rm -r src/routes/
COPY src/routes/management src/routes/management/
COPY src/routes/chromium src/routes/chromium/

# Install additional fonts for better browser fingerprinting
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
  fonts-open-sans

# Install Playwright and Puppeteer dependencies with stealth support
RUN npm install playwright-extra playwright-stealth puppeteer-extra puppeteer-extra-plugin-stealth && \
  # Install Chromium for Playwright
  ./node_modules/playwright-core/cli.js install --with-deps chromium && \
  # Build the project
  npm run build && \
  npm run build:function && \
  npm prune production && \
  npm run install:debugger && \
  # Update font cache and clean up
  chown -R blessuser:blessuser $APP_DIR && \
  fc-cache -f -v && \
  apt-get -qq clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/* /usr/share/fonts/truetype/noto

# Add a script to check if stealth mode is working
COPY scripts/test-stealth.js /usr/local/bin/test-stealth.js
RUN chmod +x /usr/local/bin/test-stealth.js

USER blessuser

CMD ["./scripts/start.sh"] 