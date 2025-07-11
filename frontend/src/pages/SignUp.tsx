import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

function SignUp() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [fieldErrors, setFieldErrors] = useState<{ [key: string]: string }>({});

  const { register, isAuthenticated } = useAuth();

  // Redirect if already authenticated
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Validation functions
  const validateName = (value: string): string => {
    if (!value.trim()) return "Name is required";
    if (value.trim().length < 1) return "Name must be at least 1 character";
    if (value.trim().length > 255)
      return "Name must be less than 256 characters";
    return "";
  };

  const validateEmail = (value: string): string => {
    if (!value.trim()) return "Email is required";
    if (value.trim().length > 255)
      return "Email must be less than 256 characters";
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) return "Please enter a valid email address";
    return "";
  };

  const validatePassword = (value: string): string => {
    if (!value) return "Password is required";
    if (value.length < 8) return "Password must be at least 8 characters";
    if (value.trim().length > 40)
      return "Password must be less than 41 characters";
    if (!/[A-Z]/.test(value))
      return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(value))
      return "Password must contain at least one lowercase letter";
    if (!/\d/.test(value)) return "Password must contain at least one number";
    if (!/[!@#$%^&*(),.?":{}|<>/\\[\]~`_+=\-;']/.test(value))
      return "Password must contain at least one special character";
    return "";
  };

  // Real-time validation on blur
  const handleBlur = (field: string, value: string) => {
    let errorMessage = "";

    switch (field) {
      case "name":
        errorMessage = validateName(value);
        break;
      case "email":
        errorMessage = validateEmail(value);
        break;
      case "password":
        errorMessage = validatePassword(value);
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

    errors.name = validateName(name);
    errors.email = validateEmail(email);
    errors.password = validatePassword(password);

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

    // Validate form before submission
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      // register function already navigates to /login on success
      await register(name, email, password);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const errorMessage =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Registration failed. Please try again.";
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-grow flex justify-center items-start py-12">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-semibold text-blue-700 mb-6">
          Create an account
        </h2>

        {/* Error message from backend */}
        {error && (
          <div className="text-red-600 text-sm mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div>
            <input
              type="text"
              name="name"
              placeholder="Name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => handleBlur("name", name)}
              onFocus={() => handleFocus("name")}
              className={`w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                fieldErrors.name
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
            />
            {fieldErrors.name && (
              <p className="text-red-600 text-xs mt-1">{fieldErrors.name}</p>
            )}
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
            {fieldErrors.email && (
              <p className="text-red-600 text-xs mt-1">{fieldErrors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => handleBlur("password", password)}
              onFocus={() => handleFocus("password")}
              className={`w-full border px-4 py-2 rounded-md focus:outline-none focus:ring-2 ${
                fieldErrors.password
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
            />
            {fieldErrors.password && (
              <p className="text-red-600 text-xs mt-1">
                {fieldErrors.password}
              </p>
            )}
            {/* Password requirements hint */}
            <p className="text-xs text-gray-500 mt-1">
              Password must be at least 8 characters with uppercase, lowercase,
              number, and special character
            </p>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isLoading ? "Creating account..." : "Sign Up"}
          </button>
        </form>

        {/* Login Link */}
        <p className="mt-4 text-sm text-center">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default SignUp;
