import config from '../config';

const API_URL = `${config.apiUrl}/auth`;

// Common fetch options
const fetchOptions = {
    credentials: 'include',
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
    }
};

const parseResponseBody = async (response) => {
    const contentType = response.headers.get('content-type') || '';
    const rawBody = await response.text();

    if (!rawBody) {
        return {};
    }

    if (contentType.includes('application/json')) {
        try {
            return JSON.parse(rawBody);
        } catch (error) {
            throw new Error(`Invalid JSON response from server (status ${response.status})`);
        }
    }

    return {
        message: rawBody
    };
};

export const authService = {
    async googleAuth({ access_token, userInfo }) {
        try {
            console.log('Frontend: Starting Google auth');
            console.log('Frontend: API URL:', `${API_URL}/google`);
            console.log('Frontend: Request data:', { 
                hasToken: !!access_token, 
                email: userInfo.email, 
                name: userInfo.name 
            });
            
            const response = await fetch(`${API_URL}/google`, {
                ...fetchOptions,
                method: 'POST',
                body: JSON.stringify({ 
                    access_token,
                    email: userInfo.email,
                    name: userInfo.name,
                    sub: userInfo.sub
                })
            });

            console.log('Frontend: Response status:', response.status);
            
            const data = await parseResponseBody(response);
            console.log('Frontend: Response data:', data);
            
            if (!response.ok) {
                throw new Error(data.message || 'Google authentication failed');
            }

            if (data.accessToken) {
                localStorage.setItem('accessToken', data.accessToken);
            }

            return data;
        } catch (error) {
            console.error('Google authentication error:', error);
            throw error;
        }
    },
    async login(email, password) {
        try {
            const response = await fetch(`${API_URL}/login`, {
                ...fetchOptions,
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            const data = await parseResponseBody(response);
            if (!response.ok) {
                throw new Error(data.message || `Login failed (status ${response.status})`);
            }
            
            // Store access token
            if (data.accessToken) {
                localStorage.setItem('accessToken', data.accessToken);
            } else {
                throw new Error('No access token received');
            }
            
            return data;
        } catch (error) {
            console.error('Login error:', error);
            throw error;
        }
    },

    async register(username, email, password) {
        try {
            if (!username || !email || !password) {
                throw new Error('All fields are required');
            }

            if (!email.includes('@')) {
                throw new Error('Invalid email format');
            }

            if (password.length < 6) {
                throw new Error('Password must be at least 6 characters long');
            }

            const response = await fetch(`${API_URL}/register`, {
                ...fetchOptions,
                method: 'POST',
                body: JSON.stringify({ username, email, password })
            });

            const data = await parseResponseBody(response);

            if (!response.ok) {
                throw new Error(data.message || data.error || 'Registration failed');
            }

            // Store access token
            if (data.accessToken) {
                localStorage.setItem('accessToken', data.accessToken);
            } else {
                throw new Error('No access token received');
            }
            return data;
        } catch (error) {
            console.error('Registration error:', error);
            // Convert any error to a proper Error object with a message
            throw error instanceof Error ? error : new Error(error?.message || 'Registration failed');
        }
    },

    async logout() {
        const response = await fetch(`${API_URL}/logout`, {
            method: 'POST',
            credentials: 'include'
        });

        // Clear specific localStorage items
        localStorage.removeItem('accessToken');
        localStorage.removeItem('predict-page-state');
        localStorage.removeItem('smartdrop-page-state');
        
        // Clear sessionStorage
        sessionStorage.clear();
        
        // Clear all cookies for this domain
        this.clearAllCookies();
        
        console.log('All authentication data and app state cleared');
        return response.ok;
    },

    // Function to clear all cookies
    clearAllCookies() {
        console.log('Starting cookie cleanup...');
        
        // Get all cookies
        const cookies = document.cookie.split(";");
        console.log('Found cookies:', cookies.length);
        
        // Clear each cookie for the current domain
        cookies.forEach(cookie => {
            const eqPos = cookie.indexOf("=");
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            
            if (name) {
                console.log(`Clearing cookie: ${name}`);
                
                // Clear cookie for current path
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
                
                // Clear cookie for root domain
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname};`;
                
                // Clear cookie for parent domain (in case of subdomains)
                const domain = window.location.hostname;
                const parts = domain.split('.');
                if (parts.length > 1) {
                    const parentDomain = '.' + parts.slice(-2).join('.');
                    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${parentDomain};`;
                }
                
                // Clear cookie for localhost specifically
                if (domain === 'localhost' || domain.includes('127.0.0.1')) {
                    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
                }
                
                // Clear cookie with SameSite and Secure attributes (for modern browsers)
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax;`;
                document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Strict;`;
                
                // For HTTPS sites
                if (window.location.protocol === 'https:') {
                    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; Secure;`;
                    document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; Secure; SameSite=None;`;
                }
            }
        });
        
        // Also explicitly clear known Pulse cookies
        const PulseCookies = ['Pulse_name', 'Pulse_email', 'Pulse_password', 'refreshToken', 'accessToken'];
        PulseCookies.forEach(cookieName => {
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/;`;
            document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; domain=${window.location.hostname};`;
        });
        
        console.log('Cookie cleanup completed');
    },

    async refreshToken() {
        try {
            const response = await fetch(`${API_URL}/refresh`, {
                method: 'POST',
                credentials: 'include'
            });

            const data = await parseResponseBody(response);
            if (!response.ok) {
                throw new Error(data.message);
            }

            localStorage.setItem('accessToken', data.accessToken);
            return data.accessToken;
        } catch (error) {
            console.error('Token refresh failed:', error);
            throw error;
        }
    },

    async getMe() {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                throw new Error('No access token found');
            }

            const response = await fetch(`${API_URL}/me`, {
                ...fetchOptions,
                method: 'GET',
                headers: {
                    ...fetchOptions.headers,
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await parseResponseBody(response);
            if (!response.ok) {
                throw new Error(data.message || 'Failed to get user data');
            }
            return data;
        } catch (error) {
            console.error('GetMe error:', error);
            throw error;
        }
    },

    async updateRole(role) {
        try {
            const token = localStorage.getItem('accessToken');
            if (!token) {
                throw new Error('No access token found');
            }

            const response = await fetch(`${API_URL}/role`, {
                ...fetchOptions,
                method: 'PUT',
                headers: {
                    ...fetchOptions.headers,
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ role })
            });

            const data = await parseResponseBody(response);
            if (!response.ok) {
                throw new Error(data.message || 'Failed to update role');
            }
            return data;
        } catch (error) {
            console.error('Update role error:', error);
            throw error;
        }
    }
};
