import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { ShieldCheck, UserCog, ScanFace, Loader2, CheckCircle2, Clock } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { kycService, type KycRoute, type KycStatus } from "../../services/kycService";
import ImageUploadField from "./ImageUploadField";
import WebcamCapture from "./WebcamCapture";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Card } from "./ui/card";

export default function VerifyIdentity() {
  const { userType, isEmailVerified } = useAuth();
  const navigate = useNavigate();

  const [status, setStatus] = useState<KycStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [route, setRoute] = useState<KycRoute>("Admin");
  const [idNumber, setIdNumber] = useState("");
  const [idDocumentUrl, setIdDocumentUrl] = useState<string | null>(null);
  const [selfieUrl, setSelfieUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    kycService
      .getStatus()
      .then((r) => setStatus(r.data))
      .catch(() => setStatus(null))
      .finally(() => setLoadingStatus(false));
  }, []);

  // Only individuals do identity verification.
  if (userType !== "Individual") {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center px-6">
        <Card className="p-8 max-w-md text-center">
          <p className="text-neutral-600">Identity verification is only for individual accounts.</p>
        </Card>
      </div>
    );
  }

  const submit = async () => {
    if (!idNumber.trim()) { toast.error("Please enter your ID number."); return; }
    if (!idDocumentUrl) { toast.error("Please upload your ID document."); return; }
    if (!selfieUrl) { toast.error("Please upload a selfie."); return; }

    setSubmitting(true);
    try {
      const res = await kycService.submit({ idNumber: idNumber.trim(), idDocumentUrl, selfieUrl, route });
      if (res.data.autoApproved) {
        toast.success("Identity verified! Please sign in again to refresh your access.");
      } else {
        toast.success("Submitted for review. You'll be notified once an administrator has reviewed it.");
      }
      const r = await kycService.getStatus();
      setStatus(r.data);
    } catch (err) {
      const data = (err as { response?: { data?: unknown } })?.response?.data;
      toast.error(typeof data === "string" ? data : "Submission failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const alreadySubmitted = status && (status.status === "Pending" || status.status === "Approved");

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-6">
      <div className="container mx-auto max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="text-center mb-8">
            <ShieldCheck className="w-12 h-12 text-orange-600 mx-auto mb-3" />
            <h1 className="text-2xl font-bold mb-2">Verify Your Identity</h1>
            <p className="text-neutral-600">
              To help keep UbuntuConnect safe and prevent fraud, we verify every individual before they can donate,
              top up, or volunteer.
            </p>
          </div>

          {!isEmailVerified && (
            <Card className="p-4 mb-6 bg-amber-50 border-amber-200 text-amber-900 text-sm">
              Please verify your email address first. Identity verification unlocks after your email is confirmed.
            </Card>
          )}

          {loadingStatus ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-orange-600" /></div>
          ) : status?.status === "Approved" ? (
            <Card className="p-8 text-center">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-3" />
              <h2 className="text-lg font-semibold mb-1">You're verified</h2>
              <p className="text-neutral-600 mb-6">Your identity has been verified. You have full access.</p>
              <Button onClick={() => navigate("/individual-dashboard")} className="bg-orange-600 hover:bg-orange-700">
                Go to dashboard
              </Button>
            </Card>
          ) : status?.status === "Pending" ? (
            <Card className="p-8 text-center">
              <Clock className="w-12 h-12 text-blue-600 mx-auto mb-3" />
              <h2 className="text-lg font-semibold mb-1">Under review</h2>
              <p className="text-neutral-600">
                Your verification was submitted{status.submittedDate ? ` on ${new Date(status.submittedDate).toLocaleDateString()}` : ""} and
                is awaiting review. You'll be notified once it's processed.
              </p>
            </Card>
          ) : (
            <Card className="p-8">
              {status?.status === "Rejected" && (
                <div className="mb-6 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
                  Your previous submission was rejected. Please review your details and submit again.
                </div>
              )}

              {/* Route choice */}
              <Label className="mb-2 block">How would you like to verify?</Label>
              <div className="grid sm:grid-cols-2 gap-3 mb-6">
                <button
                  type="button"
                  onClick={() => { setRoute("Admin"); setSelfieUrl(null); }}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${route === "Admin" ? "border-orange-500 bg-orange-50" : "border-neutral-200 hover:border-orange-300"}`}
                >
                  <UserCog className="w-6 h-6 text-orange-600 mb-2" />
                  <p className="font-medium">Admin review</p>
                  <p className="text-sm text-neutral-600">A person reviews your ID and selfie. Usually within a day.</p>
                </button>
                <button
                  type="button"
                  onClick={() => { setRoute("FaceScan"); setSelfieUrl(null); }}
                  className={`p-4 border-2 rounded-lg text-left transition-colors ${route === "FaceScan" ? "border-orange-500 bg-orange-50" : "border-neutral-200 hover:border-orange-300"}`}
                >
                  <ScanFace className="w-6 h-6 text-orange-600 mb-2" />
                  <p className="font-medium">Face scan</p>
                  <p className="text-sm text-neutral-600">
                    {status?.faceEngineEnabled
                      ? "Instant self-service match of your ID photo to your live selfie."
                      : "Take a live selfie now. If instant matching is unavailable, an admin reviews it."}
                  </p>
                </button>
              </div>

              <div className="space-y-5">
                <div>
                  <Label htmlFor="id-number">ID Number</Label>
                  <Input id="id-number" value={idNumber} onChange={(e) => setIdNumber(e.target.value)} placeholder="Your national ID number" className="mt-2" disabled={submitting} />
                </div>

                <ImageUploadField label="ID Document (photo of your ID)" value={idDocumentUrl} onChange={setIdDocumentUrl} disabled={submitting} />
                {route === "FaceScan"
                  ? <WebcamCapture label="Selfie (live camera)" value={selfieUrl} onChange={setSelfieUrl} disabled={submitting} />
                  : <ImageUploadField label="Selfie" value={selfieUrl} onChange={setSelfieUrl} disabled={submitting} />}

                <Button onClick={submit} disabled={submitting || !!alreadySubmitted} className="w-full bg-orange-600 hover:bg-orange-700">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit for verification"}
                </Button>
                <p className="text-xs text-neutral-400 text-center">
                  Your ID and selfie are stored securely and used only for verification.
                </p>
              </div>
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
