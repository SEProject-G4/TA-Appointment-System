import { render, screen, fireEvent } from "@testing-library/react";
import AppliedTARequestCard from "../components/AppliedTARequestCard";

describe("AppliedTARequestCard", () => {
  const mockOnViewMore = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  const baseProps = {
    moduleCode: "CS3033",
    moduleName: "Theory of Computing",
    onViewMore: mockOnViewMore,
  };

  describe("Rendering", () => {
    it("TC01-renders module code and name correctly", () => {
      render(<AppliedTARequestCard {...baseProps} status="pending" />);
      
      expect(screen.getByText("CS3033")).toBeInTheDocument();
      expect(screen.getByText("Theory of Computing")).toBeInTheDocument();
    });

    it("TC02-renders View More button", () => {
      render(<AppliedTARequestCard {...baseProps} status="pending" />);
      
      const viewMoreButton = screen.getByRole("button", { name: /view more/i });
      expect(viewMoreButton).toBeInTheDocument();
    });
  });

  describe("Status Display", () => {
    it("TC03-displays pending status with correct styling", () => {
      render(<AppliedTARequestCard {...baseProps} status="pending" />);
      
      const statusElement = screen.getByText(/status : pending/i);
      expect(statusElement).toBeInTheDocument();
      expect(statusElement).toHaveClass("bg-yellow-100", "text-yellow-700");
    });

    it("TC04-displays accepted status with correct styling", () => {
      render(<AppliedTARequestCard {...baseProps} status="accepted" />);
      
      const statusElement = screen.getByText(/status : accepted/i);
      expect(statusElement).toBeInTheDocument();
      expect(statusElement).toHaveClass("bg-green-100", "text-green-700");
    });

    it("TC05-displays rejected status with correct styling", () => {
      render(<AppliedTARequestCard {...baseProps} status="rejected" />);
      
      const statusElement = screen.getByText(/status : rejected/i);
      expect(statusElement).toBeInTheDocument();
      expect(statusElement).toHaveClass("bg-red-100", "text-red-700");
    });

    it("TC06-capitalizes status text correctly", () => {
      render(<AppliedTARequestCard {...baseProps} status="pending" />);
      
      expect(screen.getByText("Status : Pending")).toBeInTheDocument();
    });
  });

  describe("Interactions", () => {
    it("TC07-calls onViewMore when View More button is clicked", () => {
      render(<AppliedTARequestCard {...baseProps} status="pending" />);
      
      const viewMoreButton = screen.getByRole("button", { name: /view more/i });
      fireEvent.click(viewMoreButton);
      
      expect(mockOnViewMore).toHaveBeenCalledTimes(1);
    });

    it("TC08-calls onViewMore multiple times when button is clicked multiple times", () => {
      render(<AppliedTARequestCard {...baseProps} status="accepted" />);
      
      const viewMoreButton = screen.getByRole("button", { name: /view more/i });
      fireEvent.click(viewMoreButton);
      fireEvent.click(viewMoreButton);
      fireEvent.click(viewMoreButton);
      
      expect(mockOnViewMore).toHaveBeenCalledTimes(3);
    });
  });

  describe("Component Structure", () => {
    it("TC09-has correct CSS classes for styling", () => {
      const { container } = render(<AppliedTARequestCard {...baseProps} status="pending" />);
      
      const cardElement = container.firstChild as HTMLElement;
      expect(cardElement).toHaveClass(
        "w-full",
        "p-3",
        "sm:p-4",
        "transition-shadow",
        "duration-300",
        "border",
        "shadow-md",
        "rounded-xl",
        "bg-bg-card",
        "border-border-default",
        "hover:shadow-lg"
      );
    });

    it("TC10-applies correct button styling", () => {
      render(<AppliedTARequestCard {...baseProps} status="pending" />);
      
      const viewMoreButton = screen.getByRole("button", { name: /view more/i });
      expect(viewMoreButton).toHaveClass(
        "w-full",
        "sm:w-auto",
        "min-w-fit",
        "bg-primary-dark",
        "text-text-inverted",
        "font-semibold",
        "py-2",
        "sm:py-1",
        "px-3",
        "text-sm",
        "rounded-3xl",
        "shadow-lg",
        "hover:shadow-xl",
        "transform",
        "hover:-translate-y-0.5",
        "transition-all",
        "duration-300",
        "ease-in-out",
        "border-0",
        "relative",
        "overflow-hidden",
        "group"
      );
    });
  });

  describe("Edge Cases", () => {
    it("TC11-handles empty module code gracefully", () => {
      render(<AppliedTARequestCard {...baseProps} moduleCode="" status="pending" />);
      
      // Should still render the card structure
      expect(screen.getByRole("button", { name: /view more/i })).toBeInTheDocument();
    });

    it("TC12-handles empty module name gracefully", () => {
      render(<AppliedTARequestCard {...baseProps} moduleName="" status="pending" />);
      
      // Should still render the card structure
      expect(screen.getByText("CS3033")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /view more/i })).toBeInTheDocument();
    });

    it("TC13-handles long module names correctly", () => {
      const longModuleName = "This is a very long module name that might cause layout issues if not handled properly";
      render(<AppliedTARequestCard {...baseProps} moduleName={longModuleName} status="pending" />);
      
      expect(screen.getByText(longModuleName)).toBeInTheDocument();
    });

    it("TC14-handles long module codes correctly", () => {
      const longModuleCode = "VERYLONGMODULECODE123456";
      render(<AppliedTARequestCard {...baseProps} moduleCode={longModuleCode} status="pending" />);
      
      expect(screen.getByText(longModuleCode)).toBeInTheDocument();
    });
  });

  describe("Accessibility", () => {
    it("TC15-has proper button role for View More button", () => {
      render(<AppliedTARequestCard {...baseProps} status="pending" />);
      
      const viewMoreButton = screen.getByRole("button", { name: /view more/i });
      expect(viewMoreButton).toBeInTheDocument();
      expect(viewMoreButton.tagName).toBe("BUTTON");
    });

    it("TC16-provides meaningful text content for screen readers", () => {
      render(<AppliedTARequestCard {...baseProps} status="accepted" />);
      
      // Check that status information is readable
      expect(screen.getByText("Status : Accepted")).toBeInTheDocument();
      expect(screen.getByText("CS3033")).toBeInTheDocument();
      expect(screen.getByText("Theory of Computing")).toBeInTheDocument();
    });
  });
});
