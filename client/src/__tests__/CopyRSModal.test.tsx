import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import CopyRSModal from '../components/admin/CopyRSModal';
import { ModalProvider } from '../contexts/ModalProvider';
import axiosInstance from '../api/axiosConfig';

// Mock the dependencies
jest.mock('../api/axiosConfig', () => ({
  get: jest.fn(),
  post: jest.fn(),
  put: jest.fn(),
  delete: jest.fn(),
}));
jest.mock('../contexts/ModalProvider', () => ({
  ModalProvider: ({ children }: { children: React.ReactNode }) => children,
  useModal: () => ({
    closeModal: jest.fn(),
  }),
}));

jest.mock('../components/common/AutoSelect', () => {
  return function MockAutoSelect({ 
    options, 
    onSelect 
  }: { 
    options: any[], 
    onSelect: (option: any) => void,
    selectedOption?: any
  }) {
    return (
      <select 
        data-testid="auto-select" 
        onChange={(e) => {
          const selectedId = e.target.value;
          const selectedOption = options.find(opt => opt.id === selectedId);
          onSelect(selectedOption || null);
        }}
      >
        <option value="">Select option</option>
        {options.map((option) => (
          <option key={option.id} value={option.id}>
            {option.label}
          </option>
        ))}
      </select>
    );
  };
});

jest.mock('../components/common/Loader', () => {
  return function MockLoader() {
    return <div data-testid="loader">Loading...</div>;
  };
});

jest.mock('../components/common/Timeline', () => {
  return function MockTimeline({ events, completedUpto }: { events: any[], completedUpto: number }) {
    return (
      <div data-testid="timeline">
        {events.map((event, index) => (
          <div key={event.id} className={index <= completedUpto ? 'completed' : 'pending'}>
            {event.title}
          </div>
        ))}
      </div>
    );
  };
});

const mockAxios = axiosInstance as jest.Mocked<typeof axiosInstance>;

const mockRecruitmentSeriesData = {
  _id: 'rs123',
  name: 'Test Recruitment Series',
  applicationDueDate: '2024-12-15T23:59:00',
  documentDueDate: '2024-12-20T23:59:00',
  undergradHourLimit: 20,
  postgradHourLimit: 30,
};

const mockModules = [
  { _id: 'mod1', label: 'CS1010 - Introduction to Computer Science' },
  { _id: 'mod2', label: 'CS2040 - Data Structures and Algorithms' },
  { _id: 'mod3', label: 'CS3230 - Design and Analysis of Algorithms' },
];

const mockUndergradGroups = [
  { _id: 'ug1', name: 'CS Year 2', userCount: 50 },
  { _id: 'ug2', name: 'CS Year 3', userCount: 45 },
];

const mockPostgradGroups = [
  { _id: 'pg1', name: 'Masters Students', userCount: 25 },
  { _id: 'pg2', name: 'PhD Students', userCount: 15 },
];

