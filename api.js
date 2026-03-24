/**
 * API module for handling user profile data
 */

class UserAPI {
    constructor() {
        this.baseURL = 'https://jsonplaceholder.typicode.com'; // Mock API for demo
        this.cache = new Map();
        this.subscribers = new Set();
    }

    /**
     * Fetch user profile data from the backend API
     * @param {number} userId - The user ID to fetch
     * @returns {Promise<Object>} User profile data
     */
    async fetchUserProfile(userId = 1) {
        try {
            // Check cache first
            const cacheKey = `user_${userId}`;
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            // Fetch from API
            const response = await fetch(`${this.baseURL}/users/${userId}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const userData = await response.json();
            
            // Transform the data to match our profile structure
            const profileData = {
                id: userData.id,
                name: userData.name,
                email: userData.email,
                avatar: this.generateAvatarURL(userData.name), // Generate avatar URL
                username: userData.username,
                phone: userData.phone,
                website: userData.website,
                company: userData.company?.name || '',
                lastUpdated: new Date().toISOString()
            };

            // Cache the result
            this.cache.set(cacheKey, profileData);
            
            return profileData;
        } catch (error) {
            console.error('Error fetching user profile:', error);
            throw new Error('Failed to fetch user profile. Please try again later.');
        }
    }

    /**
     * Generate avatar URL using a service like Gravatar or UI Avatars
     * @param {string} name - User's name
     * @returns {string} Avatar URL
     */
    generateAvatarURL(name) {
        // Using UI Avatars service for demo - generates avatar based on initials
        const initials = name
            .split(' ')
            .map(word => word.charAt(0).toUpperCase())
            .join('')
            .substring(0, 2);
        
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=80&background=667eea&color=ffffff&bold=true`;
    }

    /**
     * Get default avatar URL for users without custom avatars
     * @returns {string} Default avatar URL
     */
    getDefaultAvatar() {
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODAiIGhlaWdodD0iODAiIHZpZXdCb3g9IjAgMCA4MCA4MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iNDAiIGN5PSI0MCIgcj0iNDAiIGZpbGw9IiM2NjdlZWEiLz4KPHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4PSIyMCIgeT0iMjAiPgo8cGF0aCBkPSJNMTIgMTJDMTQuNzYxNCAxMiAxNyA5Ljc2MTQyIDE3IDdDMTcgNC4yMzg1OCAxNC43NjE0IDIgMTIgMkM5LjIzODU4IDIgNyA0LjIzODU4IDcgN0M3IDkuNzYxNDIgOS4yMzg1OCAxMiAxMiAxMloiIGZpbGw9IndoaXRlIi8+CjxwYXRoIGQ9Ik0xMiAxNEM4LjEzNDAxIDE0IDUgMTcuMTM0IDUgMjFIMTlDMTkgMTcuMTM0IDE1Ljg2NiAxNCAxMiAxNFoiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPgo8L3N2Zz4K';
    }

    /**
     * Update user profile data
     * @param {number} userId - The user ID
     * @param {Object} profileData - Updated profile data
     * @returns {Promise<Object>} Updated profile data
     */
    async updateUserProfile(userId, profileData) {
        try {
            const response = await fetch(`${this.baseURL}/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(profileData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const updatedData = await response.json();
            
            // Update cache
            const cacheKey = `user_${userId}`;
            const cachedData = this.cache.get(cacheKey) || {};
            const mergedData = {
                ...cachedData,
                ...updatedData,
                lastUpdated: new Date().toISOString()
            };
            
            this.cache.set(cacheKey, mergedData);
            
            // Notify subscribers of the update
            this.notifySubscribers(mergedData);
            
            return mergedData;
        } catch (error) {
            console.error('Error updating user profile:', error);
            throw new Error('Failed to update user profile. Please try again later.');
        }
    }

    /**
     * Subscribe to profile updates for real-time notifications
     * @param {Function} callback - Callback function to call when profile updates
     */
    subscribe(callback) {
        this.subscribers.add(callback);
        
        // Return unsubscribe function
        return () => {
            this.subscribers.delete(callback);
        };
    }

    /**
     * Notify all subscribers of profile updates
     * @param {Object} profileData - Updated profile data
     */
    notifySubscribers(profileData) {
        this.subscribers.forEach(callback => {
            try {
                callback(profileData);
            } catch (error) {
                console.error('Error in subscriber callback:', error);
            }
        });
    }

    /**
     * Fetch personalized product recommendations based on user profile and browsing history
     * @param {number} userId - The user ID
     * @param {Array<number>} browsingHistory - Array of recently viewed product IDs
     * @returns {Promise<Array>} Array of recommended product objects
     */
    async fetchRecommendations(userId, browsingHistory = []) {
        try {
            const cacheKey = `recommendations_${userId}_${browsingHistory.slice(0, 3).join('_')}`;
            if (this.cache.has(cacheKey)) {
                return this.cache.get(cacheKey);
            }

            // Fetch user profile and mock product posts in parallel
            const [userProfile, postsResponse] = await Promise.all([
                this.fetchUserProfile(userId),
                fetch(`${this.baseURL}/posts?_limit=20`)
            ]);

            if (!postsResponse.ok) {
                throw new Error(`HTTP error! status: ${postsResponse.status}`);
            }

            const posts = await postsResponse.json();

            // Map posts to mock product objects with categories, prices, and ratings
            const categories = ['Electronics', 'Clothing', 'Books', 'Sports', 'Home & Kitchen', 'Beauty', 'Toys', 'Automotive'];
            const products = posts.map((post, index) => {
                const category = categories[index % categories.length];
                const basePrice = 9.99 + (post.id * 3.7) % 190;
                const rating = 3.0 + (post.id % 20) * 0.1;
                return {
                    id: post.id,
                    title: this.truncateText(post.title, 50),
                    description: this.truncateText(post.body, 100),
                    category,
                    price: parseFloat(basePrice.toFixed(2)),
                    rating: parseFloat(rating.toFixed(1)),
                    reviewCount: 10 + (post.id * 7) % 490,
                    image: `https://picsum.photos/seed/product${post.id}/200/200`,
                    badge: index < 3 ? 'Top Pick' : index < 6 ? 'New' : null
                };
            });

            // Personalize: boost products whose category matches the browsing history
            const historySet = new Set(browsingHistory);
            const historyCategories = new Set(
                products
                    .filter(p => historySet.has(p.id))
                    .map(p => p.category)
            );

            const personalized = products
                .map(product => ({
                    ...product,
                    score: historyCategories.has(product.category)
                        ? 2 + product.rating
                        : product.rating
                }))
                .sort((a, b) => b.score - a.score)
                .slice(0, 8);

            this.cache.set(cacheKey, personalized);
            return personalized;
        } catch (error) {
            console.error('Error fetching recommendations:', error);
            throw new Error('Failed to fetch recommendations. Please try again later.');
        }
    }

