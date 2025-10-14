import { render, screen, fireEvent } from '@testing-library/react';
import GoogleLoginButton from '../components/common/GoogleLoginButton';

// Mock the authApi
jest.mock('../api/authApi', () => ({
  loginWithGoogle: jest.fn(),
}));

// Get the mocked function
import { loginWithGoogle } from '../api/authApi';
const mockLoginWithGoogle = loginWithGoogle as jest.MockedFunction<typeof loginWithGoogle>;

describe('GoogleLoginButton', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders correctly with Google icon and text', () => {
    render(<GoogleLoginButton />);

    // Check if the button is rendered
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();

    // Check if the button text is correct
    expect(screen.getByText('Sign in with Google')).toBeInTheDocument();

    // Check if the button has the correct base styling classes
    expect(button).toHaveClass('w-full', 'py-3', 'px-4', 'font-semibold', 'rounded-xl');
    expect(button).toHaveClass('bg-primary', 'hover:bg-primary-dark', 'text-text-inverted');
    expect(button).toHaveClass('flex', 'items-center', 'justify-center', 'space-x-2');

    // Check if Google icon is present (FaGoogle renders as an SVG)
    const icon = button.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('calls loginWithGoogle function when clicked and applies custom className', () => {
    const customClass = 'custom-test-class';
    render(<GoogleLoginButton className={customClass} />);

    const button = screen.getByRole('button');
    
    // Check if custom className is applied
    expect(button).toHaveClass(customClass);

    // Click the button
    fireEvent.click(button);

    // Verify that loginWithGoogle was called
    expect(mockLoginWithGoogle).toHaveBeenCalledTimes(1);
  });
});
