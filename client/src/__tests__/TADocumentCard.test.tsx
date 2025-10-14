import { render, screen, fireEvent } from "@testing-library/react";
import DocumentSubmissionModal from "../components/ta/TADocumentCard";

describe("DocumentSubmissionModal (TADocumentCard)", () => {
  const mockOnClose = jest.fn();

  const mockPosition = {
    modules: [
      { moduleCode: "CS3033", moduleName: "Theory of Computing" },
      { moduleCode: "CS3043", moduleName: "Database Systems" }
    ],
    totalTAHours: 6
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("TC01-renders nothing when isDocOpen is false", () => {
    const { container } = render(
      <DocumentSubmissionModal 
        isDocOpen={false} 
        onClose={mockOnClose} 
        position={mockPosition} 
      />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it("TC02-renders essential content sections", () => {
    render(
      <DocumentSubmissionModal 
        isDocOpen={true} 
        onClose={mockOnClose} 
        position={mockPosition} 
      />
    );
    
    // Header
    expect(screen.getByText("Document Submission")).toBeInTheDocument();
    
    // Position Information
    expect(screen.getByText("Position Information")).toBeInTheDocument();
    expect(screen.getByText("CS3033")).toBeInTheDocument();
    expect(screen.getByText("Theory of Computing")).toBeInTheDocument();
    expect(screen.getByText("CS3043")).toBeInTheDocument();
    expect(screen.getByText("Database Systems")).toBeInTheDocument();
    expect(screen.getByText("6 hours")).toBeInTheDocument();
    
    // Main sections
    expect(screen.getByText("Personal Information")).toBeInTheDocument();
    expect(screen.getByText("Declaration Form")).toBeInTheDocument();
    expect(screen.getByText("Document Uploads")).toBeInTheDocument();
    
    // Action buttons
    expect(screen.getByRole("button", { name: /cancel/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /submit documents/i })).toBeInTheDocument();
  });

  it("TC03-handles basic form input changes", () => {
    render(
      <DocumentSubmissionModal 
        isDocOpen={true} 
        onClose={mockOnClose} 
        position={mockPosition} 
      />
    );
    
    // Test name input
    const nameInput = screen.getByPlaceholderText(/Enter your name as shown in bank account/);
    fireEvent.change(nameInput, { target: { value: "John Doe" } });
    expect(nameInput).toHaveValue("John Doe");
    
    // Test NIC input
    const nicInput = screen.getByPlaceholderText(/Enter your NIC number/);
    fireEvent.change(nicInput, { target: { value: "123456789V" } });
    expect(nicInput).toHaveValue("123456789V");
  });

  it("TC04-shows degree certificate field for postgraduate students", () => {
    render(
      <DocumentSubmissionModal 
        isDocOpen={true} 
        onClose={mockOnClose} 
        position={mockPosition} 
      />
    );
    
    // Initially degree certificate field should not be visible
    expect(screen.queryByText(/Degree Certificate or Transcript/)).not.toBeInTheDocument();
    
    // Find and select postgraduate option
    const selectElement = screen.getByRole("combobox") as HTMLSelectElement;
    fireEvent.change(selectElement, { target: { value: "postgraduate" } });
    
    // Now degree certificate field should be visible
    expect(screen.getByText(/Degree Certificate or Transcript/)).toBeInTheDocument();
    expect(screen.getByText("Required for postgraduate students")).toBeInTheDocument();
  });

  it("TC05-handles close actions correctly", () => {
    render(
      <DocumentSubmissionModal 
        isDocOpen={true} 
        onClose={mockOnClose} 
        position={mockPosition} 
      />
    );
    
    // Test cancel button
    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });
});
