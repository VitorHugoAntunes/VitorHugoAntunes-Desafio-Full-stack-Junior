import axios, { AxiosError } from "axios";
import { useAuth } from "@/context/AuthContext";
import { useMemo } from "react";

export const useApi = () => {
  const { refreshToken, logout } = useAuth();

  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: import.meta.env.VITE_API_URL || "http://localhost:3333",
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    instance.interceptors.request.use((config) => {
      const token = localStorage.getItem("accessToken");
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    instance.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          try {
            await refreshToken();
            const newToken = localStorage.getItem("accessToken");
            if (newToken) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            return instance(originalRequest);
          } catch {
            logout();
            return Promise.reject(error);
          }
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, [refreshToken, logout]);

  return { api };
};