import axios from "axios";

const API_BASE_URL = "http://127.0.0.1:8000/api/admin-panel";

interface AdminData {
  id: number;
  username: string;
  role: string;
  is_active: boolean;
  require_2fa: boolean;
}

interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  admin: AdminData;
}

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Don't redirect for login endpoint errors
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes("/auth/login")
    ) {
      // Token expired or invalid, clear storage and redirect to login
      localStorage.removeItem("access_token");
      localStorage.removeItem("admin_data");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export const authService = {
  // Login function
  async login(username: string, password: string): Promise<LoginResponse> {
    try {
      const response = await api.post<LoginResponse>("/auth/login", {
        username,
        password,
      });

      const { access_token, admin } = response.data;

      // Store token and admin data
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("admin_data", JSON.stringify(admin));

      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Logout function
  logout(): void {
    localStorage.removeItem("access_token");
    localStorage.removeItem("admin_data");
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem("access_token");
  },

  // Get current admin data
  getCurrentAdmin(): AdminData | null {
    const adminData = localStorage.getItem("admin_data");
    return adminData ? JSON.parse(adminData) : null;
  },

  // Get access token
  getToken(): string | null {
    return localStorage.getItem("access_token");
  },
};

export default api;
