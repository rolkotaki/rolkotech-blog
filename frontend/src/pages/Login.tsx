import React, { useState, useEffect } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import BackendErrorMessage from "../components/Common/BackendErrorMessage";
import BackendSuccessMessage from "../components/Common/BackendSuccessMessage";
import PasswordToggleButton from "../components/Common/PasswordToggleButton";
import GoToSignUpLink from "../components/Common/GoToSignUpLink";
import ForgotPasswordModal from "../components/Common/ForgotPasswordModal";

function LogIn() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [success, setSuccess] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] =
    useState<boolean>(false);
  const [searchParams, setSearchParams] = useSearchParams();

  const { login, isAuthenticated } = useAuth();

  // Handles activation and password reset messages from backend
  useEffect(() => {
    const message = searchParams.get("message");
    const error = searchParams.get("error");

    if (message) {
      switch (message) {
        case "signup_success":
          setSuccess(
            "Account created successfully! We have sent you an email to verify your account.",
          );
          break;
        case "activation_success":
          setSuccess("Account activated successfully! You can now log in.");
          break;
        case "already_activated":
          setSuccess("Account is already activated. You can log in.");
          break;
        case "password_reset_success":
          setSuccess(
            "Password reset successfully! You can now log in with your new password.",
          );
          break;
        default:
          break;
      }
      setSearchParams({});
    }

    if (error) {
      switch (error) {
        case "invalid_link":
          setError("Invalid or expired activation link.");
          break;
        case "activation_failed":
          setError("Account activation failed.");
          break;
        case "invalid_reset_link":
          setError(
            "Invalid or expired password reset link. Please request a new one.",
          );
          break;
        default:
          setError("An error occurred. Please try again.");
          break;
      }
      setSearchParams({});
    }
  }, [searchParams, setSearchParams]);

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      await login(email, password);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Invalid email or password.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-grow flex justify-center items-start py-12">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-semibold text-blue-700 mb-6">
          Log in to your account
        </h2>

        {/* Success message from backend */}
        <BackendSuccessMessage success={success} />

        {/* Error message from backend */}
        <BackendErrorMessage error={error} />

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Password with toggle */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 px-4 py-2 rounded-md pr-10 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <PasswordToggleButton
              isVisible={showPassword}
              onToggle={() => setShowPassword(!showPassword)}
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Logging in..." : "Log In"}
          </button>
        </form>

        {/* Forgot password link */}
        <div className="mt-4 text-center">
          <button
            onClick={() => setShowForgotPasswordModal(true)}
            className="text-blue-600 hover:text-blue-800 underline text-sm"
          >
            Forgot your password?
          </button>
        </div>

        <GoToSignUpLink />

        {/* Forgot password modal */}
        <ForgotPasswordModal
          isOpen={showForgotPasswordModal}
          onClose={() => setShowForgotPasswordModal(false)}
        />
      </div>
    </div>
  );
}

export default LogIn;
