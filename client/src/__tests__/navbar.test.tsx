// Polyfill for TextEncoder/TextDecoder required by React Router
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '../components/common/Navbar';
import { AuthProvider } from '../contexts/AuthContext';
import { getCurrentUser, logout as apiLogout } from '../api/authApi';

// Mock the authApi
jest.mock('../api/authApi', () => ({
  getCurrentUser: jest.fn(),
  logout: jest.fn(),
  verifyGoogleToken: jest.fn(),
}));

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<typeof getCurrentUser>;
const mockApiLogout = apiLogout as jest.MockedFunction<typeof apiLogout>;

// Mock user data
const mockAdminUser = {
  id: '1',
  name: 'John Admin',
  email: 'admin@university.edu',
  role: 'admin' as const,
  profilePicture: 'admin-profile.jpg'
};

const mockStudentUser = {
  id: '2',
  name: 'Jane Student',
  email: 'student@university.edu',
  role: 'undergraduate' as const,
  profilePicture: 'student-profile.jpg'
};

const mockLecturerUser = {
  id: '3',
  name: 'Dr. Smith',
  email: 'smith@university.edu',
  role: 'lecturer' as const,
  profilePicture: 'lecturer-profile.jpg'
};

// Test wrapper with AuthProvider and Router
const TestWrapper: React.FC<{ children: React.ReactNode; route?: string }> = ({ 
  children, 
  route = '/' 
}) => (
  <MemoryRouter initialEntries={[route]}>
    <AuthProvider>
      {children}
    </AuthProvider>
  </MemoryRouter>
);

describe('Navbar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders navbar with logo and home link', async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    
    render(
      <TestWrapper>
        <Navbar ref={null} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByAltText('CSE Logo')).toBeInTheDocument();
      expect(screen.getByText('TA Appointment System')).toBeInTheDocument();
      expect(screen.getByText('Home')).toBeInTheDocument();
    });
  });

  it('shows login button when user is not authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    
    render(
      <TestWrapper>
        <Navbar ref={null} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument();
    });
  });

  it('displays user information and profile dropdown when authenticated', async () => {
    mockGetCurrentUser.mockResolvedValue(mockStudentUser);
    
    render(
      <TestWrapper>
        <Navbar ref={null} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getAllByText('Jane Student')).toHaveLength(2); // Appears in navbar and dropdown
      expect(screen.getAllByText('student@university.edu')).toHaveLength(2); // Appears in navbar and dropdown
      expect(screen.getByAltText('User Profile')).toBeInTheDocument();
    });
  });

  it('shows role-specific navigation links for admin user', async () => {
    mockGetCurrentUser.mockResolvedValue(mockAdminUser);
    
    render(
      <TestWrapper>
        <Navbar ref={null} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Manage Users')).toBeInTheDocument();
    });
  });

  it('shows role-specific navigation links for undergraduate user', async () => {
    mockGetCurrentUser.mockResolvedValue(mockStudentUser);
    
    render(
      <TestWrapper>
        <Navbar ref={null} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('Available Positions')).toBeInTheDocument();
      expect(screen.getByText('Applied Positions')).toBeInTheDocument();
      expect(screen.getByText('Accepted Positions')).toBeInTheDocument();
    });
  });

  it('shows role-specific navigation links for lecturer user', async () => {
    mockGetCurrentUser.mockResolvedValue(mockLecturerUser);
    
    render(
      <TestWrapper>
        <Navbar ref={null} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByText('View Module Details')).toBeInTheDocument();
      expect(screen.getByText('Edit Module Details')).toBeInTheDocument();
      expect(screen.getByText('Handle TA Requests')).toBeInTheDocument();
    });
  });

  it('handles logout functionality when logout is clicked', async () => {
    mockGetCurrentUser.mockResolvedValue(mockStudentUser);
    mockApiLogout.mockResolvedValue();
    
    render(
      <TestWrapper>
        <Navbar ref={null} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(screen.getByAltText('User Profile')).toBeInTheDocument();
    });

    // Click on the profile dropdown
    const profileButton = screen.getByRole('button');
    fireEvent.click(profileButton);

    // Wait for dropdown to appear and click logout
    await waitFor(() => {
      const logoutButton = screen.getByText('Logout');
      expect(logoutButton).toBeInTheDocument();
      fireEvent.click(logoutButton);
    });

    // Note: The actual logout behavior is handled by the AuthContext
    // The navbar component itself just calls the logout function
  });

  it('does not render navbar on login page', async () => {
    mockGetCurrentUser.mockResolvedValue(null);
    
    const { container } = render(
      <TestWrapper route="/login">
        <Navbar ref={null} />
      </TestWrapper>
    );

    await waitFor(() => {
      expect(container.firstChild).toBeNull();
    });
  });
});
