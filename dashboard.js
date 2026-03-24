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

/**
 * Registration component that covers sign-up, verification, password reset,
 * profile updates, and audit visibility.
 */
class RegistrationComponent {
    /**
     * @param {string} containerId - Container element ID
     * @param {RegistrationAPI} api - Registration API instance
     */
    constructor(containerId, api) {
        this.container = document.getElementById(containerId);
        this.api = api;
        this.currentCaptcha = this.api.generateCaptchaChallenge();
        this.activeUserId = null;

        this.init();
    }

    /** Initialize component UI and listeners */
    init() {
        if (!this.container) {
            console.error('Registration container not found');
            return;
        }

        this.render();
        this.bindEvents();
        this.refreshPanels();
    }

    /** Render component layout */
    render() {
        this.container.innerHTML = `
            <div class="registration-layout">
                <div class="registration-card">
                    <h4>Create Account</h4>
                    <form id="registration-form" class="form-grid" novalidate>
                        <label>
                            Full Name
                            <input type="text" name="fullName" placeholder="Jane Doe" required>
                        </label>
                        <label>
                            Email
                            <input type="email" name="email" placeholder="jane@example.com" required>
                        </label>
                        <label>
                            Phone
                            <input type="tel" name="phone" placeholder="(555) 123-4567">
                        </label>
                        <label>
                            Password
                            <input type="password" name="password" id="registration-password" placeholder="Create a strong password" required>
                        </label>
                        <label>
                            Confirm Password
                            <input type="password" name="confirmPassword" placeholder="Re-enter password" required>
                        </label>
                        <label>
                            CAPTCHA: Solve <span id="captcha-question">${this.currentCaptcha.question}</span>
                            <input type="number" name="captcha" placeholder="Answer" required>
                        </label>
                        <div class="password-strength" id="password-strength">Password strength: —</div>
                        <div id="registration-errors" class="form-errors hidden"></div>
                        <button type="submit" class="btn btn-primary">Register</button>
                    </form>
                </div>

                <div class="registration-card">
                    <h4>Email Verification</h4>
                    <form id="verification-form" class="form-grid" novalidate>
                        <label>
                            Verification Token
                            <input type="text" name="verificationToken" placeholder="verify_..." required>
                        </label>
                        <button type="submit" class="btn btn-secondary">Verify Email</button>
                    </form>

                    <h4>Forgot Password</h4>
                    <form id="password-reset-request-form" class="form-grid" novalidate>
                        <label>
                            Account Email
                            <input type="email" name="resetEmail" placeholder="jane@example.com" required>
                        </label>
                        <button type="submit" class="btn btn-secondary">Send Reset Email</button>
                    </form>

                    <form id="password-reset-form" class="form-grid" novalidate>
                        <label>
                            Reset Token
                            <input type="text" name="resetToken" placeholder="reset_..." required>
                        </label>
                        <label>
                            New Password
                            <input type="password" name="newPassword" placeholder="Enter new password" required>
                        </label>
                        <button type="submit" class="btn btn-secondary">Reset Password</button>
                    </form>
                </div>

                <div class="registration-card">
                    <h4>Update Registration Info</h4>
                    <form id="registration-update-form" class="form-grid" novalidate>
                        <label>
                            User ID
                            <input type="number" name="userId" placeholder="1" required>
                        </label>
                        <label>
                            New Full Name
                            <input type="text" name="updatedFullName" placeholder="Jane Q. Doe">
                        </label>
                        <label>
                            New Email
                            <input type="email" name="updatedEmail" placeholder="jane.new@example.com">
                        </label>
                        <label>
                            New Phone
                            <input type="tel" name="updatedPhone" placeholder="(555) 987-6543">
                        </label>
                        <button type="submit" class="btn btn-secondary">Update Info</button>
                    </form>
                </div>
            </div>

            <div class="registration-logs-layout">
                <div class="widget">
                    <h3>Sent Emails (Demo Outbox)</h3>
                    <div id="email-outbox-panel" class="log-panel"></div>
                </div>
                <div class="widget">
                    <h3>Registration Audit Log</h3>
                    <div id="registration-audit-panel" class="log-panel"></div>
                </div>
            </div>
        `;
    }

