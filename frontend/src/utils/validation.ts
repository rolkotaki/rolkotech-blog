export const validateRequired = (value: string, fieldName: string): string => {
  if (!value || value.trim() === "") return `${fieldName} is required`;
  return "";
};

export const validatePassword = (value: string): string => {
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

export const validatePasswordConfirmation = (
  password: string,
  confirmPassword: string
): string => {
  if (!confirmPassword) return "Please confirm your password";
  if (confirmPassword !== password) return "Passwords do not match";
  return "";
};

export const validateEmail = (email: string): string => {
  if (!email) return "Email is required";
  if (email.trim().length > 255)
    return "Email must be less than 256 characters";
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) return "Please enter a valid email address";
  return "";
};

export const validateName = (name: string): string => {
  if (!name) return "Name is required";
  if (name.trim().length < 1) return "Name must be at least 1 character";
  if (name.trim().length > 255) return "Name must be less than 256 characters";
  return "";
};
