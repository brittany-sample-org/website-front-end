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