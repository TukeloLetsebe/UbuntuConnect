import { useState, useEffect, useCallback } from "react";
import { Link, useSearchParams } from "react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import api, { resolveMediaUrl } from "../../lib/api";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Progress } from "./ui/progress";
import {
  Target, HandCoins, Loader2, RefreshCw, X, ArrowLeft,
  Heart, TrendingUp, LogOut, Search, Clock
} from "lucide-react";

interface Fundraiser {
  projectId: number;
  npoId: number;
  npoName: string;
  projectName: string;
  projectDesc: string | null;
  projectStatus: string;
  projectProgress: number;
  targetAmount: number;
  raisedAmount: number;
  images: string | null;
  startDate: string | null;
  endDate: string | null;
}

/**
 * Human-readable deadline info for a fundraiser.
 * Returns null when no end date is set.
 */
function getDeadlineInfo(endDate: string | null): { label: string; ended: boolean; urgent: boolean } | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  if (isNaN(end.getTime())) return null;
  const now = new Date();
  const ms = end.getTime() - now.getTime();
  if (ms <= 0) return { label: "Ended", ended: true, urgent: false };
  const days = Math.floor(ms / 86_400_000);
  const hours = Math.floor((ms % 86_400_000) / 3_600_000);
  const label =
    days >= 1 ? `${days} day${days === 1 ? "" : "s"} left`
      : hours >= 1 ? `${hours} hour${hours === 1 ? "" : "s"} left`
        : "Less than an hour left";
  return { label, ended: false, urgent: days < 3 };
}

function formatDate(value: string | null): string {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "isAxiosError" in error) {
    const axiosError = error as { response?: { data?: { message?: string } | string; status?: number } };
    if (axiosError.response?.data) {
      if (typeof axiosError.response.data === "string") return axiosError.response.data;
      if (axiosError.response.data.message) return axiosError.response.data.message;
    }
    if (axiosError.response?.status === 400) return "Invalid request. Please check your input.";
    if (!axiosError.response) return "Unable to connect to server.";
    return "Something went wrong.";
  }
  return "An unexpected error occurred.";
}

