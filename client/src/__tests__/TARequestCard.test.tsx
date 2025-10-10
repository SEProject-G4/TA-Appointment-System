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
});
