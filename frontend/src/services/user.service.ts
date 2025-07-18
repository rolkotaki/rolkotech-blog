import api from "./api";
import type {
  User,
  UpdateMeRequest,
  ChangePasswordRequest,
  Message,
} from "../types";

export const userService = {
  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>("/users/me");
    return response.data;
  },

  updateMe: async (userData: UpdateMeRequest): Promise<User> => {
    const response = await api.patch<User>("/users/me", userData);
    return response.data;
  },

  changePassword: async (
    passwordData: ChangePasswordRequest
  ): Promise<Message> => {
    const response = await api.patch<Message>(
      "/users/me/password",
      passwordData
    );
    return response.data;
  },

  deleteMe: async (): Promise<void> => {
    await api.delete("/users/me");
  },
};