    /**
     * Truncate text to a maximum character length
     * @param {string} text - Source text
     * @param {number} maxLen - Maximum length before truncation
     * @returns {string} Truncated text
     */
    truncateText(text, maxLen) {
        if (!text) return '';
        return text.length > maxLen ? text.substring(0, maxLen).trimEnd() + '...' : text;
    }

    /**
     * Clear cache for a specific user or all users
     * @param {number} userId - Optional user ID to clear specific cache
     */
    clearCache(userId = null) {
        if (userId) {
            this.cache.delete(`user_${userId}`);
        } else {
            this.cache.clear();
        }
    }

    /**
     * Simulate real-time updates (for demo purposes)
     * In a real application, this would be handled by WebSockets or Server-Sent Events
     */
    simulateRealTimeUpdates() {
        // Simulate a profile update every 30 seconds for demo
        setInterval(async () => {
            try {
                const currentProfile = this.cache.get('user_1');
                if (currentProfile) {
                    // Simulate a small change (like last seen time)
                    const updatedProfile = {
                        ...currentProfile,
                        lastSeen: new Date().toISOString(),
                        lastUpdated: new Date().toISOString()
                    };
                    
                    this.cache.set('user_1', updatedProfile);
                    this.notifySubscribers(updatedProfile);
                }
            } catch (error) {
                console.error('Error in simulated real-time update:', error);
            }
        }, 30000); // 30 seconds
    }
}

/**
 * Registration and identity API for a demo front-end application.
 * Data is persisted locally to simulate backend behavior.
 */
class RegistrationAPI {
    constructor() {
        this.usersDbKey = 'secure_users_db_v1';
        this.auditLogKey = 'registration_audit_log_v1';
        this.emailOutboxKey = 'registration_email_outbox_v1';
        this.verificationTokenPrefix = 'verify_';
        this.resetTokenPrefix = 'reset_';
    }

