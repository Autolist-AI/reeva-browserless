# Custom Chromium Build with Stealth Mode

This Docker image extends the standard browserless Chromium image to add stealth mode support for both Puppeteer and Playwright. Stealth mode helps automated browsers avoid detection by using various techniques to make the browser appear more like a regular user's browser.

## Features

- Full support for Puppeteer stealth mode via puppeteer-extra-plugin-stealth
- Support for Playwright stealth mode via custom launch arguments
- Additional fonts installed for better browser fingerprinting
- Test script included to verify stealth functionality

## Building the Image

From the root directory of the project, build the image:

```bash
docker build -t browserless/chromium-stealth:latest -f docker/custom-chromium/Dockerfile .
```

## Running the Image

Basic usage:

```bash
docker run -p 3000:3000 browserless/chromium-stealth:latest
```

With specific options:

```bash
docker run -p 3000:3000 \
  -e "MAX_CONCURRENT_SESSIONS=10" \
  -e "PREBOOT_CHROME=true" \
  -e "CONNECTION_TIMEOUT=300000" \
  browserless/chromium-stealth:latest
```

## Testing Stealth Mode

The image includes a testing script at `/usr/local/bin/test-stealth.js` that can be used to verify that stealth mode is working correctly. To run the test:

```bash
docker run -it --rm browserless/chromium-stealth:latest node /usr/local/bin/test-stealth.js
```

This will test both Puppeteer and Playwright against common bot detection sites and save screenshots to `/tmp/stealth-test`.

## Using Stealth Mode

### For Puppeteer

Stealth mode is automatically enabled when you connect to the browserless service and specify the `stealth` parameter:

```javascript
// Connect to browserless with stealth mode
const browser = await puppeteer.connect({
  browserWSEndpoint: 'ws://localhost:3000?stealth=true',
});
```

### For Playwright

Stealth mode is also available for Playwright when you connect and specify the `stealth` parameter:

```javascript
// Connect to browserless with stealth mode for Playwright
const browser = await playwright.chromium.connect({
  wsEndpoint: 'ws://localhost:3000/playwright/chromium?stealth=true',
});
```

## Implementation Details

This custom build includes:

1. Addition of puppeteer-extra, puppeteer-extra-plugin-stealth, playwright-extra, and playwright-stealth packages
2. Custom stealth mode implementation for Playwright using command line arguments similar to those used by puppeteer-extra-plugin-stealth
3. Additional fonts for better fingerprinting

The stealth implementation helps avoid detection by:

- Disabling Chrome's automation flags and indicators
- Hiding WebDriver property
- Modifying WebGL fingerprinting
- Setting a realistic user agent
- Adding noise to various fingerprinting techniques

## Notes and Limitations

- While stealth mode makes detection harder, it doesn't guarantee undetectability
- Some websites with advanced detection mechanisms may still identify the automated browser
- Performance might be slightly lower due to the additional stealth features 