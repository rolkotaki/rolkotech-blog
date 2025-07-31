import { useEffect } from "react";

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: "danger" | "warning" | "info";
}

interface VariantStyles {
  icon: string;
  confirmButton: string;
}

function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
  variant = "info",
}: ConfirmDialogProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCancel();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      // Prevent body scroll when modal is open
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  const getVariantStyles = (): VariantStyles => {
    switch (variant) {
      case "danger":
        return {
          icon: "⚠️",
          confirmButton: "bg-red-600 hover:bg-red-700 focus:ring-red-500",
        };
      case "warning":
        return {
          icon: "⚠️",
          confirmButton:
            "bg-orange-600 hover:bg-orange-700 focus:ring-orange-500",
        };
      case "info":
        return {
          icon: "ℹ️",
          confirmButton: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
        };
    }
  };

  const styles: VariantStyles = getVariantStyles();

  return (
    <>
      {/* Background */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={onCancel}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="bg-white rounded-lg shadow-xl max-w-md w-full mx-auto transform transition-all"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">{styles.icon}</span>
              <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 py-4">
            <p className="text-gray-700 leading-relaxed">{message}</p>
          </div>

          {/* Actions */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex space-x-3 justify-end rounded-b-lg">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors text-sm font-medium"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors text-sm font-medium ${styles.confirmButton}`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

export default ConfirmDialog;
