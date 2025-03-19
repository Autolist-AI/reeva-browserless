#!/usr/bin/env node

/**
 * Stealth Mode Testing Script
 * Tests the browserless instance against common bot detection sites
 */

const puppeteer = require('puppeteer-core');
const { chromium } = require('playwright-core');
const fs = require('fs');
const path = require('path');
const os = require('os');

const OUTPUT_DIR = path.join(os.tmpdir(), 'stealth-test');
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

console.log('Starting stealth tests...');
console.log(`Results will be saved to ${OUTPUT_DIR}`);

// Test sites to check
const TEST_SITES = [
  {
    name: 'bot-detector',
    url: 'https://bot.sannysoft.com/',
    timeout: 5000,
  },
  {
    name: 'browser-leaks',
    url: 'https://browserleaks.com/canvas',
    timeout: 5000,
  },
  {
    name: 'fingerprint-js',
    url: 'https://fingerprintjs.github.io/fingerprintjs/',
    timeout: 5000,
  },
  {
    name: 'fingerprint-pro',
    url: 'https://fingerprint.com/products/bot-detection/',
    timeout: 8000,
  },
];

async function runPuppeteerTest() {
  console.log('\n🤖 Testing with Puppeteer...');
  
  // Connect to the browserless instance
  const browser = await puppeteer.connect({
    browserWSEndpoint: 'ws://localhost:3000?stealth=true',
  });
  
  console.log('✅ Connected to browserless with Puppeteer');
  
  for (const site of TEST_SITES) {
    try {
      console.log(`\nTesting ${site.name}...`);
      const page = await browser.newPage();
      
      // Set a realistic viewport
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Navigate to the test site
      await page.goto(site.url, { waitUntil: 'networkidle0', timeout: 30000 });
      console.log(`✅ Loaded ${site.url}`);
      
      // Wait for the page to stabilize
      await page.waitForTimeout(site.timeout);
      
      // Take a screenshot
      const screenshotPath = path.join(OUTPUT_DIR, `puppeteer-${site.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`📸 Screenshot saved to ${screenshotPath}`);
      
      // Close the page
      await page.close();
    } catch (error) {
      console.error(`❌ Error testing ${site.name}: ${error.message}`);
    }
  }
  
  await browser.close();
  console.log('✅ Puppeteer tests completed');
}

async function runPlaywrightTest() {
  console.log('\n🎭 Testing with Playwright...');
  
  // Connect to the browserless instance
  const browser = await chromium.connect({
    wsEndpoint: 'ws://localhost:3000/playwright/chromium?stealth=true',
  });
  
  console.log('✅ Connected to browserless with Playwright');
  
  for (const site of TEST_SITES) {
    try {
      console.log(`\nTesting ${site.name}...`);
      const context = await browser.newContext({
        viewport: { width: 1920, height: 1080 },
      });
      const page = await context.newPage();
      
      // Navigate to the test site
      await page.goto(site.url, { waitUntil: 'networkidle', timeout: 30000 });
      console.log(`✅ Loaded ${site.url}`);
      
      // Wait for the page to stabilize
      await page.waitForTimeout(site.timeout);
      
      // Take a screenshot
      const screenshotPath = path.join(OUTPUT_DIR, `playwright-${site.name}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });
      console.log(`📸 Screenshot saved to ${screenshotPath}`);
      
      // Close the context
      await context.close();
    } catch (error) {
      console.error(`❌ Error testing ${site.name}: ${error.message}`);
    }
  }
  
  await browser.close();
  console.log('✅ Playwright tests completed');
}

async function main() {
  try {
    await runPuppeteerTest();
    await runPlaywrightTest();
    console.log('\n✅ All stealth tests completed successfully!');
    console.log(`📁 Check results in ${OUTPUT_DIR}`);
  } catch (error) {
    console.error(`❌ Test error: ${error.message}`);
    process.exit(1);
  }
}

main(); 