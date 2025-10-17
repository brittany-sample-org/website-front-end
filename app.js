/**
 * Main application entry point
 */

class App {
    constructor() {
        this.isInitialized = false;
        this.components = {};
        
        this.init();
    }

    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('Initializing application...');
            
            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.start());
            } else {
                this.start();
            }
            
        } catch (error) {
            console.error('Error initializing application:', error);
            this.handleInitializationError(error);
        }
    }

    /**
     * Start the application
     */
    async start() {
        try {
            // Show loading spinner
            DashboardUtils.showLoadingSpinner();
            
            // Initialize dashboard components
            await this.initializeComponents();
            
            // Set up global error handling
            this.setupErrorHandling();
            
            // Set up performance monitoring
            this.setupPerformanceMonitoring();
            
            // Mark as initialized
            this.isInitialized = true;
            
            console.log('Application started successfully');
            DashboardUtils.showNotification('Dashboard loaded successfully!', 'success');
            
        } catch (error) {
            console.error('Error starting application:', error);
            this.handleInitializationError(error);
        } finally {
            // Hide loading spinner
            DashboardUtils.hideLoadingSpinner();
        }
    }

    /**
     * Initialize all dashboard components
     */
    async initializeComponents() {
        try {
            // Initialize dashboard
            initializeDashboard();
            
            // Store component references
            this.components.userProfile = userProfileComponent;
            
            // Set up component event listeners
            this.setupComponentEventListeners();
            
        } catch (error) {
            console.error('Error initializing components:', error);
            throw error;
        }
    }

    /**
     * Set up event listeners for components
     */
    setupComponentEventListeners() {
        // Listen for profile updates
        if (this.components.userProfile) {
            // Add click handler for profile refresh
            const profileElement = document.getElementById('user-profile');
            if (profileElement) {
                profileElement.addEventListener('click', async (e) => {
                    e.preventDefault();
                    try {
                        await this.components.userProfile.refresh();
                        DashboardUtils.showNotification('Profile refreshed!', 'info');
                    } catch (error) {
                        console.error('Error refreshing profile:', error);
                        DashboardUtils.showNotification('Failed to refresh profile', 'error');
                    }
                });
                
                // Add tooltip
                profileElement.title = 'Click to refresh profile';
            }
        }

        // Set up keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + R to refresh profile
            if ((e.ctrlKey || e.metaKey) && e.key === 'r' && e.shiftKey) {
                e.preventDefault();
                this.refreshProfile();
            }
        });
    }

    /**
     * Set up global error handling
     */
    setupErrorHandling() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            DashboardUtils.showNotification('An unexpected error occurred', 'error');
            
            // Prevent the default browser behavior
            event.preventDefault();
        });

        // Handle general JavaScript errors
        window.addEventListener('error', (event) => {
            console.error('JavaScript error:', event.error);
            DashboardUtils.showNotification('An error occurred while loading the page', 'error');
        });
    }

    /**
     * Set up performance monitoring
     */
    setupPerformanceMonitoring() {
        // Monitor page load performance
        window.addEventListener('load', () => {
            if (window.performance && window.performance.timing) {
                const loadTime = window.performance.timing.loadEventEnd - window.performance.timing.navigationStart;
                console.log(`Page load time: ${loadTime}ms`);
                
                // Log slow page loads
                if (loadTime > 3000) {
                    console.warn('Slow page load detected:', loadTime + 'ms');
                }
            }
        });

        // Monitor API response times
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = performance.now();
            try {
                const response = await originalFetch(...args);
                const endTime = performance.now();
                const duration = endTime - startTime;
                
                console.log(`API call to ${args[0]} took ${duration.toFixed(2)}ms`);
                
                // Log slow API calls
                if (duration > 2000) {
                    console.warn('Slow API call detected:', args[0], duration + 'ms');
                }
                
                return response;
            } catch (error) {
                const endTime = performance.now();
                const duration = endTime - startTime;
                console.error(`API call to ${args[0]} failed after ${duration.toFixed(2)}ms:`, error);
                throw error;
            }
        };
    }

    /**
     * Handle initialization errors
     */
    handleInitializationError(error) {
        console.error('Application initialization failed:', error);
        
        // Show error message to user
        const errorContainer = document.createElement('div');
        errorContainer.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: #dc3545;
            color: white;
            padding: 2rem;
            border-radius: 8px;
            text-align: center;
            z-index: 1002;
            max-width: 400px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
        `;
        
        errorContainer.innerHTML = `
            <h3>Application Error</h3>
            <p>Failed to initialize the dashboard. Please refresh the page and try again.</p>
            <button onclick="window.location.reload()" style="
                background: white;
                color: #dc3545;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 1rem;
                font-weight: 500;
            ">Refresh Page</button>
        `;
        
        document.body.appendChild(errorContainer);
        
        // Hide loading spinner
        DashboardUtils.hideLoadingSpinner();
    }

    /**
     * Refresh profile data
     */
    async refreshProfile() {
        if (this.components.userProfile) {
            try {
                await this.components.userProfile.refresh();
                DashboardUtils.showNotification('Profile refreshed!', 'success');
            } catch (error) {
                console.error('Error refreshing profile:', error);
                DashboardUtils.showNotification('Failed to refresh profile', 'error');
            }
        }
    }

    /**
     * Get application status
     */
    getStatus() {
        return {
            initialized: this.isInitialized,
            components: Object.keys(this.components),
            userProfile: this.components.userProfile?.getCurrentUser() || null
        };
    }

    /**
     * Destroy the application and clean up resources
     */
    destroy() {
        // Clean up components
        Object.values(this.components).forEach(component => {
            if (component && typeof component.destroy === 'function') {
                component.destroy();
            }
        });
        
        // Clear components
        this.components = {};
        this.isInitialized = false;
        
        console.log('Application destroyed');
    }
}

// Initialize the application
const app = new App();

// Make app globally available for debugging
window.app = app;

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = App;
}