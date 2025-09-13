import api from "./api";
import type {
  Users,
  User,
  UpdateUserRequest,
  UpdateMeRequest,
  ChangePasswordRequest,
  Message,
} from "../types";
import { USERS_PER_LOAD } from "../types/user";

export const userService = {
  getUsers: async (
    page: number,
    searchByName?: string,
    searchByEmail?: string,
    searchByActive?: boolean,
    searchBySuperuser?: boolean,
  ): Promise<Users> => {
    const limit: number = USERS_PER_LOAD;
    const skip: number = (page - 1) * limit;

    let url = `/users?limit=${limit}&skip=${skip}`;
    if (searchByName)
      url += `&search_by_name=${encodeURIComponent(searchByName)}`;
    if (searchByEmail)
      url += `&search_by_email=${encodeURIComponent(searchByEmail)}`;
    if (searchByActive !== undefined)
      url += `&search_by_active=${searchByActive}`;
    if (searchBySuperuser !== undefined)
      url += `&search_by_superuser=${searchBySuperuser}`;

    const response = await api.get<Users>(url);
    return response.data;
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get<User>("/users/me");
    return response.data;
  },

  updateUser: async (
    id: string,
    userData: UpdateUserRequest,
  ): Promise<User> => {
    const response = await api.patch<User>(`/users/${id}`, userData);
    return response.data;
  },

  updateMe: async (userData: UpdateMeRequest): Promise<User> => {
    const response = await api.patch<User>("/users/me", userData);
    return response.data;
  },

  changePassword: async (
    passwordData: ChangePasswordRequest,
  ): Promise<Message> => {
    const response = await api.patch<Message>(
      "/users/me/password",
      passwordData,
    );
    return response.data;
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  deleteMe: async (): Promise<void> => {
    await api.delete("/users/me");
  },
};
