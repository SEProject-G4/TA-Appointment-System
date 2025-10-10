import { render, screen } from "@testing-library/react";
import TAStatCard from "../components/ta/TAStatCard";
import { Users, Clock, CheckCircle, BookOpen } from "lucide-react";

describe("TAStatCard", () => {
  const baseProps = {
    statName: "Total Applications",
    statValue: 15,
    icon: Users,
  };

  it("TC01-renders stat value and name correctly", () => {
    render(<TAStatCard {...baseProps} />);
    
    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("Total Applications")).toBeInTheDocument();
  });

  it("TC02-renders different icons correctly", () => {
    const { rerender } = render(<TAStatCard {...baseProps} icon={Clock} />);
    
    // Check if icon is rendered (we can't easily test the specific icon, but we can check if an icon element exists)
    const iconElement = document.querySelector('svg');
    expect(iconElement).toBeInTheDocument();
    
    // Test with different icon
    rerender(<TAStatCard {...baseProps} icon={CheckCircle} />);
    expect(document.querySelector('svg')).toBeInTheDocument();
    
    // Test with another icon
    rerender(<TAStatCard {...baseProps} icon={BookOpen} />);
    expect(document.querySelector('svg')).toBeInTheDocument();
  });

  it("TC03-displays zero values correctly", () => {
    render(<TAStatCard {...baseProps} statValue={0} statName="Pending Applications" />);
    
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("Pending Applications")).toBeInTheDocument();
  });

  it("TC04-handles large numbers correctly", () => {
    render(<TAStatCard {...baseProps} statValue={999} statName="Total Hours" />);
    
    expect(screen.getByText("999")).toBeInTheDocument();
    expect(screen.getByText("Total Hours")).toBeInTheDocument();
  });

  it("TC05-applies correct CSS classes for styling", () => {
    const { container } = render(<TAStatCard {...baseProps} />);
    
    // Check main container styling
    const cardElement = container.querySelector('.p-4');
    expect(cardElement).toHaveClass(
      "p-4",
      "sm:p-6",
      "border",
      "shadow-sm",
      "bg-primary-light/10",
      "rounded-xl",
      "border-border-default/50"
    );
    
    // Check if stat value has correct styling
    const statValueElement = screen.getByText("15");
    expect(statValueElement).toHaveClass(
      "text-xl",
      "sm:text-2xl",
      "font-bold",
      "text-text-primary"
    );
    
    // Check if stat name has correct styling
    const statNameElement = screen.getByText("Total Applications");
    expect(statNameElement).toHaveClass(
      "text-xs",
      "sm:text-sm",
      "text-text-secondary",
      "leading-tight"
    );
  });
});
