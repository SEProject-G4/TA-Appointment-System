import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import TAAppliedCard from "../components/ta/TAAppliedCard";

// Mock the TADetailedCard component
jest.mock("../components/ta/TADetailedCard", () => {
  return function MockTADetailedCard({ isOpen, onClose, details }: any) {
    if (!isOpen) return null;
    return (
      <div data-testid="ta-detailed-card">
        <button onClick={onClose} data-testid="close-detailed-card">
          Close
        </button>
        <div data-testid="detailed-card-content">
          {details?.moduleCode} - {details?.moduleName}
        </div>
      </div>
    );
  };
});

describe("TAAppliedCard", () => {
  const baseProps = {
    moduleCode: "CS3033",
    moduleName: "Theory of Computing",
    coordinators: ["Dr. Smith", "Prof. Johnson"],
    requiredTAHours: 3,
    requiredTANumber: 2,
    appliedTANumber: 1,
    requirements: ["Strong programming skills", "Good communication"],
    documentDueDate: "2025-11-15",
    applicationDueDate: "2025-11-10",
    appliedDate: "2025-10-08",
    status: "pending",
  };

  describe("Rendering - List View", () => {
    it("renders module information correctly in list view", () => {
      render(<TAAppliedCard {...baseProps} viewMode="list" />);
      
      expect(screen.getByText("CS3033")).toBeInTheDocument();
      expect(screen.getByText("Theory of Computing")).toBeInTheDocument();
      expect(screen.getByText("Applied: 2025-10-08")).toBeInTheDocument();
    });

    it("renders View Details button in list view", () => {
      render(<TAAppliedCard {...baseProps} viewMode="list" />);
      
      const viewDetailsButton = screen.getByRole("button", { name: /view details/i });
      expect(viewDetailsButton).toBeInTheDocument();
    });

    it("displays BookOpen icon in list view", () => {
      const { container } = render(<TAAppliedCard {...baseProps} viewMode="list" />);
      
      const bookIcon = container.querySelector('[data-testid="book-open"]') || 
                      container.querySelector('svg');
      expect(bookIcon).toBeInTheDocument();
    });
  });

  describe("Rendering - Card View", () => {
    it("renders module information correctly in card view", () => {
      render(<TAAppliedCard {...baseProps} viewMode="cards" />);
      
      expect(screen.getByText("CS3033")).toBeInTheDocument();
      expect(screen.getByText("Theory of Computing")).toBeInTheDocument();
      expect(screen.getByText("Applied: 2025-10-08")).toBeInTheDocument();
    });

    it("renders View Details button in card view", () => {
      render(<TAAppliedCard {...baseProps} viewMode="cards" />);
      
      const viewDetailsButton = screen.getByRole("button", { name: /view details/i });
      expect(viewDetailsButton).toBeInTheDocument();
    });

    it("displays BookOpen and Calendar icons in card view", () => {
      const { container } = render(<TAAppliedCard {...baseProps} viewMode="cards" />);
      
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe("Status Display", () => {
    it("displays pending status with correct styling", () => {
      render(<TAAppliedCard {...baseProps} status="pending" />);
      
      const statusElement = screen.getByText("pending");
      expect(statusElement).toBeInTheDocument();
      expect(statusElement).toHaveClass("bg-yellow-100", "text-yellow-800", "border-yellow-200");
    });

    it("displays accepted status with correct styling", () => {
      render(<TAAppliedCard {...baseProps} status="accepted" />);
      
      const statusElement = screen.getByText("accepted");
      expect(statusElement).toBeInTheDocument();
      expect(statusElement).toHaveClass("bg-green-100", "text-green-800", "border-green-200");
    });

    it("displays rejected status with correct styling", () => {
      render(<TAAppliedCard {...baseProps} status="rejected" />);
      
      const statusElement = screen.getByText("rejected");
      expect(statusElement).toBeInTheDocument();
      expect(statusElement).toHaveClass("bg-blue-100", "text-blue-800", "border-blue-200");
    });

    it("displays default status styling for unknown status", () => {
      render(<TAAppliedCard {...baseProps} status="unknown" />);
      
      const statusElement = screen.getByText("unknown");
      expect(statusElement).toBeInTheDocument();
      expect(statusElement).toHaveClass("bg-gray-100", "text-gray-800", "border-gray-200");
    });
  });

  describe("Detailed Card Modal", () => {
    it("opens TADetailedCard when View Details button is clicked", async () => {
      render(<TAAppliedCard {...baseProps} />);
      
      const viewDetailsButton = screen.getByRole("button", { name: /view details/i });
      fireEvent.click(viewDetailsButton);
      
      await waitFor(() => {
        expect(screen.getByTestId("ta-detailed-card")).toBeInTheDocument();
      });
    });

    it("passes correct details to TADetailedCard", async () => {
      render(<TAAppliedCard {...baseProps} />);
      
      const viewDetailsButton = screen.getByRole("button", { name: /view details/i });
      fireEvent.click(viewDetailsButton);
      
      await waitFor(() => {
        expect(screen.getByTestId("detailed-card-content")).toHaveTextContent(
          "CS3033 - Theory of Computing"
        );
      });
    });

    it("closes TADetailedCard when close is triggered", async () => {
      render(<TAAppliedCard {...baseProps} />);
      
      // Open the detailed card
      const viewDetailsButton = screen.getByRole("button", { name: /view details/i });
      fireEvent.click(viewDetailsButton);
      
      await waitFor(() => {
        expect(screen.getByTestId("ta-detailed-card")).toBeInTheDocument();
      });
      
      // Close the detailed card
      const closeButton = screen.getByTestId("close-detailed-card");
      fireEvent.click(closeButton);
      
      await waitFor(() => {
        expect(screen.queryByTestId("ta-detailed-card")).not.toBeInTheDocument();
      });
    });

    it("does not render TADetailedCard initially", () => {
      render(<TAAppliedCard {...baseProps} />);
      
      expect(screen.queryByTestId("ta-detailed-card")).not.toBeInTheDocument();
    });
  });

  describe("View Mode Handling", () => {
    it("defaults to list view when viewMode is not specified", () => {
      const { container } = render(<TAAppliedCard {...baseProps} />);
      
      // List view has specific gradient styling
      const cardElement = container.querySelector('.bg-gradient-to-br');
      expect(cardElement).toBeInTheDocument();
    });

    it("renders card view when viewMode is 'cards'", () => {
      const { container } = render(<TAAppliedCard {...baseProps} viewMode="cards" />);
      
      // Card view doesn't have gradient styling but has different structure
      const cardElement = container.querySelector('.bg-gradient-to-br');
      expect(cardElement).not.toBeInTheDocument();
    });

    it("renders list view when viewMode is 'list'", () => {
      const { container } = render(<TAAppliedCard {...baseProps} viewMode="list" />);
      
      // List view has gradient styling
      const cardElement = container.querySelector('.bg-gradient-to-br');
      expect(cardElement).toBeInTheDocument();
    });
  });

  describe("Component Structure and Styling", () => {
    it("applies correct base styling for card view", () => {
      const { container } = render(<TAAppliedCard {...baseProps} viewMode="cards" />);
      
      const cardElement = container.querySelector('.w-full.p-4');
      expect(cardElement).toHaveClass(
        "transition-all",
        "duration-300",
        "border",
        "rounded-lg",
        "shadow-sm",
        "bg-bg-card",
        "hover:shadow-md",
        "border-border/50"
      );
    });

    it("applies correct base styling for list view", () => {
      const { container } = render(<TAAppliedCard {...baseProps} viewMode="list" />);
      
      const cardElement = container.querySelector('.p-6');
      expect(cardElement).toHaveClass(
        "mb-4",
        "transition-all",
        "duration-300",
        "border",
        "rounded-lg",
        "bg-gradient-to-br",
        "from-card",
        "to-muted/10",
        "border-border/50",
        "hover:shadow-lg"
      );
    });

    it("renders module code badge with correct styling", () => {
      render(<TAAppliedCard {...baseProps} />);
      
      const moduleCodeBadge = screen.getByText("CS3033");
      expect(moduleCodeBadge).toHaveClass(
        "text-xs",
        "font-medium",
        "border-transparent",
        "bg-bg-card",
        "text-text-secondary",
        "hover:bg-primary-light/80",
        "inline-flex",
        "items-center",
        "rounded-full",
        "border",
        "px-2.5",
        "py-0.5",
        "transition-colors"
      );
    });
  });

  describe("Edge Cases", () => {
    it("handles empty coordinators array", () => {
      render(<TAAppliedCard {...baseProps} coordinators={[]} />);
      
      expect(screen.getByText("CS3033")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /view details/i })).toBeInTheDocument();
    });

    it("handles empty requirements array", () => {
      render(<TAAppliedCard {...baseProps} requirements={[]} />);
      
      expect(screen.getByText("Theory of Computing")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /view details/i })).toBeInTheDocument();
    });

    it("handles long module names", () => {
      const longName = "Very Long Module Name That Might Cause Layout Issues In Some Cases";
      render(<TAAppliedCard {...baseProps} moduleName={longName} />);
      
      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it("handles long module codes", () => {
      const longCode = "VERYLONGMODULECODE123";
      render(<TAAppliedCard {...baseProps} moduleCode={longCode} />);
      
      expect(screen.getByText(longCode)).toBeInTheDocument();
    });

    it("handles zero required TA numbers", () => {
      render(<TAAppliedCard {...baseProps} requiredTANumber={0} appliedTANumber={0} />);
      
      expect(screen.getByText("CS3033")).toBeInTheDocument();
    });
  });

  describe("Date Display", () => {
    it("displays applied date with Calendar icon", () => {
      render(<TAAppliedCard {...baseProps} appliedDate="2025-10-15" />);
      
      expect(screen.getByText("Applied: 2025-10-15")).toBeInTheDocument();
    });

    it("handles different date formats", () => {
      render(<TAAppliedCard {...baseProps} appliedDate="15/10/2025" />);
      
      expect(screen.getByText("Applied: 15/10/2025")).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("has proper button accessibility", () => {
      render(<TAAppliedCard {...baseProps} />);
      
      const viewDetailsButton = screen.getByRole("button", { name: /view details/i });
      expect(viewDetailsButton).toBeInTheDocument();
      expect(viewDetailsButton.tagName).toBe("BUTTON");
    });

    it("provides meaningful text content for screen readers", () => {
      render(<TAAppliedCard {...baseProps} status="accepted" />);
      
      expect(screen.getByText("CS3033")).toBeInTheDocument();
      expect(screen.getByText("Theory of Computing")).toBeInTheDocument();
      expect(screen.getByText("accepted")).toBeInTheDocument();
      expect(screen.getByText("Applied: 2025-10-08")).toBeInTheDocument();
    });
  });
});
