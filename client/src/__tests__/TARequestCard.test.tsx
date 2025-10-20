import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { useToast } from "../contexts/ToastContext";
import TARequestCard from "../components/ta/TARequestCard";

// Mock the toast context
jest.mock("../contexts/ToastContext", () => ({
  useToast: jest.fn(),
}));

describe("TARequestCard", () => {
  const mockShowToast = jest.fn();
  const mockOnApply = jest.fn().mockResolvedValue(undefined);

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue({ showToast: mockShowToast });
  });

  const mockProps = {
    moduleCode: "CS3033",
    moduleName: "Theory of Computing",
    coordinators: ["Dr. Smith", "Prof. Johnson"],
    requiredTAHours: 3,
    requiredTANumber: 2,
    appliedTANumber: 1,
    requirements: ["Strong programming skills", "Good communication"],
    documentDueDate: "2025-11-15",
    applicationDueDate: "2025-11-10",
    onApply: mockOnApply,
    isApplied: false,
    viewMode: 'list' as 'cards' | 'list',
  };

  it("TC01-renders module info correctly", () => {
    render(<TARequestCard {...mockProps} />);
    expect(screen.getByText(/CS3033/)).toBeInTheDocument();
    expect(screen.getByText(/Theory of Computing/)).toBeInTheDocument();
  });

  it("TC02-opens confirmation dialog when Apply button is clicked", () => {
    render(<TARequestCard {...mockProps} />);
    const button = screen.getByRole("button", { name: /apply now/i });
    fireEvent.click(button);
    
    // Check if confirmation dialog appears
    expect(screen.getByText("Confirm Application?")).toBeInTheDocument();
  });

  it("TC03-calls onApply when confirmation is accepted", async () => {
    render(<TARequestCard {...mockProps} />);
    
    // Click Apply button to open dialog
    const applyButton = screen.getByRole("button", { name: /apply now/i });
    fireEvent.click(applyButton);
    
    // Find and click confirm button in dialog
    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    
    await waitFor(async () => {
      fireEvent.click(confirmButton);
      expect(mockOnApply).toHaveBeenCalled();
    });
  });

  it("TC04-displays progress bar correctly when positions not fully filled", () => {
    render(<TARequestCard {...mockProps} appliedTANumber={1} requiredTANumber={3} />);
    
    expect(screen.getByText(/1.*\/.*3/)).toBeInTheDocument();
    expect(screen.getByText("Positions Filled")).toBeInTheDocument();
    
    // Check if progress bar shows blue color for not fully filled
    const progressContainer = screen.getByText(/1.*\/.*3/);
    expect(progressContainer).toHaveClass("text-blue-600");
  });

  it("TC05-displays progress bar correctly when positions are fully filled", () => {
    render(<TARequestCard {...mockProps} appliedTANumber={2} requiredTANumber={2} />);
    
    expect(screen.getByText(/2.*\/.*2/)).toBeInTheDocument();
    
    // Check if progress bar shows green color for fully filled
    const progressContainer = screen.getByText(/2.*\/.*2/);
    expect(progressContainer).toHaveClass("text-green-600");
  });

  it("TC06-displays coordinators correctly", () => {
    const manyCoordinators = ["Dr. Smith", "Prof. Johnson", "Dr. Brown", "Prof. Wilson"];
    render(<TARequestCard {...mockProps} coordinators={manyCoordinators} />);
    
    expect(screen.getByText("Dr. Smith")).toBeInTheDocument();
    expect(screen.getByText("Prof. Johnson")).toBeInTheDocument();
    expect(screen.getByText("Dr. Brown")).toBeInTheDocument();
    expect(screen.getByText("Prof. Wilson")).toBeInTheDocument();
  });

  it("TC07-displays requirements correctly", () => {
    const manyRequirements = [
      "Strong programming skills",
      "Good communication",
      "Experience with databases",
      "Knowledge of algorithms"
    ];
    render(<TARequestCard {...mockProps} requirements={manyRequirements} />);
    
    expect(screen.getByText("Strong programming skills")).toBeInTheDocument();
    expect(screen.getByText("Good communication")).toBeInTheDocument();
    expect(screen.getByText("Experience with databases")).toBeInTheDocument();
    expect(screen.getByText("Knowledge of algorithms")).toBeInTheDocument();
  });

  it("TC08-displays due dates with correct formatting and colors", () => {
    render(<TARequestCard {...mockProps} />);
    
    expect(screen.getByText("Application Due")).toBeInTheDocument();
    expect(screen.getByText("Document Due")).toBeInTheDocument();
    expect(screen.getByText("2025-11-10")).toBeInTheDocument();
    expect(screen.getByText("2025-11-15")).toBeInTheDocument();
    
    // Check color classes for due dates
    const appDueDate = screen.getByText("2025-11-10");
    const docDueDate = screen.getByText("2025-11-15");
    expect(appDueDate).toHaveClass("text-red-600");
    expect(docDueDate).toHaveClass("text-orange-600");
  });

  it("TC09-displays hours per week information correctly", () => {
    render(<TARequestCard {...mockProps} requiredTAHours={5} />);
    
    expect(screen.getByText("5 hours/week")).toBeInTheDocument();
    
    // Check if Clock icon is present
    const clockIcon = screen.getByText("5 hours/week").parentElement?.querySelector('svg');
    expect(clockIcon).toBeInTheDocument();
  });

  it("TC10-renders card view layout when viewMode is cards", () => {
    const { container } = render(<TARequestCard {...mockProps} viewMode="cards" />);
    
    // Card view has specific styling
    const cardElement = container.querySelector('.outline-dashed.outline-1');
    expect(cardElement).toBeInTheDocument();
    
    // Should still have all the basic elements
    expect(screen.getByText("CS3033")).toBeInTheDocument();
    expect(screen.getByText("Theory of Computing")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /apply now/i })).toBeInTheDocument();
  });

  it("TC11-handles loading state correctly during application", async () => {
    // Mock onApply to simulate loading
    const slowOnApply = jest.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(resolve, 100))
    );
    
    render(<TARequestCard {...mockProps} onApply={slowOnApply} />);
    
    // Open dialog and confirm
    const applyButton = screen.getByRole("button", { name: /apply now/i });
    fireEvent.click(applyButton);
    
    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    fireEvent.click(confirmButton);
    
    // Button should be disabled during loading
    await waitFor(() => {
      expect(slowOnApply).toHaveBeenCalled();
    });
  });

  it("TC12-cancels confirmation dialog when cancel is clicked", () => {
    render(<TARequestCard {...mockProps} />);
    
    // Open dialog
    const applyButton = screen.getByRole("button", { name: /apply now/i });
    fireEvent.click(applyButton);
    
    expect(screen.getByText("Confirm Application?")).toBeInTheDocument();
    
    // Click cancel
    const cancelButton = screen.getByRole("button", { name: /cancel/i });
    fireEvent.click(cancelButton);
    
    // Dialog should be closed
    expect(screen.queryByText("Confirm Application?")).not.toBeInTheDocument();
    expect(mockOnApply).not.toHaveBeenCalled();
  });

  it("TC14-shows success toast when application succeeds", async () => {
    render(<TARequestCard {...mockProps} />);
    
    // Open dialog and confirm
    const applyButton = screen.getByRole("button", { name: /apply now/i });
    fireEvent.click(applyButton);
    
    const confirmButton = screen.getByRole("button", { name: /confirm/i });
    fireEvent.click(confirmButton);
    
    await waitFor(() => {
      expect(mockOnApply).toHaveBeenCalled();
      expect(mockShowToast).toHaveBeenCalledWith(
        "Application submitted successfully!",
        "success"
      );
    });
  });
});
