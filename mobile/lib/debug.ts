import axios from "axios";
import { Platform } from "react-native";

/**
 * Test connection to the backend API
 * Call this from a debug screen or on app startup
 */
export const testApiConnection = async () => {
  const baseUrl =
    Platform.OS === "android" ? "http://10.0.2.2:5000" : "https://expo-ecommerce-three.vercel.app";

  console.log("[DEBUG] Testing API connection to:", baseUrl);

  try {
    const response = await axios.get(`${baseUrl}/api/health`, {
      timeout: 5000,
    });

    console.log("[DEBUG] ✅ Connection successful:", response.data);
    return { success: true, data: response.data, url: baseUrl };
  } catch (error: any) {
    console.error("[DEBUG] ❌ Connection failed:", {
      message: error.message,
      code: error.code,
      url: error.config?.url,
      baseURL: baseUrl,
    });

    return {
      success: false,
      error: error.message,
      code: error.code,
      url: baseUrl,
    };
  }
};

/**
 * Get the API URL being used
 */
export const getApiUrl = () => {
  return Platform.OS === "android"
    ? "http://10.0.2.2:5000/api"
    : "https://expo-ecommerce-three.vercel.app/api"
};
