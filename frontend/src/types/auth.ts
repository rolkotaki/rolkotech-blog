import type { User } from "./user";

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
}

export interface PasswordResetRequest {
  token: string;
  new_password: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  deleteUser: () => Promise<void>;
  setUser: (user: User | null) => void;
  isAuthenticated: boolean;
  isSuperUser: boolean;
  isLoading: boolean;
}
