import api from "./api";
import type {
  User,
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  PasswordResetRequest,
  Message,
} from "../types";

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const formData = new FormData();
    formData.append("username", credentials.email);
    formData.append("password", credentials.password);

    const response = await api.post<LoginResponse>(
      "/login/access-token",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      },
    );
    return response.data;
  },

  register: async (userData: RegisterRequest): Promise<User> => {
    const response = await api.post<User>("/users/signup", userData);
    return response.data;
  },

  forgotPassword: async (email: string): Promise<Message> => {
    const response = await api.post<Message>(
      "/users/forgot-password?email=" + email,
    );
    return response.data;
  },

  resetPassword: async (data: PasswordResetRequest): Promise<Message> => {
    const response = await api.post<Message>("/users/reset-password", data);
    return response.data;
  },
};
