# Enhanced Anti-Detection Browserless Docker Image

This is a modified version of the [browserless/browserless](https://github.com/browserless/browserless) Docker image with advanced anti-detection features to help avoid bot detection when doing browser automation.

## Features

- **Comprehensive Stealth Mode**: Built-in evasion techniques for both Puppeteer and Playwright
- **Advanced Fingerprinting Protection**: Canvas, WebGL, and navigator property spoofing
- **Automatic Stealth**: Applies stealth techniques by default without requiring extra configuration
- **Browser Automation Flags Removal**: Removes automation indicators that websites check for
- **Font and Device Fingerprint Randomization**: Makes each browser instance look more like a real user

## Building the Image

From the root directory of the project, build the Docker image:

```bash
docker build -t enhanced-browserless:latest -f docker/chromium/Dockerfile .
```

## Running the Image

Basic usage:

```bash
docker run -p 3000:3000 enhanced-browserless:latest
```

With specific options:

```bash
docker run -p 3000:3000 \
  -e "MAX_CONCURRENT_SESSIONS=10" \
  -e "PREBOOT_CHROME=true" \
  -e "CONNECTION_TIMEOUT=300000" \
  enhanced-browserless:latest
```

## Testing Stealth Mode

The image includes a testing script to verify that stealth mode is working correctly. To run the test:

```bash
docker run -it --rm enhanced-browserless:latest /usr/local/bin/test-stealth.js
```

This will test both Puppeteer and Playwright against common bot detection sites and save screenshots to `/tmp/stealth-test`.

## Using Stealth Mode

### For Puppeteer

While stealth mode is enabled by default with our enhancements, you can explicitly enable it when connecting:

```javascript
// Connect to browserless with stealth mode
const browser = await puppeteer.connect({
  browserWSEndpoint: 'ws://localhost:3000?stealth=true',
});
```

### For Playwright

Similarly for Playwright, stealth mode is enabled by default but can be explicitly specified:

```javascript
// Connect to browserless with stealth mode for Playwright
const browser = await playwright.chromium.connect({
  wsEndpoint: 'ws://localhost:3000/playwright/chromium?stealth=true',
});
```

## Enhanced Features

This enhanced version includes several improvements over the standard browserless implementation:

1. **User Agent Spoofing**: Makes your automated browser look like a standard Windows Chrome installation
2. **Canvas Fingerprinting Protection**: Introduces subtle variations to canvas data to prevent fingerprinting
3. **WebGL Fingerprinting Protection**: Normalizes WebGL renderer information to common values
4. **JavaScript Property Protection**: Overrides automation-detection properties
5. **Header Order Normalization**: Uses realistic header ordering for network requests
6. **Extended Font Support**: Includes additional fonts to avoid font-based fingerprinting
7. **Automation Flag Removal**: Removes Chrome automation flags that are commonly checked
8. **Hardware Concurrency & Memory Reporting**: Reports standard values to avoid detection

## Testing Against Bot Detection

You can test your setup against these common bot detection services:

1. [Bot Detector](https://bot.sannysoft.com)
2. [Browser Leaks](https://browserleaks.com/canvas)
3. [FingerprintJS](https://fingerprintjs.github.io/fingerprintjs/)

## Notes and Limitations

- While these enhancements significantly improve bot detection avoidance, they don't guarantee 100% undetectability
- Some websites with highly sophisticated detection mechanisms may still detect automation
- Regular updates to the stealth techniques are recommended as detection methods evolve 