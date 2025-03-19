import {
  BrowserLauncherOptions,
  BrowserServerOptions,
  Config,
  Logger,
  Request,
  ServerError,
  chromeExecutablePath,
  edgeExecutablePath,
} from '@browserless.io/browserless';
import playwright from 'playwright-core';
import { Duplex } from 'stream';
import { EventEmitter } from 'events';
import httpProxy from 'http-proxy';
import path from 'path';
import { chromium, Page as PatchrightPage, BrowserServer } from 'patchright';

enum PlaywrightBrowserTypes {
  chromium = 'chromium',
  firefox = 'firefox',
  webkit = 'webkit',
}

class BasePlaywright extends EventEmitter {
  protected config: Config;
  protected userDataDir: string | null;
  protected running = false;
  protected logger: Logger;
  protected socket: Duplex | null = null;
  protected proxy = httpProxy.createProxyServer();
  protected browser: BrowserServer | playwright.BrowserServer | null = null;
  protected browserWSEndpoint: string | null = null;
  protected playwrightBrowserType: PlaywrightBrowserTypes =
    PlaywrightBrowserTypes.chromium;
  protected executablePath = () => chromium.executablePath();
  protected usesPatchright = true;

  constructor({
    config,
    userDataDir,
    logger,
  }: {
    config: Config;
    logger: Logger;
    userDataDir: BasePlaywright['userDataDir'];
  }) {
    super();

    this.userDataDir = userDataDir;
    this.config = config;
    this.logger = logger;

    this.logger.info(`Starting new ${this.constructor.name} instance`);
  }

  protected cleanListeners() {
    this.removeAllListeners();
  }

  protected makeLaunchOptions(opts: BrowserServerOptions) {
    if (this.usesPatchright) {
      // Strip headless=old as it'll cause issues with newer Chromium
      const args = (opts.args ?? []).filter((a) => !a.includes('--headless=old'));

      if (!args.some((a) => a.startsWith('--headless'))) {
        args.push('--headless=new');
      }

      // Add stealth-related arguments to avoid detection
      const stealthArgs = [
        '--disable-blink-features=AutomationControlled',
        '--disable-automation',
        '--disable-features=AutomationControlled,AutomationDriver,HtmlImports,IsolateOrigins,site-per-process',
        '--enable-features=NetworkService,NetworkServiceInProcess',
        '--no-default-browser-check',
        '--no-first-run',
        '--disable-infobars',
        '--window-size=1920,1080',
        '--force-device-scale-factor=1',
        '--disable-notifications',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-breakpad',
        '--disable-component-extensions-with-background-pages',
        '--disable-dev-shm-usage',
        '--disable-ipc-flooding-protection',
        '--disable-renderer-backgrounding',
        '--force-color-profile=srgb',
        '--metrics-recording-only',
        '--hide-scrollbars',
        '--mute-audio',
        `--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/108.0.0.0 Safari/537.36`,
        // Permissions handling
        '--use-fake-ui-for-media-stream',
        '--use-fake-device-for-media-stream',
        '--autoplay-policy=no-user-gesture-required',
        '--enable-automation=false',
        '--deny-permission-prompts',
        '--allow-running-insecure-content',
        '--ignore-certificate-errors',
        '--ignore-certificate-errors-spki-list=*'
      ];

      return {
        ...opts,
        channel: 'chrome',
        args: [
          ...stealthArgs,
          ...args,
          this.userDataDir ? `--user-data-dir=${this.userDataDir}` : '',
        ].filter(Boolean),
        executablePath: this.executablePath(),
      };
    }

    // For non-chromium browsers, return standard options
    return {
      ...opts,
      args: [
        ...(opts.args || []),
        this.userDataDir ? `--user-data-dir=${this.userDataDir}` : '',
      ].filter(Boolean),
      executablePath: this.executablePath(),
    };
  }

  public keepUntil() {
    return 0;
  }

  public isRunning(): boolean {
    return this.running;
  }

  public async close(): Promise<void> {
    if (this.browser) {
      this.logger.info(
        `Closing ${this.constructor.name} process and all listeners`,
      );
      this.socket?.destroy();
      this.emit('close');
      this.cleanListeners();
      if (this.usesPatchright) {
        this.browser.close();
      }
      this.running = false;
      this.browser = null;
      this.browserWSEndpoint = null;
    }
  }

  public async pages(): Promise<[]> {
    return [];
  }

