/**
 * Responsive Layout Service
 * Detects device type and provides responsive layout utilities
 * 
 * Requirements: 8.5 - Mobile responsiveness
 */

export enum DeviceType {
  MOBILE = 'mobile',
  TABLET = 'tablet',
  DESKTOP = 'desktop',
}

export enum Orientation {
  PORTRAIT = 'portrait',
  LANDSCAPE = 'landscape',
}

interface DeviceInfo {
  type: DeviceType;
  orientation: Orientation;
  screenWidth: number;
  screenHeight: number;
  isTouchDevice: boolean;
  pixelRatio: number;
}

interface ResponsiveConfig {
  mobileBreakpoint: number;
  tabletBreakpoint: number;
  desktopBreakpoint: number;
}

class ResponsiveLayoutService {
  private config: ResponsiveConfig = {
    mobileBreakpoint: 768,
    tabletBreakpoint: 1024,
    desktopBreakpoint: 1280,
  };

  private listeners: Set<(deviceInfo: DeviceInfo) => void> = new Set();
  private currentDeviceInfo: DeviceInfo | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  /**
   * Initialize responsive layout service
   */
  private initialize(): void {
    this.updateDeviceInfo();
    
    // Listen for resize events
    window.addEventListener('resize', this.handleResize);
    
    // Listen for orientation changes
    window.addEventListener('orientationchange', this.handleOrientationChange);
    
    // Listen for media query changes
    this.setupMediaQueryListeners();
  }

  /**
   * Get current device information
   */
  getDeviceInfo(): DeviceInfo {
    if (!this.currentDeviceInfo) {
      this.updateDeviceInfo();
    }
    return this.currentDeviceInfo!;
  }

  /**
   * Update device information
   */
  private updateDeviceInfo(): void {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    this.currentDeviceInfo = {
      type: this.detectDeviceType(width),
      orientation: this.detectOrientation(width, height),
      screenWidth: width,
      screenHeight: height,
      isTouchDevice: this.isTouchDevice(),
      pixelRatio: window.devicePixelRatio || 1,
    };
  }

  /**
   * Detect device type based on screen width
   */
  private detectDeviceType(width: number): DeviceType {
    if (width < this.config.mobileBreakpoint) {
      return DeviceType.MOBILE;
    }
    if (width < this.config.tabletBreakpoint) {
      return DeviceType.TABLET;
    }
    return DeviceType.DESKTOP;
  }

  /**
   * Detect screen orientation
   */
  private detectOrientation(width: number, height: number): Orientation {
    return width > height ? Orientation.LANDSCAPE : Orientation.PORTRAIT;
  }

  /**
   * Check if device supports touch
   */
  private isTouchDevice(): boolean {
    return (
      'ontouchstart' in window ||
      navigator.maxTouchPoints > 0 ||
      (navigator as any).msMaxTouchPoints > 0
    );
  }

  /**
   * Handle window resize
   */
  private handleResize = (): void => {
    this.updateDeviceInfo();
    this.notifyListeners();
  };

  /**
   * Handle orientation change
   */
  private handleOrientationChange = (): void => {
    // Wait for orientation change to complete
    setTimeout(() => {
      this.updateDeviceInfo();
      this.notifyListeners();
    }, 100);
  };

  /**
   * Setup media query listeners
   */
  private setupMediaQueryListeners(): void {
    const mobileQuery = window.matchMedia(`(max-width: ${this.config.mobileBreakpoint}px)`);
    const tabletQuery = window.matchMedia(
      `(min-width: ${this.config.mobileBreakpoint}px) and (max-width: ${this.config.tabletBreakpoint}px)`
    );

    mobileQuery.addEventListener('change', this.handleResize);
    tabletQuery.addEventListener('change', this.handleResize);
  }

