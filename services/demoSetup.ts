import { authService } from './authService';

/**
 * Demo Setup Service
 * Creates demo data and user context for testing SAAS functionality
 */
class DemoSetupService {
  private isInitialized = false;

  /**
   * Initialize demo environment
   */
  async initializeDemo(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      console.log('🚀 Initializing SAAS Demo Environment...');

      // Create demo user profile
      const demoUser = await authService.createDemoUserProfile();
      
      if (demoUser) {
        console.log('✅ Demo user created:', {
          name: `${demoUser.first_name} ${demoUser.last_name}`,
          role: demoUser.role,
          organization: demoUser.organization?.name,
          subscription: demoUser.organization?.subscription_status
        });

        // Also set the current user in authService for immediate use
        await authService.getCurrentUser();

        this.isInitialized = true;
        return true;
      } else {
        console.error('❌ Failed to create demo user');
        return false;
      }
    } catch (error) {
      console.error('❌ Error initializing demo:', error);
      return false;
    }
  }

  /**
   * Check if demo is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Reset demo environment
   */
  reset(): void {
    this.isInitialized = false;
  }
}

// Create and export a singleton instance
export const demoSetup = new DemoSetupService();