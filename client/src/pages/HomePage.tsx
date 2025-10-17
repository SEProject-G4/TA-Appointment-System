import { Link } from "react-router-dom";
import {
  FaChalkboardTeacher,
  FaUserTie,
  FaGraduationCap,
  FaCalendarCheck,
  FaFileAlt,
  FaUsers,
  FaSignOutAlt,
} from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";

const HomePage = () => {
  const { user, logout } = useAuth();
  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-200">
      {/* Hero Section */}
      <section className="relative py-24 bg-blue-50 dark:bg-blue-900 overflow-hidden">
        <div className="container mx-auto px-4 md:px-12 lg:px-24">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="mb-10 lg:mb-0 lg:w-1/2 lg:pr-16 text-center lg:text-left">
              <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-6">
                TA Appointment System
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
                Streamline Teaching Assistant management for lecturers, administrators, and TAs. 
                Efficient scheduling, application tracking, and communication platform.
              </p>
              <div className="space-x-4">
                {user ? (
                  <button
                    onClick={logout}
                    className="inline-flex items-center gap-2 py-3 px-6 rounded-md bg-blue-600 dark:bg-blue-400 text-white font-semibold hover:bg-blue-700 dark:hover:bg-blue-500 transition duration-300"
                  >
                    <FaSignOutAlt />
                    Logout
                  </button>
                ) : (
                  <Link
                    to="/login"
                    className="inline-block py-3 px-6 rounded-md bg-blue-600 dark:bg-blue-400 text-white font-semibold hover:bg-blue-700 dark:hover:bg-blue-500 transition duration-300"
                  >
                    Access System
                  </Link>
                )}
                <Link
                  to="/about"
                  className="inline-block py-3 px-6 rounded-md border border-blue-300 dark:border-blue-700 text-blue-600 dark:text-blue-400 font-semibold hover:bg-blue-100 dark:hover:bg-blue-800 transition duration-300"
                >
                  Learn More
                </Link>
              </div>
            </div>
            <div className="lg:w-1/2">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
                <div className="grid grid-cols-2 gap-6">
                  <div className="text-center">
                    <FaChalkboardTeacher className="w-12 h-12 text-blue-500 dark:text-blue-300 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">Lecturers</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Manage TA requests</p>
                  </div>
                  <div className="text-center">
                    <FaUserTie className="w-12 h-12 text-blue-500 dark:text-blue-300 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">Admins</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">System oversight</p>
                  </div>
                  <div className="text-center">
                    <FaGraduationCap className="w-12 h-12 text-blue-500 dark:text-blue-300 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">TAs</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Apply & manage</p>
                  </div>
                  <div className="text-center">
                    <FaCalendarCheck className="w-12 h-12 text-blue-500 dark:text-blue-300 mx-auto mb-3" />
                    <h3 className="font-semibold text-gray-700 dark:text-gray-300">Scheduling</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Efficient booking</p>
                  </div>
                </div>

              </div>
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
          <h2 className="text-3xl font-semibold text-center text-blue-600 dark:text-blue-400 mb-12">
            System Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="text-blue-500 dark:text-blue-300 mb-4">
                <FaFileAlt className="w-8 h-8 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-center text-gray-700 dark:text-gray-300 mb-2">
                Application Management
              </h3>
              <p className="text-center text-gray-500 dark:text-gray-400">
                TAs can submit applications and lecturers can review and manage TA requests efficiently.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="text-blue-500 dark:text-blue-300 mb-4">
                <FaCalendarCheck className="w-8 h-8 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-center text-gray-700 dark:text-gray-300 mb-2">
                Module Scheduling
              </h3>
              <p className="text-center text-gray-500 dark:text-gray-400">
                Schedule TA assignments for different modules and manage availability periods.
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <div className="text-blue-500 dark:text-blue-300 mb-4">
                <FaUsers className="w-8 h-8 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-center text-gray-700 dark:text-gray-300 mb-2">
                User Management
              </h3>
              <p className="text-center text-gray-500 dark:text-gray-400">
                Administrators can manage user roles, permissions, and system access controls.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="py-16 bg-blue-100 dark:bg-blue-800">
        <div className="container mx-auto px-4 md:px-12 lg:px-24 text-center">
          <h2 className="text-3xl font-semibold text-blue-600 dark:text-blue-400 mb-8">
            Ready to Manage TA Appointments?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 mb-8">
            Join lecturers, administrators, and TAs who are already using our system to streamline their workflow.
          </p>
          {user ? (
            <button
              onClick={logout}
              className="inline-flex items-center gap-2 py-4 px-8 rounded-md bg-blue-600 dark:bg-blue-400 text-white text-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-500 transition duration-300"
            >
              <FaSignOutAlt />
              Logout
            </button>
          ) : (
            <Link
              to="/login"
              className="inline-block py-4 px-8 rounded-md bg-blue-600 dark:bg-blue-400 text-white text-lg font-semibold hover:bg-blue-700 dark:hover:bg-blue-500 transition duration-300"
            >
              Access the System
            </Link>
          )}
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
              Help & Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
