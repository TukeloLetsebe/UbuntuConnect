import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "./NotificationBell";
import BrandMark from "./BrandMark";
import ProfileMenu from "./ProfileMenu";
import HeaderSearch from "./HeaderSearch";
import DashboardSidebar from "./DashboardSidebar";
import AdminReportsPanel from "./reports/AdminReportsPanel";
import { adminService, getErrorMessage, type PlatformStats, type UserItem, type UserDetail, type VerificationItem, type TransactionItem, type KycSubmissionItem } from "../../services/adminService";
import { moderationService, type ReportedPostItem } from "../../services/moderationService";
import { resolveMediaUrl } from "../../lib/api";
import { formatZar } from "../../lib/money";
import { useConfirm } from "./ConfirmDialog";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Shield, Users, Building2, Heart, TrendingUp, LogOut,
  CheckCircle, X, Search, DollarSign, AlertCircle,
  Eye, UserCheck, Ban, Loader2, RefreshCw, FileText, Menu, Flag,
  LayoutDashboard
} from "lucide-react";

export default function AdminDashboard() {
  const { logout, email } = useAuth();
  const confirm = useConfirm();
  const reduceMotion = useReducedMotion();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const selectTab = (id: string) => { setActiveTab(id); setSidebarOpen(false); };

  // Stats
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(false);

  // Users
  const [users, setUsers] = useState<UserItem[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userTypeFilter, setUserTypeFilter] = useState("All");
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserDetail | null>(null);
  const [userDetailLoading, setUserDetailLoading] = useState(false);

  // Verifications
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [verificationsLoading, setVerificationsLoading] = useState(false);
  const [verificationFilter, setVerificationFilter] = useState("Pending");

  // Transactions
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [selectedTx, setSelectedTx] = useState<TransactionItem | null>(null);

  // Reported posts (moderation)
  const [reports, setReports] = useState<ReportedPostItem[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Individual KYC submissions
  const [kyc, setKyc] = useState<KycSubmissionItem[]>([]);
  const [kycLoading, setKycLoading] = useState(false);

  // ═══ LOADERS ═══
  const loadStats = useCallback(async () => {
    setStatsLoading(true);
    try { const r = await adminService.getStats(); setStats(r.data); }
    catch (e) { toast.error(getErrorMessage(e)); }
    finally { setStatsLoading(false); }
  }, []);

  const loadUsers = useCallback(async () => {
    setUsersLoading(true);
    try { const r = await adminService.getUsers(); setUsers(r.data); }
    catch (e) { toast.error(getErrorMessage(e)); }
    finally { setUsersLoading(false); }
  }, []);

  const loadVerifications = useCallback(async () => {
    setVerificationsLoading(true);
    try {
      const r = await adminService.getVerifications(verificationFilter === "All" ? undefined : verificationFilter);
      setVerifications(r.data);
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setVerificationsLoading(false); }
  }, [verificationFilter]);

  const loadTransactions = useCallback(async () => {
    setTransactionsLoading(true);
    try { const r = await adminService.getTransactions(); setTransactions(r.data); }
    catch (e) { toast.error(getErrorMessage(e)); }
    finally { setTransactionsLoading(false); }
  }, []);

  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    try { const r = await moderationService.getReports("Pending"); setReports(r.data); }
    catch (e) { toast.error(getErrorMessage(e)); }
    finally { setReportsLoading(false); }
  }, []);

  const loadKyc = useCallback(async () => {
    setKycLoading(true);
    try { const r = await adminService.getKycSubmissions("Pending"); setKyc(r.data); }
    catch (e) { toast.error(getErrorMessage(e)); }
    finally { setKycLoading(false); }
  }, []);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => {
    if (activeTab === "users") loadUsers();
    if (activeTab === "verifications") loadVerifications();
    if (activeTab === "transactions") loadTransactions();
    if (activeTab === "moderation") loadReports();
    if (activeTab === "kyc") loadKyc();
  }, [activeTab, loadUsers, loadVerifications, loadTransactions, loadReports, loadKyc]);

  // Reload verifications when filter changes
  useEffect(() => {
    if (activeTab === "verifications") loadVerifications();
  }, [verificationFilter, loadVerifications, activeTab]);

  // ═══ HANDLERS ═══
  const handleActivateUser = async (id: number) => {
    const u = users.find(x => x.userId === id);
    const ok = await confirm({ title: `Activate ${u?.email ?? "this user"}?`, description: "The account will be able to log in again.", confirmText: "Activate" });
    if (!ok) return;
    try { await adminService.activateUser(id); setUsers(p => p.map(u => u.userId === id ? { ...u, isActive: true } : u)); toast.success("User activated."); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };

  const handleDeactivateUser = async (id: number) => {
    const u = users.find(x => x.userId === id);
    const ok = await confirm({
      title: `Deactivate ${u?.email ?? "this user"}?`,
      description: "They will be unable to log in until reactivated. Their data is preserved.",
      confirmText: "Deactivate user",
      destructive: true,
    });
    if (!ok) return;
    try { await adminService.deactivateUser(id); setUsers(p => p.map(u => u.userId === id ? { ...u, isActive: false } : u)); toast.success("User deactivated."); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };

  const handleApproveVerification = async (id: number) => {
    const v = verifications.find(x => x.verificationId === id);
    const name = v?.organizationName ?? "this applicant";
    const kind = v?.subjectType === "Business" ? "business" : "NPO";
    const ok = await confirm({
      title: `Approve ${name}?`,
      description: `This marks the ${kind} as verified and unlocks their full access. They will be notified by email and in-app.`,
      confirmText: "Approve & verify",
    });
    if (!ok) return;
    try { await adminService.approveVerification(id); setVerifications(p => p.map(x => x.verificationId === id ? { ...x, status: "Approved", isVerified: true } : x)); loadStats(); toast.success(`${name} is now verified.`); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };

  const handleRejectVerification = async (id: number) => {
    const v = verifications.find(x => x.verificationId === id);
    const name = v?.organizationName ?? "this applicant";
    const ok = await confirm({
      title: `Reject ${name}'s verification?`,
      description: `${name} will be notified that their verification was not approved and can submit again. This does not verify them.`,
      confirmText: "Reject verification",
      destructive: true,
    });
    if (!ok) return;
    try { await adminService.rejectVerification(id); setVerifications(p => p.map(x => x.verificationId === id ? { ...x, status: "Rejected" } : x)); loadStats(); toast.success(`${name}'s verification rejected.`); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };

  const handleDismissReport = async (reportId: number) => {
    const ok = await confirm({ title: "Dismiss this report?", description: "The report will be cleared and the post left as-is.", confirmText: "Dismiss" });
    if (!ok) return;
    try { await moderationService.dismiss(reportId); setReports(p => p.filter(r => r.reportId !== reportId)); toast.success("Report dismissed."); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };

  const handleRemoveReportedPost = async (reportId: number) => {
    const r = reports.find(x => x.reportId === reportId);
    const ok = await confirm({
      title: `Remove "${r?.post.postTitle ?? "this post"}"?`,
      description: `The post will be taken down and ${r?.post.authorName ?? "the author"} will be notified it was removed for violating community guidelines.`,
      confirmText: "Remove post",
      destructive: true,
    });
    if (!ok) return;
    try { await moderationService.removePost(reportId); setReports(p => p.filter(r => r.reportId !== reportId)); toast.success("Post removed and author notified."); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };

  const handleApproveKyc = async (individualId: number) => {
    const k = kyc.find(x => x.individualId === individualId);
    const who = k?.fullName ?? "this individual";
    const ok = await confirm({ title: `Approve ${who}'s identity?`, description: "Their identity will be marked verified and they'll be notified.", confirmText: "Approve" });
    if (!ok) return;
    try { await adminService.approveKyc(individualId); setKyc(p => p.filter(k => k.individualId !== individualId)); loadStats(); toast.success("Identity approved — individual notified."); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };

  const handleRejectKyc = async (individualId: number) => {
    const k = kyc.find(x => x.individualId === individualId);
    const who = k?.fullName ?? "this individual";
    const ok = await confirm({ title: `Reject ${who}'s identity?`, description: "Their submission will be rejected and they'll be asked to resubmit.", confirmText: "Reject", destructive: true });
    if (!ok) return;
    const reason = prompt("Reason for rejection (optional):") ?? undefined;
    try { await adminService.rejectKyc(individualId, reason); setKyc(p => p.filter(k => k.individualId !== individualId)); toast.success("Submission rejected — individual notified."); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };

  const openUserDetail = async (userId: number) => {
    setUserDetailLoading(true);
    setSelectedUserDetail(null);
    try {
      const r = await adminService.getUser(userId);
      setSelectedUserDetail(r.data);
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setUserDetailLoading(false); }
  };

  const filteredUsers = users.filter(u => {
    const q = userSearchQuery.toLowerCase();
    const matchesSearch = !userSearchQuery || u.email.toLowerCase().includes(q) || (u.name || "").toLowerCase().includes(q);
    const matchesType = userTypeFilter === "All" || u.userType === userTypeFilter;
    return matchesSearch && matchesType;
  });

  // ═══ RENDER ═══
  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 py-4 px-6 z-40 shrink-0"><div className="w-full flex items-center justify-between"><div className="flex items-center gap-3"><button onClick={() => setSidebarOpen(true)} className="lg:hidden text-neutral-600"><Menu className="w-6 h-6" /></button><BrandMark onClick={() => setActiveTab("overview")} /></div><HeaderSearch placeholder="Search users by email..." onSubmit={(q) => { setActiveTab("users"); setUserSearchQuery(q); }} /><div className="flex items-center gap-3"><Badge className="bg-purple-100 text-purple-700 hidden md:inline-flex"><Shield className="w-3 h-3 mr-1" /> Admin Portal</Badge><NotificationBell /><ProfileMenu name={email || "Admin"} subtitle={email || undefined} roleLabel="Admin" onLogout={logout} /></div></div></header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        <DashboardSidebar
          activeTab={activeTab}
          onSelect={selectTab}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
          storageKey="admin-sidebar-collapsed"
          accent="purple"
          groups={[
            { heading: "Core", items: [
              { id: "overview", icon: LayoutDashboard, label: "Overview" },
              { id: "users", icon: Users, label: "User Management" },
            ]},
            { heading: "Moderation", items: [
              { id: "verifications", icon: Shield, label: "Verifications" },
              { id: "kyc", icon: UserCheck, label: "Individual KYC" },
              { id: "moderation", icon: Flag, label: "Reported Posts" },
            ]},
            { heading: "Platform", items: [
              { id: "transactions", icon: DollarSign, label: "Transactions" },
              { id: "reports", icon: FileText, label: "Reports" },
            ]},
          ]}
          bottomItems={[]}
        />

        <main className="flex-1 p-4 md:p-8 w-full min-w-0 overflow-y-auto main-scroll">
          <motion.div key={activeTab} initial={reduceMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.3 }}>

            {/* OVERVIEW */}
            {activeTab === "overview" && (<div>
              <div className="mb-8"><h1 className="text-2xl font-bold mb-2">Platform Overview</h1><p className="text-neutral-600">Monitor and manage the UbuntuConnect platform</p></div>
              {statsLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div> : stats && (
                <div>
                  <div className="grid md:grid-cols-4 gap-6 mb-8">
                    <Card className="p-6 cursor-pointer hover:shadow-md" onClick={() => setActiveTab("users")}><div className="flex justify-between mb-2"><span className="text-neutral-600 text-sm">Total Users</span><Users className="w-5 h-5 text-neutral-400" /></div><div className="text-3xl font-bold">{stats.totalUsers}</div><p className="text-xs text-neutral-500 mt-1">{stats.activeUsers} active, {stats.inactiveUsers} inactive</p></Card>
                    <Card className="p-6"><div className="flex justify-between mb-2"><span className="text-neutral-600 text-sm">Total Donations</span><DollarSign className="w-5 h-5 text-neutral-400" /></div><div className="text-3xl font-bold">R {stats.totalDonations.toLocaleString()}</div><p className="text-xs text-neutral-500 mt-1">{stats.totalTransactions} transactions</p></Card>
                    <Card className="p-6 cursor-pointer hover:shadow-md" onClick={() => setActiveTab("verifications")}><div className="flex justify-between mb-2"><span className="text-neutral-600 text-sm">Pending Verifications</span><AlertCircle className="w-5 h-5 text-yellow-500" /></div><div className="text-3xl font-bold text-yellow-600">{stats.pendingVerifications}</div></Card>
                    <Card className="p-6"><div className="flex justify-between mb-2"><span className="text-neutral-600 text-sm">Active Campaigns</span><FileText className="w-5 h-5 text-neutral-400" /></div><div className="text-3xl font-bold">{stats.activeCampaigns}</div></Card>
                  </div>
                  <div className="grid md:grid-cols-3 gap-6">
                    <Card className="p-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center"><Users className="w-5 h-5 text-blue-600" /></div><div><p className="text-2xl font-bold">{stats.individuals}</p><p className="text-sm text-neutral-600">Individuals</p></div></div></Card>
                    <Card className="p-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center"><Heart className="w-5 h-5 text-orange-600" /></div><div><p className="text-2xl font-bold">{stats.npos}</p><p className="text-sm text-neutral-600">NPOs</p></div></div></Card>
                    <Card className="p-6"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center"><Building2 className="w-5 h-5 text-green-600" /></div><div><p className="text-2xl font-bold">{stats.businesses}</p><p className="text-sm text-neutral-600">Businesses</p></div></div></Card>
                  </div>
                </div>
              )}
            </div>)}

            {/* USERS */}
            {activeTab === "users" && (<div>
              <div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-bold mb-2">User Management</h1><p className="text-neutral-600">{filteredUsers.length} of {users.length} users</p></div><Button variant="outline" size="sm" onClick={loadUsers}><RefreshCw className="w-4 h-4" /></Button></div>
              <div className="flex flex-wrap gap-4 mb-6">
                <Input placeholder="Search by name or email..." value={userSearchQuery} onChange={e => setUserSearchQuery(e.target.value)} className="max-w-sm" />
                <div className="flex flex-wrap gap-2">
                  {["All", "Individual", "NPO", "Business", "Admin"].map(type => (
                    <Button key={type} size="sm" variant={userTypeFilter === type ? "default" : "outline"} className={userTypeFilter === type ? "bg-purple-600" : ""} onClick={() => setUserTypeFilter(type)}>{type}</Button>
                  ))}
                </div>
              </div>
              {usersLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div> : filteredUsers.length === 0 ? <Card className="p-12 text-center"><Users className="w-12 h-12 text-neutral-400 mx-auto mb-3" /><p className="text-neutral-600">No users match your filters.</p></Card> : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredUsers.map(user => {
                    const displayName = user.name || user.email;
                    const initial = (user.name || user.email).charAt(0).toUpperCase();
                    const gradient = user.userType === "Individual"
                      ? "from-blue-500 to-blue-600"
                      : user.userType === "NPO"
                      ? "from-orange-500 to-orange-600"
                      : user.userType === "Business"
                      ? "from-purple-500 to-purple-600"
                      : "from-neutral-600 to-neutral-700";
                    const badgeColor = user.userType === "Individual" ? "bg-blue-100 text-blue-700" : user.userType === "NPO" ? "bg-orange-100 text-orange-700" : user.userType === "Business" ? "bg-purple-100 text-purple-700" : "bg-neutral-100 text-neutral-700";
                    return (
                      <Card
                        key={user.userId}
                        className="overflow-hidden cursor-pointer hover:shadow-lg hover:-translate-y-0.5 transition-all"
                        onClick={() => openUserDetail(user.userId)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); openUserDetail(user.userId); } }}
                      >
                        <div className={`bg-gradient-to-br ${gradient} h-16 flex items-center justify-center relative`}>
                          <div className="w-12 h-12 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center border-2 border-white/40">
                            <span className="text-lg font-bold text-white">{initial}</span>
                          </div>
                          {!user.isActive && <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-400 border border-white" title="Inactive" />}
                          {user.isVerified && <span className="absolute top-1.5 left-1.5 w-2.5 h-2.5 rounded-full bg-green-400 border border-white" title="Verified" />}
                        </div>
                        <div className="p-3 text-center">
                          <p className="font-semibold text-sm truncate">{displayName}</p>
                          <p className="text-[11px] text-neutral-500 truncate">{user.email}</p>
                          <Badge className={`mt-2 text-[10px] px-2 py-0.5 ${badgeColor}`}>{user.userType}</Badge>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>)}

            {/* VERIFICATIONS */}
            {activeTab === "verifications" && (<div>
              <div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-bold mb-2">NPO Verifications</h1><p className="text-neutral-600">Review and manage NPO verification requests</p></div><Button variant="outline" size="sm" onClick={loadVerifications}><RefreshCw className="w-4 h-4" /></Button></div>
              <div className="flex gap-2 mb-6">
                {["Pending", "Approved", "Rejected", "All"].map(status => (
                  <Button key={status} size="sm" variant={verificationFilter === status ? "default" : "outline"} className={verificationFilter === status ? "bg-purple-600" : ""} onClick={() => setVerificationFilter(status)}>{status}</Button>
                ))}
              </div>
              {verificationsLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div> : verifications.length === 0 ? <Card className="p-12 text-center"><Shield className="w-12 h-12 text-neutral-400 mx-auto mb-3" /><p className="text-neutral-600">No {verificationFilter.toLowerCase()} verifications.</p></Card> : (
                <div className="space-y-3">{verifications.map(v => (
                  <Card key={v.verificationId} className="p-5">
                    <div className="flex flex-col lg:flex-row gap-6 justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 flex-wrap">
                          <h3 className="font-semibold text-lg">{v.organizationName}</h3>
                          <Badge variant="outline">{v.subjectType}</Badge>
                          <Badge className={v.status === "Pending" ? "bg-yellow-100 text-yellow-700" : v.status === "Approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>{v.status}</Badge>
                          {v.isVerified && <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" /> Verified</Badge>}
                        </div>
                        <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1 mt-3 text-sm text-neutral-600">
                          <p><span className="text-neutral-400">Reg No:</span> <span className="font-medium">{v.regNum || "—"}</span></p>
                          <p><span className="text-neutral-400">{v.subjectType === "Business" ? "Industry" : "Focus"}:</span> <span className="font-medium">{v.focusArea || "—"}</span></p>
                          <p><span className="text-neutral-400">Email:</span> <span className="font-medium break-all">{v.email || "—"}</span></p>
                          <p><span className="text-neutral-400">Phone:</span> <span className="font-medium">{v.contact || "—"}</span></p>
                          <p><span className="text-neutral-400">Location:</span> <span className="font-medium">{v.location || "—"}</span></p>
                        </div>
                        {v.mission && <p className="text-sm text-neutral-600 mt-2"><span className="text-neutral-400">{v.subjectType === "Business" ? "CSR goal" : "Mission"}:</span> {v.mission}</p>}
                        <p className="text-xs text-neutral-400 mt-2">Submitted {new Date(v.submittedDate).toLocaleDateString()}{v.reviewedDate ? ` · Reviewed ${new Date(v.reviewedDate).toLocaleDateString()}` : ""}</p>

                        {/* Supporting documents */}
                        <div className="flex flex-wrap gap-3 mt-4">
                          {v.document1 ? (
                            <a href={resolveMediaUrl(v.document1)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-neutral-200 text-sm text-purple-700 hover:bg-purple-50">
                              <FileText className="w-4 h-4" /> {v.subjectType === "Business" ? "CIPC Document" : "NPO Certificate"}
                            </a>
                          ) : <span className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-neutral-200 text-sm text-neutral-400"><FileText className="w-4 h-4" /> No {v.subjectType === "Business" ? "CIPC document" : "NPO certificate"}</span>}
                          {v.document2 ? (
                            <a href={resolveMediaUrl(v.document2)} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-neutral-200 text-sm text-purple-700 hover:bg-purple-50">
                              <FileText className="w-4 h-4" /> Tax {v.subjectType === "Business" ? "Clearance" : "Certificate"}
                            </a>
                          ) : <span className="inline-flex items-center gap-2 px-3 py-2 rounded-md border border-dashed border-neutral-200 text-sm text-neutral-400"><FileText className="w-4 h-4" /> No tax {v.subjectType === "Business" ? "clearance" : "certificate"}</span>}
                        </div>
                      </div>
                      {v.status === "Pending" && (
                        <div className="flex lg:flex-col gap-2 shrink-0">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApproveVerification(v.verificationId)}><CheckCircle className="w-4 h-4 mr-1" /> Approve</Button>
                          <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleRejectVerification(v.verificationId)}><X className="w-4 h-4 mr-1" /> Reject</Button>
                        </div>
                      )}
                    </div>
                  </Card>
                ))}</div>
              )}
            </div>)}

            {/* INDIVIDUAL KYC */}
            {activeTab === "kyc" && (<div>
              <div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-bold mb-2">Individual Identity Verification</h1><p className="text-neutral-600">Review ID + selfie submissions and approve or reject</p></div><Button variant="outline" size="sm" onClick={loadKyc}><RefreshCw className="w-4 h-4" /></Button></div>
              {kycLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div> : kyc.length === 0 ? <Card className="p-12 text-center"><UserCheck className="w-10 h-10 text-neutral-300 mx-auto mb-3" /><p className="text-neutral-600">No pending identity submissions.</p></Card> : (
                <div className="space-y-4">{kyc.map(k => (
                  <Card key={k.individualId} className="p-6">
                    <div className="flex flex-col lg:flex-row gap-6">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2"><h3 className="font-semibold">{k.fullName}</h3><Badge className="bg-yellow-100 text-yellow-700">{k.kycStatus}</Badge>{k.kycRoute && <Badge variant="outline">{k.kycRoute}</Badge>}</div>
                        <p className="text-sm text-neutral-600">{k.email}</p>
                        <p className="text-sm text-neutral-600 mt-1">ID Number: <span className="font-medium">{k.idNumber || "—"}</span></p>
                        {k.kycMatchScore != null && <p className="text-sm text-neutral-500 mt-1">Face match score: {(k.kycMatchScore * 100).toFixed(1)}%</p>}
                        {k.submittedDate && <p className="text-xs text-neutral-400 mt-1">Submitted {new Date(k.submittedDate).toLocaleDateString()}</p>}
                        <div className="flex gap-3 mt-4">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApproveKyc(k.individualId)}><CheckCircle className="w-4 h-4 mr-1" /> Approve</Button>
                          <Button size="sm" variant="outline" className="text-red-600 border-red-200" onClick={() => handleRejectKyc(k.individualId)}><X className="w-4 h-4 mr-1" /> Reject</Button>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="text-center"><p className="text-xs text-neutral-500 mb-1">ID Document</p>{k.idDocumentUrl ? <a href={resolveMediaUrl(k.idDocumentUrl)} target="_blank" rel="noreferrer"><img src={resolveMediaUrl(k.idDocumentUrl)} alt="ID" className="w-40 h-28 object-cover rounded-md border border-neutral-200" /></a> : <div className="w-40 h-28 bg-neutral-100 rounded-md flex items-center justify-center text-neutral-400 text-xs">No image</div>}</div>
                        <div className="text-center"><p className="text-xs text-neutral-500 mb-1">Selfie</p>{k.selfieUrl ? <a href={resolveMediaUrl(k.selfieUrl)} target="_blank" rel="noreferrer"><img src={resolveMediaUrl(k.selfieUrl)} alt="Selfie" className="w-40 h-28 object-cover rounded-md border border-neutral-200" /></a> : <div className="w-40 h-28 bg-neutral-100 rounded-md flex items-center justify-center text-neutral-400 text-xs">No image</div>}</div>
                      </div>
                    </div>
                  </Card>
                ))}</div>
              )}
            </div>)}

            {/* MODERATION — REPORTED POSTS */}
            {activeTab === "moderation" && (<div>
              <div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-bold mb-2">Reported Posts</h1><p className="text-neutral-600">Review posts reported by the community</p></div><Button variant="outline" size="sm" onClick={loadReports}><RefreshCw className="w-4 h-4" /></Button></div>
              {reportsLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div> : reports.length === 0 ? <Card className="p-12 text-center"><Flag className="w-10 h-10 text-neutral-300 mx-auto mb-3" /><p className="text-neutral-600">No pending reports. The community feed is clean.</p></Card> : (
                <div className="space-y-4">{reports.map(r => (
                  <Card key={r.reportId} className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2"><Badge className="bg-red-100 text-red-700"><Flag className="w-3 h-3 mr-1" /> Reported</Badge><span className="text-xs text-neutral-500">{new Date(r.createdAt).toLocaleDateString()}</span></div>
                        <h3 className="font-semibold mb-1">{r.post.postTitle}</h3>
                        {r.post.content && <p className="text-neutral-600 text-sm mb-2 line-clamp-3">{r.post.content}</p>}
                        {r.post.mediaUrl && <img src={resolveMediaUrl(r.post.mediaUrl)} alt="" className="max-h-40 rounded-md border border-neutral-200 object-cover mb-2" />}
                        <p className="text-sm mt-2"><span className="font-medium text-neutral-700">Reason:</span> <span className="text-neutral-600">{r.reason}</span></p>
                        <p className="text-xs text-neutral-400 mt-1">Reported by {r.reporterName ?? `user #${r.reporterUserId}`} · Post by {r.post.authorName ?? `user #${r.post.authorUserId}`} · Post status: {r.post.activityStatus}</p>
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button size="sm" variant="outline" onClick={() => handleDismissReport(r.reportId)}><CheckCircle className="w-4 h-4 mr-1" /> Dismiss</Button>
                        <Button size="sm" className="bg-red-600 hover:bg-red-700" onClick={() => handleRemoveReportedPost(r.reportId)}><Ban className="w-4 h-4 mr-1" /> Remove Post</Button>
                      </div>
                    </div>
                  </Card>
                ))}</div>
              )}
            </div>)}

            {/* TRANSACTIONS */}
            {activeTab === "transactions" && (<div>
              <div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-bold mb-2">All Transactions</h1><p className="text-neutral-600">Platform-wide transaction history</p></div><Button variant="outline" size="sm" onClick={loadTransactions}><RefreshCw className="w-4 h-4" /></Button></div>
              {transactionsLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div> : transactions.length === 0 ? <Card className="p-12 text-center"><p className="text-neutral-600">No transactions recorded.</p></Card> : (
                <div className="space-y-2">{transactions.slice(0, 50).map(t => (
                  <Card
                    key={t.transactionId}
                    className="p-4 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setSelectedTx(t)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); setSelectedTx(t); } }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 min-w-0">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.transactionType === "Donation" ? "bg-green-100" : t.transactionType === "TopUp" ? "bg-blue-100" : "bg-orange-100"}`}>
                          <DollarSign className={`w-5 h-5 ${t.transactionType === "Donation" ? "text-green-600" : t.transactionType === "TopUp" ? "text-blue-600" : "text-orange-600"}`} />
                        </div>
                        <div className="min-w-0"><p className="font-medium">{formatZar(t.amount)}</p><p className="text-xs text-neutral-500">{t.transactionType} • {new Date(t.timestamp).toLocaleString()}</p>{(t.senderName || t.receiverName) && <p className="text-xs text-neutral-500 truncate">{t.senderName ?? "External"} → {t.receiverName ?? "External"}</p>}{t.reason && <p className="text-xs text-neutral-600 truncate">Reason: {t.reason}</p>}</div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <Badge className={t.status === "Completed" ? "bg-green-100 text-green-700" : t.status === "Failed" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}>{t.status}</Badge>
                        <Eye className="w-4 h-4 text-neutral-400" />
                      </div>
                    </div>
                  </Card>
                ))}</div>
              )}
            </div>)}

            {/* REPORTS */}
            {activeTab === "reports" && (<div><AdminReportsPanel /></div>)}

          </motion.div>
        </main>
      </div>

      {/* User detail */}
      {(selectedUserDetail || userDetailLoading) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => { if (!userDetailLoading) setSelectedUserDetail(null); }}>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="overflow-hidden p-0">
              {userDetailLoading ? (
                <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div>
              ) : selectedUserDetail && (() => {
                const u = selectedUserDetail;
                const displayName = u.name || u.email;
                const initial = (u.name || u.email).charAt(0).toUpperCase();
                const gradient = u.userType === "Individual"
                  ? "from-blue-500 to-blue-600"
                  : u.userType === "NPO"
                  ? "from-orange-500 to-orange-600"
                  : u.userType === "Business"
                  ? "from-purple-500 to-purple-600"
                  : "from-neutral-600 to-neutral-700";
                const badgeColor = u.userType === "Individual" ? "bg-blue-100 text-blue-700" : u.userType === "NPO" ? "bg-orange-100 text-orange-700" : u.userType === "Business" ? "bg-purple-100 text-purple-700" : "bg-neutral-100 text-neutral-700";
                const joinedDate = u.registrationDate ? new Date(u.registrationDate) : null;
                const joinedStr = joinedDate && !isNaN(joinedDate.getTime()) ? joinedDate.toLocaleDateString() : "—";
                return (
                  <>
                    <div className={`relative bg-gradient-to-br ${gradient} text-white p-6 flex flex-col items-center text-center`}>
                      <button onClick={() => setSelectedUserDetail(null)} className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                      <div className="w-20 h-20 rounded-full bg-white/25 backdrop-blur-sm flex items-center justify-center mb-3 overflow-hidden border-3 border-white/40">
                        {u.profileImage
                          ? <img src={resolveMediaUrl(u.profileImage)} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                          : <span className="text-2xl font-bold">{initial}</span>}
                      </div>
                      <p className="text-lg font-bold">{displayName}</p>
                      <p className="text-white/70 text-sm">{u.email}</p>
                      <div className="flex gap-2 mt-2">
                        <Badge className={badgeColor}>{u.userType}</Badge>
                        {u.isVerified && <Badge className="bg-green-100 text-green-700">Verified</Badge>}
                        {!u.isActive && <Badge className="bg-red-100 text-red-700">Inactive</Badge>}
                      </div>
                    </div>
                    <div className="p-6 space-y-3 text-sm">
                      <div className="flex items-start justify-between gap-3"><span className="text-neutral-500 shrink-0">User ID</span><span className="font-medium">#{u.userId}</span></div>
                      <div className="flex items-start justify-between gap-3"><span className="text-neutral-500 shrink-0">Contact</span><span className="font-medium text-right">{u.contact || "—"}</span></div>
                      <div className="flex items-start justify-between gap-3"><span className="text-neutral-500 shrink-0">Location</span><span className="font-medium text-right">{u.location || "—"}</span></div>
                      <div className="flex items-start justify-between gap-3"><span className="text-neutral-500 shrink-0">Joined</span><span className="font-medium">{joinedStr}</span></div>
                    </div>
                    <div className="px-6 pb-6 flex gap-3">
                      {u.isActive ? (
                        <Button size="sm" variant="outline" className="flex-1 text-red-600" onClick={() => { handleDeactivateUser(u.userId); setSelectedUserDetail(null); }}><Ban className="w-4 h-4 mr-1" /> Deactivate</Button>
                      ) : (
                        <Button size="sm" variant="outline" className="flex-1 text-green-600" onClick={() => { handleActivateUser(u.userId); setSelectedUserDetail(null); }}><UserCheck className="w-4 h-4 mr-1" /> Activate</Button>
                      )}
                      <Button variant="outline" className="flex-1" onClick={() => setSelectedUserDetail(null)}>Close</Button>
                    </div>
                  </>
                );
              })()}
            </Card>
          </motion.div>
        </div>
      )}

      {/* Transaction detail */}
      {selectedTx && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedTx(null)}>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="overflow-hidden p-0">
              <div className="relative bg-gradient-to-br from-neutral-800 to-neutral-900 text-white p-6">
                <button onClick={() => setSelectedTx(null)} className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
                <p className="text-white/70 text-sm">{selectedTx.transactionType}</p>
                <p className="text-3xl font-bold tracking-tight">{formatZar(selectedTx.amount)}</p>
                <Badge className={`mt-2 ${selectedTx.status === "Completed" ? "bg-green-100 text-green-700" : selectedTx.status === "Failed" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{selectedTx.status}</Badge>
              </div>
              <div className="p-6 space-y-3 text-sm">
                <div className="flex items-start justify-between gap-3"><span className="text-neutral-500 shrink-0">Transaction ID</span><span className="font-medium text-right">#{selectedTx.transactionId}</span></div>
                <div className="flex items-start justify-between gap-3"><span className="text-neutral-500 shrink-0">From</span><span className="font-medium text-right">{selectedTx.senderName ?? "External"}</span></div>
                <div className="flex items-start justify-between gap-3"><span className="text-neutral-500 shrink-0">To</span><span className="font-medium text-right">{selectedTx.receiverName ?? "External"}</span></div>
                <div className="flex items-start justify-between gap-3"><span className="text-neutral-500 shrink-0">Date</span><span className="font-medium text-right">{new Date(selectedTx.timestamp).toLocaleString()}</span></div>
                <div className="pt-3 border-t border-neutral-100">
                  <span className="text-neutral-500">Reason</span>
                  <p className="font-medium mt-1">{selectedTx.reason ? selectedTx.reason : <span className="text-neutral-400 font-normal">No reason recorded (not a withdrawal).</span>}</p>
                </div>
              </div>
              <div className="px-6 pb-6">
                <Button variant="outline" className="w-full" onClick={() => setSelectedTx(null)}>Close</Button>
              </div>
            </Card>
          </motion.div>
        </div>
      )}
    </div>
  );
}
