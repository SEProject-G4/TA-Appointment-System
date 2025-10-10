import { render, screen } from '@testing-library/react';
import CircularProgress from '../components/common/CircularProgressBar';

describe('CircularProgress', () => {
  it('renders with default props and displays children content', () => {
    const { container } = render(
      <CircularProgress percentage={75}>
        <span>75%</span>
      </CircularProgress>
    );

    // Check if the children content is rendered
    expect(screen.getByText('75%')).toBeInTheDocument();
    
    // Check if SVG is rendered with correct viewBox
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute('viewBox', '0 0 120 120');

    // Check default size class (medium)
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass('w-32', 'h-32');
  });

  it('applies correct size and color classes based on props', () => {
    const { container } = render(
      <CircularProgress 
        percentage={50} 
        size="small" 
        color="green"
      >
        <span>Small Green</span>
      </CircularProgress>
    );

    // Check size classes on the main container div
    const mainDiv = container.firstChild as HTMLElement;
    expect(mainDiv).toHaveClass('w-20', 'h-20');

    // Check if progress circle has the correct color class
    const progressCircle = container.querySelectorAll('circle')[1]; // Second circle is the progress
    expect(progressCircle).toHaveClass('stroke-green-500');

    expect(screen.getByText('Small Green')).toBeInTheDocument();
  });

  it('calculates stroke-dashoffset correctly for different percentages', () => {
    const { rerender, container } = render(
      <CircularProgress percentage={0}>
        <span>0%</span>
      </CircularProgress>
    );

    // For 0%, offset should be equal to circumference (314.159...)
    let progressCircle = container.querySelectorAll('circle')[1];
    let circumference = 2 * Math.PI * 50; // radius = 50
    expect(progressCircle).toHaveAttribute('stroke-dashoffset', circumference.toString());

    // Test with 100%
    rerender(
      <CircularProgress percentage={100}>
        <span>100%</span>
      </CircularProgress>
    );

    progressCircle = container.querySelectorAll('circle')[1];
    expect(progressCircle).toHaveAttribute('stroke-dashoffset', '0');

    // Test with 50%
    rerender(
      <CircularProgress percentage={50}>
        <span>50%</span>
      </CircularProgress>
    );

    progressCircle = container.querySelectorAll('circle')[1];
    const expectedOffset = circumference - (50 / 100) * circumference;
    expect(progressCircle).toHaveAttribute('stroke-dashoffset', expectedOffset.toString());
  });
});
