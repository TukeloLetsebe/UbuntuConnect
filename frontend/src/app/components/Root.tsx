import { Outlet } from "react-router";
import { AuthProvider } from "../../context/AuthContext";
import { Toaster } from "./ui/sonner";

export default function Root() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-white">
        <Outlet />
      </div>
      <Toaster />
    </AuthProvider>
  );
}
