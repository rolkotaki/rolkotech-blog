import React, { createContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { authService } from "../services/auth.service";
import { userService } from "../services/user.service";
import type { User, AuthContextType } from "../types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token")
  );
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (token) {
      const getUser = async () => {
        try {
          setIsLoading(true);
          const user = await userService.getCurrentUser();
          setUser(user);
        } catch {
          setToken(null);
          localStorage.removeItem("token");
        } finally {
          setIsLoading(false);
        }
      };
      getUser();
    } else {
      setIsLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    if (response?.access_token) {
      setToken(response.access_token);
      localStorage.setItem("token", response.access_token);
      const userProfile = await userService.getCurrentUser();
      setUser(userProfile);
      navigate("/");
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    navigate("/");
  };

  const register = async (name: string, email: string, password: string) => {
    await authService.register({ name: name, email, password });
  };

  const deleteUser = async () => {
    await userService.deleteMe();
    setToken(null);
    setUser(null);
    localStorage.removeItem("token");
    navigate("/");
  };

  const updateUser = (newUser: User | null) => {
    setUser(newUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        register,
        deleteUser,
        setUser: updateUser,
        isAuthenticated: !!user,
        isSuperUser: user?.is_superuser || false,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export { AuthProvider, AuthContext };
export type { AuthContextType };
