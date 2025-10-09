/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import ViewModuleDetails from '../pages/lecturer/ViewModuleDetails';
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

// Mock the ViewModuleDetailsCard component
jest.mock('../components/lecturer/ViewModuleDetailsCard', () => {
  return function MockViewModuleDetailsCard({
    module,
    onViewDocuments
  }: any) {
    return (
      <div data-testid={`module-card-${module.moduleCode}`}>
        <h3>{module.moduleCode} - {module.moduleName}</h3>
        <p>Semester {module.semester} {module.year}</p>
        <div data-testid="accepted-tas">
          {module.acceptedTAs.map((ta: any, index: number) => (
            <div key={index} data-testid={`ta-${ta.userId}`}>
              <span>{ta.name}</span>
              <span>{ta.indexNumber}</span>
              {ta.docStatus === 'submitted' && (
                <button 
                  onClick={() => onViewDocuments(ta)}
                  data-testid={`view-docs-${ta.userId}`}
                >
                  View Documents
                </button>
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
  FaTimes: () => <div data-testid="fa-times" />,
  FaUserGraduate: () => <div data-testid="fa-user-graduate" />
}));

describe('ViewModuleDetails', () => {
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
      
      render(<ViewModuleDetails />);
      
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
      expect(spinner).toHaveClass('rounded-full', 'h-12', 'w-12', 'border-b-2', 'border-primary');
    });

    it('should display loading spinner with correct styling', () => {
      mockedAxios.get.mockReturnValue(new Promise(() => {}));
      
      render(<ViewModuleDetails />);
      
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toHaveClass('animate-spin', 'rounded-full', 'h-12', 'w-12', 'border-b-2', 'border-primary');
    });
  });

  describe('Error State', () => {
    it('should display error message when API call fails', async () => {
      const errorMessage = 'Failed to load accepted modules';
      mockedAxios.get.mockRejectedValue({
        response: { data: { error: errorMessage } }
      });
      
      render(<ViewModuleDetails />);
      
      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText(errorMessage)).toBeInTheDocument();
      });
    });

    it('should display generic error message when no specific error is provided', async () => {
      mockedAxios.get.mockRejectedValue(new Error('Network error'));
      
      render(<ViewModuleDetails />);
      
      await waitFor(() => {
        expect(screen.getByText('Error')).toBeInTheDocument();
        expect(screen.getByText('Failed to load accepted modules')).toBeInTheDocument();
      });
    });

    it('should have retry button that refetches data', async () => {
      mockedAxios.get
        .mockRejectedValueOnce({ response: { data: { error: 'Initial error' } } })
        .mockResolvedValueOnce({ data: { modules: [] } });
      
      render(<ViewModuleDetails />);
      
      await waitFor(() => {
        expect(screen.getByText('Try again')).toBeInTheDocument();
      });
      
      const retryButton = screen.getByText('Try again');
      fireEvent.click(retryButton);
      
      await waitFor(() => {
        expect(mockedAxios.get).toHaveBeenCalledTimes(2);
      });
    });
  });

  describe('Successful Data Display', () => {
    const mockModulesData = [
      {
        moduleId: 'mod1',
        moduleCode: 'CS1010',
        moduleName: 'Introduction to Computer Science',
        semester: '1',
        year: '2025',
        requiredTAHours: 40,
        requiredTACount: 2,
        acceptedTAs: [
          {
            userId: 'ta1',
            name: 'John Doe',
            indexNumber: '12345',
            docStatus: 'submitted',
            role: 'undergraduate',
            documents: {
              bankPassbookCopy: { fileUrl: 'https://drive.google.com/file/d/123/view' },
              nicCopy: { fileUrl: 'https://drive.google.com/open?id=456' }
            }
          },
          {
            userId: 'ta2',
            name: 'Jane Smith',
            indexNumber: '67890',
            docStatus: 'pending',
            role: 'postgraduate'
          }
        ]
      },
      {
        moduleId: 'mod2',
        moduleCode: 'CS2010',
        moduleName: 'Data Structures',
        semester: '2',
        year: '2025',
        requiredTAHours: 60,
        requiredTACount: 1,
        acceptedTAs: [
          {
            userId: 'ta3',
            name: 'Bob Johnson',
            indexNumber: '11111',
            docStatus: 'submitted',
            role: 'undergraduate',
            documents: {
              cv: { fileUrl: 'https://drive.google.com/uc?id=789&export=download' }
            }
          }
        ]
      }
    ];

    it('should display modules with accepted TAs when data is loaded', async () => {
      mockedAxios.get.mockResolvedValue({ data: { modules: mockModulesData } });
      
      render(<ViewModuleDetails />);
      
      await waitFor(() => {
        expect(screen.getByText('View Module Details')).toBeInTheDocument();
        expect(screen.getByText('Overview of assigned modules and teaching assistant status')).toBeInTheDocument();
      });
      
      // Check if module cards are rendered
      expect(screen.getByTestId('module-card-CS1010')).toBeInTheDocument();
      expect(screen.getByTestId('module-card-CS2010')).toBeInTheDocument();
      
      // Check module details
      expect(screen.getByText('CS1010 - Introduction to Computer Science')).toBeInTheDocument();
      expect(screen.getByText('CS2010 - Data Structures')).toBeInTheDocument();
    });

    it('should pass correct props to ViewModuleDetailsCard components', async () => {
      mockedAxios.get.mockResolvedValue({ data: { modules: mockModulesData } });
      
      render(<ViewModuleDetails />);
      
      await waitFor(() => {
        expect(screen.getByTestId('module-card-CS1010')).toBeInTheDocument();
      });
      
      // Check if TA applications are displayed
      expect(screen.getByTestId('ta-ta1')).toBeInTheDocument();
      expect(screen.getByTestId('ta-ta2')).toBeInTheDocument();
      expect(screen.getByTestId('ta-ta3')).toBeInTheDocument();
    });

    it('should display correct number of modules in grid layout', async () => {
      mockedAxios.get.mockResolvedValue({ data: { modules: mockModulesData } });
      
      render(<ViewModuleDetails />);
      
      await waitFor(() => {
        const moduleCards = screen.getAllByTestId(/module-card-/);
        expect(moduleCards).toHaveLength(2);
      });
    });

    it('should handle empty modules array', async () => {
      mockedAxios.get.mockResolvedValue({ data: { modules: [] } });
      
      render(<ViewModuleDetails />);
      
      await waitFor(() => {
        expect(screen.getByText('View Module Details')).toBeInTheDocument();
      });
      
      // Should not crash and should display the header
      expect(screen.getByText('Overview of assigned modules and teaching assistant status')).toBeInTheDocument();
    });
  });

  describe('Document Modal', () => {
    const mockModulesData = [
      {
        moduleId: 'mod1',
        moduleCode: 'CS1010',
        moduleName: 'Introduction to Computer Science',
        semester: '1',
        year: '2025',
        requiredTAHours: 40,
        requiredTACount: 2,
        acceptedTAs: [
          {
            userId: 'ta1',
            name: 'John Doe',
            indexNumber: '12345',
            docStatus: 'submitted',
            role: 'undergraduate',
            documents: {
              bankPassbookCopy: { fileUrl: 'https://drive.google.com/file/d/123/view' },
              nicCopy: { fileUrl: 'https://drive.google.com/open?id=456' },
              cv: { fileUrl: 'https://drive.google.com/uc?id=789&export=download' },
              degreeCertificate: { fileUrl: 'https://example.com/cert.pdf' }
            }
          }
        ]
      }
    ];

    beforeEach(() => {
      mockedAxios.get.mockResolvedValue({ data: { modules: mockModulesData } });
    });

    it('should open document modal when view documents button is clicked', async () => {
      render(<ViewModuleDetails />);
      
      await waitFor(() => {
        expect(screen.getByTestId('view-docs-ta1')).toBeInTheDocument();
      });
      
      const viewDocsButton = screen.getByTestId('view-docs-ta1');
      fireEvent.click(viewDocsButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('dialog')).toHaveTextContent('John Doe');
        expect(screen.getByRole('dialog')).toHaveTextContent('12345');
      });
    });

    it('should display all document types in modal', async () => {
      render(<ViewModuleDetails />);
      
      await waitFor(() => {
        expect(screen.getByTestId('view-docs-ta1')).toBeInTheDocument();
      });
      
      const viewDocsButton = screen.getByTestId('view-docs-ta1');
      fireEvent.click(viewDocsButton);
      
      await waitFor(() => {
        expect(screen.getByText('Bank Passbook Copy')).toBeInTheDocument();
        expect(screen.getByText('NIC Copy')).toBeInTheDocument();
        expect(screen.getByText('CV')).toBeInTheDocument();
        expect(screen.getByText('Degree Certificate')).toBeInTheDocument();
      });
    });

    it('should close modal when close button is clicked', async () => {
      render(<ViewModuleDetails />);
      
      await waitFor(() => {
        expect(screen.getByTestId('view-docs-ta1')).toBeInTheDocument();
      });
      
      // Open modal
      const viewDocsButton = screen.getByTestId('view-docs-ta1');
      fireEvent.click(viewDocsButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Close modal
      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should close modal when clicking outside', async () => {
      render(<ViewModuleDetails />);
      
      await waitFor(() => {
        expect(screen.getByTestId('view-docs-ta1')).toBeInTheDocument();
      });
      
      // Open modal
      const viewDocsButton = screen.getByTestId('view-docs-ta1');
      fireEvent.click(viewDocsButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Click outside modal
      const backdrop = document.querySelector('.absolute.inset-0.bg-black\\/40');
      if (backdrop) {
        fireEvent.click(backdrop);
      }
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should not render modal when docModal is not open', async () => {
      render(<ViewModuleDetails />);
      
      await waitFor(() => {
        expect(screen.getByTestId('module-card-CS1010')).toBeInTheDocument();
      });
      
      // Modal should not be visible initially
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });
  });

  describe('Document Rendering', () => {
    const mockModulesData = [
      {
        moduleId: 'mod1',
        moduleCode: 'CS1010',
        moduleName: 'Introduction to Computer Science',
        semester: '1',
        year: '2025',
        requiredTAHours: 40,
        requiredTACount: 2,
        acceptedTAs: [
          {
            userId: 'ta1',
            name: 'John Doe',
            indexNumber: '12345',
            docStatus: 'submitted',
            role: 'undergraduate',
            documents: {
              bankPassbookCopy: { fileUrl: 'https://drive.google.com/file/d/123/view' },
              nicCopy: { fileUrl: 'https://drive.google.com/open?id=456' },
              cv: { fileUrl: 'https://drive.google.com/uc?id=789&export=download' },
              degreeCertificate: { fileUrl: 'https://example.com/cert.pdf' }
            }
          }
        ]
      }
    ];

    beforeEach(() => {
      mockedAxios.get.mockResolvedValue({ data: { modules: mockModulesData } });
    });

    it('should render View and Download buttons for documents with URLs', async () => {
      render(<ViewModuleDetails />);
      
      await waitFor(() => {
        expect(screen.getByTestId('view-docs-ta1')).toBeInTheDocument();
      });
      
      const viewDocsButton = screen.getByTestId('view-docs-ta1');
      fireEvent.click(viewDocsButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Check for View and Download buttons
      const viewButtons = screen.getAllByText('View');
      const downloadButtons = screen.getAllByText('Download');
      
      expect(viewButtons.length).toBeGreaterThan(0);
      expect(downloadButtons.length).toBeGreaterThan(0);
    });

    it('should render "No file uploaded" for documents without URLs', async () => {
      const mockModulesDataNoUrls = [
        {
          moduleId: 'mod1',
          moduleCode: 'CS1010',
          moduleName: 'Introduction to Computer Science',
          semester: '1',
          year: '2025',
          requiredTAHours: 40,
          requiredTACount: 2,
          acceptedTAs: [
            {
              userId: 'ta1',
              name: 'John Doe',
              indexNumber: '12345',
              docStatus: 'submitted',
              role: 'undergraduate',
              documents: {
                bankPassbookCopy: { fileUrl: null },
                nicCopy: { fileUrl: undefined },
                cv: {},
                degreeCertificate: { fileUrl: '' }
              }
            }
          ]
        }
      ];

      mockedAxios.get.mockResolvedValue({ data: { modules: mockModulesDataNoUrls } });
      
      render(<ViewModuleDetails />);
      
      await waitFor(() => {
        expect(screen.getByTestId('view-docs-ta1')).toBeInTheDocument();
      });
      
      const viewDocsButton = screen.getByTestId('view-docs-ta1');
      fireEvent.click(viewDocsButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Check for "No file uploaded" text
      const noFileTexts = screen.getAllByText('No file uploaded');
      expect(noFileTexts.length).toBeGreaterThan(0);
    });

    it('should not render document rows for missing documents', async () => {
      const mockModulesDataMissingDocs = [
        {
          moduleId: 'mod1',
          moduleCode: 'CS1010',
          moduleName: 'Introduction to Computer Science',
          semester: '1',
          year: '2025',
          requiredTAHours: 40,
          requiredTACount: 2,
          acceptedTAs: [
            {
              userId: 'ta1',
              name: 'John Doe',
              indexNumber: '12345',
              docStatus: 'submitted',
              role: 'undergraduate',
              documents: {
                bankPassbookCopy: { fileUrl: 'https://drive.google.com/file/d/123/view' }
                // Missing other documents
              }
            }
          ]
        }
      ];

      mockedAxios.get.mockResolvedValue({ data: { modules: mockModulesDataMissingDocs } });
      
      render(<ViewModuleDetails />);
      
      await waitFor(() => {
        expect(screen.getByTestId('view-docs-ta1')).toBeInTheDocument();
      });
      
      const viewDocsButton = screen.getByTestId('view-docs-ta1');
      fireEvent.click(viewDocsButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Should only show Bank Passbook Copy
      expect(screen.getByText('Bank Passbook Copy')).toBeInTheDocument();
      expect(screen.queryByText('NIC Copy')).not.toBeInTheDocument();
      expect(screen.queryByText('CV')).not.toBeInTheDocument();
      expect(screen.queryByText('Degree Certificate')).not.toBeInTheDocument();
    });
  });

  describe('Google Drive URL Conversion', () => {
    const mockModulesData = [
      {
        moduleId: 'mod1',
        moduleCode: 'CS1010',
        moduleName: 'Introduction to Computer Science',
        semester: '1',
        year: '2025',
        requiredTAHours: 40,
        requiredTACount: 2,
        acceptedTAs: [
          {
            userId: 'ta1',
            name: 'John Doe',
            indexNumber: '12345',
            docStatus: 'submitted',
            role: 'undergraduate',
            documents: {
              bankPassbookCopy: { fileUrl: 'https://drive.google.com/file/d/123456789/view?usp=sharing' },
              nicCopy: { fileUrl: 'https://drive.google.com/open?id=987654321' },
              cv: { fileUrl: 'https://drive.google.com/uc?id=111222333&export=download' },
              degreeCertificate: { fileUrl: 'https://example.com/regular-file.pdf' }
            }
          }
        ]
      }
    ];

    beforeEach(() => {
      mockedAxios.get.mockResolvedValue({ data: { modules: mockModulesData } });
    });

    it('should convert Google Drive URLs to download format', async () => {
      render(<ViewModuleDetails />);
      
      await waitFor(() => {
        expect(screen.getByTestId('view-docs-ta1')).toBeInTheDocument();
      });
      
      const viewDocsButton = screen.getByTestId('view-docs-ta1');
      fireEvent.click(viewDocsButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Check that download links are properly formatted
      const downloadLinks = screen.getAllByText('Download');
      expect(downloadLinks.length).toBeGreaterThan(0);
      
      // Check that the download links have the correct href format
      downloadLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && href.includes('drive.google.com')) {
          expect(href).toMatch(/https:\/\/drive\.google\.com\/uc\?export=download&id=/);
        }
      });
    });

    it('should handle malformed Google Drive URLs gracefully', async () => {
      const mockModulesDataMalformed = [
        {
          moduleId: 'mod1',
          moduleCode: 'CS1010',
          moduleName: 'Introduction to Computer Science',
          semester: '1',
          year: '2025',
          requiredTAHours: 40,
          requiredTACount: 2,
          acceptedTAs: [
            {
              userId: 'ta1',
              name: 'John Doe',
              indexNumber: '12345',
              docStatus: 'submitted',
              role: 'undergraduate',
              documents: {
                bankPassbookCopy: { fileUrl: 'https://drive.google.com/invalid-url' },
                nicCopy: { fileUrl: 'not-a-url' }
              }
            }
          ]
        }
      ];

      mockedAxios.get.mockResolvedValue({ data: { modules: mockModulesDataMalformed } });
      
      render(<ViewModuleDetails />);
      
      await waitFor(() => {
        expect(screen.getByTestId('view-docs-ta1')).toBeInTheDocument();
      });
      
      const viewDocsButton = screen.getByTestId('view-docs-ta1');
      fireEvent.click(viewDocsButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Should not crash and should still render the modal
      expect(screen.getByRole('dialog')).toHaveTextContent('John Doe');
    });
  });

  describe('API Integration', () => {
    it('should call correct API endpoint on component mount', () => {
      mockedAxios.get.mockResolvedValue({ data: { modules: [] } });
      
      render(<ViewModuleDetails />);
      
      expect(mockedAxios.get).toHaveBeenCalledWith('/lecturer/modules/with-ta-requests');
    });

    it('should handle API response with missing modules field', async () => {
      mockedAxios.get.mockResolvedValue({ data: {} });
      
      render(<ViewModuleDetails />);
      
      await waitFor(() => {
        expect(screen.getByText('View Module Details')).toBeInTheDocument();
      });
      
      // Should not crash and should display the header
      expect(screen.getByText('Overview of assigned modules and teaching assistant status')).toBeInTheDocument();
    });
  });

  describe('Component State Management', () => {
    const mockModulesData = [
      {
        moduleId: 'mod1',
        moduleCode: 'CS1010',
        moduleName: 'Introduction to Computer Science',
        semester: '1',
        year: '2025',
        requiredTAHours: 40,
        requiredTACount: 2,
        acceptedTAs: [
          {
            userId: 'ta1',
            name: 'John Doe',
            indexNumber: '12345',
            docStatus: 'submitted',
            role: 'undergraduate',
            documents: {
              bankPassbookCopy: { fileUrl: 'https://drive.google.com/file/d/123/view' }
            }
          }
        ]
      }
    ];

    beforeEach(() => {
      mockedAxios.get.mockResolvedValue({ data: { modules: mockModulesData } });
    });

    it('should manage document modal state correctly', async () => {
      render(<ViewModuleDetails />);
      
      await waitFor(() => {
        expect(screen.getByTestId('view-docs-ta1')).toBeInTheDocument();
      });
      
      // Initially modal should be closed
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      
      // Open modal
      const viewDocsButton = screen.getByTestId('view-docs-ta1');
      fireEvent.click(viewDocsButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
      });
      
      // Close modal
      const closeButton = screen.getByLabelText('Close');
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      });
    });

    it('should pass correct TA data to modal', async () => {
      render(<ViewModuleDetails />);
      
      await waitFor(() => {
        expect(screen.getByTestId('view-docs-ta1')).toBeInTheDocument();
      });
      
      const viewDocsButton = screen.getByTestId('view-docs-ta1');
      fireEvent.click(viewDocsButton);
      
      await waitFor(() => {
        expect(screen.getByRole('dialog')).toBeInTheDocument();
        expect(screen.getByRole('dialog')).toHaveTextContent('John Doe');
        expect(screen.getByRole('dialog')).toHaveTextContent('12345');
      });
    });
  });
});
