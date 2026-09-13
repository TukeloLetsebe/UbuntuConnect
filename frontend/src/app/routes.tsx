import { createBrowserRouter } from "react-router";
import Root from "./components/Root";
import Landing from "./components/Landing";
import Register from "./components/Register";
import Login from "./components/Login";
import VerifyEmail from "./components/VerifyEmail";
import VerifyIdentity from "./components/VerifyIdentity";
import Dashboard from "./components/Dashboard";
import NPODashboard from "./components/NPODashboard";
import IndividualDashboard from "./components/IndividualDashboard";
import BusinessDashboard from "./components/BusinessDashboard";
import AdminDashboard from "./components/AdminDashboard";
import Fundraisers from "./components/Fundraisers";
import NpoProfile from "./components/NpoProfile";
import DiscoverNpos from "./components/DiscoverNpos";
import ProtectedRoute from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Landing },
      { path: "register", Component: Register },
      { path: "login", Component: Login },
      { path: "verify-email", Component: VerifyEmail },
      { path: "dashboard", Component: Dashboard },
      {
        path: "discover-npos",
        element: (
          <ProtectedRoute allowedRoles={["Individual", "Business", "NPO", "Admin"]}>
            <DiscoverNpos />
          </ProtectedRoute>
        ),
      },
      {
        path: "npo/:npoId",
        element: (
          <ProtectedRoute allowedRoles={["Individual", "Business", "NPO", "Admin"]}>
            <NpoProfile />
          </ProtectedRoute>
        ),
      },
      {
        path: "fundraisers",
        element: (
          <ProtectedRoute allowedRoles={["Individual", "Business"]}>
            <Fundraisers />
          </ProtectedRoute>
        ),
      },
      {
        path: "npo-dashboard",
        element: (
          <ProtectedRoute allowedRoles={["NPO"]}>
            <NPODashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "individual-dashboard",
        element: (
          <ProtectedRoute allowedRoles={["Individual"]}>
            <IndividualDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "verify-identity",
        element: (
          <ProtectedRoute allowedRoles={["Individual"]}>
            <VerifyIdentity />
          </ProtectedRoute>
        ),
      },
      {
        path: "business-dashboard",
        element: (
          <ProtectedRoute allowedRoles={["Business"]}>
            <BusinessDashboard />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin-dashboard",
        element: (
          <ProtectedRoute allowedRoles={["Admin"]}>
            <AdminDashboard />
          </ProtectedRoute>
        ),
      },
    ],
  },
]);