    /**
     * Validate registration data and return a list of clear error messages
     * @param {Object} input - User input
     * @param {number} captchaAnswer - User CAPTCHA answer
     * @param {number} captchaExpected - Expected CAPTCHA answer
     * @returns {Array<string>} Validation errors
     */
    validateRegistrationData(input, captchaAnswer, captchaExpected) {
        const errors = [];

        if (!input.fullName || input.fullName.trim().length < 2) {
            errors.push('Full name must be at least 2 characters long.');
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!input.email || !emailRegex.test(input.email)) {
            errors.push('Please enter a valid email address.');
        }

        const existingUser = this.getUsers().find(
            user => user.email.toLowerCase() === String(input.email || '').toLowerCase()
        );
        if (existingUser) {
            errors.push('An account with this email already exists.');
        }

        const passwordStrength = this.getPasswordStrength(input.password || '');
        if (!passwordStrength.isValid) {
            errors.push('Password must be at least 10 characters and include upper, lower, number, and symbol.');
        }

        if (input.password !== input.confirmPassword) {
            errors.push('Password and confirm password do not match.');
        }

        if (Number(captchaAnswer) !== Number(captchaExpected)) {
            errors.push('CAPTCHA verification failed. Please solve the challenge correctly.');
        }

        return errors;
    }

    /**
     * Return password strength details
     * @param {string} password - Plain text password
     * @returns {{score: number, label: string, isValid: boolean}}
     */
    getPasswordStrength(password) {
        let score = 0;
        if (password.length >= 10) score += 1;
        if (/[a-z]/.test(password)) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;

        const labels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong', 'Very Strong'];
        return {
            score,
            label: labels[score],
            isValid: score >= 5
        };
    }

    /**
     * Hash password before storing it
     * @param {string} password - Plain text password
     * @returns {Promise<string>} SHA-256 hash
     */
    async hashPassword(password) {
        const encoder = new TextEncoder();
        const data = encoder.encode(password);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const bytes = Array.from(new Uint8Array(hashBuffer));
        return bytes.map(byte => byte.toString(16).padStart(2, '0')).join('');
    }

    /**
     * Register a user and send a verification email
     * @param {Object} input - Registration form input
     * @param {number} captchaAnswer - User CAPTCHA answer
     * @param {number} captchaExpected - Expected CAPTCHA answer
     * @returns {Promise<{user: Object, verificationToken: string}>}
     */
    async registerUser(input, captchaAnswer, captchaExpected) {
        const errors = this.validateRegistrationData(input, captchaAnswer, captchaExpected);
        if (errors.length) {
            this.logActivity('REGISTRATION_FAILED', {
                email: input.email,
                errors
            });
            throw new Error(errors.join(' | '));
        }

        const users = this.getUsers();
        const now = new Date().toISOString();
        const userId = users.length ? Math.max(...users.map(user => user.id)) + 1 : 1;
        const passwordHash = await this.hashPassword(input.password);
        const verificationToken = this.createToken(this.verificationTokenPrefix, input.email);

        const userRecord = {
            id: userId,
            fullName: input.fullName.trim(),
            email: input.email.trim().toLowerCase(),
            phone: (input.phone || '').trim(),
            passwordHash,
            isEmailVerified: false,
            verificationToken,
            resetToken: null,
            resetTokenExpiry: null,
            createdAt: now,
            updatedAt: now
        };

        users.push(userRecord);
        this.saveUsers(users);

        this.sendEmail({
            to: userRecord.email,
            subject: 'Verify your account',
            body: `Welcome ${userRecord.fullName}! Use verification token: ${verificationToken}`,
            type: 'verification'
        });

        this.sendEmail({
            to: userRecord.email,
            subject: 'Registration received',
            body: 'Your registration was successful. Please verify your email to activate your account.',
            type: 'confirmation'
        });

        this.logActivity('REGISTRATION_SUCCESS', {
            userId,
            email: userRecord.email
        });

        return {
            user: this.publicUser(userRecord),
            verificationToken
        };
    }

    /**
     * Verify email token and send confirmation email
     * @param {string} token - Verification token
     * @returns {Object} Updated user data
     */
    verifyEmail(token) {
        const users = this.getUsers();
        const index = users.findIndex(user => user.verificationToken === token);
        if (index === -1) {
            this.logActivity('EMAIL_VERIFICATION_FAILED', { token });
            throw new Error('Invalid verification token.');
        }

        users[index].isEmailVerified = true;
        users[index].verificationToken = null;
        users[index].updatedAt = new Date().toISOString();
        this.saveUsers(users);

        this.sendEmail({
            to: users[index].email,
            subject: 'Registration confirmed',
            body: `Your account is now active. You can access all features.`,
            type: 'confirmation'
        });

        this.logActivity('EMAIL_VERIFIED', {
            userId: users[index].id,
            email: users[index].email
        });

        return this.publicUser(users[index]);
    }

