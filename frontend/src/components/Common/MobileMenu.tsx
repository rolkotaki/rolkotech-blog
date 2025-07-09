import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

interface MobileMenuProps {
  isOpen: boolean;
}

function MobileMenu({ isOpen }: MobileMenuProps) {
  const { isAuthenticated, logout, user } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="md:hidden px-4 pb-4 space-y-2">
      <nav className="flex flex-col space-y-2 text-gray-700">
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

      <div className="flex flex-col space-y-2 pt-2 border-t border-gray-200">
        {isAuthenticated ? (
          <>
            {user && (
              <span className="text-sm text-gray-600">
                Hello, {user.name}
              </span>
            )}
            <button
              onClick={logout}
              className="text-sm text-red-600 hover:underline text-left"
            >
              Log Out
            </button>
          </>
        ) : (
          <>
            <Link
              to="/signup"
              className="text-sm text-blue-600 hover:underline"
            >
              Sign Up
            </Link>
            <Link to="/login" className="text-sm text-blue-600 hover:underline">
              Log In
            </Link>
          </>
        )}
      </div>
    </div>
  );
}

export default MobileMenu;
