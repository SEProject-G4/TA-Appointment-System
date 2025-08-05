import axiosInstance from "./axiosConfig";
import axios from "axios";

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'student' | 'teacher' | 'admin';
    profilePicture: string;
}

//Redirect to Google for authentication
export const loginWithGoogle = () => {
    window.location.href = `http://localhost:5000/api/auth/google`;
};

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const response = await axiosInstance.get<User>('/auth/current-user');
    return response.data;
  } catch (error) {
    // A 401 response from the backend means the user is not authenticated.
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return null;
    }
    console.error('Error fetching current user:', error);
    throw error;
  }
};


export const logout = async (): Promise<void> => {
    try {
        await axiosInstance.get('/auth/logout').then(() => {
          window.location.href = '/login';
        });
    } catch (error) {
        console.error('Error during logout:', error);
    }
};