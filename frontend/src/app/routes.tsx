import { createBrowserRouter } from "react-router";
import Root from "./components/Root";
import Landing from "./components/Landing";
import Register from "./components/Register";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import NPODashboard from "./components/NPODashboard";
import IndividualDashboard from "./components/IndividualDashboard";
import BusinessDashboard from "./components/BusinessDashboard";
import AdminDashboard from "./components/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Landing },
      { path: "register", Component: Register },
      { path: "login", Component: Login },
      { path: "dashboard", Component: Dashboard },
      { path: "npo-dashboard", Component: NPODashboard },
      {
        path: "individual-dashboard",
        element: (
          <ProtectedRoute allowedRoles={["Individual"]}>
            <IndividualDashboard />
          </ProtectedRoute>
        ),
      },
      { path: "business-dashboard", Component: BusinessDashboard },
      { path: "admin-dashboard", Component: AdminDashboard },
    ],
  },
]);
