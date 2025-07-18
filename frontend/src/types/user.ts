export interface User {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
  is_superuser: boolean;
  creation_date: string;
}

export interface UpdateMeRequest {
  name: string;
  email: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  new_password: string;
}

export interface Message {
  message: string;
}
