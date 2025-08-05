import React from "react";
import { loginWithGoogle } from "../api/authApi";
import { FaGoogle } from 'react-icons/fa';

interface GoogleLoginButtonProps {
  className?: string;
}

const GoogleLoginButton: React.FC<GoogleLoginButtonProps> = ({ className }) => {
  return (
    <button
      onClick={loginWithGoogle}
      className={`
            w-full py-3 px-4 font-semibold rounded-xl transition-colors duration-200
                  bg-primary hover:bg-primary-dark text-text-inverted
                  flex items-center justify-center space-x-2
                  focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2
                  ${className || ""}`}
    >
      <FaGoogle className="text-lg" />
      <span className="ml-2">Sign in with Google</span>
    </button>
  );
};

export default GoogleLoginButton;