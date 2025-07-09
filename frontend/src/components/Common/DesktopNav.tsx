import { Link } from "react-router-dom";

function DesktopNav() {
  return (
    <nav className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 space-x-6 text-gray-600 font-medium">
      <Link to="/" className="hover:text-blue-600">
        Home
      </Link>
      <Link to="/articles" className="hover:text-blue-600">
        Articles
      </Link>
      <Link to="/about" className="hover:text-blue-600">
        About
      </Link>
    </nav>
  );
}

export default DesktopNav;
