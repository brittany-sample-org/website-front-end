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

/**
 * Displays personalized product recommendations derived from the user's
 * account data and browsing history.
 */
class RecommendationsComponent {
    /**
     * @param {string} containerId - ID of the DOM container to render into
     * @param {UserAPI} api - The shared API instance
     * @param {BrowsingHistoryTracker} historyTracker - Browsing history tracker
     */
    constructor(containerId, api, historyTracker) {
        this.container = document.getElementById(containerId);
        this.api = api;
        this.historyTracker = historyTracker;
        this.currentUserId = 1;
        this.products = [];

        this.init();
    }

    /** Load recommendations on first mount */
    async init() {
        if (!this.container) {
            console.error('Recommendations container not found');
            return;
        }
        await this.loadRecommendations();
    }

    /** Fetch recommendations from the API and re-render */
    async loadRecommendations() {
        try {
            this.renderSkeleton();
            const history = this.historyTracker.getHistory();
            this.products = await this.api.fetchRecommendations(this.currentUserId, history);
            this.render();
        } catch (error) {
            console.error('Error loading recommendations:', error);
            this.renderError(error.message);
        }
    }

    /** Show placeholder skeleton cards while data is loading */
    renderSkeleton() {
        this.container.innerHTML = `
            <div class="recommendations-grid">
                ${Array(4).fill(0).map(() => `
                    <div class="product-card product-card--skeleton">
                        <div class="product-image-wrapper skeleton-box"></div>
                        <div class="product-info">
                            <div class="skeleton-line skeleton-line--short"></div>
                            <div class="skeleton-line skeleton-line--title"></div>
                            <div class="skeleton-line skeleton-line--short"></div>
                            <div class="skeleton-line skeleton-line--price"></div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;
    }

    /** Render the full recommendations UI */
    render() {
        if (!this.products.length) {
            this.container.innerHTML = '<p class="no-recommendations">No recommendations available at this time.</p>';
            return;
        }

        const historyCount = this.historyTracker.getHistory().length;
        const subtitle = historyCount > 0
            ? `Tailored to your browsing history and profile`
            : `Popular picks to get you started`;

        this.container.innerHTML = `
            <div class="recommendations-header">
                <span class="recommendations-subtitle">${subtitle}</span>
                <button class="btn btn-secondary btn-sm" id="refresh-recommendations">Refresh</button>
            </div>
            <div class="recommendations-grid">
                ${this.products.map(product => this.renderProductCard(product)).join('')}
            </div>
        `;

        // Event delegation: clicking any product card records it in history
        this.container.querySelectorAll('.product-card[data-product-id]').forEach(card => {
            card.addEventListener('click', () => {
                const productId = parseInt(card.dataset.productId, 10);
                this.handleProductClick(productId);
            });
            card.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    const productId = parseInt(card.dataset.productId, 10);
                    this.handleProductClick(productId);
                }
            });
        });

        document.getElementById('refresh-recommendations')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this.api.clearCache();
            this.loadRecommendations();
        });
    }

    /**
     * Build the HTML for a single product card
     * @param {Object} product
     * @returns {string} HTML string
     */
    renderProductCard(product) {
        const badgeHtml = product.badge
            ? `<span class="product-badge product-badge--${product.badge.toLowerCase().replace(/\s+/g, '-')}">${this.escapeHtml(product.badge)}</span>`
            : '';

        return `
            <div class="product-card" data-product-id="${product.id}" role="button" tabindex="0" aria-label="View ${this.escapeHtml(product.title)}">
                <div class="product-image-wrapper">
                    ${badgeHtml}
                    <img
                        src="${product.image}"
                        alt="${this.escapeHtml(product.title)}"
                        class="product-image"
                        loading="lazy"
                        onerror="this.src='https://via.placeholder.com/200x200?text=No+Image'"
                    >
                </div>
                <div class="product-info">
                    <span class="product-category">${this.escapeHtml(product.category)}</span>
                    <h4 class="product-title">${this.escapeHtml(product.title)}</h4>
                    <div class="product-rating">
                        ${this.renderStars(product.rating)}
                        <span class="product-review-count">(${product.reviewCount.toLocaleString()})</span>
                    </div>
                    <div class="product-footer">
                        <span class="product-price">$${product.price.toFixed(2)}</span>
                        <button class="btn btn-primary btn-sm">View</button>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render a star rating as HTML spans
     * @param {number} rating - Rating value 0–5
     * @returns {string} HTML string
     */
    renderStars(rating) {
        const full = Math.floor(rating);
        const half = rating % 1 >= 0.5;
        const empty = 5 - full - (half ? 1 : 0);
        return `
            <span class="stars" aria-label="Rating: ${rating} out of 5">
                ${'<span class="star star--full">★</span>'.repeat(full)}
                ${half ? '<span class="star star--half">★</span>' : ''}
                ${'<span class="star star--empty">★</span>'.repeat(empty)}
            </span>
            <span class="rating-value">${rating}</span>
        `;
    }

    /**
     * Record a product view and refresh recommendations to reflect new preferences
     * @param {number} productId
     */
    handleProductClick(productId) {
        this.historyTracker.addItem(productId);
        const product = this.products.find(p => p.id === productId);
        DashboardUtils.showNotification(
            `Viewing "${product ? product.title : 'product'}" — updating recommendations...`,
            'info'
        );
        this.api.clearCache();
        setTimeout(() => this.loadRecommendations(), 800);
    }

    /** Show an error state with a retry button */
    renderError(message) {
        this.container.innerHTML = `
            <div class="recommendations-error">
                <p>Unable to load recommendations. ${this.escapeHtml(message)}</p>
                <button class="btn btn-primary btn-sm" id="retry-recommendations">Retry</button>
            </div>
        `;
        document.getElementById('retry-recommendations')?.addEventListener('click', () => {
            this.loadRecommendations();
        });
    }

    /** Escape text to prevent XSS */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    }

    /** Force a fresh reload of recommendations */
    refresh() {
        this.api.clearCache();
        return this.loadRecommendations();
    }

    /** Tear down the component */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Global variables for dashboard components
let userProfileComponent = null;
let recommendationsComponent = null;

/**
 * Initialize dashboard components
 */
function initializeDashboard() {
    // Initialize user profile component
    userProfileComponent = new UserProfileComponent('user-profile', userAPI);
    
    // Initialize personalized recommendations component
    recommendationsComponent = new RecommendationsComponent(
        'recommendations-container',
        userAPI,
        browsingHistoryTracker
    );

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