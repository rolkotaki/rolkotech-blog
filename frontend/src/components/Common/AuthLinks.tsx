import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

function AuthLinks() {
  const { isAuthenticated, logout, user } = useAuth();

  if (isAuthenticated) {
    return (
      <div className="hidden md:flex items-center space-x-4">
        {user && (
          <span className="text-sm text-gray-600">Hello, {user.name}</span>
        )}
        <button
          onClick={logout}
          className="text-sm text-red-600 hover:underline"
        >
          Log Out
        </button>
      </div>
    );
  }

  return (
    <div className="hidden md:flex space-x-4">
      <Link to="/signup" className="text-sm text-blue-600 hover:underline">
        Sign Up
      </Link>
      <Link to="/login" className="text-sm text-blue-600 hover:underline">
        Log In
      </Link>
    </div>
  );
}

export default AuthLinks;