  /**
   * Subscribe to device info changes
   */
  subscribe(callback: (deviceInfo: DeviceInfo) => void): () => void {
    this.listeners.add(callback);
    
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of device info changes
   */
  private notifyListeners(): void {
    if (this.currentDeviceInfo) {
      this.listeners.forEach((callback) => {
        callback(this.currentDeviceInfo!);
      });
    }
  }

  /**
   * Check if current device is mobile
   */
  isMobile(): boolean {
    return this.getDeviceInfo().type === DeviceType.MOBILE;
  }

  /**
   * Check if current device is tablet
   */
  isTablet(): boolean {
    return this.getDeviceInfo().type === DeviceType.TABLET;
  }

  /**
   * Check if current device is desktop
   */
  isDesktop(): boolean {
    return this.getDeviceInfo().type === DeviceType.DESKTOP;
  }

  /**
   * Check if current orientation is portrait
   */
  isPortrait(): boolean {
    return this.getDeviceInfo().orientation === Orientation.PORTRAIT;
  }

  /**
   * Check if current orientation is landscape
   */
  isLandscape(): boolean {
    return this.getDeviceInfo().orientation === Orientation.LANDSCAPE;
  }

  /**
   * Get responsive class names
   */
  getResponsiveClasses(): string[] {
    const info = this.getDeviceInfo();
    const classes: string[] = [];

    classes.push(`device-${info.type}`);
    classes.push(`orientation-${info.orientation}`);
    
    if (info.isTouchDevice) {
      classes.push('touch-device');
    }

    if (info.pixelRatio > 1) {
      classes.push('high-dpi');
    }

    return classes;
  }

  /**
   * Get optimal column count for grid layouts
   */
  getOptimalColumnCount(): number {
    const info = this.getDeviceInfo();
    
    if (info.type === DeviceType.MOBILE) {
      return info.orientation === Orientation.PORTRAIT ? 1 : 2;
    }
    
    if (info.type === DeviceType.TABLET) {
      return info.orientation === Orientation.PORTRAIT ? 2 : 3;
    }
    
    return 4; // Desktop
  }

  /**
   * Get optimal font size multiplier
   */
  getFontSizeMultiplier(): number {
    const info = this.getDeviceInfo();
    
    if (info.type === DeviceType.MOBILE) {
      return 1.0;
    }
    
    if (info.type === DeviceType.TABLET) {
      return 1.1;
    }
    
    return 1.0; // Desktop
  }

  /**
   * Get optimal touch target size (in pixels)
   */
  getTouchTargetSize(): number {
    const info = this.getDeviceInfo();
    
    if (info.isTouchDevice) {
      return 44; // Apple's recommended minimum
    }
    
    return 32; // Mouse/pointer devices
  }

  /**
   * Check if viewport is small (for compact layouts)
   */
  isSmallViewport(): boolean {
    const info = this.getDeviceInfo();
    return info.screenWidth < 640;
  }

  /**
   * Get safe area insets (for notched devices)
   */
  getSafeAreaInsets(): {
    top: number;
    right: number;
    bottom: number;
    left: number;
  } {
    if (typeof window === 'undefined' || !CSS.supports('padding: env(safe-area-inset-top)')) {
      return { top: 0, right: 0, bottom: 0, left: 0 };
    }

    const computedStyle = getComputedStyle(document.documentElement);
    
    return {
      top: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-top)')) || 0,
      right: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-right)')) || 0,
      bottom: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-bottom)')) || 0,
      left: parseInt(computedStyle.getPropertyValue('env(safe-area-inset-left)')) || 0,
    };
  }

  /**
   * Apply responsive viewport meta tag
   */
  applyResponsiveViewport(): void {
    if (typeof document === 'undefined') return;

    let viewport = document.querySelector('meta[name="viewport"]');
    
    if (!viewport) {
      viewport = document.createElement('meta');
      viewport.setAttribute('name', 'viewport');
      document.head.appendChild(viewport);
    }

    viewport.setAttribute(
      'content',
      'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover'
    );
  }

  /**
   * Cleanup listeners
   */
  destroy(): void {
    if (typeof window !== 'undefined') {
      window.removeEventListener('resize', this.handleResize);
      window.removeEventListener('orientationchange', this.handleOrientationChange);
    }
    this.listeners.clear();
  }
}

// Export singleton instance
export const responsiveLayoutService = new ResponsiveLayoutService();

// React hook for responsive layout
export const useResponsiveLayout = () => {
  const [deviceInfo, setDeviceInfo] = React.useState<DeviceInfo>(
    responsiveLayoutService.getDeviceInfo()
  );

  React.useEffect(() => {
    const unsubscribe = responsiveLayoutService.subscribe(setDeviceInfo);
    return unsubscribe;
  }, []);

  return {
    deviceInfo,
    isMobile: responsiveLayoutService.isMobile(),
    isTablet: responsiveLayoutService.isTablet(),
    isDesktop: responsiveLayoutService.isDesktop(),
    isPortrait: responsiveLayoutService.isPortrait(),
    isLandscape: responsiveLayoutService.isLandscape(),
    responsiveClasses: responsiveLayoutService.getResponsiveClasses(),
    optimalColumnCount: responsiveLayoutService.getOptimalColumnCount(),
    touchTargetSize: responsiveLayoutService.getTouchTargetSize(),
  };
};

// Note: React import is assumed to be available in the consuming application
declare const React: any;