describe('CopyRSModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAxios.get.mockImplementation((url) => {
      if (url.includes('undergraduate')) {
        return Promise.resolve({ status: 200, data: mockUndergradGroups });
      }
      if (url.includes('postgraduate')) {
        return Promise.resolve({ status: 200, data: mockPostgradGroups });
      }
      return Promise.reject(new Error('Unknown endpoint'));
    });
  });

  test('renders modal with correct header and initial form data', async () => {
    render(
      <ModalProvider>
        <CopyRSModal 
          recruitmentSeriesData={mockRecruitmentSeriesData} 
          modules={mockModules} 
        />
      </ModalProvider>
    );

    expect(screen.getByText('Copy Recruitment Series')).toBeInTheDocument();
    expect(screen.getByText('Making a copy using: Test Recruitment Series')).toBeInTheDocument();
    
    // Check if the name field is pre-filled with " - Copy" suffix
    const nameInput = screen.getByDisplayValue('Test Recruitment Series - Copy');
    expect(nameInput).toBeInTheDocument();
    
    // Check timeline is rendered
    expect(screen.getByTestId('timeline')).toBeInTheDocument();
  });

  test('validates required fields on first step', async () => {
    render(
      <ModalProvider>
        <CopyRSModal 
          recruitmentSeriesData={mockRecruitmentSeriesData} 
          modules={mockModules} 
        />
      </ModalProvider>
    );

    // Clear the name field to test validation
    const nameInput = screen.getByDisplayValue('Test Recruitment Series - Copy');
    fireEvent.change(nameInput, { target: { value: '' } });
    
    // Try to go to next step
    const nextButton = screen.getByText('Next');
    expect(nextButton).toBeDisabled();
    
    // Check error message appears
    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument();
    });
  });

  test('handles date validation correctly', async () => {
    render(
      <ModalProvider>
        <CopyRSModal 
          recruitmentSeriesData={mockRecruitmentSeriesData} 
          modules={mockModules} 
        />
      </ModalProvider>
    );

    const applicationDateInput = screen.getByDisplayValue(/2024-12-15/);
    const documentDateInput = screen.getByDisplayValue(/2024-12-20/);
    
    // Set application date after document date (invalid)
    fireEvent.change(applicationDateInput, { target: { value: '2024-12-25T23:59' } });
    
    await waitFor(() => {
      expect(screen.getByText('Application due date must be on or before document submission deadline.')).toBeInTheDocument();
    });
    
    // Fix the dates
    fireEvent.change(applicationDateInput, { target: { value: '2024-12-15T23:59' } });
    fireEvent.change(documentDateInput, { target: { value: '2024-12-20T23:59' } });
  });

  test('fetches and displays user groups on step 2', async () => {
    render(
      <ModalProvider>
        <CopyRSModal 
          recruitmentSeriesData={mockRecruitmentSeriesData} 
          modules={mockModules} 
        />
      </ModalProvider>
    );

    // Navigate to step 2
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Potential TAs - Undergraduates')).toBeInTheDocument();
      expect(screen.getByText('Potential TAs - Postgraduates')).toBeInTheDocument();
    });

    // Check if API calls were made
    expect(mockAxios.get).toHaveBeenCalledWith('/user-management/groups/undergraduate');
    expect(mockAxios.get).toHaveBeenCalledWith('/user-management/groups/postgraduate');
  });

  test('handles user group selection and removal', async () => {
    render(
      <ModalProvider>
        <CopyRSModal 
          recruitmentSeriesData={mockRecruitmentSeriesData} 
          modules={mockModules} 
        />
      </ModalProvider>
    );

    // Navigate to step 2
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Potential TAs - Undergraduates')).toBeInTheDocument();
    });

    // Wait for data to load and find the AutoSelect components
    await waitFor(() => {
      const autoSelects = screen.getAllByTestId('auto-select');
      expect(autoSelects).toHaveLength(2); // One for undergrad, one for postgrad
    });

    // Select an undergraduate group
    const undergradSelect = screen.getAllByTestId('auto-select')[0];
    fireEvent.change(undergradSelect, { target: { value: 'ug1' } });

    // Check if group appears in selected list (would need to verify the UI updates)
    await waitFor(() => {
      // The selected group should appear in the mailing list
      expect(screen.getByText('CS Year 2')).toBeInTheDocument();
      expect(screen.getByText('50 Users')).toBeInTheDocument();
    });
  });

  test('displays modules correctly on step 3', async () => {
    render(
      <ModalProvider>
        <CopyRSModal 
          recruitmentSeriesData={mockRecruitmentSeriesData} 
          modules={mockModules} 
        />
      </ModalProvider>
    );

    // Navigate to step 3
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Choose modules to be included in the Recruitment Round.')).toBeInTheDocument();
      expect(screen.getByText('Selected modules (3)')).toBeInTheDocument();
      
      // Check if all modules are displayed
      expect(screen.getByText('CS1010 - Introduction to Computer Science')).toBeInTheDocument();
      expect(screen.getByText('CS2040 - Data Structures and Algorithms')).toBeInTheDocument();
      expect(screen.getByText('CS3230 - Design and Analysis of Algorithms')).toBeInTheDocument();
    });
  });

  test('handles module removal and addition', async () => {
    render(
      <ModalProvider>
        <CopyRSModal 
          recruitmentSeriesData={mockRecruitmentSeriesData} 
          modules={mockModules} 
        />
      </ModalProvider>
    );

    // Navigate to step 3
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Selected modules (3)')).toBeInTheDocument();
    });

    // Find and click a remove button (MdClose icon)
    const removeButtons = screen.getAllByRole('button');
    const removeButton = removeButtons.find(button => 
      button.querySelector('svg') // Looking for the close icon
    );
    
    if (removeButton) {
      fireEvent.click(removeButton);
      
      await waitFor(() => {
        expect(screen.getByText('Selected modules (2)')).toBeInTheDocument();
        expect(screen.getByText('Removed Modules (1)')).toBeInTheDocument();
      });
    }
  });

  test('handles form submission and shows processing state', async () => {
    jest.useFakeTimers();
    
    render(
      <ModalProvider>
        <CopyRSModal 
          recruitmentSeriesData={mockRecruitmentSeriesData} 
          modules={mockModules} 
        />
      </ModalProvider>
    );

    // Navigate to step 3
    fireEvent.click(screen.getByText('Next'));
    fireEvent.click(screen.getByText('Next'));
    
    await waitFor(() => {
      expect(screen.getByText('Create Recruitment Round')).toBeInTheDocument();
    });

    // Click create button
    fireEvent.click(screen.getByText('Create Recruitment Round'));
    
    // Should show processing state
    await waitFor(() => {
      expect(screen.getByTestId('loader')).toBeInTheDocument();
      expect(screen.getByText('Processing...')).toBeInTheDocument();
    });

    // Fast forward the timer to complete processing
    jest.advanceTimersByTime(3000);
    
    await waitFor(() => {
      expect(screen.getByText('Recruitment Round Created Succesfully!')).toBeInTheDocument();
      expect(screen.getByText('OK')).toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  test('handles API errors gracefully', async () => {
    // Mock API failure
    mockAxios.get.mockRejectedValue(new Error('API Error'));
    
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    render(
      <ModalProvider>
        <CopyRSModal 
          recruitmentSeriesData={mockRecruitmentSeriesData} 
          modules={mockModules} 
        />
      </ModalProvider>
    );

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching undergraduate groups:', expect.any(Error));
      expect(consoleSpy).toHaveBeenCalledWith('Error fetching postgraduate groups:', expect.any(Error));
    });

    consoleSpy.mockRestore();
  });
});
