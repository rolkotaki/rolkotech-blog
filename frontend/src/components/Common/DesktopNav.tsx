import { Link, useLocation } from "react-router-dom";

function DesktopNav() {
  const location = useLocation();

  const getLinkClassName = (path: string) => {
    const isActive = location.pathname === path;
    return `hover:text-blue-600 transition-colors duration-200 ${
      isActive
        ? "text-blue-600 font-semibold border-b-2 border-blue-600 pb-1"
        : "text-gray-600"
    }`;
  };

  return (
    <nav className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 space-x-6 font-medium">
      <Link to="/" className={getLinkClassName("/")}>
        Home
      </Link>
      <Link to="/articles" className={getLinkClassName("/articles")}>
        Articles
      </Link>
      <Link to="/about" className={getLinkClassName("/about")}>
        About
      </Link>
    </nav>
  );
}

export default DesktopNav;