export default function Fundraisers() {
  const { logout, userId, userType } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [fundraisers, setFundraisers] = useState<Fundraiser[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [walletBalance, setWalletBalance] = useState<number>(0);

  // Donate modal
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Fundraiser | null>(null);
  const [donateAmount, setDonateAmount] = useState("");
  const [donating, setDonating] = useState(false);

  // Detail view
  const [detailProject, setDetailProject] = useState<Fundraiser | null>(null);

  const loadFundraisers = useCallback(async () => {
    setLoading(true);
    try {
      const r = await api.get("/api/project");
      setFundraisers(r.data.filter((f: Fundraiser) => f.projectStatus === "Active"));
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setLoading(false); }
  }, []);

  const loadWallet = useCallback(async () => {
    if (!userId) return;
    try { const r = await api.get(`/api/wallet/user/${userId}/balance`); setWalletBalance(r.data.balance); }
    catch {}
  }, [userId]);

  useEffect(() => { loadFundraisers(); loadWallet(); }, [loadFundraisers, loadWallet]);

  // Deep-link: /fundraisers?project={id} opens that fundraiser's detail view
  // once the list has loaded (QA2-004). The param is cleared after it's consumed.
  useEffect(() => {
    const projectId = searchParams.get("project");
    if (!projectId || fundraisers.length === 0) return;
    const match = fundraisers.find((f) => f.projectId === Number(projectId));
    if (match) {
      setDetailProject(match);
      searchParams.delete("project");
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, fundraisers, setSearchParams]);

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;

    const amt = parseFloat(donateAmount);
    if (isNaN(amt) || amt <= 0) { toast.error("Please enter a valid amount greater than 0."); return; }
    if (amt > walletBalance) { toast.error("Insufficient balance. Please top up your wallet first."); return; }

    setDonating(true);
    try {
      const r = await api.post(`/api/npo/project/${selectedProject.projectId}/donate`, { amount: amt });
      // Backend returns newBalance, projectRaisedAmount, projectProgress
      if (typeof r.data.newBalance === "number") {
        setWalletBalance(r.data.newBalance);
      }
      // Update local fundraiser progress from server response
      setFundraisers(prev => prev.map(f =>
        f.projectId === selectedProject.projectId
          ? {
              ...f,
              raisedAmount: r.data.projectRaisedAmount ?? f.raisedAmount + amt,
              projectProgress: r.data.projectProgress ?? f.projectProgress,
            }
          : f
      ));
      setShowDonateModal(false);
      setSelectedProject(null);
      setDonateAmount("");
      toast.success(`Thank you! You donated R ${amt.toLocaleString()} to "${selectedProject.projectName}".`);
    } catch (e) {
      // getErrorMessage surfaces the backend's specific message (insufficient balance,
      // own fundraiser, inactive fundraiser, wallet not set up, etc.)
      toast.error(getErrorMessage(e));
    }
    finally { setDonating(false); }
  };

  const filteredFundraisers = fundraisers.filter(f =>
    !searchQuery ||
    f.projectName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    f.npoName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (f.projectDesc || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const dashboardPath = userType === "Business" ? "/business-dashboard" : "/individual-dashboard";

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 py-4 px-6 sticky top-0 z-40">
        <div className="container mx-auto max-w-7xl flex items-center justify-between">
          <Link to={dashboardPath} className="text-xl text-neutral-900 font-bold">UbuntuConnect</Link>
          <div className="flex items-center gap-4">
            <span className="text-sm text-neutral-600 hidden sm:inline">Balance: R {walletBalance.toLocaleString()}</span>
            <Button variant="outline" size="sm" onClick={logout}><LogOut className="w-4 h-4 mr-2" /> Logout</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto max-w-7xl p-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

          {/* Back + Title */}
          <div className="flex items-center gap-4 mb-6">
            <Link to={dashboardPath}><Button variant="outline" size="sm"><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button></Link>
            <div>
              <h1 className="text-2xl font-bold">Fundraisers</h1>
              <p className="text-neutral-600">Support NPO projects by donating directly to their fundraisers</p>
            </div>
          </div>

          {/* Search + Refresh */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
              <Input placeholder="Search by project or NPO name..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Button variant="outline" size="sm" onClick={loadFundraisers}><RefreshCw className="w-4 h-4" /></Button>
          </div>

          {/* Fundraiser Cards */}
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-orange-600" /></div>
          ) : filteredFundraisers.length === 0 ? (
            <Card className="p-12 text-center"><Target className="w-12 h-12 text-neutral-400 mx-auto mb-3" /><p className="text-neutral-600">No active fundraisers at the moment.</p></Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredFundraisers.map(fund => (
                <Card key={fund.projectId} className="overflow-hidden hover:shadow-lg transition-shadow">
                  {fund.images && <img src={resolveMediaUrl(fund.images.split(",")[0].trim())} alt={fund.projectName} className="w-full h-48 object-cover cursor-pointer" onClick={() => setDetailProject(fund)} />}
                  <div className="p-6">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                        <span className="text-sm font-bold text-orange-600">{fund.npoName.charAt(0)}</span>
                      </div>
                      <span className="text-sm text-orange-600 font-medium">{fund.npoName}</span>
                    </div>
                    <h3 className="font-semibold text-lg mb-2 cursor-pointer hover:text-orange-600" onClick={() => setDetailProject(fund)}>{fund.projectName}</h3>
                    {fund.projectDesc && <p className="text-neutral-600 text-sm mb-4 line-clamp-2">{fund.projectDesc}</p>}

                    {/* Progress */}
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-neutral-600">R {fund.raisedAmount.toLocaleString()} raised</span>
                        <span className="font-medium">R {fund.targetAmount.toLocaleString()}</span>
                      </div>
                      <Progress value={fund.targetAmount > 0 ? Math.min(100, (fund.raisedAmount / fund.targetAmount) * 100) : 0} className="h-2" />
                      <p className="text-xs text-neutral-500 mt-1">
                        {fund.targetAmount > 0 ? Math.round((fund.raisedAmount / fund.targetAmount) * 100) : 0}% funded
                      </p>
                    </div>

                    {(() => {
                      const d = getDeadlineInfo(fund.endDate);
                      if (!d) return null;
                      return (
                        <div className={`flex items-center gap-1 text-xs mb-4 ${d.ended ? "text-red-600" : d.urgent ? "text-orange-600" : "text-neutral-500"}`}>
                          <Clock className="w-3.5 h-3.5" /> <span>{d.label}</span>
                        </div>
                      );
                    })()}

                    <div className="flex gap-2">
                      <Button variant="outline" className="flex-1" onClick={() => setDetailProject(fund)}>
                        View details
                      </Button>
                      <Button
                        className="flex-1 bg-orange-600 hover:bg-orange-700"
                        onClick={() => { setSelectedProject(fund); setDonateAmount(""); setShowDonateModal(true); }}
                      >
                        <HandCoins className="w-4 h-4 mr-1" /> Donate
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}

        </motion.div>
      </main>

      {/* FUNDRAISER DETAIL */}
      {detailProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDetailProject(null)}>
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            {detailProject.images && (
              <img src={resolveMediaUrl(detailProject.images.split(",")[0].trim())} alt={detailProject.projectName} className="w-full h-56 object-cover rounded-t-lg" />
            )}
            <div className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-orange-600">{detailProject.npoName.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-sm text-orange-600 font-medium">{detailProject.npoName}</p>
                    <Badge variant="outline" className="mt-0.5">{detailProject.projectStatus}</Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setDetailProject(null)}><X className="w-4 h-4" /></Button>
              </div>

              <h2 className="text-xl font-bold mb-2">{detailProject.projectName}</h2>
              {detailProject.projectDesc && <p className="text-neutral-600 whitespace-pre-wrap mb-6">{detailProject.projectDesc}</p>}

              <div className="mb-6">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-600 font-medium">R {detailProject.raisedAmount.toLocaleString()} raised</span>
                  <span className="text-neutral-600">Goal: R {detailProject.targetAmount.toLocaleString()}</span>
                </div>
                <Progress value={detailProject.targetAmount > 0 ? Math.min(100, (detailProject.raisedAmount / detailProject.targetAmount) * 100) : 0} className="h-3" />
                <p className="text-xs text-neutral-500 mt-1">
                  {detailProject.targetAmount > 0 ? Math.round((detailProject.raisedAmount / detailProject.targetAmount) * 100) : 0}% funded
                </p>
              </div>

              {(() => {
                const d = getDeadlineInfo(detailProject.endDate);
                if (!d) return null;
                return (
                  <div className={`flex items-center gap-2 text-sm mb-6 rounded-lg p-3 ${d.ended ? "bg-red-50 text-red-700" : d.urgent ? "bg-orange-50 text-orange-700" : "bg-neutral-50 text-neutral-700"}`}>
                    <Clock className="w-4 h-4" />
                    <span className="font-medium">{d.ended ? "This fundraiser has ended" : d.label}</span>
                    {detailProject.endDate && !d.ended && (
                      <span className="text-neutral-500">· closes {formatDate(detailProject.endDate)}</span>
                    )}
                  </div>
                );
              })()}

              {(() => {
                const d = getDeadlineInfo(detailProject.endDate);
                const ended = d?.ended ?? false;
                return (
                  <Button
                    className="w-full bg-orange-600 hover:bg-orange-700"
                    disabled={ended}
                    onClick={() => { setSelectedProject(detailProject); setDonateAmount(""); setShowDonateModal(true); setDetailProject(null); }}
                  >
                    <HandCoins className="w-4 h-4 mr-2" /> {ended ? "Fundraiser Closed" : "Donate to this Fundraiser"}
                  </Button>
                );
              })()}
            </div>
          </Card>
        </div>
      )}

      {/* DONATE MODAL */}
      {showDonateModal && selectedProject && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">Donate to Fundraiser</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowDonateModal(false)}><X className="w-4 h-4" /></Button>
            </div>
            <div className="mb-4 p-4 bg-neutral-50 rounded-lg">
              <p className="font-semibold">{selectedProject.projectName}</p>
              <p className="text-sm text-neutral-600">by {selectedProject.npoName}</p>
              <div className="mt-2 text-sm">
                <span className="text-green-600 font-medium">R {selectedProject.raisedAmount.toLocaleString()}</span>
                <span className="text-neutral-500"> / R {selectedProject.targetAmount.toLocaleString()}</span>
              </div>
            </div>
            <p className="text-sm text-neutral-600 mb-4">Your balance: <span className="font-medium">R {walletBalance.toLocaleString()}</span></p>
            <form onSubmit={handleDonate} className="space-y-4">
              <div>
                <Label>Donation Amount (R)</Label>
                <Input type="number" step="0.01" min="1" value={donateAmount} onChange={e => setDonateAmount(e.target.value)} placeholder="Enter amount..." required />
              </div>
              <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={donating}>
                {donating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <HandCoins className="w-4 h-4 mr-2" />}
                {donating ? "Processing..." : "Confirm Donation"}
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
