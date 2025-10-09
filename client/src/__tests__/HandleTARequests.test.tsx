/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import HandleTARequests from '../pages/lecturer/HandleTARequests';
import axiosInstance from '../api/axiosConfig';

// Mock axios
jest.mock('../api/axiosConfig', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    patch: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  }
}));

const mockedAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

// Mock the HandleTaRequestsCard component
jest.mock('../components/lecturer/HandleTaRequestsCard', () => {
  return function MockHandleTaRequestsCard({
    moduleCode,
    moduleName,
    semester,
    year,
    appliedTAs,
    onAccept,
    onReject,
    processingActions
  }: any) {
    return (
      <div data-testid={`module-card-${moduleCode}`}>
        <h3>{moduleCode} - {moduleName}</h3>
        <p>Semester {semester} {year}</p>
        <div data-testid="applied-tas">
          {appliedTAs.map((ta: any, index: number) => (
            <div key={index} data-testid={`ta-${ta.applicationId}`}>
              <span>{ta.name}</span>
              <span>{ta.status}</span>
              {ta.status === 'pending' && (
                <>
                  <button 
                    onClick={() => onAccept(ta.applicationId, ta.name)}
                    disabled={processingActions.has(ta.applicationId)}
                    data-testid={`accept-${ta.applicationId}`}
                  >
                    Accept
                  </button>
                  <button 
                    onClick={() => onReject(ta.applicationId, ta.name)}
                    disabled={processingActions.has(ta.applicationId)}
                    data-testid={`reject-${ta.applicationId}`}
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };
});

// Mock react-icons
jest.mock('react-icons/fa', () => ({
  FaUserGraduate: () => <div data-testid="fa-user-graduate" />
}));

describe('HandleTARequests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock console.error to avoid noise in tests
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Loading State', () => {
    it('should show loading state initially', () => {
      // Mock a pending promise to keep loading state
      mockedAxios.get.mockReturnValue(new Promise(() => {}));
      
      render(<HandleTARequests />);
      
      expect(screen.getByText('Loading TA applications...')).toBeInTheDocument();
      expect(screen.getByText('Loading TA applications...').previousElementSibling).toHaveClass('animate-spin');
    });

    it('should display loading spinner with correct styling', () => {
      mockedAxios.get.mockReturnValue(new Promise(() => {}));
      
      render(<HandleTARequests />);
      
      const spinner = screen.getByText('Loading TA applications...').previousElementSibling;
      expect(spinner).toHaveClass('animate-spin', 'rounded-full', 'h-12', 'w-12', 'border-b-2', 'border-primary');
    });
  });

  describe('Error State', () => {
    it('should display error message when API call fails', async () => {
      const errorMessage = 'Failed to fetch TA applications';
      mockedAxios.get.mockRejectedValue({
        response: { data: { error: errorMessage } }
      });
      
      render(<HandleTARequests />);
      
      await waitFor(() => {
        expect(screen.getByText('Error Loading Applications')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should display generic error message when no specific error is provided', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));
      
      render(<HandleTARequests />);
      
      await waitFor(() => {
        expect(screen.getByText('Error Loading Applications')).toBeInTheDocument();
        expect(screen.getByText('Failed to fetch TA applications')).toBeInTheDocument();
      });
    });

    it('should have retry button that refetches data', async () => {
      mockedAxios.get
        .mockRejectedValueOnce({ response: { data: { error: 'Initial error' } } })
        .mockResolvedValueOnce({ data: { modules: [] } });
      
      render(<HandleTARequests />);
      
      await waitFor(() => {
        expect(screen.getByText('Try Again')).toBeInTheDocument();
      });
      
      const retryButton = screen.getByText('Try Again');
      fireEvent.click(retryButton);
      
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no modules are returned', async () => {
      mockedAxios.get.mockResolvedValue({ data: { modules: [] } });
      
      render(<HandleTARequests />);
      
      await waitFor(() => {
        expect(screen.getByText('No TA Applications')).toBeInTheDocument();
        expect(screen.getByText('There are no TA applications for your modules at the moment.')).toBeInTheDocument();
        expect(screen.getByTestId('fa-user-graduate')).toBeInTheDocument();
      });
    });
  });

  describe('Successful Data Display', () => {
    const mockModulesData = [
      {
        moduleCode: 'CS1010',
        moduleName: 'Introduction to Computer Science',
        semester: '1',
        year: '2025',
        requiredUndergraduateTACount: 2,
        requiredPostgraduateTACount: 1,
        applications: [
          {
            applicationId: 'app1',
            studentName: 'John Doe',
            status: 'pending',
            indexNumber: '12345',
            role: 'undergraduate'
          },
          {
            applicationId: 'app2',
            studentName: 'Jane Smith',
            status: 'accepted',
            indexNumber: '67890',
            role: 'postgraduate'
          }
        ]
      },
      {
        moduleCode: 'CS2010',
        moduleName: 'Data Structures',
        semester: '2',
        year: '2025',
        requiredUndergraduateTACount: 3,
        requiredPostgraduateTACount: 0,
        applications: [
          {
            applicationId: 'app3',
            studentName: 'Bob Johnson',
            status: 'pending',
            indexNumber: '11111',
            role: 'undergraduate'
          }
        ]
      }
    ];

    it('should display modules with TA applications when data is loaded', async () => {
      mockedAxios.get.mockResolvedValue({ data: { modules: mockModulesData } });
      
      render(<HandleTARequests />);
      
      await waitFor(() => {
        expect(screen.getByText('Handle TA Requests')).toBeInTheDocument();
        expect(screen.getByText('Review and manage TA applications for your modules')).toBeInTheDocument();
      });
      
      // Check if module cards are rendered
      expect(screen.getByTestId('module-card-CS1010')).toBeInTheDocument();
      expect(screen.getByTestId('module-card-CS2010')).toBeInTheDocument();
      
      // Check module details
      expect(screen.getByText('CS1010 - Introduction to Computer Science')).toBeInTheDocument();
      expect(screen.getByText('CS2010 - Data Structures')).toBeInTheDocument();
    });

    it('should pass correct props to HandleTaRequestsCard components', async () => {
      mockedAxios.get.mockResolvedValue({ data: { modules: mockModulesData } });
      
      render(<HandleTARequests />);
      
      await waitFor(() => {
        expect(screen.getByTestId('module-card-CS1010')).toBeInTheDocument();
      });
      
      // Check if TA applications are displayed
      expect(screen.getByTestId('ta-app1')).toBeInTheDocument();
      expect(screen.getByTestId('ta-app2')).toBeInTheDocument();
      expect(screen.getByTestId('ta-app3')).toBeInTheDocument();
    });

    it('should display correct number of modules in grid layout', async () => {
      mockedAxios.get.mockResolvedValue({ data: { modules: mockModulesData } });
      
      render(<HandleTARequests />);
      
      await waitFor(() => {
        const moduleCards = screen.getAllByTestId(/module-card-/);
        expect(moduleCards).toHaveLength(2);
      });
    });
  });

  describe('Confirmation Modal', () => {
    const mockModulesData = [
      {
        moduleCode: 'CS1010',
        moduleName: 'Introduction to Computer Science',
        semester: '1',
        year: '2025',
        requiredUndergraduateTACount: 2,
        requiredPostgraduateTACount: 1,
        applications: [
          {
            applicationId: 'app1',
            studentName: 'John Doe',
            status: 'pending',
            indexNumber: '12345',
            role: 'undergraduate'
          }
        ]
      }
    ];

    beforeEach(() => {
      mockedAxios.get.mockResolvedValue({ data: { modules: mockModulesData } });
    });

    it('should open confirmation modal when accept button is clicked', async () => {
      render(<HandleTARequests />);
      
      await waitFor(() => {
        expect(screen.getByTestId('accept-app1')).toBeInTheDocument();
      });
      
      // Ensure modal is not visible initially
      expect(screen.queryByText('Confirm Acceptance')).not.toBeInTheDocument();
      
      const acceptButton = screen.getByTestId('accept-app1');
      fireEvent.click(acceptButton);
      
      await waitFor(() => {
        expect(screen.getByText('Confirm Acceptance')).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to accept John Doe as a TA\?/)).toBeInTheDocument();
      });
    });

    it('should open confirmation modal when reject button is clicked', async () => {
      render(<HandleTARequests />);
      
      await waitFor(() => {
        expect(screen.getByTestId('reject-app1')).toBeInTheDocument();
      });
      
      // Ensure modal is not visible initially
      expect(screen.queryByText('Confirm Rejection')).not.toBeInTheDocument();
      
      const rejectButton = screen.getByTestId('reject-app1');
      fireEvent.click(rejectButton);
      
      await waitFor(() => {
        expect(screen.getByText('Confirm Rejection')).toBeInTheDocument();
        expect(screen.getByText(/Are you sure you want to reject John Doe's TA application\?/)).toBeInTheDocument();
      });
    });

    it('should close modal when cancel button is clicked', async () => {
      render(<HandleTARequests />);
      
      await waitFor(() => {
        expect(screen.getByTestId('accept-app1')).toBeInTheDocument();
      });
      
      // Open modal
      const acceptButton = screen.getByTestId('accept-app1');
      fireEvent.click(acceptButton);
      
      await waitFor(() => {
        expect(screen.getByText('Confirm Acceptance')).toBeInTheDocument();
      });
      
      // Close modal
      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);
      
      await waitFor(() => {
        expect(screen.queryByText('Confirm Acceptance')).not.toBeInTheDocument();
      });
    });

    it('should show warning message about irreversible action', async () => {
      render(<HandleTARequests />);
      
      await waitFor(() => {
        expect(screen.getByTestId('accept-app1')).toBeInTheDocument();
      });
      
      const acceptButton = screen.getByTestId('accept-app1');
      fireEvent.click(acceptButton);
      
      await waitFor(() => {
        expect(screen.getByText('This action cannot be undone')).toBeInTheDocument();
      });
    });
  });

  describe('API Integration', () => {
    it('should call correct API endpoint on component mount', () => {
      mockedAxios.get.mockResolvedValue({ data: { modules: [] } });
      
      render(<HandleTARequests />);
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/lecturer/handle-requests');
    });

    it('should call accept API when confirmation is submitted', async () => {
      const mockModulesData = [
        {
          moduleCode: 'CS1010',
          moduleName: 'Introduction to Computer Science',
          semester: '1',
          year: '2025',
          requiredUndergraduateTACount: 2,
          requiredPostgraduateTACount: 1,
          applications: [
            {
              applicationId: 'app1',
              studentName: 'John Doe',
              status: 'pending',
              indexNumber: '12345',
              role: 'undergraduate'
            }
          ]
        }
      ];

      mockedAxios.get.mockResolvedValue({ data: { modules: mockModulesData } });
      mockedAxios.patch.mockResolvedValue({ data: { success: true } });
      
      render(<HandleTARequests />);
      
      await waitFor(() => {
        expect(screen.getByTestId('accept-app1')).toBeInTheDocument();
      });
      
      // Open modal and confirm
      const acceptButton = screen.getByTestId('accept-app1');
      fireEvent.click(acceptButton);
      
      await waitFor(() => {
        expect(screen.getByText('Confirm Acceptance')).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(mockedAxios.patch).toHaveBeenCalledWith('/lecturer/applications/app1/accept');
      });
    });

    it('should call reject API when rejection is confirmed', async () => {
      const mockModulesData = [
        {
          moduleCode: 'CS1010',
          moduleName: 'Introduction to Computer Science',
          semester: '1',
          year: '2025',
          requiredUndergraduateTACount: 2,
          requiredPostgraduateTACount: 1,
          applications: [
            {
              applicationId: 'app1',
              studentName: 'John Doe',
              status: 'pending',
              indexNumber: '12345',
              role: 'undergraduate'
            }
          ]
        }
      ];

      mockedAxios.get.mockResolvedValue({ data: { modules: mockModulesData } });
      mockedAxios.patch.mockResolvedValue({ data: { success: true } });
      
      render(<HandleTARequests />);
      
      await waitFor(() => {
        expect(screen.getByTestId('reject-app1')).toBeInTheDocument();
      });
      
      // Open modal and confirm
      const rejectButton = screen.getByTestId('reject-app1');
      fireEvent.click(rejectButton);
      
      await waitFor(() => {
        expect(screen.getByText('Confirm Rejection')).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(mockedAxios.patch).toHaveBeenCalledWith('/lecturer/applications/app1/reject');
      });
    });

    it('should refetch data after successful action', async () => {
      const mockModulesData = [
        {
          moduleCode: 'CS1010',
          moduleName: 'Introduction to Computer Science',
          semester: '1',
          year: '2025',
          requiredUndergraduateTACount: 2,
          requiredPostgraduateTACount: 1,
          applications: [
            {
              applicationId: 'app1',
              studentName: 'John Doe',
              status: 'pending',
              indexNumber: '12345',
              role: 'undergraduate'
            }
          ]
        }
      ];

      mockedAxios.get.mockResolvedValue({ data: { modules: mockModulesData } });
      mockedAxios.patch.mockResolvedValue({ data: { success: true } });
      
      render(<HandleTARequests />);
      
      await waitFor(() => {
        expect(screen.getByTestId('accept-app1')).toBeInTheDocument();
      });
      
      // Open modal and confirm
      const acceptButton = screen.getByTestId('accept-app1');
      fireEvent.click(acceptButton);
      
      await waitFor(() => {
        expect(screen.getByText('Confirm Acceptance')).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(2); // Initial load + refetch
      });
    });
  });

  describe('Error Handling in Actions', () => {
    it('should show alert when accept action fails', async () => {
      const mockModulesData = [
        {
          moduleCode: 'CS1010',
          moduleName: 'Introduction to Computer Science',
          semester: '1',
          year: '2025',
          requiredUndergraduateTACount: 2,
          requiredPostgraduateTACount: 1,
          applications: [
            {
              applicationId: 'app1',
              studentName: 'John Doe',
              status: 'pending',
              indexNumber: '12345',
              role: 'undergraduate'
            }
          ]
        }
      ];

      mockedAxios.get.mockResolvedValue({ data: { modules: mockModulesData } });
      mockedAxios.patch.mockRejectedValue({
        response: { data: { error: 'Server error' } }
      });
      
      // Mock window.alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(<HandleTARequests />);
      
      await waitFor(() => {
        expect(screen.getByTestId('accept-app1')).toBeInTheDocument();
      });
      
      // Open modal and confirm
      const acceptButton = screen.getByTestId('accept-app1');
      fireEvent.click(acceptButton);
      
      await waitFor(() => {
        expect(screen.getByText('Confirm Acceptance')).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to accept John Doe: Server error');
      });
      
      alertSpy.mockRestore();
    });

    it('should show alert when reject action fails', async () => {
      const mockModulesData = [
        {
          moduleCode: 'CS1010',
          moduleName: 'Introduction to Computer Science',
          semester: '1',
          year: '2025',
          requiredUndergraduateTACount: 2,
          requiredPostgraduateTACount: 1,
          applications: [
            {
              applicationId: 'app1',
              studentName: 'John Doe',
              status: 'pending',
              indexNumber: '12345',
              role: 'undergraduate'
            }
          ]
        }
      ];

      mockedAxios.get.mockResolvedValue({ data: { modules: mockModulesData } });
      mockedAxios.patch.mockRejectedValue({
        response: { data: { error: 'Network error' } }
      });
      
      // Mock window.alert
      const alertSpy = jest.spyOn(window, 'alert').mockImplementation(() => {});
      
      render(<HandleTARequests />);
      
      await waitFor(() => {
        expect(screen.getByTestId('reject-app1')).toBeInTheDocument();
      });
      
      // Open modal and confirm
      const rejectButton = screen.getByTestId('reject-app1');
      fireEvent.click(rejectButton);
      
      await waitFor(() => {
        expect(screen.getByText('Confirm Rejection')).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);
      
      await waitFor(() => {
        expect(alertSpy).toHaveBeenCalledWith('Failed to reject John Doe: Network error');
      });
      
      alertSpy.mockRestore();
    });
  });

  describe('Processing States', () => {
    it('should show processing state during API call', async () => {
      const mockModulesData = [
        {
          moduleCode: 'CS1010',
          moduleName: 'Introduction to Computer Science',
          semester: '1',
          year: '2025',
          requiredUndergraduateTACount: 2,
          requiredPostgraduateTACount: 1,
          applications: [
            {
              applicationId: 'app1',
              studentName: 'John Doe',
              status: 'pending',
              indexNumber: '12345',
              role: 'undergraduate'
            }
          ]
        }
      ];

      mockedAxios.get.mockResolvedValue({ data: { modules: mockModulesData } });
      
      // Create a promise that we can control
      let resolvePatch: (value: any) => void;
      const patchPromise = new Promise((resolve) => {
        resolvePatch = resolve;
      });
      mockedAxios.patch.mockReturnValue(patchPromise);
      
      render(<HandleTARequests />);
      
      await waitFor(() => {
        expect(screen.getByTestId('accept-app1')).toBeInTheDocument();
      });
      
      // Open modal and confirm
      const acceptButton = screen.getByTestId('accept-app1');
      fireEvent.click(acceptButton);
      
      await waitFor(() => {
        expect(screen.getByText('Confirm Acceptance')).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);
      
      // Check that processing state is shown
      await waitFor(() => {
        expect(screen.getByText('Processing...')).toBeInTheDocument();
      });
      
      // Resolve the promise
      resolvePatch!({ data: { success: true } });
      
      await waitFor(() => {
        expect(screen.queryByText('Processing...')).not.toBeInTheDocument();
      });
    });

    it('should disable confirm button during processing', async () => {
      const mockModulesData = [
        {
          moduleCode: 'CS1010',
          moduleName: 'Introduction to Computer Science',
          semester: '1',
          year: '2025',
          requiredUndergraduateTACount: 2,
          requiredPostgraduateTACount: 1,
          applications: [
            {
              applicationId: 'app1',
              studentName: 'John Doe',
              status: 'pending',
              indexNumber: '12345',
              role: 'undergraduate'
            }
          ]
        }
      ];

      mockedAxios.get.mockResolvedValue({ data: { modules: mockModulesData } });
      
      // Create a promise that we can control
      let resolvePatch: (value: any) => void;
      const patchPromise = new Promise((resolve) => {
        resolvePatch = resolve;
      });
      mockedAxios.patch.mockReturnValue(patchPromise);
      
      render(<HandleTARequests />);
      
      await waitFor(() => {
        expect(screen.getByTestId('accept-app1')).toBeInTheDocument();
      });
      
      // Open modal and confirm
      const acceptButton = screen.getByTestId('accept-app1');
      fireEvent.click(acceptButton);
      
      await waitFor(() => {
        expect(screen.getByText('Confirm Acceptance')).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByText('Confirm');
      fireEvent.click(confirmButton);
      
      // Check that button is disabled during processing
      await waitFor(() => {
        const processingButton = screen.getByText('Processing...');
        expect(processingButton).toBeDisabled();
      });
      
      // Resolve the promise
      resolvePatch!({ data: { success: true } });
    });
  });

  describe('Data Mapping', () => {
    it('should correctly map API response to component state', async () => {
      const apiResponse = {
        modules: [
          {
            moduleCode: 'CS1010',
            moduleName: 'Introduction to Computer Science',
            semester: '1',
            year: '2025',
            requiredUndergraduateTACount: 2,
            requiredPostgraduateTACount: 1,
            applications: [
              {
                applicationId: 'app1',
                studentName: 'John Doe',
                status: 'pending',
                indexNumber: '12345',
                role: 'undergraduate'
              }
            ]
          }
        ]
      };

      mockedAxios.get.mockResolvedValue({ data: apiResponse });
      
      render(<HandleTARequests />);
      
      await waitFor(() => {
        expect(screen.getByTestId('module-card-CS1010')).toBeInTheDocument();
      });
      
      // Verify the data is correctly passed to the card component
      expect(screen.getByText('CS1010 - Introduction to Computer Science')).toBeInTheDocument();
      expect(screen.getByText('Semester 1 2025')).toBeInTheDocument();
      expect(screen.getByTestId('ta-app1')).toBeInTheDocument();
    });

    it('should handle missing optional fields gracefully', async () => {
      const apiResponse = {
        modules: [
          {
            moduleCode: 'CS1010',
            moduleName: 'Introduction to Computer Science',
            semester: '1',
            year: '2025',
            // Missing requiredUndergraduateTACount and requiredPostgraduateTACount
            applications: []
          }
        ]
      };

      mockedAxios.get.mockResolvedValue({ data: apiResponse });
      
      render(<HandleTARequests />);
      
      await waitFor(() => {
        expect(screen.getByTestId('module-card-CS1010')).toBeInTheDocument();
      });
      
      // Should not crash and should display the module
      expect(screen.getByText('CS1010 - Introduction to Computer Science')).toBeInTheDocument();
    });
  });
});
