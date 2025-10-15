// import { Link, useLocation } from "react-router-dom";
// import { GraduationCap, Search, FileText, CheckCircle } from "lucide-react";

// const navigationItems = [
//   { name: "Available Positions", path: "/ta-dashboard", icon: Search },
//   { name: "Applied Positions", path: "/ta-applied", icon: FileText },
//   { name: "Accepted Positions", path: "/ta-accepted", icon: CheckCircle },
// ];

// // Reusable Nav Item Component (no cn function)
// type NavItemProps = {
//   item: {
//     name: string;
//     path: string;
//     icon: React.ElementType;
//   };
//   isActive: boolean;
//   variant: "desktop" | "mobile";
// };

// const NavItem = ({ item, isActive, variant }: NavItemProps) => {
//   const Icon = item.icon;

//   let baseClasses =
//     variant === "desktop"
//       ? "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200"
//       : "flex flex-col items-center gap-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200";

//   let activeClasses =
//     variant === "desktop"
//       ? "bg-primary text-primary-foreground shadow-sm"
//       : "bg-primary text-primary-foreground";

//   let inactiveClasses =
//     variant === "desktop"
//       ? "text-muted-foreground hover:text-foreground hover:bg-muted"
//       : "text-muted-foreground hover:text-foreground hover:bg-muted";

//   const finalClasses = `${baseClasses} ${isActive ? activeClasses : inactiveClasses}`;

//   return (
//     <Link
//       to={item.path}
//       className={finalClasses}
//       aria-current={isActive ? "page" : undefined}
//     >
//       <Icon className="w-4 h-4" />
//       {variant === "desktop"
//         ? item.name
//         : <span className="text-[10px]">{item.name.split(" ")[0]}</span>}
//     </Link>
//   );
// };

// export const Navigation = () => {
//   const location = useLocation();

//   return (
//     <nav
//       className="sticky top-0 z-50 border-b shadow-sm bg-card border-border"
//       aria-label="Main navigation"
//     >
//       <div className="container px-4 mx-auto">
//         <div className="flex items-center justify-between h-16">
          
//           {/* Logo */}
//           <Link to="/" className="flex items-center gap-3">
//             <div className="p-2 rounded-lg bg-primary/10">
//               <GraduationCap className="w-6 h-6 text-primary" />
//             </div>
//             <div>
//               <h1 className="text-xl font-bold text-foreground">TA Portal</h1>
//               <p className="text-xs text-muted-foreground">
//                 Teaching Assistant Application System
//               </p>
//             </div>
//           </Link>

//           {/* Desktop Navigation */}
//           <div className="items-center hidden space-x-1 md:flex">
//             {navigationItems.map((item) => {
//               const isActive = location.pathname.startsWith(item.path);
//               return (
//                 <NavItem
//                   key={item.path}
//                   item={item}
//                   isActive={isActive}
//                   variant="desktop"
//                 />
//               );
//             })}
//           </div>

//           {/* Mobile Navigation */}
//           <div className="flex items-center space-x-1 md:hidden">
//             {navigationItems.map((item) => {
//               const isActive = location.pathname.startsWith(item.path);
//               return (
//                 <NavItem
//                   key={item.path}
//                   item={item}
//                   isActive={isActive}
//                   variant="mobile"
//                 />
//               );
//             })}
//           </div>
//         </div>
//       </div>
//     </nav>
//   );
// };
