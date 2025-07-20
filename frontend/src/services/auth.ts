import { apiService } from './api';
import { User, LoginForm, ApiResponse } from '../types';

export interface AuthResponse {
  user: User;
  token: string;
}

export const authService = {
  // Login user
  login: async (credentials: LoginForm): Promise<AuthResponse> => {
    const response = await apiService.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  // Register user
  register: async (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }): Promise<AuthResponse> => {
    const response = await apiService.post<AuthResponse>('/auth/register', userData);
    return response.data;
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    const response = await apiService.get<User>('/auth/profile');
    return response.data;
  },

  // Refresh token
  refreshToken: async (token: string): Promise<{ token: string }> => {
    const response = await apiService.post<{ token: string }>('/auth/refresh', { token });
    return response.data;
  },

  // Store auth data in localStorage
  setAuth: (user: User, token: string) => {
    localStorage.setItem('user', JSON.stringify(user));
    localStorage.setItem('token', token);
  },

  // Get auth data from localStorage
  getAuth: (): { user: User | null; token: string | null } => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    return {
      user: user ? JSON.parse(user) : null,
      token: token || null,
    };
  },

  // Clear auth data
  clearAuth: () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    const { token } = authService.getAuth();
    return !!token;
  },
};

export default authService; 