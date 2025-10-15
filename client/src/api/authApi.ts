import axiosInstance from "./axiosConfig";
import axios from "axios";

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'undergraduate' | 'postgraduate' | 'hod' | 'cse-office' | 'lecturer' | 'admin';
    profilePicture: string;
}

interface LoginResponse {
  user: User;
  token: string;
}

export const verifyGoogleToken = async (id_token: string): Promise<User> => {
  try{
    const response = await axiosInstance.post<LoginResponse>('/auth/google-verify', { id_token });
    
    // Store JWT token in localStorage
    if (response.data.token) {
      localStorage.setItem('authToken', response.data.token);
    }
    
    return response.data.user;
  }catch(error) {
    console.error('Error verifying Google token:', error);
    throw error;
  }
};

export const getCurrentUser = async (): Promise<User | null> => {
  // Check if token exists in localStorage
  const token = localStorage.getItem('authToken');
  if (!token) {
    return null;
  }

  try {
    const response = await axiosInstance.get<User | { user: null }>('/auth/current-user');
    // Backend returns { user: null } when not authenticated
    if (response.data && 'user' in response.data && response.data.user === null) {
      // Clear invalid token
      localStorage.removeItem('authToken');
      return null;
    }
    return response.data as User;
  } catch (error) {
    console.error('Error fetching current user:', error);
    // Clear token on error
    localStorage.removeItem('authToken');
    return null;
  }
};


export const logout = async (): Promise<void> => {
    try {
        await axiosInstance.post('/auth/logout');
    } catch (error) {
        console.error('Error during logout:', error);
    } finally {
        // Always remove token from localStorage, even if API call fails
        localStorage.removeItem('authToken');
    }
};