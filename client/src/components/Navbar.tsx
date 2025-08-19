import React from "react";
import { FaCog, FaUser, FaSignOutAlt } from "react-icons/fa";
import CSELogo from "../assets/images/cse-logo.png";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, useLocation, Link } from "react-router-dom";

const Navbar = () => {
  const { user, loading, logout, isLoggingOut } = useAuth(); // Destructure the new state
  const navigate = useNavigate();
  const location = useLocation();

  if (isLoggingOut) {
    return null;
  }

  const handleLogout = () => {
    logout();
  };
  
  const isLoginPage = location.pathname === '/login';
  if(isLoginPage) {
    return null;
  }

  const navLinks: { role: string; links: { to: string; label: string }[] }[] = [
    {
      role: "admin",
      links: [
        { to: "/admin-dashboard", label: "Admin Dashboard" },
        { to: "/manage-users", label: "Manage Users" },
      ]
    },
  ]

  const isPathActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <nav className="w-full fixed top-0 z-50 shaddow-lg">
      <div className="navbar flex flex-row bg-bg-card text-text-primary shadow-lg w-full">
        
        <div className="flex flex-1 flex-row items-center justify-start space-x-32">
          <div className="flex items-center">
            <img src={CSELogo} alt="CSE Logo" className="w-14 h-8 mr-2" />
            <Link to="/" className="text-xl text-text-primary font-marcellus">
              TA Appointment System
            </Link>
          </div>
          {/* Nav Links */}
          <ul className="flex space-x-4">
            <li className={`font-raleway hover:text-primary transition duration-300 ease-in-out ${location.pathname === '/' ? 'font-semibold text-primary-dark' : 'text-text-secondary'}`}>
              <Link to="/">Home</Link>
            </li>

            {navLinks.map((nav) => {
              if (user && user.role === nav.role) {
                return nav.links.map((link) => (
                  <li key={link.to} className={`font-raleway hover:text-primary transition duration-300 ease-in-out ${isPathActive(link.to) ? 'font-semibold text-primary-dark' : 'text-text-secondary'}`}>
                    <Link to={link.to}>{link.label}</Link>
                  </li>
                ));
              }
              return null;
            })}
          </ul>
        </div>

        <div className="flex flex-row gap-2">
          

          {loading ? (
            <span className="loading loading-spinner text-primary"></span>
          ) : user ? (
            <>
              {" "}
              <div className="flex flex-col items-end">
                <p className="text-md text-text-primary font-semibold">
                  {user.name}
                </p>
                <p className="text-sm text-text-secondary">{user.email}</p>
              </div>
              <div className="dropdown dropdown-end mx-5">
                <div
                  tabIndex={0}
                  role="button"
                  className="btn border-2 border-primary btn-circle avatar"
                >
                  <div className="w-10 rounded-full">
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
                  <li className="rounded p-1 hover:bg-primary/80 hover:text-text-inverted text-text-secondary font-semibold">
                    <Link
                      to="/profile"
                      className="px-2 flex flex-row items-center gap-2"
                    >
                      <FaUser />
                      Profile
                    </Link>
                  </li>
                  <li className="rounded mt-2 p-1 hover:bg-primary/80 hover:text-text-inverted text-text-secondary font-semibold">
                    <Link
                      to="/settings"
                      className="px-2 flex flex-row items-center gap-2"
                    >
                      <FaCog />
                      Settings
                    </Link>
                  </li>
                  <div className="px-2 my-2 h-[1px] w-full bg-text-secondary/20"></div>
                  <li
                    onClick={handleLogout}
                    className="flex flex-row text-error rounded p-1 hover:bg-primary/80 hover:text-text-inverted font-semibold cursor-pointer"
                  >
                    <div className="px-2 flex flex-row items-center gap-2 w-full">
                      <FaSignOutAlt />
                      <p>Logout</p>
                    </div>
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <Link to="/login" className="btn bg-primary text-text-primary">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;