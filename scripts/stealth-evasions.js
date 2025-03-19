/**
 * Advanced browser fingerprinting evasion script
 * Enhanced with Patchright protections
 */

function applyEvasions() {
  // Hide automation flags
  Object.defineProperty(navigator, "webdriver", { get: () => false });
  
  // Add window.chrome properties with enhanced Patchright structure
  if (!window.chrome) {
    window.chrome = {
      app: {
        InstallState: { DISABLED: 'disabled', INSTALLED: 'installed', NOT_INSTALLED: 'not_installed' },
        RunningState: { CANNOT_RUN: 'cannot_run', READY_TO_RUN: 'ready_to_run', RUNNING: 'running' },
        getDetails: function() { return null; },
        getIsInstalled: function() { return false; },
        isInstalled: false
      },
      runtime: {
        OnInstalledReason: { INSTALL: 'install', UPDATE: 'update', CHROME_UPDATE: 'chrome_update', SHARED_MODULE_UPDATE: 'shared_module_update' },
        OnRestartRequiredReason: { APP_UPDATE: 'app_update', OS_UPDATE: 'os_update', PERIODIC: 'periodic' },
        PlatformArch: { ARM: 'arm', ARM64: 'arm64', MIPS: 'mips', MIPS64: 'mips64', X86_32: 'x86-32', X86_64: 'x86-64' },
        PlatformNaclArch: { ARM: 'arm', MIPS: 'mips', MIPS64: 'mips64', X86_32: 'x86-32', X86_64: 'x86-64' },
        PlatformOs: { ANDROID: 'android', CROS: 'cros', LINUX: 'linux', MAC: 'mac', OPENBSD: 'openbsd', WIN: 'win' },
        RequestUpdateCheckStatus: { THROTTLED: 'throttled', NO_UPDATE: 'no_update', UPDATE_AVAILABLE: 'update_available' },
        connect: function() { return { disconnect: function() {} }; },
        sendMessage: function() { return Promise.resolve(); }
      }
    };
  }
  
  // Enhanced plugins spoofing from Patchright
  Object.defineProperty(navigator, "plugins", {
    get: () => {
      const plugins = [
        {
          0: { type: 'application/x-google-chrome-pdf', suffixes: 'pdf', description: 'Portable Document Format' },
          description: "Chrome PDF Plugin",
          filename: "internal-pdf-viewer",
          name: "Chrome PDF Plugin",
          length: 1,
          item: idx => idx === 0 ? { type: 'application/x-google-chrome-pdf' } : undefined,
          namedItem: name => name === 'Chrome PDF Plugin' ? { type: 'application/x-google-chrome-pdf' } : undefined
        },
        {
          0: { type: 'application/pdf', suffixes: 'pdf', description: 'Portable Document Format' },
          description: "Chrome PDF Viewer",
          filename: "mhjfbmdgcfjbbpaeojofohoefgiehjai",
          name: "Chrome PDF Viewer",
          length: 1,
          item: idx => idx === 0 ? { type: 'application/pdf' } : undefined,
          namedItem: name => name === 'Chrome PDF Viewer' ? { type: 'application/pdf' } : undefined
        },
        {
          0: { type: 'application/x-nacl', suffixes: '', description: 'Native Client Executable' },
          description: "Native Client",
          filename: "internal-nacl-plugin",
          name: "Native Client",
          length: 1,
          item: idx => idx === 0 ? { type: 'application/x-nacl' } : undefined,
          namedItem: name => name === 'Native Client' ? { type: 'application/x-nacl' } : undefined
        }
      ];

      plugins.refresh = () => {};
      plugins.item = idx => plugins[idx];
      plugins.namedItem = name => plugins.find(p => p.name === name);
      
      return Object.freeze(plugins);
    }
  });
  
  // Enhanced canvas fingerprinting protection from Patchright
  const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
  HTMLCanvasElement.prototype.toDataURL = function(type, quality) {
    if (this.width === 0 || this.height === 0) {
      return originalToDataURL.apply(this, arguments);
    }
    
    const dataURL = originalToDataURL.apply(this, arguments);
    if (this.width <= 16 && this.height <= 16) {
      // Likely a favicon, return as-is
      return dataURL;
    }

    // Add noise to the canvas data
    return dataURL.replace(/[a-f0-9]/g, (match) => {
      const rand = Math.random();
      if (rand < 0.1) { // 10% chance to modify each hex digit
        return Math.floor(Math.random() * 16).toString(16);
      }
      return match;
    });
  };
  
  // Enhanced audio fingerprinting protection
  if (window.AudioContext || window.webkitAudioContext) {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    const originalGetChannelData = AudioBuffer.prototype.getChannelData;
    const originalCreateAnalyser = AudioContext.prototype.createAnalyser;
    const originalGetFloatFrequencyData = AnalyserNode.prototype.getFloatFrequencyData;
    
    AudioBuffer.prototype.getChannelData = function(channel) {
      const data = originalGetChannelData.call(this, channel);
      if (data.length > 0) {
        // Add very subtle noise
        const noise = new Float32Array(data.length);
        for (let i = 0; i < data.length; i++) {
          noise[i] = (Math.random() - 0.5) * 0.0000001;
        }
        return data.map((v, i) => v + noise[i]);
      }
      return data;
    };

    AudioContext.prototype.createAnalyser = function(...args) {
      const analyser = originalCreateAnalyser.apply(this, args);
      analyser.getFloatFrequencyData = function(array) {
        originalGetFloatFrequencyData.call(this, array);
        for (let i = 0; i < array.length; i++) {
          array[i] += (Math.random() - 0.5) * 0.5;
        }
      };
      return analyser;
    };
  }
  
  // Enhanced WebGL fingerprinting protection
  const getParameterProxyHandler = {
    apply: function(target, ctx, args) {
      const param = args[0];
      
      const UNMASKED_VENDOR_WEBGL = 37445;
      const UNMASKED_RENDERER_WEBGL = 37446;
      
      if (param === UNMASKED_VENDOR_WEBGL) {
        return "Google Inc. (NVIDIA)";
      }
      if (param === UNMASKED_RENDERER_WEBGL) {
        return "ANGLE (NVIDIA, NVIDIA GeForce RTX 3070 Direct3D11 vs_5_0 ps_5_0, D3D11)";
      }
      
      return target.apply(ctx, args);
    }
  };
  
  // Apply to both WebGL contexts
  if (window.WebGLRenderingContext) {
    const getParameter = WebGLRenderingContext.prototype.getParameter;
    WebGLRenderingContext.prototype.getParameter = new Proxy(getParameter, getParameterProxyHandler);
  }
  if (window.WebGL2RenderingContext) {
    const getParameter = WebGL2RenderingContext.prototype.getParameter;
    WebGL2RenderingContext.prototype.getParameter = new Proxy(getParameter, getParameterProxyHandler);
  }
  
  // Enhanced permissions API spoofing
  if (navigator.permissions) {
    const originalQuery = navigator.permissions.query;
    navigator.permissions.query = function(parameters) {
      return new Promise((resolve) => {
        // Define permissions that should be "granted" vs "denied"
        const denyList = ['notifications', 'push', 'midi'];
        const grantList = ['geolocation', 'camera', 'microphone', 'background-sync', 'persistent-storage'];
        
        let result;
        if (denyList.includes(parameters.name)) {
          result = { state: 'denied', status: 'denied' };
        } else if (grantList.includes(parameters.name)) {
          result = { state: 'granted', status: 'granted' };
        } else {
          result = { state: 'prompt', status: 'prompt' };
        }

        result.onchange = null;
        result.addEventListener = function() {};
        result.removeEventListener = function() {};
        result.dispatchEvent = function() { return true; };
        
        resolve(result);
      });
    };
  }
  
  // Enhanced hardware concurrency and device memory
  Object.defineProperty(navigator, 'hardwareConcurrency', { get: () => 8 });
  Object.defineProperty(navigator, 'deviceMemory', { get: () => 8 });
  
  // Enhanced connection info spoofing
  if (navigator.connection) {
    Object.defineProperties(navigator.connection, {
      effectiveType: { get: () => '4g' },
      rtt: { get: () => 100 },
      downlink: { get: () => 10 },
      saveData: { get: () => false }
    });
  }
  
  // Enhanced screen properties
  Object.defineProperties(screen, {
    colorDepth: { get: () => 24 },
    pixelDepth: { get: () => 24 }
  });
  
  // Block known automation detection libraries
  const automationProperties = [
    'webdriver', '_selenium', 'callSelenium', '_Selenium_IDE_Recorder',
    '__webdriver_script_fn', '__driver_evaluate', '__webdriver_evaluate',
    '__selenium_evaluate', '__fxdriver_evaluate', '__driver_unwrapped',
    '__webdriver_unwrapped', '__selenium_unwrapped', '__fxdriver_unwrapped',
    '_WEBDRIVER_ELEM_CACHE'
  ];
  
  // Remove automation properties
  automationProperties.forEach(prop => {
    Object.defineProperty(window, prop, {
      get: () => undefined,
      set: () => undefined
    });
  });
}

// Execute evasions immediately
applyEvasions();

// Handle dynamic page updates
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyEvasions);
} else {
  applyEvasions();
}

// Reapply periodically to handle dynamic checks
setInterval(applyEvasions, 1000); 