import axiosInstance from "./axiosConfig";
import axios from "axios";

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'undergraduate' | 'postgraduate' | 'hod' | 'cse-office' | 'lecturer' | 'admin';
    profilePicture: string;
}

export interface AvailableRole {
    userId: string;
    role: string;
    groupId: string;
    firstLogin: boolean;
}

export interface RoleSelectionResponse {
    requiresRoleSelection: true;
    availableRoles: AvailableRole[];
    email: string;
}

export type AuthResponse = User | RoleSelectionResponse;

export const verifyGoogleToken = async (id_token: string): Promise<AuthResponse> => {
  try{
    const response = await axiosInstance.post<AuthResponse>('/auth/google-verify', { id_token });
    return response.data;
  }catch(error) {
    console.error('Error verifying Google token:', error);
    throw error;
  }
};

export const selectRole = async (userId: string, role: string): Promise<User> => {
  try {
    const response = await axiosInstance.post<User>('/auth/select-role', { userId, role });
    return response.data;
  } catch (error) {
    console.error('Error selecting role:', error);
    throw error;
  }
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
        await axiosInstance.post('/auth/logout');
    } catch (error) {
        console.error('Error during logout:', error);
        throw error;
    }
};