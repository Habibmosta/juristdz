/**
 * Property-Based Tests for Multi-Platform Support
 * Feature: document-management-system
 * 
 * Tests Requirements 8.4 and 8.5:
 * - Multi-language platform consistency
 * - Mobile responsiveness
 */

import * as fc from 'fast-check';
import { Language } from '../../src/document-management/types';
import { languagePreferenceService } from '../../src/document-management/services/languagePreferenceService';
import { responsiveLayoutService, DeviceType, Orientation } from '../../src/document-management/services/responsiveLayoutService';
import { translations } from '../../src/document-management/components/MultiLanguageInterface';

describe('Multi-Platform Support Property Tests', () => {
  describe('Property 42: Multi-Language Platform Consistency', () => {
    /**
     * **Validates: Requirements 8.4**
     * 
     * For any user interface interaction, the system should support both French and Arabic
     * interfaces matching the existing platform standards
     */
    
    it('should provide translations for all interface keys in both languages', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(...Object.keys(translations)),
          (translationKey) => {
            const translation = translations[translationKey];
            
            // Property: Every translation key must have both French and Arabic versions
            expect(translation).toHaveProperty(Language.FRENCH);
            expect(translation).toHaveProperty(Language.ARABIC);
            
            // Property: Translations must be non-empty strings
            expect(translation[Language.FRENCH]).toBeTruthy();
            expect(typeof translation[Language.FRENCH]).toBe('string');
            expect(translation[Language.FRENCH].length).toBeGreaterThan(0);
            
            expect(translation[Language.ARABIC]).toBeTruthy();
            expect(typeof translation[Language.ARABIC]).toBe('string');
            expect(translation[Language.ARABIC].length).toBeGreaterThan(0);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should maintain consistent text direction for each language', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(Language.FRENCH, Language.ARABIC),
          (language) => {
            const direction = languagePreferenceService.getTextDirection(language);
            
            // Property: French should always be LTR, Arabic should always be RTL
            if (language === Language.FRENCH) {
              expect(direction).toBe('ltr');
              expect(languagePreferenceService.isRTL(language)).toBe(false);
            } else if (language === Language.ARABIC) {
              expect(direction).toBe('rtl');
              expect(languagePreferenceService.isRTL(language)).toBe(true);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should preserve language preference across operations', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.constantFrom(Language.FRENCH, Language.ARABIC),
          async (userId, language) => {
            // Set language preference
            const setResult = await languagePreferenceService.setUserLanguagePreference(
              userId,
              language
            );
            
            // Property: Setting should succeed
            expect(setResult.success).toBe(true);
            expect(setResult.language).toBe(language);
            
            // Property: Getting preference should return the same language
            const retrievedLanguage = await languagePreferenceService.getUserLanguagePreference(
              userId
            );
            expect(retrievedLanguage).toBe(language);
            
            // Property: Current language should be updated
            expect(languagePreferenceService.getCurrentLanguage()).toBe(language);
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should provide language display names in both languages', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(Language.FRENCH, Language.ARABIC),
          fc.constantFrom(Language.FRENCH, Language.ARABIC),
          (targetLanguage, displayLanguage) => {
            const displayName = languagePreferenceService.getLanguageDisplayName(
              targetLanguage,
              displayLanguage
            );
            
            // Property: Display name must be a non-empty string
            expect(displayName).toBeTruthy();
            expect(typeof displayName).toBe('string');
            expect(displayName.length).toBeGreaterThan(0);
            
            // Property: Display name should be appropriate for the display language
            if (displayLanguage === Language.ARABIC) {
              // Arabic display names should contain Arabic characters
              expect(/[\u0600-\u06FF]/.test(displayName)).toBe(true);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should validate language codes correctly', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constantFrom(Language.FRENCH, Language.ARABIC),
            fc.string({ minLength: 1, maxLength: 10 })
          ),
          (languageCode) => {
            const isValid = languagePreferenceService.isValidLanguage(languageCode);
            
            // Property: Only valid language codes should be accepted
            if (languageCode === Language.FRENCH || languageCode === Language.ARABIC) {
              expect(isValid).toBe(true);
            } else {
              expect(isValid).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });
  });

  describe('Property 43: Mobile Responsiveness', () => {
    /**
     * **Validates: Requirements 8.5**
     * 
     * For any mobile device access, the system should provide responsive document viewing
     * and basic operations
     */
    
    it('should correctly detect device type based on screen width', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 320, max: 2560 }),
          (screenWidth) => {
            // Mock window.innerWidth
            Object.defineProperty(window, 'innerWidth', {
              writable: true,
              configurable: true,
              value: screenWidth,
            });
            
            const deviceInfo = responsiveLayoutService.getDeviceInfo();
            
            // Property: Device type should match screen width breakpoints
            if (screenWidth < 768) {
              expect(deviceInfo.type).toBe(DeviceType.MOBILE);
              expect(responsiveLayoutService.isMobile()).toBe(true);
            } else if (screenWidth < 1024) {
              expect(deviceInfo.type).toBe(DeviceType.TABLET);
              expect(responsiveLayoutService.isTablet()).toBe(true);
            } else {
              expect(deviceInfo.type).toBe(DeviceType.DESKTOP);
              expect(responsiveLayoutService.isDesktop()).toBe(true);
            }
            
            // Property: Screen width should be recorded correctly
            expect(deviceInfo.screenWidth).toBe(screenWidth);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should correctly detect orientation based on dimensions', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 320, max: 1920 }),
          fc.integer({ min: 320, max: 1920 }),
          (width, height) => {
            // Mock window dimensions
            Object.defineProperty(window, 'innerWidth', {
              writable: true,
              configurable: true,
              value: width,
            });
            Object.defineProperty(window, 'innerHeight', {
              writable: true,
              configurable: true,
              value: height,
            });
            
            const deviceInfo = responsiveLayoutService.getDeviceInfo();
            
            // Property: Orientation should match width vs height comparison
            if (width > height) {
              expect(deviceInfo.orientation).toBe(Orientation.LANDSCAPE);
              expect(responsiveLayoutService.isLandscape()).toBe(true);
              expect(responsiveLayoutService.isPortrait()).toBe(false);
            } else {
              expect(deviceInfo.orientation).toBe(Orientation.PORTRAIT);
              expect(responsiveLayoutService.isPortrait()).toBe(true);
              expect(responsiveLayoutService.isLandscape()).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide appropriate column count for device type', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(DeviceType.MOBILE, DeviceType.TABLET, DeviceType.DESKTOP),
          fc.constantFrom(Orientation.PORTRAIT, Orientation.LANDSCAPE),
          (deviceType, orientation) => {
            // Mock device info
            const mockWidth = deviceType === DeviceType.MOBILE ? 375 :
                            deviceType === DeviceType.TABLET ? 768 : 1280;
            const mockHeight = orientation === Orientation.PORTRAIT ? mockWidth * 1.5 : mockWidth * 0.6;
            
            Object.defineProperty(window, 'innerWidth', {
              writable: true,
              configurable: true,
              value: mockWidth,
            });
            Object.defineProperty(window, 'innerHeight', {
              writable: true,
              configurable: true,
              value: mockHeight,
            });
            
            const columnCount = responsiveLayoutService.getOptimalColumnCount();
            
            // Property: Column count should be appropriate for device and orientation
            expect(columnCount).toBeGreaterThan(0);
            expect(columnCount).toBeLessThanOrEqual(4);
            
            if (deviceType === DeviceType.MOBILE && orientation === Orientation.PORTRAIT) {
              expect(columnCount).toBe(1);
            } else if (deviceType === DeviceType.DESKTOP) {
              expect(columnCount).toBe(4);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should provide appropriate touch target size for device', () => {
      fc.assert(
        fc.property(
          fc.boolean(),
          (isTouchDevice) => {
            // Mock touch device detection
            if (isTouchDevice) {
              Object.defineProperty(window, 'ontouchstart', {
                writable: true,
                configurable: true,
                value: {},
              });
            } else {
              Object.defineProperty(window, 'ontouchstart', {
                writable: true,
                configurable: true,
                value: undefined,
              });
            }
            
            const touchTargetSize = responsiveLayoutService.getTouchTargetSize();
            
            // Property: Touch target size should meet accessibility guidelines
            expect(touchTargetSize).toBeGreaterThanOrEqual(32);
            
            // Property: Touch devices should have larger targets
            if (isTouchDevice) {
              expect(touchTargetSize).toBeGreaterThanOrEqual(44);
            }
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should generate appropriate responsive CSS classes', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 320, max: 2560 }),
          (screenWidth) => {
            Object.defineProperty(window, 'innerWidth', {
              writable: true,
              configurable: true,
              value: screenWidth,
            });
            
            const classes = responsiveLayoutService.getResponsiveClasses();
            
            // Property: Should always return an array of classes
            expect(Array.isArray(classes)).toBe(true);
            expect(classes.length).toBeGreaterThan(0);
            
            // Property: Should include device type class
            const hasDeviceClass = classes.some(c => 
              c.startsWith('device-')
            );
            expect(hasDeviceClass).toBe(true);
            
            // Property: Should include orientation class
            const hasOrientationClass = classes.some(c => 
              c.startsWith('orientation-')
            );
            expect(hasOrientationClass).toBe(true);
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should detect small viewports correctly', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 320, max: 1920 }),
          (screenWidth) => {
            Object.defineProperty(window, 'innerWidth', {
              writable: true,
              configurable: true,
              value: screenWidth,
            });
            
            const isSmall = responsiveLayoutService.isSmallViewport();
            
            // Property: Small viewport detection should match threshold
            if (screenWidth < 640) {
              expect(isSmall).toBe(true);
            } else {
              expect(isSmall).toBe(false);
            }
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should provide consistent device info across multiple calls', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 320, max: 2560 }),
          fc.integer({ min: 320, max: 2560 }),
          (width, height) => {
            Object.defineProperty(window, 'innerWidth', {
              writable: true,
              configurable: true,
              value: width,
            });
            Object.defineProperty(window, 'innerHeight', {
              writable: true,
              configurable: true,
              value: height,
            });
            
            const info1 = responsiveLayoutService.getDeviceInfo();
            const info2 = responsiveLayoutService.getDeviceInfo();
            
            // Property: Multiple calls should return consistent information
            expect(info1.type).toBe(info2.type);
            expect(info1.orientation).toBe(info2.orientation);
            expect(info1.screenWidth).toBe(info2.screenWidth);
            expect(info1.screenHeight).toBe(info2.screenHeight);
          }
        ),
        { numRuns: 50 }
      );
    });
  });

  describe('Integration: Multi-Language and Mobile Responsiveness', () => {
    it('should maintain language preference across device changes', () => {
      fc.assert(
        fc.property(
          fc.uuid(),
          fc.constantFrom(Language.FRENCH, Language.ARABIC),
          fc.integer({ min: 320, max: 2560 }),
          async (userId, language, screenWidth) => {
            // Set language preference
            await languagePreferenceService.setUserLanguagePreference(userId, language);
            
            // Change device width
            Object.defineProperty(window, 'innerWidth', {
              writable: true,
              configurable: true,
              value: screenWidth,
            });
            
            // Property: Language preference should persist across device changes
            const retrievedLanguage = await languagePreferenceService.getUserLanguagePreference(
              userId
            );
            expect(retrievedLanguage).toBe(language);
            
            // Property: Text direction should remain consistent
            const direction = languagePreferenceService.getTextDirection(language);
            expect(direction).toBe(language === Language.ARABIC ? 'rtl' : 'ltr');
          }
        ),
        { numRuns: 20 }
      );
    });

    it('should apply correct text direction for mobile devices', () => {
      fc.assert(
        fc.property(
          fc.constantFrom(Language.FRENCH, Language.ARABIC),
          fc.integer({ min: 320, max: 767 }), // Mobile range
          (language, mobileWidth) => {
            Object.defineProperty(window, 'innerWidth', {
              writable: true,
              configurable: true,
              value: mobileWidth,
            });
            
            const deviceInfo = responsiveLayoutService.getDeviceInfo();
            const direction = languagePreferenceService.getTextDirection(language);
            
            // Property: Mobile devices should respect language direction
            expect(deviceInfo.type).toBe(DeviceType.MOBILE);
            
            if (language === Language.ARABIC) {
              expect(direction).toBe('rtl');
            } else {
              expect(direction).toBe('ltr');
            }
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
