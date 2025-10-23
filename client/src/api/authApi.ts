import axiosInstance from "./axiosConfig";
import axios from "axios";

export interface User {
    id: string;
    name: string;
    email: string;
    role: 'undergraduate' | 'postgraduate' | 'hod' | 'cse-office' | 'lecturer' | 'admin';
    profilePicture: string;
    availableRoles?: AvailableRole[];
}

export interface AvailableRole {
    userId: string;
    role: string;
    displayName: string;
    indexNumber?: string;
}

export interface RoleSelectionResponse {
    requiresRoleSelection: boolean;
    availableRoles: AvailableRole[];
    email: string;
}

export interface UserProfile extends User {
  displayName?: string; // For lecturers and HOD
    indexNumber?: string; // For students (undergraduate/postgraduate)
    googleId?: string;
    userGroup?: {
        _id: string;
        name: string;
        description?: string;
    };
    firstLogin?: boolean;
    createdAt?: string;
    lastLoginAt?: string;
    lastActivityAt?: string;
    updatedAt?: string;
}

export const verifyGoogleToken = async (id_token: string): Promise<User | RoleSelectionResponse> => {
  try{
    const response = await axiosInstance.post<User | RoleSelectionResponse>('/auth/google-verify', { id_token });
    return response.data;
  }catch(error) {
    console.error('Error verifying Google token:', error);
    throw error;
  }
};

export const selectRole = async (id_token: string, selectedRole: string): Promise<User> => {
  try{
    const response = await axiosInstance.post<User>('/auth/select-role', { id_token, selectedRole });
    return response.data;
  }catch(error) {
    console.error('Error selecting role:', error);
    throw error;
  }
};

export const switchRole = async (newRole: string): Promise<User> => {
  try{
    const response = await axiosInstance.post<User>('/auth/switch-role', { newRole });
    return response.data;
  }catch(error) {
    console.error('Error switching role:', error);
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

export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const response = await axiosInstance.get<User>('/auth/profile');
    return response.data;
  } catch (error) {
    // A 401 response from the backend means the user is not authenticated.
    if (axios.isAxiosError(error) && error.response?.status === 401) {
      return null;
    }
    console.error('Error fetching user profile:', error);
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