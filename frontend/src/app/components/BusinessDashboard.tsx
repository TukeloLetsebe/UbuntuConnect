import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { businessService, getErrorMessage, type BusinessProfile, type NPOSummary, type FollowedNPO, type Campaign, type CampaignApplication, type DonationsResponse, type BusinessImpact, type CommunityPost, type CommentItem } from "../../services/businessService";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Search, Heart, TrendingUp, LogOut, DollarSign, Users, Plus, X,
  Building2, Target, MessageSquare, Loader2, RefreshCw, Wallet,
  Calendar, FileText, CheckCircle, AlertCircle, Eye, UserCheck, Ban,
  ArrowUpFromLine, Send, Trash2, Edit, Menu
} from "lucide-react";

export default function BusinessDashboard() {
  const { logout, userId } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const selectTab = (id: string) => { setActiveTab(id); setSidebarOpen(false); };

  // Profile
  const [profile, setProfile] = useState<BusinessProfile | null>(null);

  // Discover NPOs
  const [npos, setNpos] = useState<NPOSummary[]>([]);
  const [nposLoading, setNposLoading] = useState(false);
  const [followedNpoIds, setFollowedNpoIds] = useState<Set<number>>(new Set());
  const [followedNpos, setFollowedNpos] = useState<FollowedNPO[]>([]);
  const [npoSearchQuery, setNpoSearchQuery] = useState("");

  // Campaigns
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignApps, setCampaignApps] = useState<CampaignApplication[]>([]);
  const [appsLoading, setAppsLoading] = useState(false);

  // Donations
  const [donations, setDonations] = useState<DonationsResponse | null>(null);
  const [donationsLoading, setDonationsLoading] = useState(false);

  // Wallet
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletLoading, setWalletLoading] = useState(false);
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [toppingUp, setToppingUp] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donateNpoId, setDonateNpoId] = useState<number | null>(null);
  const [donateAmount, setDonateAmount] = useState("");
  const [donating, setDonating] = useState(false);

  // Impact
  const [impact, setImpact] = useState<BusinessImpact | null>(null);

  // Community
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);
  const [likedPostIds, setLikedPostIds] = useState<Set<number>>(new Set());

  // Comments
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // ═══ LOADERS ═══
  const loadProfile = useCallback(async () => {
    try { const r = await businessService.getProfile(); setProfile(r.data); } catch {}
  }, []);

  const loadWallet = useCallback(async () => {
    if (!userId) return;
    setWalletLoading(true);
    try { const r = await businessService.getWalletBalance(userId); setWalletBalance(r.data.balance); }
    catch {} finally { setWalletLoading(false); }
  }, [userId]);

  const loadNPOs = useCallback(async () => {
    setNposLoading(true);
    try {
      const [npoRes, followRes] = await Promise.all([businessService.discoverNPOs(), businessService.getMyFollows()]);
      setNpos(npoRes.data);
      setFollowedNpos(followRes.data);
      setFollowedNpoIds(new Set(followRes.data.map(f => f.npoId)));
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setNposLoading(false); }
  }, []);

  const loadCampaigns = useCallback(async () => {
    setCampaignsLoading(true);
    try { const r = await businessService.getMyCampaigns(); setCampaigns(r.data); }
    catch (e) { toast.error(getErrorMessage(e)); }
    finally { setCampaignsLoading(false); }
  }, []);

  const loadDonations = useCallback(async () => {
    setDonationsLoading(true);
    try { const r = await businessService.getMyDonations(); setDonations(r.data); }
    catch (e) { toast.error(getErrorMessage(e)); }
    finally { setDonationsLoading(false); }
  }, []);

  const loadImpact = useCallback(async () => {
    try { const r = await businessService.getMyImpact(); setImpact(r.data); } catch {}
  }, []);

  const loadCommunity = useCallback(async () => {
    setCommunityLoading(true);
    try {
      const [posts, likes] = await Promise.all([businessService.getCommunityUpdates(), businessService.getMyLikes()]);
      setCommunityPosts(posts.data);
      setLikedPostIds(new Set(likes.data));
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setCommunityLoading(false); }
  }, []);

  useEffect(() => { loadProfile(); loadWallet(); loadImpact(); }, [loadProfile, loadWallet, loadImpact]);
  useEffect(() => {
    if (activeTab === "discover") loadNPOs();
    if (activeTab === "campaigns") loadCampaigns();
    if (activeTab === "donations") loadDonations();
    if (activeTab === "community") loadCommunity();
  }, [activeTab, loadNPOs, loadCampaigns, loadDonations, loadCommunity]);

  // ═══ HANDLERS ═══
  const handleFollow = async (npoId: number) => {
    const isFollowed = followedNpoIds.has(npoId);
    if (isFollowed) {
      setFollowedNpoIds(p => { const n = new Set(p); n.delete(npoId); return n; });
      try { await businessService.unfollowNPO(npoId); toast.success("Unfollowed."); } catch (e) { setFollowedNpoIds(p => new Set(p).add(npoId)); toast.error(getErrorMessage(e)); }
    } else {
      setFollowedNpoIds(p => new Set(p).add(npoId));
      try { await businessService.followNPO(npoId); toast.success("Following!"); } catch (e) { setFollowedNpoIds(p => { const n = new Set(p); n.delete(npoId); return n; }); toast.error(getErrorMessage(e)); }
    }
  };

  const handleDonate = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(donateAmount);
    if (!amt || amt <= 0 || !donateNpoId) { toast.error("Enter a valid amount."); return; }
    if (amt > walletBalance) { toast.error("Insufficient balance. Top up first."); return; }
    setDonating(true);
    try {
      const r = await businessService.donate(donateNpoId, amt);
      setWalletBalance(r.data.newBalance);
      setShowDonateModal(false); setDonateAmount("");
      toast.success(`Donated R ${amt.toLocaleString()} successfully!`);
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setDonating(false); }
  };

  const handleTopUp = async (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(topUpAmount);
    if (!amt || amt <= 0) { toast.error("Enter a valid amount."); return; }
    setToppingUp(true);
    try {
      const r = await businessService.topUp(amt);
      setWalletBalance(r.data.newBalance);
      setShowTopUp(false); setTopUpAmount("");
      toast.success(`R ${amt.toLocaleString()} added to wallet!`);
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setToppingUp(false); }
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    try {
      await businessService.createCampaign({
        title: fd.get("title") as string,
        description: (fd.get("description") as string) || undefined,
        category: (fd.get("category") as string) || undefined,
        requirements: (fd.get("requirements") as string) || undefined,
        budgetPerPartner: parseFloat(fd.get("budgetPerPartner") as string) || undefined,
        startDate: fd.get("startDate") as string,
        endDate: (fd.get("endDate") as string) || undefined,
      });
      setShowCreateCampaign(false);
      loadCampaigns();
      toast.success("Campaign created!");
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const handleDeleteCampaign = async (id: number) => {
    if (!confirm("Delete this campaign?")) return;
    try { await businessService.deleteCampaign(id); setCampaigns(p => p.filter(c => c.campaignId !== id)); toast.success("Deleted."); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };

  const handleUpdateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;
    const fd = new FormData(e.currentTarget as HTMLFormElement);
    try {
      await businessService.updateCampaign(editingCampaign.campaignId, {
        title: (fd.get("title") as string) || undefined,
        description: (fd.get("description") as string) || undefined,
        category: (fd.get("category") as string) || undefined,
        requirements: (fd.get("requirements") as string) || undefined,
        budgetPerPartner: fd.get("budgetPerPartner") ? parseFloat(fd.get("budgetPerPartner") as string) : undefined,
      });
      setEditingCampaign(null);
      loadCampaigns();
      toast.success("Campaign updated!");
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const handleViewApplications = async (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setAppsLoading(true);
    try { const r = await businessService.getCampaignApplications(campaign.campaignId); setCampaignApps(r.data); }
    catch (e) { toast.error(getErrorMessage(e)); }
    finally { setAppsLoading(false); }
  };

  const handleApproveApp = async (id: number) => {
    try { await businessService.approveApplication(id); setCampaignApps(p => p.map(a => a.applicationId === id ? { ...a, status: "Accepted" } : a)); toast.success("Approved!"); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };

  const handleRejectApp = async (id: number) => {
    try { await businessService.rejectApplication(id); setCampaignApps(p => p.map(a => a.applicationId === id ? { ...a, status: "Rejected" } : a)); toast.success("Rejected."); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };

  const handleLikePost = async (postId: number) => {
    const isLiked = likedPostIds.has(postId);
    if (isLiked) {
      setLikedPostIds(p => { const n = new Set(p); n.delete(postId); return n; });
      setCommunityPosts(p => p.map(x => x.postId === postId ? { ...x, likeCount: Math.max(0, x.likeCount - 1) } : x));
      try { await businessService.unlikePost(postId); } catch (e) { setLikedPostIds(p => new Set(p).add(postId)); toast.error(getErrorMessage(e)); }
    } else {
      setLikedPostIds(p => new Set(p).add(postId));
      setCommunityPosts(p => p.map(x => x.postId === postId ? { ...x, likeCount: x.likeCount + 1 } : x));
      try { await businessService.likePost(postId); } catch (e) { const m = getErrorMessage(e); if (!m.toLowerCase().includes("already liked")) { setLikedPostIds(p => { const n = new Set(p); n.delete(postId); return n; }); toast.error(m); } }
    }
  };

  const handleOpenComments = async (post: CommunityPost) => {
    setSelectedPost(post);
    setComments([]);
    setNewComment("");
    setCommentsLoading(true);
    try { const r = await businessService.getComments(post.postId); setComments(r.data); }
    catch (e) { toast.error(getErrorMessage(e)); }
    finally { setCommentsLoading(false); }
  };

  const handleAddComment = async () => {
    if (!selectedPost) return;
    const content = newComment.trim();
    if (!content) return;
    setCommentSubmitting(true);
    try {
      const r = await businessService.createComment(selectedPost.postId, content);
      setComments(prev => [r.data, ...prev]);
      setNewComment("");
      toast.success("Comment added!");
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setCommentSubmitting(false); }
  };

  const handleDeleteComment = async (commentId: number) => {
    try { await businessService.deleteComment(commentId); setComments(prev => prev.filter(c => c.commentId !== commentId)); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };

  const filteredNpos = npos.filter(n => !npoSearchQuery || n.organizationName.toLowerCase().includes(npoSearchQuery.toLowerCase()) || (n.focusArea || "").toLowerCase().includes(npoSearchQuery.toLowerCase()));

  // ═══ RENDER ═══
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 py-4 px-6"><div className="container mx-auto max-w-7xl flex items-center justify-between"><div className="flex items-center gap-3"><button onClick={() => setSidebarOpen(true)} className="lg:hidden text-neutral-600"><Menu className="w-6 h-6" /></button><button onClick={() => setActiveTab("overview")} className="text-xl text-neutral-900 font-bold">UbuntuConnect</button></div><div className="flex items-center gap-4"><span className="text-neutral-600 hidden sm:inline">{profile?.contactPersonName || profile?.businessEmail || "Business"}</span><Button variant="outline" size="sm" onClick={logout}><LogOut className="w-4 h-4 mr-2" /> Logout</Button></div></div></header>

      <div className="flex">
        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform fixed lg:sticky top-0 left-0 z-40 w-64 bg-white border-r border-neutral-200 h-screen lg:min-h-[calc(100vh-73px)] p-6 overflow-y-auto`}>
          <div className="flex justify-between items-center mb-4 lg:hidden"><span className="font-bold">Menu</span><button onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></button></div>
          <nav className="space-y-2">
            {[
              { id: "overview", icon: TrendingUp, label: "Overview" },
              { id: "discover", icon: Search, label: "Discover NPOs" },
              { id: "following", icon: Heart, label: "Following" },
              { id: "campaigns", icon: Target, label: "Campaigns" },
              { id: "donations", icon: DollarSign, label: "Donations" },
              { id: "wallet", icon: Wallet, label: "Wallet" },
              { id: "community", icon: MessageSquare, label: "Community Feed" },
            ].map(item => (
              <button key={item.id} onClick={() => selectTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${activeTab === item.id ? "bg-orange-50 text-orange-600" : "text-neutral-600 hover:bg-neutral-50"}`}><item.icon className="w-5 h-5" /> {item.label}</button>
            ))}
            <Link to="/fundraisers" className="w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-neutral-600 hover:bg-neutral-50"><Target className="w-5 h-5" /> Fundraisers</Link>
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-8 w-full min-w-0">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

            {/* OVERVIEW */}
            {activeTab === "overview" && (<div>
              <div className="mb-8"><h1 className="text-2xl font-bold mb-2">Business Dashboard</h1><p className="text-neutral-600">Welcome back, {profile?.contactPersonName || "Business"}</p></div>
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <Card className="p-6 cursor-pointer hover:shadow-md" onClick={() => setActiveTab("wallet")}><div className="flex justify-between mb-2"><span className="text-neutral-600 text-sm">Balance</span><Wallet className="w-5 h-5 text-neutral-400" /></div><div className="text-3xl font-bold">R {walletBalance.toLocaleString()}</div></Card>
                <Card className="p-6 cursor-pointer hover:shadow-md" onClick={() => setActiveTab("donations")}><div className="flex justify-between mb-2"><span className="text-neutral-600 text-sm">Total Donated</span><DollarSign className="w-5 h-5 text-neutral-400" /></div><div className="text-3xl font-bold">R {(impact?.totalDonated || 0).toLocaleString()}</div></Card>
                <Card className="p-6 cursor-pointer hover:shadow-md" onClick={() => setActiveTab("campaigns")}><div className="flex justify-between mb-2"><span className="text-neutral-600 text-sm">Campaigns</span><Target className="w-5 h-5 text-neutral-400" /></div><div className="text-3xl font-bold">{impact?.activeCampaigns || 0}</div></Card>
                <Card className="p-6 cursor-pointer hover:shadow-md" onClick={() => setActiveTab("discover")}><div className="flex justify-between mb-2"><span className="text-neutral-600 text-sm">NPOs Supported</span><Users className="w-5 h-5 text-neutral-400" /></div><div className="text-3xl font-bold">{impact?.nposSupported || 0}</div></Card>
              </div>
              {profile?.csrGoal && <Card className="p-6"><h3 className="font-semibold mb-2">CSR Goal</h3><p className="text-neutral-600">{profile.csrGoal}</p></Card>}
            </div>)}

            {/* DISCOVER NPOs */}
            {activeTab === "discover" && (<div>
              <div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-bold mb-2">Discover NPOs</h1><p className="text-neutral-600">Find and support organizations aligned with your CSR goals</p></div><Button variant="outline" size="sm" onClick={loadNPOs}><RefreshCw className="w-4 h-4" /></Button></div>
              <div className="mb-6"><Input placeholder="Search by name or focus area..." value={npoSearchQuery} onChange={e => setNpoSearchQuery(e.target.value)} className="max-w-md" /></div>
              {nposLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-orange-600" /></div> : filteredNpos.length === 0 ? <Card className="p-12 text-center"><p className="text-neutral-600">No NPOs found.</p></Card> : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{filteredNpos.map(npo => (
                  <Card key={npo.npoId} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center"><span className="text-lg font-bold text-orange-600">{npo.organizationName.charAt(0)}</span></div><div><h3 className="font-semibold">{npo.organizationName}</h3>{npo.focusArea && <Badge variant="outline" className="text-xs">{npo.focusArea}</Badge>}</div></div>
                    {npo.mission && <p className="text-sm text-neutral-600 mb-4 line-clamp-2">{npo.mission}</p>}
                    {npo.isVerified && <Badge className="mb-3 bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" /> Verified</Badge>}
                    <div className="flex gap-2">
                      <Button variant={followedNpoIds.has(npo.npoId) ? "default" : "outline"} size="sm" className={`flex-1 ${followedNpoIds.has(npo.npoId) ? "bg-orange-600 hover:bg-orange-700" : ""}`} onClick={() => handleFollow(npo.npoId)}><Heart className={`w-4 h-4 mr-1 ${followedNpoIds.has(npo.npoId) ? "fill-current" : ""}`} /> {followedNpoIds.has(npo.npoId) ? "Following" : "Follow"}</Button>
                      <Button variant="outline" size="sm" onClick={() => { setDonateNpoId(npo.npoId); setDonateAmount(""); setShowDonateModal(true); }}><DollarSign className="w-4 h-4" /></Button>
                    </div>
                  </Card>
                ))}</div>
              )}
            </div>)}

            {/* FOLLOWING */}
            {activeTab === "following" && (<div>
              <h1 className="text-2xl font-bold mb-6">Following</h1>
              {followedNpos.length === 0 ? <Card className="p-12 text-center"><p className="text-neutral-600">You're not following any NPOs yet.</p><Button onClick={() => setActiveTab("discover")} className="mt-4">Discover NPOs</Button></Card> : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{followedNpos.map(npo => (
                  <Card key={npo.npoId} className="p-6">
                    <div className="flex items-center gap-3 mb-3"><div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center"><span className="font-bold text-orange-600">{npo.organizationName.charAt(0)}</span></div><div><h3 className="font-semibold text-sm">{npo.organizationName}</h3>{npo.focusArea && <p className="text-xs text-neutral-500">{npo.focusArea}</p>}</div></div>
                    <p className="text-xs text-neutral-500 mb-3">Following since {new Date(npo.followDate).toLocaleDateString()}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" className="flex-1" onClick={() => { setDonateNpoId(npo.npoId); setDonateAmount(""); setShowDonateModal(true); }}><DollarSign className="w-4 h-4 mr-1" /> Donate</Button>
                      <Button size="sm" variant="outline" className="text-red-600" onClick={() => handleFollow(npo.npoId)}><X className="w-4 h-4" /></Button>
                    </div>
                  </Card>
                ))}</div>
              )}
            </div>)}

            {/* CAMPAIGNS */}
            {activeTab === "campaigns" && (<div>
              <div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-bold mb-2">Partnership Campaigns</h1><p className="text-neutral-600">Create campaigns for NPOs to apply to</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={loadCampaigns}><RefreshCw className="w-4 h-4" /></Button><Button className="bg-orange-600 hover:bg-orange-700" onClick={() => setShowCreateCampaign(true)}><Plus className="w-4 h-4 mr-2" /> New Campaign</Button></div></div>
              {campaignsLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-orange-600" /></div> : campaigns.length === 0 ? <Card className="p-12 text-center"><Target className="w-12 h-12 text-neutral-400 mx-auto mb-3" /><p className="text-neutral-600">No campaigns yet.</p><Button onClick={() => setShowCreateCampaign(true)} className="mt-4">Create Campaign</Button></Card> : (
                <div className="space-y-4">{campaigns.map(c => (
                  <Card key={c.campaignId} className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1"><h3 className="font-semibold text-lg">{c.title}</h3>{c.category && <Badge variant="outline" className="mt-1">{c.category}</Badge>}{c.description && <p className="text-neutral-600 text-sm mt-2">{c.description}</p>}<div className="flex gap-4 mt-3 text-sm text-neutral-500">{c.budgetPerPartner && <span>R {c.budgetPerPartner.toLocaleString()}/partner</span>}<span><Calendar className="w-4 h-4 inline mr-1" />{c.startDate}</span>{c.applicantCount !== undefined && <span>{c.applicantCount} applicant{c.applicantCount !== 1 ? "s" : ""}</span>}</div></div>
                      <div className="flex gap-2 ml-4"><Button size="sm" variant="outline" onClick={() => handleViewApplications(c)}><Eye className="w-4 h-4 mr-1" /> Apps</Button><Button size="sm" variant="outline" onClick={() => setEditingCampaign(c)}><Edit className="w-4 h-4" /></Button><Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDeleteCampaign(c.campaignId)}><X className="w-4 h-4" /></Button></div>
                    </div>
                  </Card>
                ))}</div>
              )}

              {/* View Applications Modal */}
              {selectedCampaign && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6">
                <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Applications for: {selectedCampaign.title}</h2><Button variant="ghost" size="sm" onClick={() => setSelectedCampaign(null)}><X className="w-4 h-4" /></Button></div>
                {appsLoading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div> : campaignApps.length === 0 ? <p className="text-neutral-600 text-center py-8">No applications yet.</p> : (
                  <div className="space-y-3">{campaignApps.map(app => (
                    <Card key={app.applicationId} className="p-4"><div className="flex items-center justify-between"><div><p className="font-medium">NPO #{app.npoId}</p>{app.motivation && <p className="text-sm text-neutral-600 mt-1">{app.motivation}</p>}<p className="text-xs text-neutral-500 mt-1">{new Date(app.applicationDate).toLocaleDateString()}</p></div><div className="flex items-center gap-2">{app.status === "Pending" ? (<><Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApproveApp(app.applicationId)}><CheckCircle className="w-4 h-4" /></Button><Button size="sm" variant="outline" className="text-red-600" onClick={() => handleRejectApp(app.applicationId)}><Ban className="w-4 h-4" /></Button></>) : <Badge className={app.status === "Accepted" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>{app.status}</Badge>}</div></div></Card>
                  ))}</div>
                )}
              </Card></div>)}
            </div>)}

            {/* DONATIONS */}
            {activeTab === "donations" && (<div>
              <div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-bold">My Donations</h1><div className="flex gap-2"><Button variant="outline" size="sm" onClick={async () => { try { const r = await businessService.generateReport(); const blob = new Blob([r.data], { type: "text/csv" }); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = `donations_report_${new Date().toISOString().slice(0,10)}.csv`; a.click(); URL.revokeObjectURL(url); toast.success("Report downloaded!"); } catch (e) { toast.error(getErrorMessage(e)); } }}><FileText className="w-4 h-4 mr-1" /> Generate Report</Button><Button variant="outline" size="sm" onClick={loadDonations}><RefreshCw className="w-4 h-4" /></Button></div></div>
              {donationsLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-orange-600" /></div> : !donations || donations.count === 0 ? <Card className="p-12 text-center"><DollarSign className="w-12 h-12 text-neutral-400 mx-auto mb-3" /><p className="text-neutral-600">No donations yet.</p></Card> : (
                <div>
                  <Card className="p-6 mb-6"><div className="text-center"><p className="text-sm text-neutral-600">Total Donated</p><p className="text-3xl font-bold text-green-600">R {donations.totalDonated.toLocaleString()}</p><p className="text-sm text-neutral-500">{donations.count} donation{donations.count > 1 ? "s" : ""}</p></div></Card>
                  <div className="space-y-3">{donations.donations.map(d => (
                    <Card key={d.transactionId} className="p-4"><div className="flex items-center justify-between"><div><p className="font-medium">R {d.amount.toLocaleString()}</p><p className="text-xs text-neutral-500">{new Date(d.timestamp).toLocaleString()}</p></div><Badge className={d.status === "Completed" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}>{d.status}</Badge></div></Card>
                  ))}</div>
                </div>
              )}
            </div>)}

            {/* WALLET */}
            {activeTab === "wallet" && (<div>
              <h1 className="text-2xl font-bold mb-6">Wallet</h1>
              <Card className="p-8 text-center mb-6"><Wallet className="w-12 h-12 text-orange-600 mx-auto mb-3" /><p className="text-sm text-neutral-600">Current Balance</p><p className="text-4xl font-bold">R {walletBalance.toLocaleString()}</p><Button className="mt-4 bg-orange-600 hover:bg-orange-700" onClick={() => setShowTopUp(true)}><ArrowUpFromLine className="w-4 h-4 mr-2" /> Top Up</Button></Card>
            </div>)}

            {/* COMMUNITY */}
            {activeTab === "community" && (<div>
              <div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-bold">Community Feed</h1><Button variant="outline" size="sm" onClick={loadCommunity}><RefreshCw className="w-4 h-4 mr-2" /> Refresh</Button></div>
              {communityLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div> : communityPosts.length === 0 ? <Card className="p-12 text-center"><p className="text-neutral-600">No posts yet.</p></Card> : (
                <div className="grid md:grid-cols-2 gap-6">{communityPosts.map(post => (
                  <Card key={post.postId} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {post.mediaUrl && <img src={post.mediaUrl} alt="" className="w-full h-48 object-cover" />}
                    <div className="p-6"><p className="text-xs text-orange-600 font-medium mb-1">{post.authorName}</p><h3 className="font-semibold mb-2">{post.postTitle}</h3>{post.content && <p className="text-neutral-600 text-sm mb-4 line-clamp-3">{post.content}</p>}<div className="flex items-center justify-between text-sm"><div className="flex items-center gap-4"><button onClick={() => handleLikePost(post.postId)} className={`flex items-center gap-1 ${likedPostIds.has(post.postId) ? "text-red-500" : "text-neutral-600"}`}><Heart className={`w-4 h-4 ${likedPostIds.has(post.postId) ? "fill-current" : ""}`} /> {post.likeCount}</button><button onClick={() => handleOpenComments(post)} className="flex items-center gap-1 text-neutral-600 hover:text-orange-600"><MessageSquare className="w-4 h-4" /> Comment</button></div><span className="text-neutral-500 text-xs">{new Date(post.timestamp).toLocaleDateString()}</span></div></div>
                  </Card>
                ))}</div>
              )}
            </div>)}

          </motion.div>
        </main>
      </div>

      {/* CREATE CAMPAIGN MODAL */}
      {showCreateCampaign && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><Card className="w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Create Campaign</h2><Button variant="ghost" size="sm" onClick={() => setShowCreateCampaign(false)}><X className="w-4 h-4" /></Button></div>
        <form onSubmit={handleCreateCampaign} className="space-y-4">
          <div><Label>Title *</Label><Input name="title" required /></div>
          <div><Label>Description</Label><Textarea name="description" /></div>
          <div className="grid grid-cols-2 gap-4"><div><Label>Category</Label><Input name="category" placeholder="e.g. Education" /></div><div><Label>Budget per Partner (R)</Label><Input name="budgetPerPartner" type="number" step="0.01" /></div></div>
          <div><Label>Requirements</Label><Textarea name="requirements" placeholder="What you expect from partner NPOs..." /></div>
          <div className="grid grid-cols-2 gap-4"><div><Label>Start Date *</Label><Input name="startDate" type="date" required /></div><div><Label>End Date</Label><Input name="endDate" type="date" /></div></div>
          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">Create Campaign</Button>
        </form>
      </Card></div>)}

      {/* EDIT CAMPAIGN MODAL */}
      {editingCampaign && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><Card className="w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Edit Campaign</h2><Button variant="ghost" size="sm" onClick={() => setEditingCampaign(null)}><X className="w-4 h-4" /></Button></div>
        <form onSubmit={handleUpdateCampaign} className="space-y-4">
          <div><Label>Title</Label><Input name="title" defaultValue={editingCampaign.title} required /></div>
          <div><Label>Description</Label><Textarea name="description" defaultValue={editingCampaign.description || ""} /></div>
          <div className="grid grid-cols-2 gap-4"><div><Label>Category</Label><Input name="category" defaultValue={editingCampaign.category || ""} placeholder="e.g. Education" /></div><div><Label>Budget per Partner (R)</Label><Input name="budgetPerPartner" type="number" step="0.01" defaultValue={editingCampaign.budgetPerPartner ?? ""} /></div></div>
          <div><Label>Requirements</Label><Textarea name="requirements" defaultValue={editingCampaign.requirements || ""} placeholder="What you expect from partner NPOs..." /></div>
          <div className="flex gap-3"><Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">Save Changes</Button><Button type="button" variant="outline" onClick={() => setEditingCampaign(null)}>Cancel</Button></div>
        </form>
      </Card></div>)}

      {/* DONATE MODAL */}
      {showDonateModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><Card className="w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold">Donate to NPO</h2><Button variant="ghost" size="sm" onClick={() => setShowDonateModal(false)}><X className="w-4 h-4" /></Button></div>
        <p className="text-sm text-neutral-600 mb-4">Balance: R {walletBalance.toLocaleString()}</p>
        <form onSubmit={handleDonate} className="space-y-4">
          <div><Label>Amount (R)</Label><Input type="number" step="0.01" min="1" value={donateAmount} onChange={e => setDonateAmount(e.target.value)} required /></div>
          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={donating}>{donating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Donate"}</Button>
        </form>
      </Card></div>)}

      {/* TOP UP MODAL */}
      {showTopUp && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><Card className="w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold">Top Up Wallet</h2><Button variant="ghost" size="sm" onClick={() => setShowTopUp(false)}><X className="w-4 h-4" /></Button></div>
        <form onSubmit={handleTopUp} className="space-y-4">
          <div><Label>Amount (R)</Label><Input type="number" step="0.01" min="1" value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)} required /></div>
          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={toppingUp}>{toppingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : "Top Up"}</Button>
        </form>
      </Card></div>)}

      {/* COMMENTS MODAL */}
      {selectedPost && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><Card className="w-full max-w-lg max-h-[85vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold">Comments</h2><Button variant="ghost" size="sm" onClick={() => setSelectedPost(null)}><X className="w-4 h-4" /></Button></div>
        <div className="mb-4 p-3 bg-neutral-50 rounded-lg"><p className="text-xs text-orange-600 font-medium">{selectedPost.authorName}</p><p className="font-semibold text-sm">{selectedPost.postTitle}</p></div>
        <div className="flex gap-2 mb-4">
          <Input placeholder="Write a comment..." value={newComment} onChange={e => setNewComment(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddComment(); } }} />
          <Button onClick={handleAddComment} disabled={commentSubmitting} className="bg-orange-600 hover:bg-orange-700"><Send className="w-4 h-4" /></Button>
        </div>
        {commentsLoading ? <div className="flex justify-center py-6"><Loader2 className="w-6 h-6 animate-spin text-orange-600" /></div> : comments.length === 0 ? <p className="text-neutral-500 text-sm text-center py-6">No comments yet. Be the first!</p> : (
          <div className="space-y-3">{comments.map(c => (
            <div key={c.commentId} className="flex gap-3 p-3 bg-neutral-50 rounded-lg">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0"><span className="text-xs font-bold">{c.authorName?.charAt(0)}</span></div>
              <div className="flex-1">
                <div className="flex justify-between items-center"><span className="text-sm font-semibold">{c.authorName}</span><div className="flex gap-2 items-center"><span className="text-xs text-neutral-400">{new Date(c.timestamp).toLocaleDateString()}</span>{c.userId === userId && <button onClick={() => handleDeleteComment(c.commentId)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>}</div></div>
                <p className="text-sm mt-1">{c.content}</p>
              </div>
            </div>
          ))}</div>
        )}
      </Card></div>)}
    </div>
  );
}
