import React, { useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { userService } from "../services/user.service";
import {
  validatePassword,
  validatePasswordConfirmation,
  validateRequired
} from "../utils/validation";
import BackendErrorMessage from "../components/Common/BackendErrorMessage";
import BackendSuccessMessage from "../components/Common/BackendSuccessMessage";
import PasswordToggleButton from "../components/Common/PasswordToggleButton";
import PasswordInfo from "../components/Common/PasswordInfo";
import FieldError from "../components/Common/FieldError";
import BackToHomeLink from "../components/Common/BackToHomeLink";

function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState<string>("");
  const [newPassword, setNewPassword] = useState<string>("");
  const [newPasswordConf, setNewPasswordConf] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [showCurrentPassword, setShowCurrentPassword] =
    useState<boolean>(false);
  const [showNewPassword, setShowNewPassword] = useState<boolean>(false);
  const [showNewPasswordConf, setShowNewPasswordConf] =
    useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const { isAuthenticated, isLoading: authLoading } = useAuth();

  // Show loading spinner while authentication is being determined
  if (authLoading) {
    return (
      <div className="flex-grow flex justify-center items-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Redirect if not authenticated
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Validation functions
  const validateCurrentPassword = (value: string): string => {
    return validateRequired(value, "Current password");
  };

  const validateNewPassword = (value: string): string => {
    return validatePassword(value);
  };

  const validateConfirmPassword = (value: string): string => {
    return validatePasswordConfirmation(newPassword, value);
  };

  // Real-time validation on blur
  const handleBlur = (field: string, value: string) => {
    let errorMessage = "";

    switch (field) {
      case "currentPassword":
        errorMessage = validateCurrentPassword(value);
        break;
      case "newPassword":
        errorMessage = validateNewPassword(value);
        if (newPasswordConf) {
          const confirmError = validateConfirmPassword(newPasswordConf);
          setFieldErrors((prev) => ({
            ...prev,
            newPasswordConf: confirmError
          }));
        }
        break;
      case "newPasswordConf":
        errorMessage = validateConfirmPassword(value);
        break;
      default:
        errorMessage = "";
    }

    setFieldErrors((prev) => ({
      ...prev,
      [field]: errorMessage
    }));
  };

  // Clear field error when user starts typing
  const handleFocus = (field: string) => {
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({
        ...prev,
        [field]: ""
      }));
    }
  };

  // Validate all fields before submit
  const validateForm = (): boolean => {
    const errors: { [key: string]: string } = {};

    errors.currentPassword = validateCurrentPassword(currentPassword);
    errors.newPassword = validateNewPassword(newPassword);
    errors.newPasswordConf = validateConfirmPassword(newPasswordConf);

    // Filter out empty error messages
    const validationErrors = Object.keys(errors).reduce(
      (acc, key) => {
        if (errors[key]) {
          acc[key] = errors[key];
        }
        return acc;
      },
      {} as { [key: string]: string }
    );

    setFieldErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
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
      const response = await userService.changePassword({
        current_password: currentPassword,
        new_password: newPassword
      });
      setSuccess(response.message);
      setCurrentPassword("");
      setNewPassword("");
      setNewPasswordConf("");
      setFieldErrors({});
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update password. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-grow flex justify-center items-start py-12">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-semibold text-blue-700 mb-6">
          Change Password
        </h2>

        {/* Success message */}
        <BackendSuccessMessage success={success} />

        {/* Error message from backend */}
        <BackendErrorMessage error={error} />

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Current Password */}
          <div>
            <div className="relative">
              <input
                type={showCurrentPassword ? "text" : "password"}
                name="current_password"
                placeholder="Current Password"
                required
                value={currentPassword}
                onBlur={() => handleBlur("currentPassword", currentPassword)}
                onFocus={() => handleFocus("currentPassword")}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className={`w-full border px-4 py-2 rounded-md pr-10 focus:outline-none focus:ring-2 ${
                  fieldErrors.currentPassword
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />

              <PasswordToggleButton
                isVisible={showCurrentPassword}
                onToggle={() => setShowCurrentPassword(!showCurrentPassword)}
              />
            </div>
            <FieldError error={fieldErrors.currentPassword} />
          </div>

          {/* New Password */}
          <div>
            <div className="relative">
              <input
                type={showNewPassword ? "text" : "password"}
                name="new_password"
                placeholder="New Password"
                required
                value={newPassword}
                onBlur={() => handleBlur("newPassword", newPassword)}
                onFocus={() => handleFocus("newPassword")}
                onChange={(e) => setNewPassword(e.target.value)}
                className={`w-full border px-4 py-2 rounded-md pr-10 focus:outline-none focus:ring-2 ${
                  fieldErrors.newPassword
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />

              <PasswordToggleButton
                isVisible={showNewPassword}
                onToggle={() => setShowNewPassword(!showNewPassword)}
              />
            </div>
            <FieldError error={fieldErrors.newPassword} />
          </div>

          {/* New Password confirmation */}
          <div>
            <div className="relative">
              <input
                type={showNewPasswordConf ? "text" : "password"}
                name="new_password_conf"
                placeholder="Confirm New Password"
                required
                value={newPasswordConf}
                onBlur={() => handleBlur("newPasswordConf", newPasswordConf)}
                onFocus={() => handleFocus("newPasswordConf")}
                onChange={(e) => setNewPasswordConf(e.target.value)}
                className={`w-full border px-4 py-2 rounded-md pr-10 focus:outline-none focus:ring-2 ${
                  fieldErrors.newPasswordConf
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
              />

              <PasswordToggleButton
                isVisible={showNewPasswordConf}
                onToggle={() => setShowNewPasswordConf(!showNewPasswordConf)}
              />
            </div>
            <FieldError error={fieldErrors.newPasswordConf} />
          </div>
          <PasswordInfo />

          {/* Show positive feedback when passwords match */}
          {newPassword &&
            newPasswordConf &&
            !fieldErrors.newPasswordConf &&
            newPassword === newPasswordConf && (
              <p className="text-green-600 text-xs mt-1">✓ Passwords match</p>
            )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Updating..." : "Update Password"}
          </button>
        </form>

        <BackToHomeLink />
      </div>
    </div>
  );
}

export default ChangePassword;
