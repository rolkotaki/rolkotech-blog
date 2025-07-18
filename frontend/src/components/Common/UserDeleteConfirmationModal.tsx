import { useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import BackendErrorMessage from "./BackendErrorMessage";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function UserDeleteConfirmationModal({
  isOpen,
  onClose,
}: ConfirmationModalProps) {
  const { deleteUser } = useAuth();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string>("");

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    setError("");
    try {
      await deleteUser();
      onClose();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Failed to delete account:", err);
      const errorMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to delete account. Please try again.";
      setError(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    setError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Delete Account
          </h3>
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete your account? This action cannot be
            undone and you will lose all your data.
          </p>

          {/* Error message from backend */}
          <BackendErrorMessage error={error} />

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-white rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700 focus:ring-red-500"
            >
              {isDeleting ? "Deleting..." : "Delete Account"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default UserDeleteConfirmationModal;
