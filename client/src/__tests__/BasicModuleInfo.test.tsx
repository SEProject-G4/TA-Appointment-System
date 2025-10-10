import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import BasicModuleInfoTab from '../components/admin/BasicModuleInfoTab';

const mockModuleData = {
  _id: 'module123',
  recruitmentSeriesId: 'rs123',
  moduleCode: 'CS1010',
  moduleName: 'Introduction to Computer Science',
  semester: 1,
  moduleStatus: 'advertised',
  coordinators: [
    {
      id: 'coord1',
      displayName: 'Dr. John Smith',
      email: 'john.smith@university.edu',
      profilePicture: '/path/to/image.jpg'
    },
    {
      id: 'coord2',
      displayName: 'Prof. Jane Doe',
      email: 'jane.doe@university.edu',
      profilePicture: ''
    }
  ],
  applicationDueDate: new Date('2024-12-15T23:59:00'),
  documentDueDate: new Date('2024-12-20T23:59:00'),
  requiredTAHours: 40,
  openForUndergraduates: true,
  openForPostgraduates: true,
  undergraduateCounts: {
    required: 5,
    remaining: 2,
    applied: 8,
    reviewed: 6,
    accepted: 4,
    docSubmitted: 3,
    appointed: 2
  },
  postgraduateCounts: {
    required: 3,
    remaining: 1,
    applied: 4,
    reviewed: 3,
    accepted: 2,
    docSubmitted: 2,
    appointed: 1
  },
  requirements: 'Strong programming background required'
};

