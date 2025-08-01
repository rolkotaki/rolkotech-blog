import { Link } from "react-router-dom";
import { useState } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../hooks/useAuth";
import ConfirmDialog from "./ConfirmDialog";

interface MobileMenuProps {
  isOpen: boolean;
}

function MobileMenu({ isOpen }: MobileMenuProps) {
  const { isAuthenticated, logout, user, deleteUser } = useAuth();
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen) return null;

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
              <span className="text-sm text-gray-600">Hello, {user.name}</span>
            )}
            <Link to="/me" className="text-sm text-blue-600 hover:underline">
              Update Profile
            </Link>
            <Link
              to="/me/password"
              className="text-sm text-blue-600 hover:underline"
            >
              Change Password
            </Link>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="text-sm text-red-600 hover:underline text-left"
            >
              Delete My Account
            </button>

            <button
              onClick={logout}
              className="text-sm text-gray-700 hover:underline text-left"
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
