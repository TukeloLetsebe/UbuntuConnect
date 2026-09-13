import axios from "axios";

export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5275";

/**
 * Resolves a media URL for rendering. Uploaded files come back as relative
 * paths (e.g. "/uploads/images/x.jpg") served by the API, so they must be
 * prefixed with the API origin. Absolute URLs (http...) are returned as-is.
 */
export function resolveMediaUrl(url: string | null | undefined): string | undefined {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`;
}

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    "Content-Type": "application/json",
  },
});

// Attach JWT token to every request if present
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401 response, clear auth state and redirect to login.
// Only redirect if we had a token (session expired) and are not already on /login.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const hadToken = !!localStorage.getItem("token");
      const url: string = error.config?.url || "";
      const isAuthEndpoint =
        url.includes("/api/Auth/login") || url.includes("/api/Auth/register");
      const alreadyOnLogin = window.location.pathname === "/login";

      if (hadToken && !isAuthEndpoint && !alreadyOnLogin) {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
      } else if (!isAuthEndpoint) {
        // Clear stale token silently without redirecting
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }
    return Promise.reject(error);
  }
);

export default api;