describe('BasicModuleInfoTab', () => {
  test('renders basic module information correctly', () => {
    render(<BasicModuleInfoTab moduleData={mockModuleData} />);
    
    // Check module code and name
    expect(screen.getByText('CS1010')).toBeInTheDocument();
    expect(screen.getByText('Introduction to Computer Science')).toBeInTheDocument();
    
    // Check semester
    expect(screen.getByText('1')).toBeInTheDocument();
    
    // Check module ID
    expect(screen.getByText('module123')).toBeInTheDocument();
  });

  test('displays module status with correct styling', () => {
    render(<BasicModuleInfoTab moduleData={mockModuleData} />);
    
    const statusElement = screen.getByText('Advertised');
    expect(statusElement).toBeInTheDocument();
    expect(statusElement).toHaveClass('bg-purple-100', 'text-purple-800');
  });

  test('renders all coordinators with correct information', () => {
    render(<BasicModuleInfoTab moduleData={mockModuleData} />);
    
    // Check first coordinator
    expect(screen.getByText('Dr. John Smith')).toBeInTheDocument();
    expect(screen.getByText('john.smith@university.edu')).toBeInTheDocument();
    
    // Check second coordinator
    expect(screen.getByText('Prof. Jane Doe')).toBeInTheDocument();
    expect(screen.getByText('jane.doe@university.edu')).toBeInTheDocument();
    
    // Check coordinator email links
    const emailLinks = screen.getAllByRole('link');
    expect(emailLinks[0]).toHaveAttribute('href', 'mailto:john.smith@university.edu');
    expect(emailLinks[1]).toHaveAttribute('href', 'mailto:jane.doe@university.edu');
  });

  test('displays due dates in correct format', () => {
    render(<BasicModuleInfoTab moduleData={mockModuleData} />);
    
    // Check that due dates are displayed (exact format may vary based on locale)
    expect(screen.getByText(/Application:/)).toBeInTheDocument();
    expect(screen.getByText(/Document Submission:/)).toBeInTheDocument();
    
    // Check that dates contain expected elements (adjust for actual format)
    expect(screen.getByText(/Dec 15/)).toBeInTheDocument();
    expect(screen.getByText(/Dec 20/)).toBeInTheDocument();
  });

  test('renders progress bars for undergraduate and postgraduate counts', () => {
    render(<BasicModuleInfoTab moduleData={mockModuleData} />);
    
    // Check undergraduate section
    expect(screen.getByText('Undergraduates')).toBeInTheDocument();
    
    // Check postgraduate section
    expect(screen.getByText('Postgraduates')).toBeInTheDocument();
    
    // Check progress bar labels
    expect(screen.getAllByText('Applied so far')).toHaveLength(2);
    expect(screen.getAllByText('Reviewed applications')).toHaveLength(2);
    expect(screen.getAllByText('Approved applications')).toHaveLength(2);
    expect(screen.getAllByText('Document submitted')).toHaveLength(2);
    expect(screen.getAllByText('Appointed')).toHaveLength(2);
  });

  test('displays requirements or default message when none provided', () => {
    // Test with requirements
    render(<BasicModuleInfoTab moduleData={mockModuleData} />);
    expect(screen.getByText('Strong programming background required')).toBeInTheDocument();
    
    // Test without requirements
    const moduleDataWithoutRequirements = {
      ...mockModuleData,
      requirements: ''
    };
    
    render(<BasicModuleInfoTab moduleData={moduleDataWithoutRequirements} />);
    expect(screen.getByText('N/A (No special requirements or notes specified)')).toBeInTheDocument();
  });

  test('handles different module statuses correctly', () => {
    const statusTestCases = [
      { status: 'initialised', expectedClass: 'bg-primary-light/20 text-primary' },
      { status: 'pending changes', expectedClass: 'bg-yellow-100 text-yellow-800' },
      { status: 'changes submitted', expectedClass: 'bg-lime-100 text-lime-800' },
      { status: 'advertised', expectedClass: 'bg-purple-100 text-purple-800' },
      { status: 'full', expectedClass: 'bg-green-100 text-green-800' },
      { status: 'getting-documents', expectedClass: 'bg-pink-100 text-pink-800' },
      { status: 'closed', expectedClass: 'bg-black text-white' },
      { status: 'unknown', expectedClass: 'bg-text-secondary/20 text-text-secondary' }
    ];

    statusTestCases.forEach(({ status, expectedClass }) => {
      const { unmount } = render(
        <BasicModuleInfoTab 
          moduleData={{ ...mockModuleData, moduleStatus: status }} 
        />
      );
      
      const statusElement = screen.getByText(
        status.charAt(0).toUpperCase() + status.slice(1)
      );
      
      expectedClass.split(' ').forEach(className => {
        expect(statusElement).toHaveClass(className);
      });
      
      unmount();
    });
  });

  test('renders coordinator profile pictures with fallback', () => {
    render(<BasicModuleInfoTab moduleData={mockModuleData} />);
    
    const profileImages = screen.getAllByRole('img');
    
    // Check that images are rendered
    expect(profileImages).toHaveLength(2);
    
    // Check alt text
    expect(profileImages[0]).toHaveAttribute('alt', 'Dr. John Smith');
    expect(profileImages[1]).toHaveAttribute('alt', 'Prof. Jane Doe');
    
    // Check image styling
    profileImages.forEach(img => {
      expect(img).toHaveClass('rounded-full', 'size-10', 'border-2', 'border-text-secondary/70', 'object-cover');
    });
  });

  test('displays correct progress bar values and calculations', () => {
    render(<BasicModuleInfoTab moduleData={mockModuleData} />);
    
    // Check that progress bars show correct values using getAllByText for duplicates
    const appliedElements = screen.getAllByText('8 / 8'); // Applied (undergraduate)
    expect(appliedElements.length).toBeGreaterThan(0);
    
    const reviewedElements = screen.getAllByText('6 / 8'); // Reviewed
    expect(reviewedElements.length).toBeGreaterThan(0);
    
    const acceptedElements = screen.getAllByText('4 / 6'); // Accepted
    expect(acceptedElements.length).toBeGreaterThan(0);
    
    // Check general pattern - should have multiple progress indicators
    const progressElements = screen.getAllByText(/\d+ \/ \d+/);
    expect(progressElements.length).toBeGreaterThan(5); // Multiple progress indicators
  });
});
