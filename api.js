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

// Create and export API instance
const userAPI = new UserAPI();

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