    /** Attach form and input listeners */
    bindEvents() {
        const registrationForm = this.container.querySelector('#registration-form');
        const verificationForm = this.container.querySelector('#verification-form');
        const resetRequestForm = this.container.querySelector('#password-reset-request-form');
        const resetForm = this.container.querySelector('#password-reset-form');
        const updateForm = this.container.querySelector('#registration-update-form');
        const passwordInput = this.container.querySelector('#registration-password');

        passwordInput?.addEventListener('input', () => this.updatePasswordStrength());

        registrationForm?.addEventListener('submit', async (event) => {
            event.preventDefault();
            await this.handleRegistrationSubmit();
        });

        verificationForm?.addEventListener('submit', (event) => {
            event.preventDefault();
            this.handleVerificationSubmit();
        });

        resetRequestForm?.addEventListener('submit', (event) => {
            event.preventDefault();
            this.handleResetRequestSubmit();
        });

        resetForm?.addEventListener('submit', async (event) => {
            event.preventDefault();
            await this.handleResetSubmit();
        });

        updateForm?.addEventListener('submit', (event) => {
            event.preventDefault();
            this.handleUpdateSubmit();
        });
    }

    /** Update password strength indicator as user types */
    updatePasswordStrength() {
        const password = this.container.querySelector('#registration-password')?.value || '';
        const strength = this.api.getPasswordStrength(password);
        const strengthEl = this.container.querySelector('#password-strength');
        if (!strengthEl) return;

        strengthEl.textContent = `Password strength: ${strength.label}`;
        strengthEl.classList.remove('strength-weak', 'strength-good', 'strength-strong');
        if (strength.score <= 2) {
            strengthEl.classList.add('strength-weak');
        } else if (strength.score <= 4) {
            strengthEl.classList.add('strength-good');
        } else {
            strengthEl.classList.add('strength-strong');
        }
    }

    /** Handle registration form submission */
    async handleRegistrationSubmit() {
        const form = this.container.querySelector('#registration-form');
        const errorsEl = this.container.querySelector('#registration-errors');
        if (!form || !errorsEl) return;

        const formData = new FormData(form);
        const input = {
            fullName: String(formData.get('fullName') || ''),
            email: String(formData.get('email') || ''),
            phone: String(formData.get('phone') || ''),
            password: String(formData.get('password') || ''),
            confirmPassword: String(formData.get('confirmPassword') || '')
        };
        const captchaAnswer = Number(formData.get('captcha'));

        const validationErrors = this.api.validateRegistrationData(
            input,
            captchaAnswer,
            this.currentCaptcha.answer
        );

        if (validationErrors.length) {
            errorsEl.classList.remove('hidden');
            errorsEl.innerHTML = validationErrors.map(error => `<div>${this.escapeHtml(error)}</div>`).join('');
            DashboardUtils.showNotification('Please correct the highlighted registration errors.', 'error');
            return;
        }

        errorsEl.classList.add('hidden');
        errorsEl.innerHTML = '';

        try {
            const result = await this.api.registerUser(input, captchaAnswer, this.currentCaptcha.answer);
            this.activeUserId = result.user.id;
            DashboardUtils.showNotification('Registration successful. Check verification token in Sent Emails.', 'success');
            form.reset();
            this.refreshCaptcha();

            const verificationInput = this.container.querySelector('input[name="verificationToken"]');
            if (verificationInput) {
                verificationInput.value = result.verificationToken;
            }

            const userIdInput = this.container.querySelector('input[name="userId"]');
            if (userIdInput) {
                userIdInput.value = String(result.user.id);
            }

            this.refreshPanels();
        } catch (error) {
            errorsEl.classList.remove('hidden');
            errorsEl.innerHTML = `<div>${this.escapeHtml(error.message)}</div>`;
            DashboardUtils.showNotification('Registration failed.', 'error');
            this.refreshCaptcha();
            this.refreshPanels();
        }
    }

    /** Handle email verification form */
    handleVerificationSubmit() {
        const form = this.container.querySelector('#verification-form');
        if (!form) return;

        const token = String(new FormData(form).get('verificationToken') || '').trim();
        if (!token) {
            DashboardUtils.showNotification('Enter a verification token.', 'error');
            return;
        }

        try {
            const user = this.api.verifyEmail(token);
            this.activeUserId = user.id;
            DashboardUtils.showNotification('Email verified. Confirmation email sent.', 'success');
            form.reset();
            this.refreshPanels();
        } catch (error) {
            DashboardUtils.showNotification(error.message, 'error');
            this.refreshPanels();
        }
    }

