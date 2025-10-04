import axios, { type AxiosInstance, type InternalAxiosRequestConfig } from 'axios';
import { AuthUserValidator, type AuthUserModel } from '@/models/auth';

// In-memory storage
let accessToken: string | null = null;
let tokenExpiry: number | null = null;

// Create axios instance with interceptors
const securedRequest: AxiosInstance = axios.create({
    baseURL: '/api/user',
    withCredentials: true, // Important for cookies
});


// Request interceptor to attach access token and refresh 2mins before expiration
securedRequest.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {

        // check if token needs refresh 2mins before expiration
        if (accessToken && tokenExpiry && Date.now() > tokenExpiry - 120000) {
            console.log("THE TOKEN IS LESS THAN 2MINS. REQUESTING FOR NEW TOKEN USING REFRESH TOKEN");

            try {
                await refreshAccessToken();
                console.log("Access token refresh successfully!");
            } catch (error) {
                console.error('Proactive refresh failed:', error);
                // continue with current refresh token that will expire soon
            }
        }

        // attach token if still valid
        if (accessToken && isTokenValid()) {
            config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);


// Response interceptor to handle token refresh
securedRequest.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

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


// authenticate function
export async function authenticate(credentials: AuthUserModel) {
    // Validate the data
    try {
        AuthUserValidator.validate(credentials);

        /// Authentication fetch from api layer logic
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
        console.error("Authentication Validation failed:", error);
        throw error;
    }
}


// Set access token in memory
function setAccessToken(token: string) {
    accessToken = token;
    tokenExpiry = Date.now() + (15 * 60 * 1000); // 15 minutes
}


// Refresh access token using http-only cookie
async function refreshAccessToken(): Promise<void> {
    try {
        const response = await securedRequest.post('/auth/refresh2', {}, {
            withCredentials: true,
        });

        if (response.data.access_token) {
            setAccessToken(response.data.access_token);
        } else {
            throw new Error('No access token in refresh response');
        }
    } catch (error) {
        console.error('Token refresh failed:', error);
        throw error;
    }
}


// Logout function
export function logout() {
    accessToken = null;
    tokenExpiry = null;

    // Redirect to authenticate page
    // window.location.href = '/authenticate';
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