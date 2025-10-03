import React from "react";
import { FaCog, FaUser, FaSignOutAlt } from "react-icons/fa";
import CSELogo from "../../assets/images/cse-logo.png";
import { useAuth } from "../../contexts/AuthContext";
import { useLocation, Link } from "react-router-dom";



interface NavbarProps {
  ref: React.Ref<HTMLDivElement>;
}

const Navbar = React.forwardRef<HTMLDivElement, NavbarProps>((props, ref) => {
  const { user, loading, logout, isLoggingOut } = useAuth(); // Destructure the new state
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
    <nav ref={ref} className="w-full fixed top-0 z-50 shadow-sm">
      <div className="navbar flex flex-row bg-bg-card text-text-primary shadow-lg w-full">
        
        <div className="flex flex-row items-center justify-start flex-1 space-x-32">
          <div className="flex items-center">
            <img src={CSELogo} alt="CSE Logo" className="h-8 mr-2 w-14" />
            <Link to="/" className="text-xl text-text-primary font-mercellus">
              <p className="hidden lg:flex">TA Appointment System</p>
              <p className="lg:hidden">TAAS</p>
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

                    {link.subMenu ? (
                      <div className="group">
                        <p role="button">{link.label}</p>
                        <ul className="hidden outline-text-secondary/20 outline-1 outline rounded-sm absolute group-hover:block menu bg-bg-card z-10 w-48 p-2 drop-shadow">
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

        <div className="flex flex-row gap-2">
          

          {loading ? (
            <span className="loading loading-spinner text-primary"></span>
          ) : user ? (
            <>
              {" "}
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
                  <div className="h-10 w-10 rounded-full">
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
            <Link to="/login" className="btn bg-primary text-text-primary">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
});

export default Navbar;