    /** Handle password reset request form */
    handleResetRequestSubmit() {
        const form = this.container.querySelector('#password-reset-request-form');
        if (!form) return;
        const email = String(new FormData(form).get('resetEmail') || '').trim();

        try {
            const resetToken = this.api.requestPasswordReset(email);
            const resetInput = this.container.querySelector('input[name="resetToken"]');
            if (resetInput) {
                resetInput.value = resetToken;
            }
            DashboardUtils.showNotification('Password reset email sent.', 'success');
            this.refreshPanels();
        } catch (error) {
            DashboardUtils.showNotification(error.message, 'error');
            this.refreshPanels();
        }
    }

    /** Handle actual password reset with token + new password */
    async handleResetSubmit() {
        const form = this.container.querySelector('#password-reset-form');
        if (!form) return;

        const data = new FormData(form);
        const token = String(data.get('resetToken') || '').trim();
        const newPassword = String(data.get('newPassword') || '');

        try {
            await this.api.resetPassword(token, newPassword);
            DashboardUtils.showNotification('Password has been reset.', 'success');
            form.reset();
            this.refreshPanels();
        } catch (error) {
            DashboardUtils.showNotification(error.message, 'error');
            this.refreshPanels();
        }
    }

    /** Handle registration-info update form */
    handleUpdateSubmit() {
        const form = this.container.querySelector('#registration-update-form');
        if (!form) return;

        const data = new FormData(form);
        const userId = Number(data.get('userId'));
        if (!userId) {
            DashboardUtils.showNotification('Provide a valid user ID.', 'error');
            return;
        }

        const updates = {
            fullName: String(data.get('updatedFullName') || ''),
            email: String(data.get('updatedEmail') || ''),
            phone: String(data.get('updatedPhone') || '')
        };

        if (!updates.fullName) delete updates.fullName;
        if (!updates.email) delete updates.email;
        if (!updates.phone) delete updates.phone;

        try {
            this.api.updateRegistrationInfo(userId, updates);
            DashboardUtils.showNotification('Registration info updated successfully.', 'success');
            this.refreshPanels();
        } catch (error) {
            DashboardUtils.showNotification(error.message, 'error');
            this.refreshPanels();
        }
    }

    /** Refresh both the email and audit panels */
    refreshPanels() {
        this.renderEmailOutbox();
        this.renderAuditLog();
    }

    /** Render sent emails panel */
    renderEmailOutbox() {
        const panel = this.container.querySelector('#email-outbox-panel');
        if (!panel) return;

        const mails = this.api.getEmailOutbox().slice(0, 8);
        if (!mails.length) {
            panel.innerHTML = '<p class="empty-log">No emails sent yet.</p>';
            return;
        }

        panel.innerHTML = mails.map(mail => `
            <div class="log-row">
                <div class="log-row-title">${this.escapeHtml(mail.subject)}</div>
                <div class="log-row-meta">To: ${this.escapeHtml(mail.to)} • ${DashboardUtils.formatDate(mail.sentAt)}</div>
                <div class="log-row-body">${this.escapeHtml(mail.body)}</div>
            </div>
        `).join('');
    }

    /** Render registration audit events */
    renderAuditLog() {
        const panel = this.container.querySelector('#registration-audit-panel');
        if (!panel) return;

        const logs = this.api.getAuditLogs().slice(0, 12);
        if (!logs.length) {
            panel.innerHTML = '<p class="empty-log">No audit events yet.</p>';
            return;
        }

        panel.innerHTML = logs.map(log => `
            <div class="log-row">
                <div class="log-row-title">${this.escapeHtml(log.eventType)}</div>
                <div class="log-row-meta">${DashboardUtils.formatDate(log.occurredAt)}</div>
                <div class="log-row-body">${this.escapeHtml(JSON.stringify(log.details))}</div>
            </div>
        `).join('');
    }

    /** Generate and display a new CAPTCHA challenge */
    refreshCaptcha() {
        this.currentCaptcha = this.api.generateCaptchaChallenge();
        const question = this.container.querySelector('#captcha-question');
        if (question) {
            question.textContent = this.currentCaptcha.question;
        }
    }

    /** Escape text to prevent XSS in rendered logs */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    }

    /** Destroy component */
    destroy() {
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
}

// Global variables for dashboard components
let userProfileComponent = null;
let recommendationsComponent = null;
let registrationComponent = null;

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

    // Initialize registration component
    registrationComponent = new RegistrationComponent('registration-container', registrationAPI);

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