  public getPageId(): string {
    throw new ServerError(
      `#getPageId is not yet supported with ${this.constructor.name}.`,
    );
  }

  public makeLiveURL(): void {
    throw new ServerError(
      `Live URLs are not yet supported with ${this.constructor.name}. In the future this will be at "${this.config.getExternalAddress()}"`,
    );
  }

  public async newPage(): Promise<PatchrightPage | playwright.Page> {
    if (!this.browser || !this.browserWSEndpoint) {
      throw new ServerError(
        `${this.constructor.name} hasn't been launched yet!`,
      );
    }
    if (this.usesPatchright) {
      const browser = await chromium.connect(this.browserWSEndpoint);
      return await browser.newPage();
    }
    const browser = await playwright[this.playwrightBrowserType].connect(
      this.browserWSEndpoint,
    );
    return await browser.newPage();
  }

  public async launch(
    laucherOpts: BrowserLauncherOptions,
  ): Promise<BrowserServer | playwright.BrowserServer> {
    const { options, pwVersion } = laucherOpts;
    this.logger.info(`Launching ${this.constructor.name} Handler`);

    const opts = this.makeLaunchOptions(options);
    
    let browser;
    if (this.usesPatchright) {
      browser = await chromium.launchServer(opts);
    } else {
      const versionedPw = await this.config.loadPwVersion(pwVersion!);
      browser = await versionedPw[this.playwrightBrowserType].launchServer(opts);
    }
    
    const browserWSEndpoint = browser.wsEndpoint();

    this.logger.info(
      `${this.constructor.name} is running on ${browserWSEndpoint}`,
    );
    this.running = true;
    this.browserWSEndpoint = browserWSEndpoint;
    this.browser = browser;

    return browser;
  }

  public wsEndpoint(): string | null {
    return this.browserWSEndpoint;
  }

  public publicWSEndpoint(token: string | null): string | null {
    if (!this.browserWSEndpoint) {
      return null;
    }

    const externalURL = new URL(this.config.getExternalWebSocketAddress());
    const { pathname } = new URL(this.browserWSEndpoint);

    externalURL.pathname = path.join(externalURL.pathname, pathname);

    if (token) {
      externalURL.searchParams.set('token', token);
    }

    return externalURL.href;
  }

  public async proxyPageWebSocket() {
    this.logger.error(`Not yet implemented in ${this.constructor.name}`);
  }

  public async proxyWebSocket(
    req: Request,
    socket: Duplex,
    head: Buffer,
  ): Promise<void> {
    this.socket = socket;
    return new Promise((resolve, reject) => {
      if (!this.browserWSEndpoint) {
        throw new ServerError(
          `No browserWSEndpoint found, did you launch first?`,
        );
      }
      socket.once('close', resolve);

      this.logger.info(
        `Proxying ${req.parsed.href} to ${this.constructor.name} ${this.browserWSEndpoint}`,
      );

      // Delete headers known to cause issues
      delete req.headers.origin;

      req.url = '';

      this.proxy.ws(
        req,
        socket,
        head,
        {
          changeOrigin: true,
          target: this.browserWSEndpoint,
        },
        (error) => {
          this.logger.error(
            `Error proxying session to ${this.constructor.name}: ${error}`,
          );
          this.close();
          return reject(error);
        },
      );
    });
  }
}

export class ChromiumPlaywright extends BasePlaywright {
  protected playwrightBrowserType = PlaywrightBrowserTypes.chromium;
  protected usesPatchright = true;
}

export class ChromePlaywright extends ChromiumPlaywright {
  protected executablePath = () => chromeExecutablePath();
  protected playwrightBrowserType = PlaywrightBrowserTypes.chromium;
  protected usesPatchright = true;
}

export class EdgePlaywright extends ChromiumPlaywright {
  protected executablePath = () => edgeExecutablePath();
  protected playwrightBrowserType = PlaywrightBrowserTypes.chromium;
  protected usesPatchright = true;
}

export class FirefoxPlaywright extends BasePlaywright {
  protected playwrightBrowserType = PlaywrightBrowserTypes.firefox;
  protected usesPatchright = false;
  protected executablePath = () => playwright.firefox.executablePath();
}

export class WebKitPlaywright extends BasePlaywright {
  protected playwrightBrowserType = PlaywrightBrowserTypes.webkit;
  protected usesPatchright = false;
  protected executablePath = () => playwright.webkit.executablePath();
}
