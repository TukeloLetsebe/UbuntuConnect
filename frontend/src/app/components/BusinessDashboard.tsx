import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "./NotificationBell";
import EmailVerificationBanner from "./EmailVerificationBanner";
import ReportPostButton from "./ReportPostButton";
import CardPaymentFields, { type CardDetails, emptyCard } from "./CardPaymentFields";
import ImageUploadField from "./ImageUploadField";
import ImageCropField from "./ImageCropField";
import PostDetailModal from "./PostDetailModal";
import { parseProvince, SA_PROVINCES, PROVINCE_OTHER } from "../../lib/registrationOptions";
import BusinessReportsPanel from "./reports/BusinessReportsPanel";
import { resolveMediaUrl } from "../../lib/api";
import { businessService, getErrorMessage, type BusinessProfile, type NPOSummary, type FollowedNPO, type Campaign, type CampaignApplication, type DonationsResponse, type BusinessImpact, type CommunityPost, type CommentItem, type Fundraiser, type NpoDocuments } from "../../services/businessService";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "./ui/carousel";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Search, Heart, TrendingUp, LogOut, DollarSign, Users, Plus, X,
  Building2, Target, MessageSquare, Loader2, RefreshCw, Wallet,
  Calendar, FileText, CheckCircle, AlertCircle, Eye, UserCheck, Ban,
  ArrowUpFromLine, Send, Trash2, Edit, Menu, MapPin
} from "lucide-react";

