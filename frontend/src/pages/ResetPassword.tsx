import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { authService } from "../services/auth.service";
import {
  validatePassword,
  validatePasswordConfirmation,
} from "../utils/validation";
import BackendErrorMessage from "../components/Common/BackendErrorMessage";
import PasswordToggleButton from "../components/Common/PasswordToggleButton";
import PasswordInfo from "../components/Common/PasswordInfo";
import FieldError from "../components/Common/FieldError";

function ResetPassword() {
  const [newPassword, setNewPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();

  const token = searchParams.get("token");

  // Redirect if no token provided
  useEffect(() => {
    if (!token) {
      navigate("/login?error=invalid_reset_link");
    }
  }, [token, navigate]);

  // Log out if authenticated
  if (isAuthenticated) {
    logout();
  }

  // Validation functions
  const validatePasswordField = (value: string): string => {
    return validatePassword(value);
  };

  const validateConfirmPasswordField = (value: string): string => {
    return validatePasswordConfirmation(newPassword, value);
  };

  // Real-time validation on blur
  const handleBlur = (field: string, value: string) => {
    let errorMessage = "";

    switch (field) {
      case "newPassword":
        errorMessage = validatePasswordField(value);
        break;
      case "confirmPassword":
        errorMessage = validateConfirmPasswordField(value);
        break;
    }

    setFieldErrors((prev) => ({
      ...prev,
      [field]: errorMessage,
    }));
  };

  // Clear field error when user starts typing
  const handleFocus = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: "",
      }));
    }
  };

  // Validate all fields before submission
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    errors.newPassword = validatePasswordField(newPassword);
    errors.confirmPassword = validateConfirmPasswordField(confirmPassword);

    // Filter out empty error messages
    const validationErrors = Object.keys(errors).reduce((acc, key) => {
      if (errors[key]) {
        acc[key] = errors[key];
      }
      return acc;
    }, {} as { [key: string]: string });

    setFieldErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!validateForm()) {
      return;
    }

    if (!token) {
      setError("Invalid reset token.");
      return;
    }

    setIsLoading(true);

    try {
      await authService.resetPassword({
        token: token,
        new_password: newPassword,
      });

      // Redirect to login with success message
      navigate("/login?message=password_reset_success");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to reset password. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-grow flex justify-center items-start py-12">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-semibold text-blue-700 mb-6">
          Reset Your Password
        </h2>

        {/* Error message */}
        <BackendErrorMessage error={error} />

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* New Password */}
          <div>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="newPassword"
                placeholder="New Password"
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                onBlur={() => handleBlur("newPassword", newPassword)}
                onFocus={() => handleFocus("newPassword")}
                className={`w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                  fieldErrors.newPassword
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              <PasswordToggleButton
                isVisible={showPassword}
                onToggle={() => setShowPassword(!showPassword)}
              />
            </div>
            <FieldError error={fieldErrors.newPassword} />
          </div>

          {/* Confirm Password */}
          <div>
            <div className="relative">
              <input
                type={showConfirmPassword ? "text" : "password"}
                name="confirmPassword"
                placeholder="Confirm New Password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onBlur={() => handleBlur("confirmPassword", confirmPassword)}
                onFocus={() => handleFocus("confirmPassword")}
                className={`w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                  fieldErrors.confirmPassword
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />
              <PasswordToggleButton
                isVisible={showConfirmPassword}
                onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
              />
            </div>
            <FieldError error={fieldErrors.confirmPassword} />
          </div>

          {/* Password requirements */}
          <PasswordInfo />

          {/* Show positive feedback when passwords match */}
          {newPassword &&
            confirmPassword &&
            !fieldErrors.confirmPassword &&
            newPassword === confirmPassword && (
              <p className="text-green-600 text-xs mt-1">✓ Passwords match</p>
            )}

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Resetting Password..." : "Reset Password"}
          </button>
        </form>

        {/* Back to login link */}
        <div className="mt-6 text-center">
          <button
            onClick={() => navigate("/login")}
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            Back to Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
