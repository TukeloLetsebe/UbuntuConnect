import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { adminService, getErrorMessage, type PlatformStats, type UserItem, type VerificationItem, type TransactionItem } from "../../services/adminService";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Shield, Users, Building2, Heart, TrendingUp, LogOut,
  CheckCircle, X, Search, DollarSign, AlertCircle,
  Eye, UserCheck, Ban, Loader2, RefreshCw, FileText, Menu
} from "lucide-react";

export default function AdminDashboard() {
  const { logout } = useAuth();
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

  // Verifications
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [verificationsLoading, setVerificationsLoading] = useState(false);
  const [verificationFilter, setVerificationFilter] = useState("Pending");

  // Transactions
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

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

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => {
    if (activeTab === "users") loadUsers();
    if (activeTab === "verifications") loadVerifications();
    if (activeTab === "transactions") loadTransactions();
  }, [activeTab, loadUsers, loadVerifications, loadTransactions]);

  // Reload verifications when filter changes
  useEffect(() => {
    if (activeTab === "verifications") loadVerifications();
  }, [verificationFilter, loadVerifications, activeTab]);

  // ═══ HANDLERS ═══
  const handleActivateUser = async (id: number) => {
    try { await adminService.activateUser(id); setUsers(p => p.map(u => u.userId === id ? { ...u, isActive: true } : u)); toast.success("User activated."); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };

  const handleDeactivateUser = async (id: number) => {
    if (!confirm("Deactivate this user?")) return;
    try { await adminService.deactivateUser(id); setUsers(p => p.map(u => u.userId === id ? { ...u, isActive: false } : u)); toast.success("User deactivated."); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };

  const handleApproveVerification = async (id: number) => {
    try { await adminService.approveVerification(id); setVerifications(p => p.map(v => v.verificationId === id ? { ...v, status: "Approved" } : v)); loadStats(); toast.success("Verification approved — NPO is now verified."); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };

  const handleRejectVerification = async (id: number) => {
    try { await adminService.rejectVerification(id); setVerifications(p => p.map(v => v.verificationId === id ? { ...v, status: "Rejected" } : v)); loadStats(); toast.success("Verification rejected."); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = !userSearchQuery || u.email.toLowerCase().includes(userSearchQuery.toLowerCase());
    const matchesType = userTypeFilter === "All" || u.userType === userTypeFilter;
    return matchesSearch && matchesType;
  });

  // ═══ RENDER ═══
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 py-4 px-6"><div className="container mx-auto max-w-7xl flex items-center justify-between"><div className="flex items-center gap-3"><button onClick={() => setSidebarOpen(true)} className="lg:hidden text-neutral-600"><Menu className="w-6 h-6" /></button><button onClick={() => setActiveTab("overview")} className="text-xl text-neutral-900 font-bold">UbuntuConnect</button></div><div className="flex items-center gap-4"><Badge className="bg-purple-100 text-purple-700"><Shield className="w-3 h-3 mr-1" /> Admin</Badge><Button variant="outline" size="sm" onClick={logout}><LogOut className="w-4 h-4 mr-2" /> Logout</Button></div></div></header>

      <div className="flex">
        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform fixed lg:sticky top-0 left-0 z-40 w-64 bg-white border-r border-neutral-200 h-screen lg:min-h-[calc(100vh-73px)] p-6 overflow-y-auto`}>
          <div className="flex justify-between items-center mb-4 lg:hidden"><span className="font-bold">Menu</span><button onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></button></div>
          <nav className="space-y-2">
            {[
              { id: "overview", icon: TrendingUp, label: "Overview" },
              { id: "users", icon: Users, label: "User Management" },
              { id: "verifications", icon: Shield, label: "Verifications" },
              { id: "transactions", icon: DollarSign, label: "Transactions" },
            ].map(item => (
              <button key={item.id} onClick={() => selectTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${activeTab === item.id ? "bg-purple-50 text-purple-600" : "text-neutral-600 hover:bg-neutral-50"}`}><item.icon className="w-5 h-5" /> {item.label}</button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-8 w-full min-w-0">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

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
              <div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-bold mb-2">User Management</h1><p className="text-neutral-600">{users.length} total users</p></div><Button variant="outline" size="sm" onClick={loadUsers}><RefreshCw className="w-4 h-4" /></Button></div>
              <div className="flex gap-4 mb-6">
                <Input placeholder="Search by email..." value={userSearchQuery} onChange={e => setUserSearchQuery(e.target.value)} className="max-w-sm" />
                <div className="flex gap-2">
                  {["All", "Individual", "NPO", "Business", "Admin"].map(type => (
                    <Button key={type} size="sm" variant={userTypeFilter === type ? "default" : "outline"} className={userTypeFilter === type ? "bg-purple-600" : ""} onClick={() => setUserTypeFilter(type)}>{type}</Button>
                  ))}
                </div>
              </div>
              {usersLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-purple-600" /></div> : (
                <div className="space-y-2">{filteredUsers.map(user => (
                  <Card key={user.userId} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full bg-neutral-100 flex items-center justify-center"><span className="text-sm font-bold">{user.email.charAt(0).toUpperCase()}</span></div>
                        <div><p className="font-medium">{user.email}</p><div className="flex gap-2 mt-1"><Badge variant="outline" className="text-xs">{user.userType}</Badge>{user.isVerified && <Badge className="text-xs bg-green-100 text-green-700">Verified</Badge>}{!user.isActive && <Badge className="text-xs bg-red-100 text-red-700">Inactive</Badge>}</div></div>
                      </div>
                      <div className="flex gap-2">
                        {user.isActive ? (
                          <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDeactivateUser(user.userId)}><Ban className="w-4 h-4 mr-1" /> Deactivate</Button>
                        ) : (
                          <Button size="sm" variant="outline" className="text-green-600" onClick={() => handleActivateUser(user.userId)}><UserCheck className="w-4 h-4 mr-1" /> Activate</Button>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}</div>
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
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3"><p className="font-semibold">NPO #{v.npoId}</p><Badge className={v.status === "Pending" ? "bg-yellow-100 text-yellow-700" : v.status === "Approved" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>{v.status}</Badge></div>
                        <p className="text-sm text-neutral-500 mt-1">Submitted: {new Date(v.submittedDate).toLocaleDateString()}</p>
                        {v.reviewedDate && <p className="text-sm text-neutral-500">Reviewed: {new Date(v.reviewedDate).toLocaleDateString()}</p>}
                      </div>
                      {v.status === "Pending" && (
                        <div className="flex gap-2">
                          <Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApproveVerification(v.verificationId)}><CheckCircle className="w-4 h-4 mr-1" /> Approve</Button>
                          <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleRejectVerification(v.verificationId)}><X className="w-4 h-4 mr-1" /> Reject</Button>
                        </div>
                      )}
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
                  <Card key={t.transactionId} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${t.transactionType === "Donation" ? "bg-green-100" : t.transactionType === "TopUp" ? "bg-blue-100" : "bg-orange-100"}`}>
                          <DollarSign className={`w-5 h-5 ${t.transactionType === "Donation" ? "text-green-600" : t.transactionType === "TopUp" ? "text-blue-600" : "text-orange-600"}`} />
                        </div>
                        <div><p className="font-medium">R {t.amount.toLocaleString()}</p><p className="text-xs text-neutral-500">{t.transactionType} • {new Date(t.timestamp).toLocaleString()}</p>{t.senderUserId && <p className="text-xs text-neutral-500">From User #{t.senderUserId} → User #{t.receiverUserId}</p>}</div>
                      </div>
                      <Badge className={t.status === "Completed" ? "bg-green-100 text-green-700" : t.status === "Failed" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}>{t.status}</Badge>
                    </div>
                  </Card>
                ))}</div>
              )}
            </div>)}

          </motion.div>
        </main>
      </div>
    </div>
  );
}