export default function BusinessDashboard() {
  const { logout, userId } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const selectTab = (id: string) => { setActiveTab(id); setSidebarOpen(false); };

  // Profile
  const [profile, setProfile] = useState<BusinessProfile | null>(null);
  // Edit Profile form
  const [editIndustry, setEditIndustry] = useState("");
  const [editContactName, setEditContactName] = useState("");
  const [editContactTitle, setEditContactTitle] = useState("");
  const [editCsrGoal, setEditCsrGoal] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editProfileImage, setEditProfileImage] = useState<string | null>(null);
  const [editBackgroundImage, setEditBackgroundImage] = useState<string | null>(null);
  const [editProfileSeeded, setEditProfileSeeded] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);

  // Discover NPOs
  const [npos, setNpos] = useState<NPOSummary[]>([]);
  const [nposLoading, setNposLoading] = useState(false);
  const [followedNpoIds, setFollowedNpoIds] = useState<Set<number>>(new Set());
  const [followedNpos, setFollowedNpos] = useState<FollowedNPO[]>([]);
  const [npoSearchQuery, setNpoSearchQuery] = useState("");
  const [npoLocationFilter, setNpoLocationFilter] = useState("All");
  const [npoCategoryFilter, setNpoCategoryFilter] = useState("All");
  const [npoVerificationFilter, setNpoVerificationFilter] = useState("All");

  // Campaigns
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [campaignsLoading, setCampaignsLoading] = useState(false);

  // Overview slider: all NPO fundraisers + NPO document viewer
  const [allFundraisers, setAllFundraisers] = useState<Fundraiser[]>([]);
  const [docModalNpo, setDocModalNpo] = useState<{ npoId: number; name: string } | null>(null);
  const [npoDocs, setNpoDocs] = useState<NpoDocuments | null>(null);
  const [docsLoading, setDocsLoading] = useState(false);
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [campaignImageUrl, setCampaignImageUrl] = useState<string | null>(null);
  const [editCampaignImageUrl, setEditCampaignImageUrl] = useState<string | null>(null);
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
  const [topUpCard, setTopUpCard] = useState<CardDetails>(emptyCard);
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

  // Seed the Edit Profile form from the loaded profile the first time the tab opens.
  const seedEditProfile = useCallback(() => {
    if (!profile || editProfileSeeded) return;
    setEditIndustry(profile.industry || "");
    setEditContactName(profile.contactPersonName || "");
    setEditContactTitle(profile.contactPersonTitle || "");
    setEditCsrGoal(profile.csrGoal || "");
    setEditBio(profile.bio || "");
    setEditProfileImage(profile.profileImage);
    setEditBackgroundImage(profile.backgroundImage);
    setEditProfileSeeded(true);
  }, [profile, editProfileSeeded]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await businessService.updateProfile({
        industry: editIndustry || undefined,
        contactPersonName: editContactName || undefined,
        contactPersonTitle: editContactTitle || undefined,
        csrGoal: editCsrGoal || undefined,
        bio: editBio || undefined,
        profileImage: editProfileImage,
        backgroundImage: editBackgroundImage,
      });
      await loadProfile();
      toast.success("Profile updated!");
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setSavingProfile(false); }
  };

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

  const loadOverviewSlider = useCallback(async () => {
    try {
      const [c, f] = await Promise.all([businessService.getMyCampaigns(), businessService.getFundraisers()]);
      setCampaigns(c.data);
      setAllFundraisers(f.data.filter(x => x.projectStatus === "Active"));
    } catch { /* non-critical slider */ }
  }, []);

  useEffect(() => { loadProfile(); loadWallet(); loadImpact(); }, [loadProfile, loadWallet, loadImpact]);
  useEffect(() => {
    if (activeTab === "overview") loadOverviewSlider();
    if (activeTab === "discover") loadNPOs();
    if (activeTab === "campaigns") loadCampaigns();
    if (activeTab === "donations") loadDonations();
    if (activeTab === "community") loadCommunity();
    if (activeTab === "editprofile") seedEditProfile();
  }, [activeTab, loadOverviewSlider, loadNPOs, loadCampaigns, loadDonations, loadCommunity, seedEditProfile]);

  // ═══ HANDLERS ═══
  const handleViewDocs = async (npoId: number, name: string) => {
    setDocModalNpo({ npoId, name });
    setNpoDocs(null);
    setDocsLoading(true);
    try {
      const r = await businessService.getNpoDocuments(npoId);
      setNpoDocs(r.data);
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setDocsLoading(false); }
  };
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
    // Simulated card — no validation; any entered number is accepted.
    setToppingUp(true);
    try {
      const r = await businessService.topUp(amt, {
        cardNumber: topUpCard.cardNumber,
        cardExpiry: topUpCard.cardExpiry,
        cardCvv: topUpCard.cardCvv,
      });
      setWalletBalance(r.data.newBalance);
      setShowTopUp(false); setTopUpAmount(""); setTopUpCard(emptyCard);
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
        imageUrl: campaignImageUrl || undefined,
        startDate: fd.get("startDate") as string,
        endDate: (fd.get("endDate") as string) || undefined,
      });
      setShowCreateCampaign(false);
      setCampaignImageUrl(null);
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
        imageUrl: editCampaignImageUrl || undefined,
        startDate: (fd.get("startDate") as string) || undefined,
        // Empty end date clears it (open-ended); send null so the backend clears it.
        endDate: (fd.get("endDate") as string) || null,
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

  const npoProvinces = (() => {
    const present = new Set(npos.map(n => parseProvince(n.location) ?? (n.location ? PROVINCE_OTHER : null)).filter((p): p is string => !!p));
    const ordered = SA_PROVINCES.filter(p => present.has(p));
    if (present.has(PROVINCE_OTHER)) ordered.push(PROVINCE_OTHER);
    return ordered;
  })();
  const filteredNpos = npos.filter(n => {
    const q = npoSearchQuery.toLowerCase();
    const matchesSearch = !npoSearchQuery
      || n.organizationName.toLowerCase().includes(q)
      || (n.focusArea || "").toLowerCase().includes(q)
      || (n.location || "").toLowerCase().includes(q);
    const matchesCategory = npoCategoryFilter === "All"
      || (n.focusArea || "").toLowerCase().includes(npoCategoryFilter.toLowerCase());
    const matchesVerification = npoVerificationFilter === "All"
      || (npoVerificationFilter === "Verified" && n.isVerified)
      || (npoVerificationFilter === "Pending" && !n.isVerified);
    const prov = parseProvince(n.location) ?? (n.location ? PROVINCE_OTHER : null);
    const matchesLocation = npoLocationFilter === "All" || prov === npoLocationFilter;
    return matchesSearch && matchesCategory && matchesVerification && matchesLocation;
  });

  // ═══ RENDER ═══
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 py-4 px-6 sticky top-0 z-40"><div className="container mx-auto max-w-7xl flex items-center justify-between"><div className="flex items-center gap-3"><button onClick={() => setSidebarOpen(true)} className="lg:hidden text-neutral-600"><Menu className="w-6 h-6" /></button><button onClick={() => setActiveTab("overview")} className="text-xl text-neutral-900 font-bold">UbuntuConnect</button></div><div className="flex items-center gap-4"><button onClick={() => setActiveTab("editprofile")} className="text-neutral-600 hover:text-orange-600 transition-colors hidden sm:inline cursor-pointer" title="Go to Profile Settings">{profile?.contactPersonName || profile?.businessEmail || "Business"}</button><NotificationBell /><Button variant="outline" size="sm" onClick={logout}><LogOut className="w-4 h-4 mr-2" /> Logout</Button></div></div></header>

      <div className="flex">
        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform fixed lg:sticky top-0 lg:top-[73px] left-0 z-40 lg:z-30 w-64 bg-white border-r border-neutral-200 h-screen lg:h-[calc(100vh-73px)] p-6 overflow-y-auto`}>
          <div className="flex justify-between items-center mb-4 lg:hidden"><span className="font-bold">Menu</span><button onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></button></div>
          <nav className="space-y-2">
            {[
              { id: "overview", icon: TrendingUp, label: "Overview" },
              { id: "editprofile", icon: Edit, label: "Edit Profile" },
              { id: "discover", icon: Search, label: "Discover NPOs" },
              { id: "following", icon: Heart, label: "Following" },
              { id: "campaigns", icon: Target, label: "Campaigns" },
              { id: "donations", icon: DollarSign, label: "Donations" },
              { id: "wallet", icon: Wallet, label: "Wallet" },
              { id: "community", icon: MessageSquare, label: "Community Feed" },
              { id: "reports", icon: TrendingUp, label: "Reports" },
            ].map(item => (
              <button key={item.id} onClick={() => selectTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${activeTab === item.id ? "bg-orange-50 text-orange-600" : "text-neutral-600 hover:bg-neutral-50"}`}><item.icon className="w-5 h-5" /> {item.label}</button>
            ))}
            <Link to="/fundraisers" onClick={() => setSidebarOpen(false)} className="w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors text-neutral-600 hover:bg-neutral-50"><Target className="w-5 h-5" /> Fundraisers</Link>
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
              {profile?.csrGoal && <Card className="p-6 mb-8"><h3 className="font-semibold mb-2">CSR Goal</h3><p className="text-neutral-600">{profile.csrGoal}</p></Card>}

              {campaigns.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3"><h2 className="text-lg font-semibold">Your Campaigns</h2><Button variant="ghost" size="sm" onClick={() => setActiveTab("campaigns")}>Manage</Button></div>
                  <Carousel opts={{ align: "start" }} className="w-full">
                    <CarouselContent>
                      {campaigns.map(c => (
                        <CarouselItem key={c.campaignId} className="md:basis-1/2 lg:basis-1/3">
                          <Card className="p-5 h-full">
                            {c.imageUrl && <img src={resolveMediaUrl(c.imageUrl)} alt={c.title} className="w-full h-32 object-cover object-center rounded-md mb-3" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />}
                            <Badge variant="outline" className="mb-2">Your campaign</Badge>
                            <h3 className="font-semibold truncate">{c.title}</h3>
                            {c.category && <p className="text-xs text-neutral-500 mt-1">{c.category}</p>}
                            {c.budgetPerPartner != null && <p className="text-sm text-orange-600 mt-2">R {c.budgetPerPartner.toLocaleString()} per partner</p>}
                            {c.description && <p className="text-sm text-neutral-600 mt-2 line-clamp-2">{c.description}</p>}
                          </Card>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                  </Carousel>
                </div>
              )}

              {allFundraisers.length > 0 && (
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3"><h2 className="text-lg font-semibold">NPO Fundraisers</h2><Link to="/fundraisers" className="text-sm text-orange-600 hover:underline">See all</Link></div>
                  <Carousel opts={{ align: "start" }} className="w-full">
                    <CarouselContent>
                      {allFundraisers.map(f => (
                        <CarouselItem key={f.projectId} className="md:basis-1/2 lg:basis-1/3">
                          <Card className="overflow-hidden h-full">
                            {f.images && <img src={resolveMediaUrl(f.images.split(",")[0].trim())} alt={f.projectName} className="w-full h-28 object-cover" />}
                            <div className="p-4">
                              <p className="text-xs text-orange-600 font-medium truncate">{f.npoName}</p>
                              <h3 className="font-semibold text-sm truncate">{f.projectName}</h3>
                              <div className="w-full bg-neutral-200 rounded-full h-2 mt-2"><div className="bg-orange-600 h-2 rounded-full" style={{ width: `${f.targetAmount > 0 ? Math.min(100, (f.raisedAmount / f.targetAmount) * 100) : 0}%` }} /></div>
                              <p className="text-xs text-neutral-500 mt-1">R {f.raisedAmount.toLocaleString()} of R {f.targetAmount.toLocaleString()}</p>
                              <div className="flex gap-2 mt-3"><Button size="sm" variant="outline" className="flex-1" onClick={() => handleViewDocs(f.npoId, f.npoName)}><FileText className="w-3.5 h-3.5 mr-1" /> Docs</Button><Button asChild size="sm" className="flex-1 bg-orange-600 hover:bg-orange-700"><Link to={`/npo/${f.npoId}`}>Profile</Link></Button></div>
                            </div>
                          </Card>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                  </Carousel>
                </div>
              )}
            </div>)}

            {/* EDIT PROFILE */}
            {activeTab === "editprofile" && (<div className="max-w-2xl">
              <div className="mb-8"><h1 className="text-2xl font-bold mb-2">Edit Profile</h1><p className="text-neutral-600">Manage how your business appears across the platform.</p></div>
              <form onSubmit={handleSaveProfile} className="space-y-6">
                <Card className="p-6 space-y-5">
                  <ImageCropField label="Banner / Cover Image" value={editBackgroundImage} onChange={setEditBackgroundImage} aspect={16 / 5} rounded="lg" disabled={savingProfile} />
                  <ImageCropField label="Profile Picture / Logo" value={editProfileImage} onChange={setEditProfileImage} aspect={1} rounded="full" disabled={savingProfile} />
                  <div><Label>Bio</Label><Textarea value={editBio} onChange={e => setEditBio(e.target.value)} rows={4} placeholder="Tell NPOs about your business..." className="mt-1" maxLength={1000} disabled={savingProfile} /></div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Industry</Label><Input value={editIndustry} onChange={e => setEditIndustry(e.target.value)} className="mt-1" disabled={savingProfile} /></div>
                    <div><Label>CSR Goal</Label><Input value={editCsrGoal} onChange={e => setEditCsrGoal(e.target.value)} className="mt-1" disabled={savingProfile} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><Label>Contact Person</Label><Input value={editContactName} onChange={e => setEditContactName(e.target.value)} className="mt-1" disabled={savingProfile} /></div>
                    <div><Label>Contact Title</Label><Input value={editContactTitle} onChange={e => setEditContactTitle(e.target.value)} className="mt-1" disabled={savingProfile} /></div>
                  </div>
                </Card>
                <Button type="submit" className="bg-orange-600 hover:bg-orange-700" disabled={savingProfile}>{savingProfile && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save Changes</Button>
              </form>
            </div>)}

            {/* DISCOVER NPOs */}
            {activeTab === "discover" && (<div>
              <div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-bold mb-2">Discover NPOs</h1><p className="text-neutral-600">Find and support organizations aligned with your CSR goals</p></div><Button variant="outline" size="sm" onClick={loadNPOs}><RefreshCw className="w-4 h-4" /></Button></div>
              <div className="mb-8">
                <div className="flex gap-4 mb-6">
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                    <Input placeholder="Search by name, location, or keyword..." className="pl-10" value={npoSearchQuery} onChange={e => setNpoSearchQuery(e.target.value)} />
                  </div>
                </div>
                <div className="grid md:grid-cols-4 gap-4 mb-6">
                  <div>
                    <Label>Category</Label>
                    <select className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-md" value={npoCategoryFilter} onChange={e => setNpoCategoryFilter(e.target.value)}>
                      <option value="All">All Categories</option>
                      <option value="Education">Education</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Environment">Environment</option>
                      <option value="Youth Development">Youth Development</option>
                      <option value="Food Security">Food Security</option>
                      <option value="Women's Rights">Women's Rights</option>
                    </select>
                  </div>
                  <div>
                    <Label>Verification</Label>
                    <select className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-md" value={npoVerificationFilter} onChange={e => setNpoVerificationFilter(e.target.value)}>
                      <option value="All">All NPOs</option>
                      <option value="Verified">Verified Only</option>
                      <option value="Pending">Pending Verification</option>
                    </select>
                  </div>
                  <div>
                    <Label>Province</Label>
                    <select className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-md" value={npoLocationFilter} onChange={e => setNpoLocationFilter(e.target.value)}>
                      <option value="All">All Provinces</option>
                      {npoProvinces.map(prov => <option key={prov} value={prov}>{prov}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end">
                    <Button variant="outline" className="w-full" onClick={() => { setNpoSearchQuery(""); setNpoCategoryFilter("All"); setNpoVerificationFilter("All"); setNpoLocationFilter("All"); }}>Clear Filters</Button>
                  </div>
                </div>
                <p className="text-sm text-neutral-600">Showing {filteredNpos.length} organization{filteredNpos.length !== 1 ? "s" : ""}</p>
              </div>
              {nposLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-orange-600" /></div> : filteredNpos.length === 0 ? <Card className="p-12 text-center"><p className="text-neutral-600">No NPOs found.</p></Card> : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{filteredNpos.map(npo => (
                  <Card key={npo.npoId} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/npo/${npo.npoId}`)}>
                    <div className="h-40 bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center overflow-hidden">
                      {npo.profileImage
                        ? <img src={resolveMediaUrl(npo.profileImage)} alt={npo.organizationName} className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                        : <span className="text-5xl font-bold text-white/80">{npo.organizationName.charAt(0).toUpperCase()}</span>}
                    </div>
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg font-semibold">{npo.organizationName}</span>
                        {npo.isVerified && <CheckCircle className="w-5 h-5 text-green-600" />}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-neutral-600 mb-3">
                        {npo.location && <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {npo.location}</span>}
                        {npo.focusArea && <Badge variant="outline">{npo.focusArea}</Badge>}
                      </div>
                      {npo.mission && <p className="text-sm text-neutral-600 mb-4 line-clamp-2">{npo.mission}</p>}
                      <div className="flex gap-2">
                        <Button variant={followedNpoIds.has(npo.npoId) ? "default" : "outline"} className={`flex-1 ${followedNpoIds.has(npo.npoId) ? "bg-orange-600 hover:bg-orange-700" : ""}`} onClick={(e) => { e.stopPropagation(); handleFollow(npo.npoId); }}><Heart className={`w-4 h-4 mr-1 ${followedNpoIds.has(npo.npoId) ? "fill-current" : ""}`} /> {followedNpoIds.has(npo.npoId) ? "Following" : "Follow"}</Button>
                        <Button className="flex-1 bg-orange-600 hover:bg-orange-700" onClick={(e) => { e.stopPropagation(); setDonateNpoId(npo.npoId); setDonateAmount(""); setShowDonateModal(true); }}>Donate</Button>
                      </div>
                      <p className="text-center text-sm text-orange-600 mt-3">View full profile →</p>
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
              <div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-bold mb-2">Partnership Campaigns</h1><p className="text-neutral-600">Create campaigns for NPOs to apply to</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={loadCampaigns}><RefreshCw className="w-4 h-4" /></Button><Button className="bg-orange-600 hover:bg-orange-700" onClick={() => { setCampaignImageUrl(null); setShowCreateCampaign(true); }}><Plus className="w-4 h-4 mr-2" /> New Campaign</Button></div></div>
              {campaignsLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-orange-600" /></div> : campaigns.length === 0 ? <Card className="p-12 text-center"><Target className="w-12 h-12 text-neutral-400 mx-auto mb-3" /><p className="text-neutral-600">No campaigns yet.</p><Button onClick={() => { setCampaignImageUrl(null); setShowCreateCampaign(true); }} className="mt-4">Create Campaign</Button></Card> : (
                <div className="space-y-4">{campaigns.map(c => (
                  <Card key={c.campaignId} className="p-6 cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleViewApplications(c)}>
                    {c.imageUrl && <img src={resolveMediaUrl(c.imageUrl)} alt={c.title} className="w-full h-48 object-cover object-center rounded-lg mb-4" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />}
                    <div className="flex items-start justify-between">
                      <div className="flex-1"><h3 className="font-semibold text-lg">{c.title}</h3>{c.category && <Badge variant="outline" className="mt-1">{c.category}</Badge>}{c.description && <p className="text-neutral-600 text-sm mt-2">{c.description}</p>}<div className="flex gap-4 mt-3 text-sm text-neutral-500">{c.budgetPerPartner && <span>R {c.budgetPerPartner.toLocaleString()}/partner</span>}<span><Calendar className="w-4 h-4 inline mr-1" />{c.startDate}</span>{c.applicantCount !== undefined && <span>{c.applicantCount} applicant{c.applicantCount !== 1 ? "s" : ""}</span>}</div></div>
                      <div className="flex gap-2 ml-4"><Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); handleViewApplications(c); }}><Eye className="w-4 h-4 mr-1" /> Apps</Button><Button size="sm" variant="outline" onClick={(e) => { e.stopPropagation(); setEditCampaignImageUrl(c.imageUrl ?? null); setEditingCampaign(c); }}><Edit className="w-4 h-4" /></Button><Button size="sm" variant="outline" className="text-red-600" onClick={(e) => { e.stopPropagation(); handleDeleteCampaign(c.campaignId); }}><X className="w-4 h-4" /></Button></div>
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
                  <Card key={post.postId} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => handleOpenComments(post)}>
                    {post.mediaUrl && <img src={resolveMediaUrl(post.mediaUrl)} alt="" className="w-full h-48 object-cover" />}
                    <div className="p-6">{post.authorNpoId ? <button onClick={(e) => { e.stopPropagation(); navigate(`/npo/${post.authorNpoId}`); }} className="text-xs text-orange-600 font-medium mb-1 hover:underline">{post.authorName}</button> : <p className="text-xs text-orange-600 font-medium mb-1">{post.authorName}</p>}<h3 className="font-semibold mb-2">{post.postTitle}</h3>{post.content && <p className="text-neutral-600 text-sm mb-4 line-clamp-3">{post.content}</p>}<div className="flex items-center justify-between text-sm"><div className="flex items-center gap-4"><button onClick={(e) => { e.stopPropagation(); handleLikePost(post.postId); }} className={`flex items-center gap-1 ${likedPostIds.has(post.postId) ? "text-red-500" : "text-neutral-600"}`}><Heart className={`w-4 h-4 ${likedPostIds.has(post.postId) ? "fill-current" : ""}`} /> {post.likeCount}</button><button onClick={(e) => { e.stopPropagation(); handleOpenComments(post); }} className="flex items-center gap-1 text-neutral-600 hover:text-orange-600"><MessageSquare className="w-4 h-4" /> Comment</button><span onClick={(e) => e.stopPropagation()}><ReportPostButton postId={post.postId} /></span></div><span className="text-neutral-500 text-xs">{new Date(post.timestamp).toLocaleDateString()}</span></div></div>
                  </Card>
                ))}</div>
              )}
            </div>)}

            {/* REPORTS */}
            {activeTab === "reports" && (<div><BusinessReportsPanel /></div>)}

          </motion.div>
        </main>
      </div>

      {/* CREATE CAMPAIGN MODAL */}
      {showCreateCampaign && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><Card className="w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Create Campaign</h2><Button variant="ghost" size="sm" onClick={() => { setShowCreateCampaign(false); setCampaignImageUrl(null); }}><X className="w-4 h-4" /></Button></div>
        <form onSubmit={handleCreateCampaign} className="space-y-4">
          <div><Label>Title *</Label><Input name="title" required /></div>
          <div><Label>Description</Label><Textarea name="description" /></div>
          <div className="grid grid-cols-2 gap-4"><div><Label>Category</Label><Input name="category" placeholder="e.g. Education" /></div><div><Label>Budget per Partner (R)</Label><Input name="budgetPerPartner" type="number" step="0.01" /></div></div>
          <div><Label>Requirements</Label><Textarea name="requirements" placeholder="What you expect from partner NPOs..." /></div>
          <div className="grid grid-cols-2 gap-4"><div><Label>Start Date *</Label><Input name="startDate" type="date" required /></div><div><Label>End Date</Label><Input name="endDate" type="date" /></div></div>
          <ImageUploadField label="Campaign Image (optional)" value={campaignImageUrl} onChange={setCampaignImageUrl} />
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
          <div className="grid grid-cols-2 gap-4"><div><Label>Start Date</Label><Input name="startDate" type="date" defaultValue={editingCampaign.startDate ? editingCampaign.startDate.slice(0, 10) : ""} /></div><div><Label>End Date</Label><Input name="endDate" type="date" defaultValue={editingCampaign.endDate ? editingCampaign.endDate.slice(0, 10) : ""} /><p className="text-xs text-neutral-500 mt-1">Leave blank for open-ended.</p></div></div>
          <ImageUploadField label="Campaign Image (optional)" value={editCampaignImageUrl} onChange={setEditCampaignImageUrl} />
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
          <CardPaymentFields value={topUpCard} onChange={setTopUpCard} disabled={toppingUp} />
          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={toppingUp}>{toppingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : "Top Up"}</Button>
        </form>
      </Card></div>)}

      {/* NPO DOCUMENTS MODAL */}
      {docModalNpo && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDocModalNpo(null)}><Card className="w-full max-w-md p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold">Verification Documents</h2><Button variant="ghost" size="sm" onClick={() => setDocModalNpo(null)}><X className="w-4 h-4" /></Button></div>
        <p className="text-sm text-neutral-600 mb-4">{docModalNpo.name}</p>
        {docsLoading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-orange-600" /></div> : !npoDocs || !npoDocs.hasDocuments ? (
          <p className="text-neutral-500 text-sm">This NPO has not submitted any verification documents yet.</p>
        ) : (
          <div className="space-y-3">
            {npoDocs.status && <Badge className={npoDocs.status === "Approved" ? "bg-green-100 text-green-700" : npoDocs.status === "Rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}>{npoDocs.status}</Badge>}
            {npoDocs.npoCertificate && <a href={resolveMediaUrl(npoDocs.npoCertificate)} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-md border border-neutral-200 p-3 hover:bg-neutral-50"><FileText className="w-5 h-5 text-orange-600" /><span className="text-sm">NPO Registration Certificate</span></a>}
            {npoDocs.npoTaxCertificate && <a href={resolveMediaUrl(npoDocs.npoTaxCertificate)} target="_blank" rel="noreferrer" className="flex items-center gap-2 rounded-md border border-neutral-200 p-3 hover:bg-neutral-50"><FileText className="w-5 h-5 text-orange-600" /><span className="text-sm">Tax Clearance Certificate</span></a>}
          </div>
        )}
      </Card></div>)}

      {/* Shared full-post modal */}
      {selectedPost && (
        <PostDetailModal
          post={{
            postId: selectedPost.postId,
            postTitle: selectedPost.postTitle,
            content: selectedPost.content,
            mediaUrl: selectedPost.mediaUrl,
            authorName: selectedPost.authorName,
            authorNpoId: selectedPost.authorNpoId,
            likeCount: selectedPost.likeCount,
            timestamp: selectedPost.timestamp,
          }}
          currentUserId={userId}
          liked={likedPostIds.has(selectedPost.postId)}
          onClose={() => setSelectedPost(null)}
          onLikeChange={(postId, isLiked, newCount) => {
            setLikedPostIds((prev) => {
              const next = new Set(prev);
              if (isLiked) next.add(postId); else next.delete(postId);
              return next;
            });
            setCommunityPosts((prev) => prev.map((p) => p.postId === postId ? { ...p, likeCount: newCount } : p));
          }}
        />
      )}

      <EmailVerificationBanner />
    </div>
  );
}
