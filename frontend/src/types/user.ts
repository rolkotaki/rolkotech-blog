export const USERS_PER_LOAD = 50;

export interface User {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  creation_date: string;
}

export interface Users {
  data: User[];
  count: number;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  is_active?: boolean;
  is_superuser?: boolean;
}

export interface UpdateMeRequest {
  name: string;
  email: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}
