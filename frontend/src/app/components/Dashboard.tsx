import { Navigate } from "react-router";
import { useAuth, type UserType } from "../../context/AuthContext";

const dashboardMap: Record<UserType, string> = {
  Individual: "/individual-dashboard",
  NPO: "/npo-dashboard",
  Business: "/business-dashboard",
  Admin: "/admin-dashboard",
};

/**
 * Dashboard route — never renders UI.
 * Redirects authenticated users to their role-specific dashboard.
 * Redirects unauthenticated users to /login.
 */
export default function Dashboard() {
  const { isAuthenticated, userType } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (userType) {
    return <Navigate to={dashboardMap[userType]} replace />;
  }

  // Fallback (should never happen if auth state is correct)
  return <Navigate to="/login" replace />;
}
