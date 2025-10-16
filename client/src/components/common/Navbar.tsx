import React, { useState } from "react";
import { FaCog, FaUser, FaSignOutAlt, FaBars, FaTimes } from "react-icons/fa";
import CSELogo from "../../assets/images/cse-logo.png";
import { useAuth } from "../../contexts/AuthContext";
import { useLocation, Link } from "react-router-dom";



interface NavbarProps {
  ref: React.Ref<HTMLDivElement>;
}

const Navbar = React.forwardRef<HTMLDivElement, NavbarProps>((props, ref) => {
  const { user, loading, logout, isLoggingOut } = useAuth(); // Destructure the new state
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (isLoggingOut) {
    return null;
  }

  const handleLogout = () => {
    logout();
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };
  
  const isLoginPage = location.pathname === '/login';
  if(isLoginPage) {
    return null;
  }

  const navLinks: { role: string; links: { subMenu:boolean; to: string; label: string; subNavs?: { to: string; label: string }[] }[] }[] = [
    {
      role: "admin",
      links: [
        { subMenu:false, to: "/admin-dashboard", label: "Admin Dashboard" },
        { subMenu:true, to: "/manage-users/add-user", label: "Manage Users",
          subNavs: [
            { to: "/manage-users/overview", label: "Overview" },
            { to: "/manage-users/undergraduates", label: "Undergraduates" },
            { to: "/manage-users/postgraduates", label: "Postgraduates" },
            { to: "/manage-users/add-user", label: "Add User" },
          ]
        },
      ]
    },
    {
      role:"undergraduate",
      links: [
        { subMenu:false, to: "/ta-dashboard", label: "Available Positions" },
        { subMenu:false, to: "/ta-applied", label: "Applied Positions" },
        { subMenu:false, to: "/ta-accepted", label: "Accepted Positions" },
      ]
    },
    {
      role: "postgraduate",
      links: [
        {  subMenu:false, to: "/ta-dashboard", label: "Available Positions" },
        { subMenu:false, to: "/ta-applied", label: "Applied Positions" },
        { subMenu:false, to: "/ta-accepted", label: "Accepted Positions" },
      ]
    },

    {
      role: "lecturer",
      links: [
        { subMenu:false, to: "/lec-view-module-details", label: "View Module Details" },
        { subMenu:false, to: "/lec-edit-module-details", label: "Edit Module Details" },
        { subMenu:false, to: "/lec-handle-ta-requests", label: "Handle TA Requests" },
      ]
    },

    {
      role: "cse office",
      links: [
        { subMenu:false, to: "/cse-office-dashboard", label: "View TA Documents" }
      ]
    }
  ]

  const isPathActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <nav ref={ref} className="fixed top-0 z-50 w-full shadow-sm">
        <div className="flex flex-row w-full shadow-lg navbar bg-bg-card text-text-primary justify-between items-center">
          
          {/* Logo and Brand */}
          <div className="flex items-center flex-shrink-0">
            <img src={CSELogo} alt="CSE Logo" className="h-8 mr-2 w-14" />
            <Link to="/" className="text-xl text-text-primary font-mercellus" onClick={closeMobileMenu}>
              <p className="hidden lg:flex">TA Appointment System</p>
              <p className="lg:hidden">TAAS</p>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex flex-row items-center justify-center flex-1 space-x-8">
            <ul className="flex space-x-6">
              <li className={`font-raleway hover:text-primary transition duration-300 ease-in-out ${location.pathname === '/' ? 'font-semibold text-primary-dark' : 'text-text-secondary'}`}>
                <Link to="/">Home</Link>
              </li>

              {navLinks.map((nav) => {
                if (user && user.role === nav.role) {
                  return nav.links.map((link) => (
                    <li key={link.to} className={`font-raleway hover:text-primary transition duration-300 ease-in-out ${isPathActive(link.to) ? 'font-semibold text-primary-dark' : 'text-text-secondary'}`}>

                      {link.subMenu ? (
                        <div className="group">
                          <p role="button">{link.label}</p>
                          <ul className="absolute z-10 hidden w-48 p-2 rounded-sm outline-text-secondary/20 outline-1 outline group-hover:block menu bg-bg-card drop-shadow">
                            {link.subNavs?.map((subNav) => (
                              <li key={subNav.to} className={`hover:bg-primary/70 hover:text-text-inverted rounded ${isPathActive(subNav.to) ? 'font-semibold text-primary-dark' : 'text-text-secondary'}`}>
                                <Link to={subNav.to}>{subNav.label}</Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ) : (
                        <Link to={link.to}>{link.label}</Link>
                      )}

                    </li>
                  ));
                }
                return null;
              })}
            </ul>
          </div>

          {/* Right Side - Desktop User Menu / Mobile Menu Button */}
          <div className="flex flex-row gap-2 items-center">
            {/* Desktop User Menu */}
            <div className="hidden lg:flex flex-row gap-2 items-center">
              {loading ? (
                <span className="loading loading-spinner text-primary"></span>
              ) : user ? (
                <>
                  <div className="flex flex-col items-end">
                    <p className="font-semibold text-md text-text-primary">
                      {user.name}
                    </p>
                    <p className="text-sm text-text-secondary">{user.email}</p>
                  </div>
                  <div className="mx-5 dropdown dropdown-end">
                    <div
                      tabIndex={0}
                      role="button"
                      className="border-2 border-primary btn-circle avatar"
                    >
                      <div className="w-10 h-10 rounded-full">
                        <img alt="User Profile" src={user.profilePicture} />
                      </div>
                    </div>
                    <ul
                      tabIndex={0}
                      className="menu mt-3 z-[1] p-2 shadow dropdown-content bg-bg-card rounded-box w-52"
                    >
                      <li className="px-2 py-1 font-semibold text-md text-text-primary">
                        {user.name}
                      </li>
                      <li className="px-2 text-xs text-text-secondary">
                        {user.email}
                      </li>
                      <li className="px-2 text-xs font-semibold text-primary">
                        {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                      </li>
                      <div className="px-2 my-2 h-[1px] w-full bg-text-secondary/20"></div>
                      <li className="p-1 font-semibold rounded hover:bg-primary/80 hover:text-text-inverted text-text-secondary">
                        <Link
                          to="/profile"
                          className="flex flex-row items-center gap-2 px-2"
                        >
                          <FaUser />
                          Profile
                        </Link>
                      </li>
                      <li className="p-1 mt-2 font-semibold rounded hover:bg-primary/80 hover:text-text-inverted text-text-secondary">
                        <Link
                          to="/settings"
                          className="flex flex-row items-center gap-2 px-2"
                        >
                          <FaCog />
                          Settings
                        </Link>
                      </li>
                      <div className="px-2 my-2 h-[1px] w-full bg-text-secondary/20"></div>
                      <li
                        onClick={handleLogout}
                        className="flex flex-row p-1 font-semibold rounded cursor-pointer text-error hover:bg-primary/80 hover:text-text-inverted"
                      >
                        <div className="flex flex-row items-center w-full gap-2 px-2">
                          <FaSignOutAlt />
                          <p>Logout</p>
                        </div>
                      </li>
                    </ul>
                  </div>
                </>
              ) : (
                <Link 
                  to="/login" 
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition duration-200 ease-in-out"
                >
                  Login
                </Link>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="lg:hidden flex items-center">
              <button
                onClick={toggleMobileMenu}
                className="p-2 rounded-md text-text-primary hover:text-primary hover:bg-bg-page transition duration-200"
                aria-label="Toggle mobile menu"
              >
                {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeMobileMenu}></div>
          <div className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-bg-card shadow-xl transform transition-transform duration-300 ease-in-out">
            <div className="flex flex-col h-full">
              {/* Mobile Header */}
              <div className="flex items-center justify-between p-4 border-b border-border-default">
                <div className="flex items-center">
                  <img src={CSELogo} alt="CSE Logo" className="h-6 mr-2 w-10" />
                  <span className="text-lg font-mercellus text-text-primary">TAAS</span>
                </div>
                <button
                  onClick={closeMobileMenu}
                  className="p-2 rounded-md text-text-secondary hover:text-primary hover:bg-bg-page transition duration-200"
                  aria-label="Close mobile menu"
                >
                  <FaTimes size={18} />
                </button>
              </div>

              {/* Mobile Navigation */}
              <div className="flex-1 overflow-y-auto p-4">
                <ul className="space-y-2">
                  <li>
                    <Link
                      to="/"
                      onClick={closeMobileMenu}
                      className={`block px-3 py-2 rounded-md font-raleway transition duration-200 ${
                        location.pathname === '/' 
                          ? 'bg-primary/10 text-primary-dark font-semibold' 
                          : 'text-text-secondary hover:text-primary hover:bg-bg-page'
                      }`}
                    >
                      Home
                    </Link>
                  </li>

                  {navLinks.map((nav) => {
                    if (user && user.role === nav.role) {
                      return nav.links.map((link) => (
                        <li key={link.to}>
                          {link.subMenu ? (
                            <div className="space-y-1">
                              <div className="px-3 py-2 text-text-secondary font-raleway font-medium">
                                {link.label}
                              </div>
                              {link.subNavs?.map((subNav) => (
                                <Link
                                  key={subNav.to}
                                  to={subNav.to}
                                  onClick={closeMobileMenu}
                                  className={`block px-6 py-2 rounded-md font-raleway text-sm transition duration-200 ${
                                    isPathActive(subNav.to)
                                      ? 'bg-primary/10 text-primary-dark font-semibold'
                                      : 'text-text-secondary hover:text-primary hover:bg-bg-page'
                                  }`}
                                >
                                  {subNav.label}
                                </Link>
                              ))}
                            </div>
                          ) : (
                            <Link
                              to={link.to}
                              onClick={closeMobileMenu}
                              className={`block px-3 py-2 rounded-md font-raleway transition duration-200 ${
                                isPathActive(link.to)
                                  ? 'bg-primary/10 text-primary-dark font-semibold'
                                  : 'text-text-secondary hover:text-primary hover:bg-bg-page'
                              }`}
                            >
                              {link.label}
                            </Link>
                          )}
                        </li>
                      ));
                    }
                    return null;
                  })}
                </ul>
              </div>

              {/* Mobile User Section */}
              {user && (
                <div className="border-t border-border-default p-4">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-10 h-10 rounded-full border-2 border-primary">
                      <img alt="User Profile" src={user.profilePicture} className="w-full h-full rounded-full" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-text-primary truncate">{user.name}</p>
                      <p className="text-xs text-text-secondary truncate">{user.email}</p>
                      <p className="text-xs font-semibold text-primary">{user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <Link
                      to="/profile"
                      onClick={closeMobileMenu}
                      className="flex items-center px-3 py-2 text-sm text-text-secondary hover:text-primary hover:bg-bg-page rounded-md transition duration-200"
                    >
                      <FaUser className="mr-2" />
                      Profile
                    </Link>
                    <Link
                      to="/settings"
                      onClick={closeMobileMenu}
                      className="flex items-center px-3 py-2 text-sm text-text-secondary hover:text-primary hover:bg-bg-page rounded-md transition duration-200"
                    >
                      <FaCog className="mr-2" />
                      Settings
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="flex items-center w-full px-3 py-2 text-sm text-error hover:bg-error/10 rounded-md transition duration-200"
                    >
                      <FaSignOutAlt className="mr-2" />
                      Logout
                    </button>
                  </div>
                </div>
              )}

              {/* Mobile Login Button */}
              {!user && !loading && (
                <div className="border-t border-border-default p-4">
                  <Link
                    to="/login"
                    onClick={closeMobileMenu}
                    className="block w-full text-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 transition duration-200"
                  >
                    Login
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
});

export default Navbar;