    /**
     * Send reset token to email for forgotten password flow
     * @param {string} email - Account email
     * @returns {string} Reset token
     */
    requestPasswordReset(email) {
        const users = this.getUsers();
        const normalizedEmail = String(email || '').toLowerCase().trim();
        const index = users.findIndex(user => user.email === normalizedEmail);
        if (index === -1) {
            this.logActivity('PASSWORD_RESET_REQUEST_FAILED', { email: normalizedEmail });
            throw new Error('No account found with that email.');
        }

        const token = this.createToken(this.resetTokenPrefix, normalizedEmail);
        const expiry = Date.now() + 15 * 60 * 1000;
        users[index].resetToken = token;
        users[index].resetTokenExpiry = expiry;
        users[index].updatedAt = new Date().toISOString();
        this.saveUsers(users);

        this.sendEmail({
            to: normalizedEmail,
            subject: 'Password reset request',
            body: `Use reset token: ${token}. This token expires in 15 minutes.`,
            type: 'password_reset'
        });

        this.logActivity('PASSWORD_RESET_REQUESTED', {
            userId: users[index].id,
            email: normalizedEmail
        });

        return token;
    }

    /**
     * Complete password reset using reset token
     * @param {string} token - Reset token
     * @param {string} newPassword - New plain-text password
     * @returns {Promise<Object>} Updated user data
     */
    async resetPassword(token, newPassword) {
        const users = this.getUsers();
        const index = users.findIndex(user => user.resetToken === token);
        if (index === -1) {
            this.logActivity('PASSWORD_RESET_FAILED', { token });
            throw new Error('Invalid reset token.');
        }

        if (!users[index].resetTokenExpiry || Date.now() > users[index].resetTokenExpiry) {
            this.logActivity('PASSWORD_RESET_FAILED', {
                userId: users[index].id,
                reason: 'expired_token'
            });
            throw new Error('Reset token has expired.');
        }

        const strength = this.getPasswordStrength(newPassword);
        if (!strength.isValid) {
            throw new Error('New password does not meet strength requirements.');
        }

        users[index].passwordHash = await this.hashPassword(newPassword);
        users[index].resetToken = null;
        users[index].resetTokenExpiry = null;
        users[index].updatedAt = new Date().toISOString();
        this.saveUsers(users);

        this.logActivity('PASSWORD_RESET_COMPLETED', {
            userId: users[index].id,
            email: users[index].email
        });

        return this.publicUser(users[index]);
    }

    /**
     * Update registration info for an existing user
     * @param {number} userId - User identifier
     * @param {Object} updates - Fields to update
     * @returns {Object} Updated user data
     */
    updateRegistrationInfo(userId, updates) {
        const users = this.getUsers();
        const index = users.findIndex(user => user.id === Number(userId));
        if (index === -1) {
            throw new Error('User not found.');
        }

        if (updates.email) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(updates.email)) {
                throw new Error('Please enter a valid email address.');
            }
            const emailTaken = users.some(
                user => user.id !== Number(userId) && user.email === updates.email.toLowerCase().trim()
            );
            if (emailTaken) {
                throw new Error('Another account already uses this email address.');
            }
            users[index].email = updates.email.toLowerCase().trim();
            users[index].isEmailVerified = false;
            users[index].verificationToken = this.createToken(this.verificationTokenPrefix, users[index].email);

