import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router";
import api from "../lib/api";

// --- Types ---

type UserType = "Individual" | "NPO" | "Business" | "Admin";

interface AuthState {
  token: string | null;
  userId: number | null;
  userType: UserType | null;
  email: string | null;
  isVerified: boolean;
  isAuthenticated: boolean;
}

interface RegisterDto {
  userEmail: string;
  password: string;
  userType: string;
  userContact?: string;
  location?: string;
  // Individual
  firstName?: string;
  lastName?: string;
  causeOfCare?: string;
  // NPO
  npoRegNum?: string;
  organizationName?: string;
  npoFocusArea?: string;
  npoMission?: string;
  // Business
  businessRegNum?: string;
  industry?: string;
  contactPersonName?: string;
  contactPersonTitle?: string;
  businessEmail?: string;
  csrGoal?: string;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (dto: RegisterDto) => Promise<void>;
  logout: () => void;
}

// --- Context ---

const AuthContext = createContext<AuthContextValue | null>(null);

// --- Helpers ---

const STORAGE_KEY_TOKEN = "token";
const STORAGE_KEY_USER = "user";

interface StoredUser {
  userId: number;
  userType: UserType;
  email: string;
  isVerified: boolean;
}

function loadFromStorage(): AuthState {
  const token = localStorage.getItem(STORAGE_KEY_TOKEN);
  const userJson = localStorage.getItem(STORAGE_KEY_USER);

  if (token && userJson) {
    try {
      const user: StoredUser = JSON.parse(userJson);
      return {
        token,
        userId: user.userId,
        userType: user.userType,
        email: user.email,
        isVerified: user.isVerified,
        isAuthenticated: true,
      };
    } catch {
      // Corrupted storage — clear it
      localStorage.removeItem(STORAGE_KEY_TOKEN);
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  }

  return {
    token: null,
    userId: null,
    userType: null,
    email: null,
    isVerified: false,
    isAuthenticated: false,
  };
}

function persistToStorage(token: string, user: StoredUser) {
  localStorage.setItem(STORAGE_KEY_TOKEN, token);
  localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
}

function clearStorage() {
  localStorage.removeItem(STORAGE_KEY_TOKEN);
  localStorage.removeItem(STORAGE_KEY_USER);
}

// --- Provider ---

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>(loadFromStorage);
  const navigate = useNavigate();

  // Hydrate on mount (handles tab focus / storage changes)
  useEffect(() => {
    setState(loadFromStorage());
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.post("/api/Auth/login", {
        userEmail: email,
        password,
      });

      const { token, userId, userType, email: responseEmail, isVerified } = response.data;

      const user: StoredUser = { userId, userType, email: responseEmail, isVerified };
      persistToStorage(token, user);

      setState({
        token,
        userId,
        userType,
        email: responseEmail,
        isVerified,
        isAuthenticated: true,
      });

      // Navigate to role-specific dashboard
      const dashboardMap: Record<UserType, string> = {
        Individual: "/individual-dashboard",
        NPO: "/npo-dashboard",
        Business: "/business-dashboard",
        Admin: "/admin-dashboard",
      };
      navigate(dashboardMap[userType as UserType] || "/dashboard");
    },
    [navigate]
  );

  const register = useCallback(
    async (dto: RegisterDto) => {
      // Register the user
      await api.post("/api/Auth/register", dto);

      // Auto-login after successful registration
      await login(dto.userEmail, dto.password);
    },
    [login]
  );

  const logout = useCallback(() => {
    clearStorage();
    setState({
      token: null,
      userId: null,
      userType: null,
      email: null,
      isVerified: false,
      isAuthenticated: false,
    });
    navigate("/login");
  }, [navigate]);

  const value: AuthContextValue = {
    ...state,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// --- Hook ---

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export type { RegisterDto, UserType };
