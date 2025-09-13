import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../hooks/useAuth";
import ConfirmDialog from "../Common/ConfirmDialog";

function AuthLinks() {
  const { isAuthenticated, logout, user, deleteUser } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    try {
      await deleteUser();
      setShowDeleteModal(false);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Failed to delete account:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  if (isAuthenticated) {
    return (
      <>
        <div className="hidden md:flex items-center space-x-4">
          {user && (
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-1 text-sm text-gray-600 hover:text-gray-800 focus:outline-none"
              >
                <span>Hello, {user.name}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${
                    showUserMenu ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 9l-7 7-7-7"
                  ></path>
                </svg>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50 border border-gray-200">
                  <Link
                    to="/me"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Update Profile
                  </Link>
                  <Link
                    to="/me/password"
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                    onClick={() => setShowUserMenu(false)}
                  >
                    Change Password
                  </Link>
                  {!user.is_superuser && (
                    <button
                      onClick={() => {
                        setShowDeleteModal(true);
                        setShowUserMenu(false);
                      }}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      Delete My Account
                    </button>
                  )}
                  <button
                    onClick={() => {
                      logout();
                      setShowUserMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    Log Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {createPortal(
          <ConfirmDialog
            isOpen={showDeleteModal}
            title="Delete Account"
            message="Are you sure you want to delete your account? This action cannot be undone and you will lose all your data."
            confirmText={isDeleting ? "Deleting..." : "Delete Account"}
            cancelText="Cancel"
            onConfirm={handleDeleteAccount}
            onCancel={() => setShowDeleteModal(false)}
            variant="danger"
          />,
          document.body,
        )}
      </>
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
