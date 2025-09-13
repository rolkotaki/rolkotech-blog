import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { userService } from "../services/user.service";
import { validateEmail, validateUsername } from "../utils/validation";
import BackendErrorMessage from "../components/Common/BackendErrorMessage";
import BackendSuccessMessage from "../components/Common/BackendSuccessMessage";
import BackToHomeLink from "../components/Common/BackToHomeLink";
import FieldError from "../components/Common/FieldError";

function UpdateMe() {
  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const { isAuthenticated, user, setUser, isLoading: authLoading } = useAuth();

  // Use current user data
  useEffect(() => {
    if (user) {
      setUsername(user.name);
      setEmail(user.email);
    }
  }, [user]);

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
  const validateUsernameField = (value: string): string => {
    return validateUsername(value);
  };

  const validateEmailField = (value: string): string => {
    return validateEmail(value);
  };

  // Real-time validation on blur
  const handleBlur = (field: string, value: string) => {
    let errorMessage = "";

    switch (field) {
      case "username":
        errorMessage = validateUsernameField(value);
        break;
      case "email":
        errorMessage = validateEmailField(value);
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

    errors.username = validateUsernameField(username);
    errors.email = validateEmailField(email);

    // Filter out empty error messages
    const validationErrors = Object.keys(errors).reduce(
      (acc, key) => {
        if (errors[key]) {
          acc[key] = errors[key];
        }
        return acc;
      },
      {} as { [key: string]: string },
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
      const updatedUser = await userService.updateMe({ name: username, email });
      setUser(updatedUser);
      setSuccess("Profile updated successfully!");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error("Update profile error:", err);
      const errorMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update profile. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-grow flex justify-center items-start py-12">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-semibold text-blue-700 mb-6">
          Update Profile
        </h2>

        {/* Success message */}
        <BackendSuccessMessage success={success} />

        {/* Error message from backend */}
        <BackendErrorMessage error={error} />

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username */}
          <div>
            <input
              type="text"
              name="username"
              placeholder="Username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onBlur={() => handleBlur("username", username)}
              onFocus={() => handleFocus("username")}
              className={`w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                fieldErrors.username
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
            />
            <FieldError error={fieldErrors.username} />
          </div>

          {/* Email */}
          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onBlur={() => handleBlur("email", email)}
              onFocus={() => handleFocus("email")}
              className={`w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                fieldErrors.email
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
            />
            <FieldError error={fieldErrors.email} />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Updating..." : "Update"}
          </button>
        </form>

        <BackToHomeLink />
      </div>
    </div>
  );
}

export default UpdateMe;
