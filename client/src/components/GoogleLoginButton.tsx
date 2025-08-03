import React from "react";
import { loginWithGoogle } from "../api/authApi";

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
      <svg
        className="w-5 h-5"
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          fill="#FFC107"
          d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.753-6.121 8.083-11.303 8.083-6.757 0-12.264-5.463-12.264-12.213 0-6.75 5.507-12.213 12.264-12.213C30.932 12.593 33.72 13.791 35.858 15.938l5.653-5.653C39.51 7.158 35.253 5.132 30.138 5.132c-10.957 0-19.824 8.905-19.824 19.824s8.867 19.824 19.824 19.824c11.026 0 19.263-8.083 19.263-18.777 0-1.189-.133-2.353-.33-3.489z"
        />
        <path
          fill="#FF3D00"
          d="M6.353 28.058l6.305-4.872c-.886-2.662-.886-5.594 0-8.256L6.353 10.941c-3.535 7.129-3.535 15.228 0 22.117z"
        />
        <path
          fill="#4CAF50"
          d="M43.611 20.083H24v8h11.303c-1.649 4.753-6.121 8.083-11.303 8.083-6.757 0-12.264-5.463-12.264-12.213 0-6.75 5.507-12.213 12.264-12.213C30.932 12.593 33.72 13.791 35.858 15.938l5.653-5.653C39.51 7.158 35.253 5.132 30.138 5.132c-10.957 0-19.824 8.905-19.824 19.824s8.867 19.824 19.824 19.824c11.026 0 19.263-8.083 19.263-18.777 0-1.189-.133-2.353-.33-3.489z"
        />
        <path
          fill="#1976D2"
          d="M24 44.824c6.757 0 12.264-5.463 12.264-12.213H24v-8h11.303c-1.649 4.753-6.121 8.083-11.303 8.083-6.757 0-12.264-5.463-12.264-12.213s5.507-12.213 12.264-12.213V5.132c-10.957 0-19.824 8.905-19.824 19.824s8.867 19.824 19.824 19.824z"
        />
      </svg>
      <span className="ml-2">Sign in with Google</span>
    </button>
  );
};

export default GoogleLoginButton;