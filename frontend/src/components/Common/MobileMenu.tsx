import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../hooks/useAuth";
import ConfirmDialog from "./ConfirmDialog";

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { isAuthenticated, logout, user, deleteUser } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const location = useLocation();

  if (!isOpen) return null;

  const getLinkClassName = (path: string) => {
    const isActive = location.pathname === path;
    return `hover:text-blue-600 transition-colors duration-200 py-2 px-3 rounded-md ${
      isActive ? "text-blue-600 font-semibold bg-blue-50" : "text-gray-600"
    }`;
  };

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

  return (
    <div className="md:hidden px-4 pb-4 space-y-2">
      <nav className="flex flex-col space-y-1">
        <Link to="/" className={getLinkClassName("/")} onClick={onClose}>
          Home
        </Link>
        <Link
          to="/articles"
          className={getLinkClassName("/articles")}
          onClick={onClose}
        >
          Articles
        </Link>
        <Link
          to="/about"
          className={getLinkClassName("/about")}
          onClick={onClose}
        >
          About
        </Link>
      </nav>

      <div className="flex flex-col space-y-2 pt-2 border-t border-gray-200">
        {isAuthenticated ? (
          <>
            {user && (
              <>
                <span className="text-sm text-gray-600">
                  Hello, {user.name}
                </span>
                <Link
                  to="/me"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Update Profile
                </Link>
                <Link
                  to="/me/password"
                  className="text-sm text-blue-600 hover:underline"
                >
                  Change Password
                </Link>
                {!user.is_superuser && (
                  <button
                    onClick={() => setShowDeleteModal(true)}
                    className="text-sm text-red-600 hover:underline text-left"
                  >
                    Delete My Account
                  </button>
                )}
                <button
                  onClick={logout}
                  className="text-sm text-gray-700 hover:underline text-left"
                >
                  Log Out
                </button>
              </>
            )}
          </>
        ) : (
          <>
            <Link
              to="/signup"
              className="text-sm text-blue-600 hover:underline"
              onClick={onClose}
            >
              Sign Up
            </Link>
            <Link
              to="/login"
              className="text-sm text-blue-600 hover:underline"
              onClick={onClose}
            >
              Log In
            </Link>
          </>
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
        document.body
      )}
    </div>
  );
}

export default MobileMenu;
