import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { authService } from "../../services/authService";
import { Button } from "./ui/button";

type Status = "verifying" | "success" | "error";

export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get("token");
  const [status, setStatus] = useState<Status>("verifying");
  const [message, setMessage] = useState("");
  const ran = useRef(false);

  useEffect(() => {
    // Guard against double-invoke in React StrictMode.
    if (ran.current) return;
    ran.current = true;

    if (!token) {
      setStatus("error");
      setMessage("No verification token was provided.");
      return;
    }

    authService
      .verifyEmail(token)
      .then(() => {
        setStatus("success");
        setMessage("Your email has been verified. You can now sign in.");
      })
      .catch((err) => {
        setStatus("error");
        const data = err?.response?.data;
        setMessage(
          (typeof data === "string" ? data : data?.message) ||
            "This verification link is invalid or has expired."
        );
      });
  }, [token]);

  return (
    <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-6">
      <div className="bg-white rounded-lg p-8 shadow-sm max-w-md w-full text-center">
        {status === "verifying" && (
          <>
            <Loader2 className="w-10 h-10 text-orange-600 mx-auto mb-4 animate-spin" />
            <h1 className="text-xl mb-2">Verifying your email…</h1>
            <p className="text-neutral-600">Please wait a moment.</p>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h1 className="text-xl mb-2">Email verified</h1>
            <p className="text-neutral-600 mb-6">{message}</p>
            <Button asChild className="bg-orange-600 hover:bg-orange-700">
              <Link to="/login">Continue to sign in</Link>
            </Button>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
            <h1 className="text-xl mb-2">Verification failed</h1>
            <p className="text-neutral-600 mb-6">{message}</p>
            <Button asChild variant="outline">
              <Link to="/login">Back to sign in</Link>
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
