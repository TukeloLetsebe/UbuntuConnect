import { RouterProvider } from "react-router";
import { router } from "./routes";
import { ConfirmProvider } from "./components/ConfirmDialog";

export default function App() {
  return (
    <ConfirmProvider>
      <RouterProvider router={router} />
    </ConfirmProvider>
  );
}
