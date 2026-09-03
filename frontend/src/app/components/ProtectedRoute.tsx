import { Navigate } from "react-router";
import { useAuth, type UserType } from "../../context/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserType[];
}

const dashboardMap: Record<UserType, string> = {
  Individual: "/individual-dashboard",
  NPO: "/npo-dashboard",
  Business: "/business-dashboard",
  Admin: "/admin-dashboard",
};

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, userType } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If specific roles are required and current user doesn't match, redirect to their correct dashboard
  if (allowedRoles && userType && !allowedRoles.includes(userType)) {
    return <Navigate to={dashboardMap[userType]} replace />;
  }

  return <>{children}</>;
}
