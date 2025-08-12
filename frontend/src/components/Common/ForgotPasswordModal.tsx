import React, { useState } from "react";
import { validateEmail } from "../../utils/validation";
import { authService } from "../../services/auth.service";
import BackendErrorMessage from "./BackendErrorMessage";
import FieldError from "./FieldError";
import BackendSuccessMessage from "./BackendSuccessMessage";

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function ForgotPasswordModal({ isOpen, onClose }: ForgotPasswordModalProps) {
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [emailError, setEmailError] = useState<string>("");

  // Real-time validation on blur
  const handleBlur = () => {
    const errorMessage = validateEmail(email);
    setEmailError(errorMessage);
  };

  // Clear email error when user starts typing
  const handleFocus = () => {
    if (emailError) {
      setEmailError("");
    }
  };

  // Validate form before submission
  const validateForm = (): boolean => {
    const errorMessage = validateEmail(email);
    setEmailError(errorMessage);
    return !errorMessage;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!validateForm()) {
      return;
    }
    setIsLoading(true);

    try {
      const response = await authService.forgotPassword(email);
      setSuccess(response.message);
      setIsSuccess(true);
    } catch {
      setError("Failed to send the password reset email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setError("");
    setSuccess("");
    setIsSuccess(false);
    setIsLoading(false);
    setEmailError("");
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md mx-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            Reset Password
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 text-xl"
          >
            ×
          </button>
        </div>

        {isSuccess ? (
          <div className="text-center">
            <BackendSuccessMessage success={success} />
            <button
              onClick={handleClose}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Close
            </button>
          </div>
        ) : (
          <>
            <p className="text-gray-600 mb-4">
              Enter your email address and we'll send you a link to reset your
              password.
            </p>

            <BackendErrorMessage error={error} />

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  placeholder="Enter your email address"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onBlur={handleBlur}
                  onFocus={handleFocus}
                  className={`w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                    emailError
                      ? "border-red-500 focus:ring-red-500"
                      : "border-gray-300 focus:ring-blue-500"
                  }`}
                  disabled={isLoading}
                />
                <FieldError error={emailError} />
              </div>

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? "Sending..." : "Send Reset Link"}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default ForgotPasswordModal;
