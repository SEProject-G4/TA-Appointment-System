import React from "react";
import { Link } from "react-router-dom";
import {
  FaCheckCircle,
  FaCalendarAlt,
  FaUsers,
  FaQuestionCircle,
} from "react-icons/fa";

const HomePage = () => {
  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Hero Section */}
      <section className="relative py-24 bg-blue-50 dark:bg-blue-900 overflow-hidden">
        <div className="container mx-auto px-4 md:px-12 lg:px-24">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="mb-10 lg:mb-0 lg:w-1/2 lg:pr-16 text-center lg:text-left">
              <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-6 animate-fade-in-down">
                Welcome to the TA Appointment System
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 animate-fade-in">
                Effortlessly schedule and manage your Teaching Assistant
                appointments. Streamlining the process for students and faculty.
              </p>
              <div className="space-x-4">
                <Link
                  to="/login"
                  className="inline-block py-3 px-6 rounded-md bg-blue-600 dark:bg-blue-400 text-white font-semibold hover:bg-blue-700 dark:hover:bg-blue-500 transition duration-300 animate-pulse-on-hover"
                >
                  Login
                </Link>
                <Link
                  to="/about"
                  className="inline-block py-3 px-6 rounded-md border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-100 dark:hover:bg-blue-800 transition duration-300 animate-pulse-on-hover"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="lg:w-1/2">
              <img
                src="https://via.placeholder.com/300x200/4F46E5/FFFFFF?text=Modern+Scheduling"
                alt="Modern Scheduling Illustration"
                className="rounded-lg shadow-lg animate-fade-in-up"
              />
            </div>
          </div>
        </div>
        {/* Animated Background Bubbles (Subtle) */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
          <div
            className="absolute bg-blue-200 dark:bg-blue-800 rounded-full opacity-50 animate-float slow"
            style={{ top: "10%", left: "15%", width: "60px", height: "60px" }}
          ></div>
          <div
            className="absolute bg-blue-300 dark:bg-blue-700 rounded-full opacity-50 animate-float delay-1000"
            style={{ top: "70%", right: "20%", width: "40px", height: "40px" }}
          ></div>
          <div
            className="absolute bg-blue-100 dark:bg-blue-900 rounded-full opacity-50 animate-float delay-2000"
            style={{ bottom: "5%", left: "30%", width: "80px", height: "80px" }}
          ></div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16">
        <div className="container mx-auto px-4 md:px-12 lg:px-24">
          <h2 className="text-3xl font-semibold text-center text-blue-600 dark:text-blue-400 mb-12 animate-fade-in-down delay-500">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-slide-in-left">
              <div className="text-blue-500 dark:text-blue-300 mb-4">
                <FaCalendarAlt className="w-8 h-8 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-center text-gray-700 dark:text-gray-300 mb-2">
                Easy Scheduling
              </h3>
              <p className="text-center text-gray-500 dark:text-gray-400">
                Students can easily view available slots and book appointments
                with TAs.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-fade-in delay-200">
              <div className="text-green-500 dark:text-green-300 mb-4">
                <FaCheckCircle className="w-8 h-8 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-center text-gray-700 dark:text-gray-300 mb-2">
                Automated Notifications
              </h3>
              <p className="text-center text-gray-500 dark:text-gray-400">
                Receive timely reminders for upcoming appointments.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 animate-slide-in-right">
              <div className="text-indigo-500 dark:text-indigo-300 mb-4">
                <FaUsers className="w-8 h-8 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-center text-gray-700 dark:text-gray-300 mb-2">
                Faculty Management
              </h3>
              <p className="text-center text-gray-500 dark:text-gray-400">
                Faculty can manage TA availability and view appointment
                schedules.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-blue-100 dark:bg-blue-800">
        <div className="container mx-auto px-4 md:px-12 lg:px-24 text-center">
          <h2 className="text-3xl font-semibold text-blue-600 dark:text-blue-400 mb-8 animate-fade-in-down delay-700">
            Ready to Get Started?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8 animate-fade-in delay-900">
            Join the TA Appointment System and simplify your scheduling needs
            today.
          </p>
          <Link
            to="/login"
            className="inline-block py-4 px-8 rounded-md bg-blue-600 dark:bg-blue-400 text-white text-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-500 transition duration-300 animate-pulse-on-hover"
          >
            Access the System
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 bg-gray-100 dark:bg-gray-800 text-center text-gray-500 dark:text-gray-400">
        <div className="container mx-auto px-4">
          <p className="text-sm">
            Department of Computer Science & Engineering, University of
            Moratuwa, Sri Lanka.
          </p>
          <p className="text-xs mt-2">
            © {new Date().getFullYear()} TA Appointment System. All rights
            reserved.
          </p>
          <div className="mt-4">
            <Link
              to="/privacy"
              className="hover:text-gray-700 dark:hover:text-gray-300 text-sm mr-4"
            >
              Privacy Policy
            </Link>
            <Link
              to="/terms"
              className="hover:text-gray-700 dark:hover:text-gray-300 text-sm"
            >
              Terms of Service
            </Link>
            <Link
              to="/help"
              className="hover:text-gray-700 dark:hover:text-gray-300 text-sm ml-4"
            >
              <FaQuestionCircle className="inline-block mr-1" /> Help
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
