import { useAuth } from "@clerk/clerk-expo";
import axios from "axios";
import { useEffect } from "react";
import { Platform } from "react-native";

// For Android emulator: 10.0.2.2 is the host machine
// For iOS simulator: localhost or 127.0.0.1
// For physical device: use actual IP or production URL
const getAPIUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  const baseUrl = Platform.OS === "android" ? "http://10.0.2.2:5000/api" : "https://expo-ecommerce-three.vercel.app/api";
  console.log("[API Config] Platform:", Platform.OS, "URL:", baseUrl);
  return baseUrl;
};

const API_URL = getAPIUrl();

console.log("[API Init] Using API URL:", API_URL);

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

export const useApi = () => {
  const { getToken } = useAuth();

  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      async (config) => {
        const token = await getToken();

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        console.log("[API Request]", config.method?.toUpperCase(), config.url);
        return config;
      },
      (error) => {
        console.error("[API Request Error]", error.message);
        return Promise.reject(error);
      }
    );

    const responseInterceptor = api.interceptors.response.use(
      (response) => {
        console.log("[API Response]", response.status, response.config.url);
        return response;
      },
      (error) => {
        // Log detailed errors for debugging
        console.error("[API Error]", {
          message: error.message,
          status: error.response?.status,
          url: error.config?.url,
          code: error.code,
          baseURL: error.config?.baseURL,
        });
        return Promise.reject(error);
      }
    );

    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [getToken]);

  return api;
};

export { api };

// on every single req, we would like have an auth token so that our backend knows that we're authenticated
// we're including the auth token under the auth headers
