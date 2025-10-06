import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { AuthUserValidator, type AuthUserModel } from '@/models/auth';

// In-memory storage
let accessToken: string | null = null;
let tokenExpiry: number | null = null;
let isRefreshing = false;
let refreshPromise: Promise<void> | null = null; // Store the refresh promise

// Create axios instance with interceptors
const securedRequest: AxiosInstance = axios.create({
    baseURL: '/api',
    withCredentials: true,
});


// Request interceptor to attach access token and refresh 2mins before expiration
securedRequest.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {

        // Skip token refresh logic for refresh endpoint itself
        if (config.url?.includes('/user/auth/refresh2')) {
            return config;
        }

        // Check if token needs refresh 2mins before expiration
        if (accessToken && tokenExpiry && Date.now() > tokenExpiry - 120000 && !isRefreshing) {
            console.log("THE TOKEN IS LESS THAN 2MINS. REQUESTING FOR NEW TOKEN USING REFRESH TOKEN.");

            try {
                await refreshAccessToken();
                console.log("Access token refreshed successfully!");
            } catch (error) {
                console.error('Proactive refresh failed:', error);
                // Continue with current token
            }
        }

        // Attach token if still valid
        if (accessToken && isTokenValid()) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);


// Response interceptor to handle 401 errors
securedRequest.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Skip retry logic for refresh endpoint to prevent infinite loops
        if (originalRequest.url?.includes('/user/auth/refresh2')) {
            return Promise.reject(error);
        }

        if (error.response?.status === 401 && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                await refreshAccessToken();
                // Retry the original request with new token
                if (accessToken) {
                    originalRequest.headers.Authorization = `Bearer ${accessToken}`;
                }
                return securedRequest(originalRequest);
            } catch (refreshError) {
                // Clear tokens on refresh failure
                accessToken = null;
                tokenExpiry = null;
                return Promise.reject(refreshError);
            }
        }

        return Promise.reject(error);
    }
);


// Check if token is still valid (with 2min buffer)
function isTokenValid(): boolean {
    return tokenExpiry ? Date.now() < tokenExpiry - 120000 : false;
}


// Authenticate function
export async function authenticate(credentials: AuthUserModel) {
    try {
        // Validate the data
        AuthUserValidator.validate(credentials);

        const formData = new URLSearchParams();
        formData.append('username', credentials.username);
        formData.append('password', credentials.password);

        const response = await axios.post('/api/user/auth/token', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            withCredentials: true,
        });

        if (response.data.access_token) {
            setAccessToken(response.data.access_token);
        }

        return response.data;
    } catch (error) {
        console.error("Authentication failed:", error);
        throw error;
    }
}


// Set access token in memory
function setAccessToken(token: string) {
    accessToken = token;
    tokenExpiry = Date.now() + (15 * 60 * 1000); // 15 minutes
}


// Refresh access token using http-only cookie
export async function refreshAccessToken(): Promise<void> {
    // If already refreshing, return the existing promise
    if (isRefreshing && refreshPromise) {
        console.log('Refresh already in progress, waiting...');
        return refreshPromise;
    }

    isRefreshing = true;

    // Create and store the refresh promise
    refreshPromise = (async () => {
        try {
            const response = await axios.post('/api/user/auth/refresh2', {}, {
                withCredentials: true,
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (response.data.access_token) {
                setAccessToken(response.data.access_token);
                console.log('Token refresh successful, new token stored');
            } else {
                throw new Error('No access token in refresh response');
            }
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const errorDetail = error.response?.data?.detail || error.message;
                console.error('Token refresh failed:', {
                    status: error.response?.status,
                    detail: errorDetail,
                });
            } else {
                console.error('Token refresh failed:', error);
            }
            // Clear tokens on failure
            accessToken = null;
            tokenExpiry = null;
            throw error;
        } finally {
            isRefreshing = false;
            refreshPromise = null;
        }
    })();

    return refreshPromise;
}


// Request for access token if cookie still available (used on page reload)
export async function reinitializeAuth(): Promise<boolean> {
    try {
        // If no access token (e.g., after page reload), try to get one using cookie
        if (accessToken === null) {
            console.log('No access token found, attempting to reinitialize from cookie...');
            await refreshAccessToken();
            return true;
        }

        // Token already exists in memory
        console.log('Access token already in memory');
        return true;
    } catch (error) {
        console.log("No valid session found.");
        throw error;
    }
}


// Sign-out function
export async function signOut(): Promise<boolean> {
    try {
        const response = await securedRequest.post("/user/sign-out");

        if (response.status === 200) {
            console.log("Signing out...");
            accessToken = null;
            tokenExpiry = null;
            return true;
        }

        return false;
    } catch (error) {
        console.error("Error during sign-out:", error);
        throw error;
    }
}

// Get current access token
export function getAccessToken(): string | null {
    return isTokenValid() ? accessToken : null;
}


// Check if user is authenticated
export function isAuthenticated(): boolean {
    return isTokenValid();
}


export default securedRequest;