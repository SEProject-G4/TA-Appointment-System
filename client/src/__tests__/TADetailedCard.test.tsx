import { render, screen, fireEvent } from "@testing-library/react";
import TADetailedCard from "../components/ta/TADetailedCard";

describe("TADetailedCard", () => {
  const mockOnClose = jest.fn();

  const mockDetails = {
    moduleCode: "CS3033",
    moduleName: "Theory of Computing",
    coordinators: ["Dr. Smith", "Prof. Johnson"],
    requiredTAHours: 3,
    requiredTANumber: 2,
    appliedTANumber: 1,
    requirements: ["Strong programming skills", "Good communication", "Previous TA experience"],
    documentDueDate: "2025-11-15",
    applicationDueDate: "2025-11-10",
    appliedDate: "2025-10-08",
    status: "pending",
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("TC01-renders nothing when isOpen is false", () => {
    const { container } = render(
      <TADetailedCard isOpen={false} onClose={mockOnClose} details={mockDetails} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it("TC02-renders nothing when details is null", () => {
    const { container } = render(
      <TADetailedCard isOpen={true} onClose={mockOnClose} details={null} />
    );
    
    expect(container.firstChild).toBeNull();
  });

  it("TC03-renders complete module information and details correctly", () => {
    render(<TADetailedCard isOpen={true} onClose={mockOnClose} details={mockDetails} />);
    
    // Header information
    expect(screen.getByText("Application Details")).toBeInTheDocument();
    
    // Module information
    expect(screen.getByText("CS3033")).toBeInTheDocument();
    expect(screen.getByText("Theory of Computing")).toBeInTheDocument();
    expect(screen.getByText("pending")).toBeInTheDocument();
    expect(screen.getByText("Applied on: 2025-10-08")).toBeInTheDocument();
    
    // Coordinators
    expect(screen.getByText("Module Coordinators")).toBeInTheDocument();
    expect(screen.getByText("Dr. Smith")).toBeInTheDocument();
    expect(screen.getByText("Prof. Johnson")).toBeInTheDocument();
    
    // Position details
    expect(screen.getByText("Position Details")).toBeInTheDocument();
    expect(screen.getByText("3 hrs/week")).toBeInTheDocument();
    expect(screen.getByText("Required TAs:")).toBeInTheDocument();
    expect(screen.getByText("Applied TAs:")).toBeInTheDocument();
    
    // Deadlines
    expect(screen.getByText("Important Deadlines")).toBeInTheDocument();
    expect(screen.getByText("Application Due Date")).toBeInTheDocument();
    expect(screen.getByText("Document Due Date")).toBeInTheDocument();
    expect(screen.getByText("2025-11-10")).toBeInTheDocument();
    expect(screen.getByText("2025-11-15")).toBeInTheDocument();
    
    // Requirements
    expect(screen.getByText("Position Requirements")).toBeInTheDocument();
    expect(screen.getByText("Strong programming skills")).toBeInTheDocument();
    expect(screen.getByText("Good communication")).toBeInTheDocument();
    expect(screen.getByText("Previous TA experience")).toBeInTheDocument();
  });

  it("TC04-calls onClose when close button is clicked", () => {
    render(<TADetailedCard isOpen={true} onClose={mockOnClose} details={mockDetails} />);
    
    const closeButton = screen.getByRole("button");
    fireEvent.click(closeButton);
    
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it("TC05-applies correct modal styling and responsive classes", () => {
    const { container } = render(
      <TADetailedCard isOpen={true} onClose={mockOnClose} details={mockDetails} />
    );
    
    // Check modal overlay
    const modalOverlay = container.querySelector('.fixed.inset-0.z-50');
    expect(modalOverlay).toBeInTheDocument();
    expect(modalOverlay).toHaveClass(
      "fixed",
      "inset-0",
      "z-50",
      "flex",
      "items-center",
      "justify-center",
      "bg-black/50",
      "p-2",
      "sm:p-4"
    );
    
    // Check modal content container
    const modalContent = container.querySelector('.bg-white.rounded-lg');
    expect(modalContent).toBeInTheDocument();
    expect(modalContent).toHaveClass(
      "bg-white",
      "rounded-lg",
      "shadow-xl",
      "w-full",
      "max-w-3xl",
      "p-4",
      "sm:p-6",
      "relative",
      "overflow-y-auto",
      "max-h-[95vh]",
      "sm:max-h-[90vh]"
    );
    
    // Check module info section styling
    const moduleInfoSection = container.querySelector('.bg-gradient-to-r');
    expect(moduleInfoSection).toBeInTheDocument();
    expect(moduleInfoSection).toHaveClass(
      "p-3",
      "sm:p-4",
      "mb-4",
      "sm:mb-6",
      "border",
      "rounded-lg",
      "bg-gradient-to-r",
      "from-primary/5",
      "to-accent/5"
    );
    
    // Check grid layout for coordinators and position details
    const gridSection = container.querySelector('.lg\\:grid-cols-2');
    expect(gridSection).toBeInTheDocument();
    expect(gridSection).toHaveClass("grid", "gap-3", "sm:gap-4", "mb-4", "sm:mb-6", "lg:grid-cols-2");
    
    // Check requirements list styling
    const requirementsList = container.querySelector('ul.list-disc');
    expect(requirementsList).toBeInTheDocument();
    expect(requirementsList).toHaveClass(
      "pl-4",
      "sm:pl-5",
      "space-y-1",
      "text-xs",
      "sm:text-sm",
      "text-gray-600",
      "list-disc"
    );
  });
});
