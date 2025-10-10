// Polyfill for TextEncoder/TextDecoder required by React Router
import { TextEncoder, TextDecoder } from 'util';
global.TextEncoder = TextEncoder as any;
global.TextDecoder = TextDecoder as any;

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ModalProvider } from '../contexts/ModalProvider';
import { ToastProvider } from '../contexts/ToastContext';
import RSModuleCard from '../components/admin/RSModuleCard';
import axiosInstance from '../api/axiosConfig';

// Mock axios
jest.mock('../api/axiosConfig', () => ({
  get: jest.fn(),
  put: jest.fn(),
  post: jest.fn(),
  delete: jest.fn(),
}));
const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

// Mock react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock toast context
const mockShowToast = jest.fn();
jest.mock('../contexts/ToastContext', () => ({
  ...jest.requireActual('../contexts/ToastContext'),
  useToast: () => ({ showToast: mockShowToast }),
}));

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <ModalProvider>
      <ToastProvider>
        {children}
      </ToastProvider>
    </ModalProvider>
  </BrowserRouter>
);

describe('RSModuleCard', () => {
  const mockRefreshPage = jest.fn();
  
  const mockModuleData = {
    _id: 'module-123',
    recruitmentSeriesId: 'rs-456',
    moduleCode: 'CS3004',
    moduleName: 'Software Engineering',
    semester: 5,
    moduleStatus: 'initialised',
    coordinators: [
      {
        id: 'coord-1',
        displayName: 'Dr. John Smith',
        email: 'john.smith@university.edu',
        profilePicture: 'profile1.jpg'
      }
    ],
    applicationDueDate: new Date('2024-12-31'),
    documentDueDate: new Date('2025-01-15'),
    requiredTAHours: 10,
    openForUndergraduates: true,
    openForPostgraduates: true,
    undergraduateCounts: {
      required: 5,
      remaining: 2,
      applied: 8,
      reviewed: 6,
      accepted: 3,
      docSubmitted: 2,
      appointed: 1
    },
    postgraduateCounts: {
      required: 3,
      remaining: 1,
      applied: 4,
      reviewed: 3,
      accepted: 2,
      docSubmitted: 1,
      appointed: 1
    },
    requirements: 'Good programming skills required',
    refreshPage: mockRefreshPage
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockedAxios.get.mockClear();
    mockedAxios.put.mockClear();
  });

  it('renders module card with basic information', () => {
    render(
      <TestWrapper>
        <RSModuleCard {...mockModuleData} />
      </TestWrapper>
    );

    // Check module code and name
    expect(screen.getByText(/CS3004 - Software Engineering/)).toBeInTheDocument();
    expect(screen.getByText(/Semester 5/)).toBeInTheDocument();
    
    // Check status
    expect(screen.getByText('Initialised')).toBeInTheDocument();
    
    // Check coordinators section
    expect(screen.getByText('Coordinators')).toBeInTheDocument();
    expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
  });

  it('displays undergraduate and postgraduate TA counts correctly', () => {
    render(
      <TestWrapper>
        <RSModuleCard {...mockModuleData} />
      </TestWrapper>
    );

    // Check undergraduate section
    expect(screen.getByText('Undergraduate TAs')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument(); // required - remaining
    expect(screen.getByText('/5')).toBeInTheDocument(); // total required

    // Check postgraduate section
    expect(screen.getByText('Postgraduate TAs')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument(); // required - remaining
    expect(screen.getByText('/3')).toBeInTheDocument(); // total required

    // Check hours display (appears twice - once for undergrad, once for postgrad)
    expect(screen.getAllByText('10hours/week')).toHaveLength(2);
  });

  it('handles checkbox selection correctly', () => {
    render(
      <TestWrapper>
        <RSModuleCard {...mockModuleData} />
      </TestWrapper>
    );

    const checkbox = screen.getByRole('checkbox');
    expect(checkbox).not.toBeChecked();

    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();
  });

  it('navigates to module details when title is clicked', () => {
    render(
      <TestWrapper>
        <RSModuleCard {...mockModuleData} />
      </TestWrapper>
    );

    const moduleTitle = screen.getByText(/CS3004 - Software Engineering/);
    fireEvent.click(moduleTitle);

    expect(mockNavigate).toHaveBeenCalledWith('/module-details/module-123', {
      state: { moduleData: expect.objectContaining({ _id: 'module-123' }) }
    });
  });

  it('displays correct status styling for different statuses', () => {
    const advertisedModule = { ...mockModuleData, moduleStatus: 'advertised' };
    
    render(
      <TestWrapper>
        <RSModuleCard {...advertisedModule} />
      </TestWrapper>
    );

    const statusElement = screen.getByText('Advertised');
    expect(statusElement).toHaveClass('bg-purple-100', 'text-purple-800');
  });

  it('shows dropdown menu with action options', () => {
    render(
      <TestWrapper>
        <RSModuleCard {...mockModuleData} />
      </TestWrapper>
    );

    // Check if dropdown menu items are present
    expect(screen.getByText('Change deadlines')).toBeInTheDocument();
    expect(screen.getByText('Change hour limits')).toBeInTheDocument();
    expect(screen.getAllByText('Edit')).toHaveLength(2); // One in dropdown, one as action button
    expect(screen.getByText('Make a copy')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('displays appropriate action buttons based on status', () => {
    render(
      <TestWrapper>
        <RSModuleCard {...mockModuleData} />
      </TestWrapper>
    );

    // For initialised status, should show Edit and Notify Coordinators buttons
    const actionButtons = screen.getAllByRole('button');
    const editButton = actionButtons.find(button => button.textContent === 'Edit');
    const notifyButton = actionButtons.find(button => button.textContent === 'Notify Coordinators');
    
    expect(editButton).toBeInTheDocument();
    expect(notifyButton).toBeInTheDocument();
  });

  it('handles module status update correctly', async () => {
    mockedAxios.put.mockResolvedValueOnce({ data: {} });

    render(
      <TestWrapper>
        <RSModuleCard {...mockModuleData} />
      </TestWrapper>
    );

    const actionButtons = screen.getAllByRole('button');
    const notifyButton = actionButtons.find(button => button.textContent === 'Notify Coordinators');
    expect(notifyButton).toBeInTheDocument();
    
    if (notifyButton) {
      fireEvent.click(notifyButton);
    }

    await waitFor(() => {
      expect(mockedAxios.put).toHaveBeenCalledWith('/modules/module-123/change-status', {
        status: 'pending changes'
      });
    });

    expect(mockShowToast).toHaveBeenCalledWith('Module status updated successfully', 'success');
  });

  it('displays no undergraduate TAs message when not open for undergraduates', () => {
    const moduleWithoutUndergrads = {
      ...mockModuleData,
      openForUndergraduates: false
    };

    render(
      <TestWrapper>
        <RSModuleCard {...moduleWithoutUndergrads} />
      </TestWrapper>
    );

    expect(screen.getByText('No Undergraduate TAs required')).toBeInTheDocument();
  });

  it('displays no postgraduate TAs message when not open for postgraduates', () => {
    const moduleWithoutPostgrads = {
      ...mockModuleData,
      openForPostgraduates: false
    };

    render(
      <TestWrapper>
        <RSModuleCard {...moduleWithoutPostgrads} />
      </TestWrapper>
    );

    expect(screen.getByText('No Postgraduate TAs required')).toBeInTheDocument();
  });
});