            this.sendEmail({
                to: users[index].email,
                subject: 'Verify your updated email',
                body: `Use verification token: ${users[index].verificationToken}`,
                type: 'verification'
            });
        }

        if (typeof updates.fullName === 'string' && updates.fullName.trim().length >= 2) {
            users[index].fullName = updates.fullName.trim();
        }

        if (typeof updates.phone === 'string') {
            users[index].phone = updates.phone.trim();
        }

        users[index].updatedAt = new Date().toISOString();
        this.saveUsers(users);

        this.logActivity('REGISTRATION_INFO_UPDATED', {
            userId: users[index].id,
            email: users[index].email
        });

        return this.publicUser(users[index]);
    }

    /**
     * Return all users without sensitive fields
     * @returns {Array<Object>} Public users
     */
    getPublicUsers() {
        return this.getUsers().map(user => this.publicUser(user));
    }

    /**
     * Return registration audit logs
     * @returns {Array<Object>} Log events
     */
    getAuditLogs() {
        return this.readJson(this.auditLogKey, []);
    }

    /**
     * Return sent emails for demo visibility
     * @returns {Array<Object>} Email outbox entries
     */
    getEmailOutbox() {
        return this.readJson(this.emailOutboxKey, []);
    }

    /**
     * Build a simple CAPTCHA challenge
     * @returns {{question: string, answer: number}}
     */
    generateCaptchaChallenge() {
        const a = Math.floor(Math.random() * 9) + 1;
        const b = Math.floor(Math.random() * 9) + 1;
        const operation = Math.random() > 0.5 ? '+' : '-';
        const answer = operation === '+' ? a + b : a - b;
        return {
            question: `${a} ${operation} ${b}`,
            answer
        };
    }

    /**
     * Save audit logs for registration activities
     * @param {string} eventType - Event name
     * @param {Object} details - Event details
     */
    logActivity(eventType, details = {}) {
        const logs = this.getAuditLogs();
        logs.unshift({
            id: this.createToken('log_', eventType),
            eventType,
            details,
            occurredAt: new Date().toISOString()
        });
        this.writeJson(this.auditLogKey, logs.slice(0, 300));
    }

    /**
     * Simulate sending email by storing it in local outbox
     * @param {Object} mail - Mail metadata
     */
    sendEmail(mail) {
        const outbox = this.getEmailOutbox();
        outbox.unshift({
            id: this.createToken('mail_', mail.to),
            ...mail,
            sentAt: new Date().toISOString()
        });
        this.writeJson(this.emailOutboxKey, outbox.slice(0, 100));
    }

    /**
     * Create a unique token
     * @param {string} prefix - Token prefix
     * @param {string} seed - Seed content
     * @returns {string} Unique token
     */
    createToken(prefix, seed = '') {
        const rand = Math.random().toString(36).slice(2, 10);
        const ts = Date.now().toString(36);
        const safeSeed = String(seed).toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 8);
        return `${prefix}${safeSeed}${ts}${rand}`;
    }

    /**
     * Normalize user object for UI
     * @param {Object} user - Raw user object
     * @returns {Object} Safe user object
     */
    publicUser(user) {
        return {
            id: user.id,
            fullName: user.fullName,
            email: user.email,
            phone: user.phone,
            isEmailVerified: user.isEmailVerified,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
        };
    }

    /**
     * Return users from local storage
     * @returns {Array<Object>} Raw users
     */
    getUsers() {
        return this.readJson(this.usersDbKey, []);
    }

    /**
     * Save users to local storage
     * @param {Array<Object>} users - Users list
     */
    saveUsers(users) {
        this.writeJson(this.usersDbKey, users);
    }

    /**
     * Read JSON from local storage
     * @param {string} key - Storage key
     * @param {any} fallback - Fallback when missing/invalid
     * @returns {any} Parsed value
     */
    readJson(key, fallback) {
        try {
            const raw = localStorage.getItem(key);
            return raw ? JSON.parse(raw) : fallback;
        } catch {
            return fallback;
        }
    }

    /**
     * Write JSON to local storage
     * @param {string} key - Storage key
     * @param {any} value - Serializable value
     */
    writeJson(key, value) {
        localStorage.setItem(key, JSON.stringify(value));
    }
}

// Create and export API instance
const userAPI = new UserAPI();

// Create and export registration API instance
const registrationAPI = new RegistrationAPI();

// Start simulating real-time updates for demo
userAPI.simulateRealTimeUpdates();

/**
 * Tracks the user's product browsing history using localStorage so that
 * recommendations can be personalized across page loads.
 */
class BrowsingHistoryTracker {
    /**
     * @param {string} storageKey - localStorage key for persistence
     * @param {number} maxItems - Maximum number of history entries to keep
     */
    constructor(storageKey = 'browsing_history', maxItems = 20) {
        this.storageKey = storageKey;
        this.maxItems = maxItems;
    }

    /**
     * Retrieve the full browsing history (most recent first)
     * @returns {Array<number>} Array of product IDs
     */
    getHistory() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch {
            return [];
        }
    }

    /**
     * Record a product view, deduplicating and enforcing max size
     * @param {number} productId - The product that was viewed
     * @returns {Array<number>} Updated history
     */
    addItem(productId) {
        const history = this.getHistory().filter(id => id !== productId);
        history.unshift(productId);
        const trimmed = history.slice(0, this.maxItems);
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(trimmed));
        } catch (e) {
            console.warn('Unable to save browsing history:', e);
        }
        return trimmed;
    }

    /**
     * Clear all browsing history
     */
    clear() {
        localStorage.removeItem(this.storageKey);
    }
}

// Create and export browsing history tracker instance
const browsingHistoryTracker = new BrowsingHistoryTracker();