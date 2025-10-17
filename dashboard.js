/**
 * Dashboard module for managing user profile display
 */

class UserProfileComponent {
    constructor(containerId, api) {
        this.container = document.getElementById(containerId);
        this.api = api;
        this.currentUser = null;
        this.isLoading = false;
        this.unsubscribe = null;
        
        this.init();
    }

    /**
     * Initialize the component
     */
    init() {
        if (!this.container) {
            console.error('User profile container not found');
            return;
        }

        // Subscribe to real-time updates
        this.unsubscribe = this.api.subscribe((profileData) => {
            this.handleProfileUpdate(profileData);
        });

        // Load initial profile data
        this.loadUserProfile();
    }

    /**
     * Load user profile data from API
     */
    async loadUserProfile(userId = 1) {
        try {
            this.setLoadingState(true);
            
            const profileData = await this.api.fetchUserProfile(userId);
            this.currentUser = profileData;
            this.renderProfile(profileData);
            
        } catch (error) {
            console.error('Error loading user profile:', error);
            this.renderError(error.message);
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Handle real-time profile updates
     */
    handleProfileUpdate(profileData) {
        if (this.currentUser && profileData.id === this.currentUser.id) {
            this.currentUser = profileData;
            this.renderProfile(profileData, true); // true indicates this is an update
        }
    }

    /**
     * Set loading state
     */
    setLoadingState(isLoading) {
        this.isLoading = isLoading;
        
        if (isLoading) {
            this.container.classList.add('loading');
        } else {
            this.container.classList.remove('loading');
        }
    }

    /**
     * Render the user profile
     */
    renderProfile(profileData, isUpdate = false) {
        if (!profileData) return;

        // Add update animation if this is a real-time update
        if (isUpdate) {
            this.container.classList.add('updating');
            setTimeout(() => {
                this.container.classList.remove('updating');
            }, 600);
        }

        this.container.innerHTML = `
            <img 
                src="${profileData.avatar || this.api.getDefaultAvatar()}" 
                alt="${profileData.name}'s avatar" 
                class="user-avatar"
                onerror="this.src='${this.api.getDefaultAvatar()}'"
            >
            <div class="user-info">
                <div class="user-name">${this.escapeHtml(profileData.name)}</div>
                <div class="user-email">${this.escapeHtml(profileData.email)}</div>
            </div>
        `;

        // Remove any error state
        this.container.classList.remove('error');
    }

    /**
     * Render error state
     */
    renderError(errorMessage) {
        this.container.classList.add('error');
        this.container.innerHTML = `
            <img 
                src="${this.api.getDefaultAvatar()}" 
                alt="Default avatar" 
                class="user-avatar"
            >
            <div class="user-info">
                <div class="user-name">Unable to load profile</div>
                <div class="user-email error-message">${this.escapeHtml(errorMessage)}</div>
            </div>
        `;
    }

    /**
     * Escape HTML to prevent XSS attacks
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Refresh the profile data
     */
    async refresh() {
        if (this.currentUser) {
            // Clear cache to force fresh data
            this.api.clearCache(this.currentUser.id);
            await this.loadUserProfile(this.currentUser.id);
        }
    }

    /**
     * Update profile data
     */
    async updateProfile(newData) {
        if (!this.currentUser) return;

        try {
            this.setLoadingState(true);
            
            const updatedProfile = await this.api.updateUserProfile(this.currentUser.id, newData);
            this.currentUser = updatedProfile;
            this.renderProfile(updatedProfile, true);
            
            return updatedProfile;
        } catch (error) {
            console.error('Error updating profile:', error);
            throw error;
        } finally {
            this.setLoadingState(false);
        }
    }

    /**
     * Get current user data
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * Destroy the component and clean up subscriptions
     */
    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
        
        if (this.container) {
            this.container.innerHTML = '';
            this.container.classList.remove('loading', 'error', 'updating');
        }
    }
}

/**
 * Dashboard utility functions
 */
class DashboardUtils {
    /**
     * Show loading spinner
     */
    static showLoadingSpinner() {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.classList.remove('hidden');
        }
    }

    /**
     * Hide loading spinner
     */
    static hideLoadingSpinner() {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.classList.add('hidden');
        }
    }

    /**
     * Show notification message
     */
    static showNotification(message, type = 'info') {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 1rem 1.5rem;
                border-radius: 8px;
                color: white;
                font-weight: 500;
                z-index: 1001;
                transform: translateX(100%);
                transition: transform 0.3s ease;
                max-width: 300px;
                word-wrap: break-word;
            `;
            document.body.appendChild(notification);
        }

        // Set notification style based on type
        const colors = {
            info: '#667eea',
            success: '#28a745',
            warning: '#ffc107',
            error: '#dc3545'
        };

        notification.style.backgroundColor = colors[type] || colors.info;
        notification.textContent = message;
        
        // Show notification
        notification.style.transform = 'translateX(0)';
        
        // Hide after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
        }, 3000);
    }

    /**
     * Format date for display
     */
    static formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Check if device is mobile
     */
    static isMobile() {
        return window.innerWidth <= 768;
    }

    /**
     * Debounce function for performance optimization
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Global variables for dashboard components
let userProfileComponent = null;

/**
 * Initialize dashboard components
 */
function initializeDashboard() {
    // Initialize user profile component
    userProfileComponent = new UserProfileComponent('user-profile', userAPI);
    
    // Add resize listener for responsive behavior
    const handleResize = DashboardUtils.debounce(() => {
        // Handle any responsive adjustments if needed
        console.log('Window resized, checking responsive layout...');
    }, 250);
    
    window.addEventListener('resize', handleResize);
    
    console.log('Dashboard initialized successfully');
}

/**
 * Global function to update profile (called from HTML button)
 */
async function updateProfile() {
    if (!userProfileComponent) {
        DashboardUtils.showNotification('Profile component not initialized', 'error');
        return;
    }

    try {
        DashboardUtils.showLoadingSpinner();
        
        // Simulate profile update with new data
        const currentUser = userProfileComponent.getCurrentUser();
        if (currentUser) {
            const updatedData = {
                ...currentUser,
                name: currentUser.name + ' (Updated)',
                lastUpdated: new Date().toISOString()
            };
            
            await userProfileComponent.updateProfile(updatedData);
            DashboardUtils.showNotification('Profile updated successfully!', 'success');
        }
    } catch (error) {
        console.error('Error updating profile:', error);
        DashboardUtils.showNotification('Failed to update profile', 'error');
    } finally {
        DashboardUtils.hideLoadingSpinner();
    }
}