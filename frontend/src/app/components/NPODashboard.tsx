import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "./NotificationBell";
import EmailVerificationBanner from "./EmailVerificationBanner";
import ImageUploadField from "./ImageUploadField";
import DocumentUploadField from "./DocumentUploadField";
import NpoReportsPanel from "./reports/NpoReportsPanel";
import { resolveMediaUrl } from "../../lib/api";
import { npoService, getErrorMessage } from "../../services/npoService";
import type { PostItem, CommentItem, ProjectItem, VolunteerApplicationItem, VerificationItem, TransactionItem, VolunteerOpportunityItem, NpoDiscoverItem, FollowerItem, DonorItem, FollowedNpoItem } from "../../services/npoService";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext } from "./ui/carousel";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Users, Heart, TrendingUp, FileText, CheckCircle, AlertCircle, Plus,
  Settings, LogOut, BarChart3, Upload, DollarSign, UserPlus, X, Check,
  Clock, Calendar, Wallet, ArrowDownToLine, ArrowUpRight, Edit, Trash2,
  MessageSquare, Loader2, RefreshCw, Send, FolderOpen, Shield, Search,
  MapPin, ArrowUpFromLine, Eye, UserCheck, Target, Menu
} from "lucide-react";

/** Human-readable deadline label for an NPO's own fundraiser card. */
function fundraiserDeadlineLabel(endDate: string | null | undefined): { text: string; ended: boolean } | null {
  if (!endDate) return null;
  const end = new Date(endDate);
  if (isNaN(end.getTime())) return null;
  const ms = end.getTime() - Date.now();
  if (ms <= 0) return { text: `Ended ${end.toLocaleDateString()}`, ended: true };
  const days = Math.ceil(ms / 86_400_000);
  return { text: `${days} day${days === 1 ? "" : "s"} left · closes ${end.toLocaleDateString()}`, ended: false };
}

export default function NPODashboard() {
  const { logout, userId } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const selectTab = (id: string) => { setActiveTab(id); setSidebarOpen(false); };

  // Posts
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [editingPost, setEditingPost] = useState<PostItem | null>(null);
  const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);
  const [postImageUrl, setPostImageUrl] = useState<string | null>(null);
  const [likedPostIds, setLikedPostIds] = useState<Set<number>>(new Set());

  // Comments
  const [comments, setComments] = useState<Record<number, CommentItem[]>>({});
  const [commentsLoading, setCommentsLoading] = useState<Record<number, boolean>>({});
  const [newComment, setNewComment] = useState<Record<number, string>>({});
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Projects (Fundraisers)
  const [projects, setProjects] = useState<ProjectItem[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectItem | null>(null);

  // Volunteers
  const [applications, setApplications] = useState<VolunteerApplicationItem[]>([]);
  const [applicationsLoading, setApplicationsLoading] = useState(false);
  const [opportunities, setOpportunities] = useState<VolunteerOpportunityItem[]>([]);
  const [opportunitiesLoading, setOpportunitiesLoading] = useState(false);
  const [showCreateOpportunity, setShowCreateOpportunity] = useState(false);
  const [opportunityImageUrl, setOpportunityImageUrl] = useState<string | null>(null);
  const [editingOpportunity, setEditingOpportunity] = useState<VolunteerOpportunityItem | null>(null);

  // Verification
  const [verifications, setVerifications] = useState<VerificationItem[]>([]);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [npoCertUrl, setNpoCertUrl] = useState<string | null>(null);
  const [npoTaxCertUrl, setNpoTaxCertUrl] = useState<string | null>(null);

  // Wallet
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [transactions, setTransactions] = useState<TransactionItem[]>([]);
  const [walletLoading, setWalletLoading] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  // Profile
  const [npoProfile, setNpoProfile] = useState<{ npoId: number; organizationName: string; npofocusArea: string | null; npomission: string | null } | null>(null);

  // Discover NPOs
  const [discoverNpos, setDiscoverNpos] = useState<NpoDiscoverItem[]>([]);
  const [discoverLoading, setDiscoverLoading] = useState(false);
  const [selectedNpoDetail, setSelectedNpoDetail] = useState<NpoDiscoverItem | null>(null);
  const [followedNpoIds, setFollowedNpoIds] = useState<Set<number>>(new Set());
  const [npoSearchQuery, setNpoSearchQuery] = useState("");

  // Community
  const [communityPosts, setCommunityPosts] = useState<PostItem[]>([]);
  const [communityLoading, setCommunityLoading] = useState(false);

  // Supporters (followers + donors)
  const [followers, setFollowers] = useState<FollowerItem[]>([]);
  const [donors, setDonors] = useState<DonorItem[]>([]);
  const [supportersLoading, setSupportersLoading] = useState(false);

  // ═══ LOADERS ═══
  const loadProfile = useCallback(async () => { if (!userId) return; try { const r = await npoService.getProfileByUserId(userId); setNpoProfile(r.data); } catch {} }, [userId]);

  const loadPosts = useCallback(async () => { if (!userId) return; setPostsLoading(true); try { const [a, l] = await Promise.all([npoService.getMyPosts(userId), npoService.getMyLikes()]); setPosts(a.data.filter(p => p.activityStatus === "Active")); setLikedPostIds(new Set(l.data)); } catch (e) { toast.error(getErrorMessage(e)); } finally { setPostsLoading(false); } }, [userId]);

  const loadCommunityPosts = useCallback(async () => { setCommunityLoading(true); try { const r = await npoService.getAllPosts(); setCommunityPosts(r.data); } catch (e) { toast.error(getErrorMessage(e)); } finally { setCommunityLoading(false); } }, []);

  const loadProjects = useCallback(async () => { setProjectsLoading(true); try { const r = await npoService.getMyProjects(); setProjects(r.data); } catch (e) { toast.error(getErrorMessage(e)); } finally { setProjectsLoading(false); } }, []);

  const loadApplications = useCallback(async () => { setApplicationsLoading(true); try { const r = await npoService.getAllApplications(); setApplications(r.data); } catch (e) { toast.error(getErrorMessage(e)); } finally { setApplicationsLoading(false); } }, []);

  const loadOpportunities = useCallback(async () => { if (!npoProfile) return; setOpportunitiesLoading(true); try { const r = await npoService.getMyOpportunities(npoProfile.npoId); setOpportunities(r.data); } catch (e) { toast.error(getErrorMessage(e)); } finally { setOpportunitiesLoading(false); } }, [npoProfile]);

  const loadVerification = useCallback(async () => { setVerificationLoading(true); try { const r = await npoService.getMyVerificationStatus(); setVerifications(r.data); } catch (e) { toast.error(getErrorMessage(e)); } finally { setVerificationLoading(false); } }, []);

  const loadWallet = useCallback(async () => { if (!userId) return; setWalletLoading(true); try { const [b, t] = await Promise.all([npoService.getWalletBalance(userId), npoService.getTransactions(userId)]); setWalletBalance(b.data.balance); setTransactions(t.data); } catch (e) { toast.error(getErrorMessage(e)); } finally { setWalletLoading(false); } }, [userId]);

  const loadDiscoverNpos = useCallback(async () => { setDiscoverLoading(true); try { const [npos, follows] = await Promise.all([npoService.discoverNPOs(), npoService.getMyFollows()]); setDiscoverNpos(npos.data.filter(n => n.userId !== userId)); setFollowedNpoIds(new Set(follows.data.map(f => f.npoId))); } catch (e) { toast.error(getErrorMessage(e)); } finally { setDiscoverLoading(false); } }, [userId]);

  const loadSupporters = useCallback(async () => { setSupportersLoading(true); try { const [f, d] = await Promise.all([npoService.getMyFollowers(), npoService.getMyDonors()]); setFollowers(f.data); setDonors(d.data); } catch (e) { toast.error(getErrorMessage(e)); } finally { setSupportersLoading(false); } }, []);

  useEffect(() => { loadProfile(); loadPosts(); loadWallet(); }, [loadProfile, loadPosts, loadWallet]);
  useEffect(() => {
    if (activeTab === "projects") loadProjects();
    if (activeTab === "volunteers") { loadApplications(); loadOpportunities(); }
    if (activeTab === "verification") loadVerification();
    if (activeTab === "community") loadCommunityPosts();
    if (activeTab === "discover") loadDiscoverNpos();
    if (activeTab === "supporters") loadSupporters();
  }, [activeTab, loadProjects, loadApplications, loadOpportunities, loadVerification, loadCommunityPosts, loadDiscoverNpos, loadSupporters]);

  // ═══ HANDLERS ═══
  const handleCreatePost = async (e: React.FormEvent) => { e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement); try { const r = await npoService.createPost({ postTitle: fd.get("title") as string, content: fd.get("content") as string, mediaUrl: (fd.get("mediaUrl") as string) || undefined }); setPosts(p => [r.data, ...p]); setShowCreatePost(false); toast.success("Post created!"); } catch (e) { toast.error(getErrorMessage(e)); } };
  const handleUpdatePost = async (e: React.FormEvent) => { e.preventDefault(); if (!editingPost) return; const fd = new FormData(e.currentTarget as HTMLFormElement); try { await npoService.updatePost(editingPost.postId, { postTitle: fd.get("title") as string, content: fd.get("content") as string, mediaUrl: (fd.get("mediaUrl") as string) || undefined }); setPosts(p => p.map(x => x.postId === editingPost.postId ? { ...x, postTitle: fd.get("title") as string, content: fd.get("content") as string, mediaUrl: (fd.get("mediaUrl") as string) || x.mediaUrl } : x)); setEditingPost(null); toast.success("Post updated!"); } catch (e) { toast.error(getErrorMessage(e)); } };
  const handleDeletePost = async (id: number) => { if (!confirm("Delete this post?")) return; try { await npoService.deletePost(id); setPosts(p => p.filter(x => x.postId !== id)); setSelectedPost(null); toast.success("Deleted."); } catch (e) { toast.error(getErrorMessage(e)); } };

  const handleLikePost = async (postId: number) => {
    const isLiked = likedPostIds.has(postId);
    const update = (d: number) => { setCommunityPosts(p => p.map(x => x.postId === postId ? { ...x, likeCount: Math.max(0, x.likeCount + d) } : x)); setPosts(p => p.map(x => x.postId === postId ? { ...x, likeCount: Math.max(0, x.likeCount + d) } : x)); };
    if (isLiked) { setLikedPostIds(p => { const n = new Set(p); n.delete(postId); return n; }); update(-1); try { await npoService.unlikePost(postId); } catch (e) { setLikedPostIds(p => new Set(p).add(postId)); update(1); toast.error(getErrorMessage(e)); } }
    else { setLikedPostIds(p => new Set(p).add(postId)); update(1); try { await npoService.likePost(postId); } catch (e) { const m = getErrorMessage(e); if (!m.toLowerCase().includes("already liked")) { setLikedPostIds(p => { const n = new Set(p); n.delete(postId); return n; }); update(-1); toast.error(m); } } }
  };

  const loadComments = async (postId: number) => { setCommentsLoading(p => ({ ...p, [postId]: true })); try { const r = await npoService.getComments(postId); setComments(p => ({ ...p, [postId]: r.data })); } catch (e) { toast.error(getErrorMessage(e)); } finally { setCommentsLoading(p => ({ ...p, [postId]: false })); } };
  const handleAddComment = async (postId: number) => { const c = newComment[postId]?.trim(); if (!c) return; setCommentSubmitting(true); try { const r = await npoService.createComment(postId, c); setComments(p => ({ ...p, [postId]: [r.data, ...(p[postId] || [])] })); setNewComment(p => ({ ...p, [postId]: "" })); toast.success("Comment added!"); } catch (e) { toast.error(getErrorMessage(e)); } finally { setCommentSubmitting(false); } };
  const handleDeleteComment = async (cId: number, pId: number) => { try { await npoService.deleteComment(cId); setComments(p => ({ ...p, [pId]: (p[pId] || []).filter(c => c.commentId !== cId) })); } catch (e) { toast.error(getErrorMessage(e)); } };

  const handleCreateProject = async (e: React.FormEvent) => { e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement); try { const durRaw = (fd.get("durationDays") as string) || ""; const durationDays = durRaw ? parseInt(durRaw, 10) : undefined; const r = await npoService.createProject({ projectName: fd.get("projectName") as string, projectDesc: (fd.get("projectDesc") as string) || undefined, projectStatus: (fd.get("projectStatus") as string) || "Active", projectProgress: 0, targetAmount: parseFloat(fd.get("targetAmount") as string) || 0, images: (fd.get("images") as string) || undefined, durationDays: durationDays && durationDays > 0 ? durationDays : undefined }); setProjects(p => [r.data, ...p]); setShowCreateProject(false); toast.success("Fundraiser created!"); } catch (e) { toast.error(getErrorMessage(e)); } };
  const handleUpdateProject = async (e: React.FormEvent) => { e.preventDefault(); if (!editingProject) return; const fd = new FormData(e.currentTarget as HTMLFormElement); try { const endRaw = (fd.get("endDate") as string) || ""; const r = await npoService.updateProject(editingProject.projectId, { projectName: fd.get("projectName") as string, projectDesc: (fd.get("projectDesc") as string) || undefined, projectStatus: fd.get("projectStatus") as string, targetAmount: parseFloat(fd.get("targetAmount") as string) || undefined, images: (fd.get("images") as string) || undefined, endDate: endRaw ? new Date(endRaw).toISOString() : undefined }); setProjects(p => p.map(x => x.projectId === editingProject.projectId ? r.data : x)); setEditingProject(null); toast.success("Updated!"); } catch (e) { toast.error(getErrorMessage(e)); } };
  const handleDeleteProject = async (id: number) => { if (!confirm("Delete?")) return; try { await npoService.deleteProject(id); setProjects(p => p.filter(x => x.projectId !== id)); toast.success("Deleted."); } catch (e) { toast.error(getErrorMessage(e)); } };

  const handleAcceptApplication = async (id: number) => { try { await npoService.acceptApplication(id); setApplications(p => p.map(a => a.applicationId === id ? { ...a, status: "Accepted" } : a)); toast.success("Accepted!"); } catch (e) { toast.error(getErrorMessage(e)); } };
  const handleRejectApplication = async (id: number) => { try { await npoService.rejectApplication(id); setApplications(p => p.map(a => a.applicationId === id ? { ...a, status: "Rejected" } : a)); toast.success("Rejected."); } catch (e) { toast.error(getErrorMessage(e)); } };
  const handleDeleteApplication = async (id: number) => { if (!confirm("Delete?")) return; try { await npoService.deleteApplication(id); setApplications(p => p.filter(a => a.applicationId !== id)); toast.success("Deleted."); } catch (e) { toast.error(getErrorMessage(e)); } };
  const handleCreateOpportunity = async (e: React.FormEvent) => { e.preventDefault(); const fd = new FormData(e.currentTarget as HTMLFormElement); try { const r = await npoService.createOpportunity({ roleTitle: fd.get("roleTitle") as string, category: (fd.get("category") as string) || undefined, numOfPositions: parseInt(fd.get("numOfPositions") as string) || 1, description: (fd.get("description") as string) || undefined, skillsRequired: (fd.get("skillsRequired") as string) || undefined, timeCommitment: (fd.get("timeCommitment") as string) || undefined, duration: (fd.get("duration") as string) || undefined, mediaURL: opportunityImageUrl || undefined }); setOpportunities(p => [r.data, ...p]); setShowCreateOpportunity(false); setOpportunityImageUrl(null); toast.success("Opportunity created!"); } catch (e) { toast.error(getErrorMessage(e)); } };
  const handleDeleteOpportunity = async (id: number) => { if (!confirm("Delete?")) return; try { await npoService.deleteOpportunity(id); setOpportunities(p => p.filter(o => o.opportunityId !== id)); toast.success("Deleted."); } catch (e) { toast.error(getErrorMessage(e)); } };
  const handleUpdateOpportunity = async (e: React.FormEvent) => { e.preventDefault(); if (!editingOpportunity) return; const fd = new FormData(e.currentTarget as HTMLFormElement); try { await npoService.updateOpportunity(editingOpportunity.opportunityId, { roleTitle: (fd.get("roleTitle") as string) || undefined, category: (fd.get("category") as string) || undefined, numOfPositions: fd.get("numOfPositions") ? parseInt(fd.get("numOfPositions") as string) : undefined, description: (fd.get("description") as string) || undefined, skillsRequired: (fd.get("skillsRequired") as string) || undefined, timeCommitment: (fd.get("timeCommitment") as string) || undefined, duration: (fd.get("duration") as string) || undefined }); setEditingOpportunity(null); loadOpportunities(); toast.success("Opportunity updated!"); } catch (e) { toast.error(getErrorMessage(e)); } };

  const handleSubmitVerification = async (e: React.FormEvent) => { e.preventDefault(); if (!npoCertUrl && !npoTaxCertUrl) { toast.error("Please upload at least one document (PDF)."); return; } try { await npoService.submitVerification({ npoCertificate: npoCertUrl || undefined, npoTaxCertificate: npoTaxCertUrl || undefined }); setShowVerificationForm(false); setNpoCertUrl(null); setNpoTaxCertUrl(null); loadVerification(); toast.success("Documents submitted for verification!"); } catch (e) { toast.error(getErrorMessage(e)); } };

  const handleWithdraw = async (e: React.FormEvent) => { e.preventDefault(); const amt = parseFloat(withdrawAmount); if (!amt || amt <= 0) { toast.error("Enter valid amount."); return; } if (amt > walletBalance) { toast.error("Insufficient balance."); return; } setWithdrawing(true); try { await npoService.withdraw(amt); setWalletBalance(p => p - amt); setTransactions(p => [{ transactionId: Date.now(), senderUserId: userId, receiverUserId: null, amount: amt, transactionType: "Withdrawal", status: "Completed", timestamp: new Date().toISOString() }, ...p]); setShowWithdrawModal(false); setWithdrawAmount(""); toast.success(`R ${amt.toLocaleString()} withdrawn!`); } catch (e) { toast.error(getErrorMessage(e)); } finally { setWithdrawing(false); } };

  const handleFollowNpo = async (npoId: number) => { if (followedNpoIds.has(npoId)) { setFollowedNpoIds(p => { const n = new Set(p); n.delete(npoId); return n; }); try { await npoService.unfollowNpo(npoId); } catch (e) { setFollowedNpoIds(p => new Set(p).add(npoId)); toast.error(getErrorMessage(e)); } } else { setFollowedNpoIds(p => new Set(p).add(npoId)); try { await npoService.followNpo(npoId); toast.success("Following!"); } catch (e) { setFollowedNpoIds(p => { const n = new Set(p); n.delete(npoId); return n; }); toast.error(getErrorMessage(e)); } } };

  const pendingApps = applications.filter(a => a.status === "Pending");
  const acceptedApps = applications.filter(a => a.status === "Accepted");
  const filteredNpos = discoverNpos.filter(n => !npoSearchQuery || n.organizationName.toLowerCase().includes(npoSearchQuery.toLowerCase()) || (n.npofocusArea || "").toLowerCase().includes(npoSearchQuery.toLowerCase()));

  // ═══ RENDER ═══
  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 py-4 px-6 sticky top-0 z-40"><div className="container mx-auto max-w-7xl flex items-center justify-between"><div className="flex items-center gap-3"><button onClick={() => setSidebarOpen(true)} className="lg:hidden text-neutral-600"><Menu className="w-6 h-6" /></button><button onClick={() => setActiveTab("overview")} className="text-xl text-neutral-900 font-bold">UbuntuConnect</button></div><div className="flex items-center gap-4"><span className="text-neutral-600 hidden sm:inline">{npoProfile?.organizationName || "NPO"}</span>{npoProfile && <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex"><Link to={`/npo/${npoProfile.npoId}`}><Eye className="w-4 h-4 mr-2" /> Public Profile</Link></Button>}<NotificationBell /><Button variant="outline" size="sm" onClick={logout}><LogOut className="w-4 h-4 mr-2" /> Logout</Button></div></div></header>

      <div className="flex">
        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        <aside className={`${sidebarOpen ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 transition-transform fixed lg:sticky top-0 lg:top-[73px] left-0 z-40 lg:z-30 w-64 bg-white border-r border-neutral-200 h-screen lg:h-[calc(100vh-73px)] p-6 overflow-y-auto`}>
          <div className="flex justify-between items-center mb-4 lg:hidden"><span className="font-bold">Menu</span><button onClick={() => setSidebarOpen(false)}><X className="w-5 h-5" /></button></div>
          <nav className="space-y-2">
            {[
              { id: "overview", icon: BarChart3, label: "Overview" },
              { id: "posts", icon: MessageSquare, label: "Posts & Updates" },
              { id: "community", icon: Heart, label: "Community Feed" },
              { id: "discover", icon: Search, label: "Discover NPOs" },
              { id: "projects", icon: Target, label: "Fundraisers" },
              { id: "volunteers", icon: UserPlus, label: "Volunteers" },
              { id: "supporters", icon: Users, label: "Supporters" },
              { id: "finances", icon: Wallet, label: "Finances" },
              { id: "verification", icon: Shield, label: "Verification" },
              { id: "campaigns", icon: Target, label: "Campaigns" },
              { id: "reports", icon: BarChart3, label: "Reports" },
            ].map(item => (
              <button key={item.id} onClick={() => selectTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${activeTab === item.id ? "bg-orange-50 text-orange-600" : "text-neutral-600 hover:bg-neutral-50"}`}><item.icon className="w-5 h-5" /> {item.label}</button>
            ))}
          </nav>
        </aside>

        <main className="flex-1 p-4 md:p-8 w-full min-w-0">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>

            {/* OVERVIEW */}
            {activeTab === "overview" && (<div>
              <div className="mb-8"><h1 className="text-2xl font-bold mb-2">Dashboard Overview</h1><p className="text-neutral-600">Welcome back, {npoProfile?.organizationName || "NPO"}</p></div>
              <div className="grid md:grid-cols-4 gap-6 mb-8">
                <Card className="p-6 cursor-pointer hover:shadow-md" onClick={() => setActiveTab("finances")}><div className="flex justify-between mb-2"><span className="text-neutral-600 text-sm">Balance</span><Wallet className="w-5 h-5 text-neutral-400" /></div><div className="text-3xl font-bold">R {walletBalance.toLocaleString()}</div></Card>
                <Card className="p-6 cursor-pointer hover:shadow-md" onClick={() => setActiveTab("posts")}><div className="flex justify-between mb-2"><span className="text-neutral-600 text-sm">Posts</span><MessageSquare className="w-5 h-5 text-neutral-400" /></div><div className="text-3xl font-bold">{posts.length}</div></Card>
                <Card className="p-6 cursor-pointer hover:shadow-md" onClick={() => setActiveTab("supporters")}><div className="flex justify-between mb-2"><span className="text-neutral-600 text-sm">Followers</span><Users className="w-5 h-5 text-neutral-400" /></div><div className="text-3xl font-bold">{followers.length}</div></Card>
                <Card className="p-6 cursor-pointer hover:shadow-md" onClick={() => setActiveTab("volunteers")}><div className="flex justify-between mb-2"><span className="text-neutral-600 text-sm">Pending</span><UserPlus className="w-5 h-5 text-neutral-400" /></div><div className="text-3xl font-bold">{pendingApps.length}</div></Card>
              </div>
            </div>)}

            {/* DISCOVER NPOs */}
            {activeTab === "discover" && (<div>
              <div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-bold mb-2">Discover NPOs</h1><p className="text-neutral-600">Browse and follow other organizations</p></div><Button variant="outline" size="sm" onClick={loadDiscoverNpos}><RefreshCw className="w-4 h-4" /></Button></div>
              <div className="mb-6"><Input placeholder="Search by name or focus area..." value={npoSearchQuery} onChange={e => setNpoSearchQuery(e.target.value)} className="max-w-md" /></div>
              {discoverLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-orange-600" /></div> : filteredNpos.length === 0 ? <Card className="p-12 text-center"><p className="text-neutral-600">No NPOs found.</p></Card> : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">{filteredNpos.map(npo => (
                  <Card key={npo.npoId} className="p-6 hover:shadow-lg transition-shadow">
                    <div className="flex items-center gap-3 mb-4"><div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center"><span className="text-lg font-bold text-orange-600">{npo.organizationName.charAt(0)}</span></div><div><h3 className="font-semibold">{npo.organizationName}</h3>{npo.npofocusArea && <Badge variant="outline" className="text-xs">{npo.npofocusArea}</Badge>}</div></div>
                    {npo.npomission && <p className="text-sm text-neutral-600 mb-4 line-clamp-2">{npo.npomission}</p>}
                    <div className="flex gap-2">
                      <Button variant={followedNpoIds.has(npo.npoId) ? "default" : "outline"} size="sm" className={`flex-1 ${followedNpoIds.has(npo.npoId) ? "bg-orange-600 hover:bg-orange-700" : ""}`} onClick={() => handleFollowNpo(npo.npoId)}><Heart className={`w-4 h-4 mr-1 ${followedNpoIds.has(npo.npoId) ? "fill-current" : ""}`} /> {followedNpoIds.has(npo.npoId) ? "Following" : "Follow"}</Button>
                      <Button variant="outline" size="sm" onClick={() => setSelectedNpoDetail(npo)}><Eye className="w-4 h-4" /></Button>
                    </div>
                  </Card>
                ))}</div>
              )}
            </div>)}

            {/* SUPPORTERS */}
            {activeTab === "supporters" && (<div>
              <div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-bold mb-2">Supporters</h1><p className="text-neutral-600">Your followers and donors</p></div><Button variant="outline" size="sm" onClick={loadSupporters}><RefreshCw className="w-4 h-4" /></Button></div>
              {supportersLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-orange-600" /></div> : (
                <Tabs defaultValue="followers"><TabsList className="mb-6"><TabsTrigger value="followers">Followers ({followers.length})</TabsTrigger><TabsTrigger value="donors">Donors ({donors.length})</TabsTrigger></TabsList>
                  <TabsContent value="followers">{followers.length === 0 ? <Card className="p-12 text-center"><p className="text-neutral-600">No followers yet.</p></Card> : <div className="space-y-3">{followers.map(f => (
                    <Card key={f.userId} className="p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center"><span className="text-sm font-bold">{f.name.charAt(0)}</span></div><div><p className="font-semibold text-sm">{f.name}</p><p className="text-xs text-neutral-500">{f.userType} • Since {new Date(f.followDate).toLocaleDateString()}</p></div></div></div></Card>
                  ))}</div>}</TabsContent>
                  <TabsContent value="donors">{donors.length === 0 ? <Card className="p-12 text-center"><p className="text-neutral-600">No donations yet.</p></Card> : <div className="space-y-3">{donors.map((d, i) => (
                    <Card key={i} className="p-4"><div className="flex items-center justify-between"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center"><span className="text-sm font-bold">{d.name.charAt(0)}</span></div><div><p className="font-semibold text-sm">{d.name}</p><p className="text-xs text-neutral-500">{d.donationCount} donation{d.donationCount > 1 ? "s" : ""} • Last: {new Date(d.lastDonation).toLocaleDateString()}</p></div></div><span className="font-bold text-green-600">R {d.totalDonated.toLocaleString()}</span></div></Card>
                  ))}</div>}</TabsContent>
                </Tabs>
              )}
            </div>)}

            {/* POSTS */}
            {activeTab === "posts" && (<div>
              <div className="flex items-center justify-between mb-8"><div><h1 className="text-2xl font-bold mb-2">Posts & Updates</h1></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={loadPosts}><RefreshCw className="w-4 h-4" /></Button><Button className="bg-orange-600 hover:bg-orange-700" onClick={() => { setPostImageUrl(null); setShowCreatePost(true); }}><Plus className="w-4 h-4 mr-2" /> Create Post</Button></div></div>
              {postsLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-orange-600" /></div> : posts.length === 0 ? <Card className="p-12 text-center"><MessageSquare className="w-12 h-12 text-neutral-400 mx-auto mb-3" /><p className="text-neutral-600">No posts yet.</p><Button onClick={() => { setPostImageUrl(null); setShowCreatePost(true); }} className="mt-4">Create Post</Button></Card> : (
                <div className="grid md:grid-cols-2 gap-6">{posts.map(post => (
                  <Card key={post.postId} className="overflow-hidden hover:shadow-lg transition-shadow">
                    {post.mediaUrl && <img src={resolveMediaUrl(post.mediaUrl)} alt="" className="w-full h-48 object-cover cursor-pointer" onClick={() => { setSelectedPost(post); loadComments(post.postId); }} />}
                    <div className="p-6"><div className="flex items-start justify-between mb-3"><h3 className="font-semibold flex-1 cursor-pointer hover:text-orange-600" onClick={() => { setSelectedPost(post); loadComments(post.postId); }}>{post.postTitle}</h3><div className="flex gap-1 ml-2"><Button variant="ghost" size="sm" onClick={() => { setPostImageUrl(post.mediaUrl); setEditingPost(post); }}><Edit className="w-4 h-4" /></Button><Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeletePost(post.postId)}><Trash2 className="w-4 h-4" /></Button></div></div>
                    <p className="text-neutral-600 text-sm mb-4 line-clamp-3">{post.content}</p>
                    <div className="flex items-center justify-between text-sm"><div className="flex gap-4"><button onClick={() => handleLikePost(post.postId)} className={`flex items-center gap-1 ${likedPostIds.has(post.postId) ? "text-red-500" : "text-neutral-600"}`}><Heart className={`w-4 h-4 ${likedPostIds.has(post.postId) ? "fill-current" : ""}`} /> {post.likeCount}</button><button onClick={() => { setSelectedPost(post); loadComments(post.postId); }} className="flex items-center gap-1 text-neutral-600 hover:text-orange-600"><MessageSquare className="w-4 h-4" /> Comments</button></div><span className="text-neutral-500 text-xs">{new Date(post.timestamp).toLocaleDateString()}</span></div></div>
                  </Card>
                ))}</div>
              )}
            </div>)}

            {/* COMMUNITY */}
            {activeTab === "community" && (<div>
              <div className="flex items-center justify-between mb-8"><div><h1 className="text-2xl font-bold mb-2">Community Feed</h1></div><Button variant="outline" size="sm" onClick={loadCommunityPosts}><RefreshCw className="w-4 h-4 mr-2" /> Refresh</Button></div>
              {communityLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div> : communityPosts.length === 0 ? <Card className="p-12 text-center"><p className="text-neutral-600">No posts yet.</p></Card> : (
                <div className="grid md:grid-cols-2 gap-6">{communityPosts.map(post => (
                  <Card key={post.postId} className="overflow-hidden hover:shadow-lg"><div className="p-6"><h3 className="font-semibold mb-2">{post.postTitle}</h3><p className="text-neutral-600 text-sm mb-4 line-clamp-3">{post.content}</p><div className="flex items-center justify-between text-sm"><div className="flex gap-4"><button onClick={() => handleLikePost(post.postId)} className={`flex items-center gap-1 ${likedPostIds.has(post.postId) ? "text-red-500" : "text-neutral-600"}`}><Heart className={`w-4 h-4 ${likedPostIds.has(post.postId) ? "fill-current" : ""}`} /> {post.likeCount}</button><button onClick={() => { setSelectedPost(post); loadComments(post.postId); }} className="flex items-center gap-1 text-neutral-600 hover:text-orange-600"><MessageSquare className="w-4 h-4" /></button></div><span className="text-xs text-neutral-500">{new Date(post.timestamp).toLocaleDateString()}</span></div></div></Card>
                ))}</div>
              )}
            </div>)}

            {/* FUNDRAISERS (Projects) */}
            {activeTab === "projects" && (<div>
              <div className="flex items-center justify-between mb-8"><div><h1 className="text-2xl font-bold mb-2">Fundraisers</h1><p className="text-neutral-600">Create fundraisers for your initiatives. Supporters can donate directly.</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={loadProjects}><RefreshCw className="w-4 h-4" /></Button><Button className="bg-orange-600 hover:bg-orange-700" onClick={() => setShowCreateProject(true)}><Plus className="w-4 h-4 mr-2" /> New Fundraiser</Button></div></div>
              {(() => { const active = projects.filter(p => p.projectStatus === "Active"); if (active.length === 0) return null; return (
                <div className="mb-8">
                  <h2 className="text-lg font-semibold mb-3">Currently Running</h2>
                  <Carousel opts={{ align: "start" }} className="w-full">
                    <CarouselContent>
                      {active.map(p => (
                        <CarouselItem key={p.projectId} className="md:basis-1/2 lg:basis-1/3">
                          <Card className="overflow-hidden h-full">
                            {p.images && <img src={resolveMediaUrl(p.images.split(",")[0].trim())} alt={p.projectName} className="w-full h-32 object-cover" />}
                            <div className="p-4">
                              <h3 className="font-semibold text-sm truncate">{p.projectName}</h3>
                              <div className="w-full bg-neutral-200 rounded-full h-2 mt-2"><div className="bg-orange-600 h-2 rounded-full" style={{ width: `${p.targetAmount > 0 ? Math.min(100, (p.raisedAmount / p.targetAmount) * 100) : 0}%` }} /></div>
                              <p className="text-xs text-neutral-500 mt-1">R {p.raisedAmount.toLocaleString()} of R {p.targetAmount.toLocaleString()}</p>
                              {(() => { const d = fundraiserDeadlineLabel(p.endDate); if (!d) return null; return <div className={`flex items-center gap-1 text-xs mt-1 ${d.ended ? "text-red-600" : "text-neutral-500"}`}><Clock className="w-3 h-3" /><span>{d.text}</span></div>; })()}
                            </div>
                          </Card>
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                    <CarouselPrevious />
                    <CarouselNext />
                  </Carousel>
                </div>
              ); })()}
              {projectsLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-orange-600" /></div> : projects.length === 0 ? <Card className="p-12 text-center"><Target className="w-12 h-12 text-neutral-400 mx-auto mb-3" /><h3 className="font-semibold mb-2">No fundraisers yet</h3><p className="text-neutral-600 mb-4">Create a fundraiser to collect donations for your projects</p><Button onClick={() => setShowCreateProject(true)}>Create Fundraiser</Button></Card> : (
                <div className="grid md:grid-cols-2 gap-6">{projects.map(project => (
                  <Card key={project.projectId} className="overflow-hidden hover:shadow-lg">
                    {project.images && <div className="flex overflow-x-auto gap-1">{project.images.split(",").map((img, i) => <img key={i} src={img.trim()} alt="" className="w-full h-48 object-cover flex-shrink-0" />)}</div>}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3"><div><h3 className="font-semibold">{project.projectName}</h3><Badge className={`mt-1 ${project.projectStatus === "Active" ? "bg-green-100 text-green-700" : project.projectStatus === "Completed" ? "bg-blue-100 text-blue-700" : "bg-amber-100 text-amber-700"}`}>{project.projectStatus}</Badge></div><div className="flex gap-1"><Button variant="ghost" size="sm" onClick={() => setEditingProject(project)}><Edit className="w-4 h-4" /></Button><Button variant="ghost" size="sm" className="text-red-600" onClick={() => handleDeleteProject(project.projectId)}><Trash2 className="w-4 h-4" /></Button></div></div>
                      {project.projectDesc && <p className="text-sm text-neutral-600 mb-4 line-clamp-2">{project.projectDesc}</p>}
                      <div className="mb-2"><div className="flex justify-between text-sm mb-1"><span className="text-neutral-600">R {project.raisedAmount.toLocaleString()} raised</span><span className="font-semibold">R {project.targetAmount.toLocaleString()} target</span></div><div className="w-full bg-neutral-200 rounded-full h-3"><div className="bg-orange-600 h-3 rounded-full transition-all" style={{ width: `${project.targetAmount > 0 ? Math.min(100, (project.raisedAmount / project.targetAmount) * 100) : 0}%` }} /></div><p className="text-xs text-neutral-500 mt-1">{project.targetAmount > 0 ? Math.round((project.raisedAmount / project.targetAmount) * 100) : 0}% funded</p></div>{(() => { const d = fundraiserDeadlineLabel(project.endDate); if (!d) return null; return <div className={`flex items-center gap-1 text-xs mt-2 ${d.ended ? "text-red-600" : "text-neutral-500"}`}><Clock className="w-3.5 h-3.5" /><span>{d.text}</span></div>; })()}
                    </div>
                  </Card>
                ))}</div>
              )}
            </div>)}

            {/* VOLUNTEERS */}
            {activeTab === "volunteers" && (<div>
              <div className="flex items-center justify-between mb-8"><div><h1 className="text-2xl font-bold mb-2">Volunteers</h1></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => { loadApplications(); loadOpportunities(); }}><RefreshCw className="w-4 h-4" /></Button><Button className="bg-orange-600 hover:bg-orange-700" onClick={() => { setOpportunityImageUrl(null); setShowCreateOpportunity(true); }}><Plus className="w-4 h-4 mr-2" /> Create Opportunity</Button></div></div>
              <Tabs defaultValue="opportunities"><TabsList className="mb-6"><TabsTrigger value="opportunities">Opportunities ({opportunities.length})</TabsTrigger><TabsTrigger value="pending">Pending ({pendingApps.length})</TabsTrigger><TabsTrigger value="accepted">Accepted ({acceptedApps.length})</TabsTrigger></TabsList>
                <TabsContent value="opportunities">{opportunitiesLoading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin" /></div> : opportunities.length === 0 ? <Card className="p-12 text-center"><p className="text-neutral-600 mb-4">No opportunities. Create one for supporters to apply.</p><Button onClick={() => { setOpportunityImageUrl(null); setShowCreateOpportunity(true); }}>Create Opportunity</Button></Card> : <div className="grid md:grid-cols-2 gap-6">{opportunities.map(o => (<Card key={o.opportunityId} className="p-6"><div className="flex justify-between mb-2"><div><h3 className="font-semibold">{o.roleTitle}</h3>{o.category && <Badge variant="outline">{o.category}</Badge>}</div><Badge className="bg-green-100 text-green-700">{o.numOfPositions} pos.</Badge></div>{o.description && <p className="text-sm text-neutral-600 mb-3 line-clamp-2">{o.description}</p>}<div className="flex gap-2"><Button variant="outline" size="sm" className="flex-1" onClick={() => setEditingOpportunity(o)}><Edit className="w-4 h-4 mr-1" /> Edit</Button><Button variant="outline" size="sm" className="text-red-600 flex-1" onClick={() => handleDeleteOpportunity(o.opportunityId)}><Trash2 className="w-4 h-4 mr-1" /> Delete</Button></div></Card>))}</div>}</TabsContent>
                <TabsContent value="pending">{pendingApps.length === 0 ? <Card className="p-8 text-center"><p className="text-neutral-600">No pending applications.</p></Card> : <div className="space-y-4">{pendingApps.map(a => (<Card key={a.applicationId} className="p-6"><div className="flex justify-between"><div><h3 className="font-semibold">{a.firstName} {a.lastName}</h3>{a.roleTitle && <Badge variant="outline" className="mt-1">{a.roleTitle}</Badge>}<p className="text-sm text-neutral-600 mt-1">{a.email}{a.phoneNum ? ` · ${a.phoneNum}` : ""}</p>{a.skills && <p className="text-xs text-neutral-500 mt-1">Skills: {a.skills}</p>}{a.availability && <p className="text-xs text-neutral-500 mt-0.5">Availability: {a.availability}</p>}{a.whyVolunteer && <p className="text-sm text-neutral-600 mt-2 italic">“{a.whyVolunteer}”</p>}<p className="text-xs text-neutral-400 mt-1">Applied {new Date(a.applicationDate).toLocaleDateString()}</p></div><div className="flex gap-2"><Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleAcceptApplication(a.applicationId)}><Check className="w-4 h-4" /></Button><Button size="sm" variant="outline" className="text-red-600" onClick={() => handleRejectApplication(a.applicationId)}><X className="w-4 h-4" /></Button></div></div></Card>))}</div>}</TabsContent>
                <TabsContent value="accepted">{acceptedApps.length === 0 ? <Card className="p-8 text-center"><p className="text-neutral-600">No accepted volunteers.</p></Card> : <div className="space-y-4">{acceptedApps.map(a => (<Card key={a.applicationId} className="p-4"><div className="flex justify-between items-center"><div><span className="font-semibold">{a.firstName} {a.lastName}</span> <Badge className="bg-green-100 text-green-700 ml-2">Active</Badge></div><Button size="sm" variant="outline" className="text-red-600" onClick={() => handleDeleteApplication(a.applicationId)}><Trash2 className="w-4 h-4" /></Button></div></Card>))}</div>}</TabsContent>
              </Tabs>
            </div>)}

            {/* FINANCES */}
            {activeTab === "finances" && (<div>
              <div className="flex items-center justify-between mb-8"><div><h1 className="text-2xl font-bold mb-2">Finances & Wallet</h1></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={loadWallet}><RefreshCw className="w-4 h-4" /></Button><Button className="bg-green-600 hover:bg-green-700" onClick={() => setShowWithdrawModal(true)}><ArrowDownToLine className="w-4 h-4 mr-2" /> Withdraw</Button></div></div>
              {walletLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div> : (<>
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <Card className="p-8 bg-gradient-to-br from-green-500 to-green-600 text-white"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center"><Wallet className="w-6 h-6" /></div><div><p className="text-white/80 text-sm">Balance</p><h2 className="text-2xl font-bold">R {walletBalance.toLocaleString()}</h2></div></div></Card>
                  <Card className="p-6"><p className="text-neutral-600 text-sm mb-1">Total Received</p><p className="text-3xl font-bold text-green-600">R {transactions.filter(t => t.transactionType !== "Withdrawal" && t.status === "Completed").reduce((s, t) => s + t.amount, 0).toLocaleString()}</p></Card>
                  <Card className="p-6"><p className="text-neutral-600 text-sm mb-1">Total Withdrawn</p><p className="text-3xl font-bold text-orange-600">R {transactions.filter(t => t.transactionType === "Withdrawal" && t.status === "Completed").reduce((s, t) => s + t.amount, 0).toLocaleString()}</p></Card>
                </div>
                <Card className="p-6"><h3 className="font-semibold mb-4">Transactions</h3>{transactions.length === 0 ? <p className="text-neutral-600 text-sm">No transactions yet.</p> : <div className="space-y-3">{transactions.map(tx => (<div key={tx.transactionId} className="flex items-center justify-between p-4 border rounded-lg"><div className="flex items-center gap-4"><div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.transactionType === "Withdrawal" ? "bg-orange-100" : tx.transactionType === "TopUp" ? "bg-blue-100" : "bg-green-100"}`}>{tx.transactionType === "Withdrawal" ? <ArrowDownToLine className="w-5 h-5 text-orange-600" /> : tx.transactionType === "TopUp" ? <ArrowUpFromLine className="w-5 h-5 text-blue-600" /> : <Heart className="w-5 h-5 text-green-600" />}</div><div><p className="text-sm font-medium">{tx.transactionType}</p><p className="text-xs text-neutral-500">{new Date(tx.timestamp).toLocaleDateString()}</p></div></div><div className="text-right"><p className={`font-semibold ${tx.transactionType === "Withdrawal" ? "text-orange-600" : "text-green-600"}`}>{tx.transactionType === "Withdrawal" ? "-" : "+"}R {tx.amount.toLocaleString()}</p><Badge className={tx.status === "Completed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>{tx.status}</Badge></div></div>))}</div>}</Card>
              </>)}
            </div>)}

            {/* VERIFICATION */}
            {activeTab === "verification" && (<div>
              <div className="flex items-center justify-between mb-8"><div><h1 className="text-2xl font-bold mb-2">Verification</h1></div><Button className="bg-orange-600 hover:bg-orange-700" onClick={() => setShowVerificationForm(true)}><Upload className="w-4 h-4 mr-2" /> Submit</Button></div>
              {verificationLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div> : verifications.length === 0 ? <Card className="p-12 text-center"><Shield className="w-12 h-12 text-neutral-400 mx-auto mb-3" /><p className="text-neutral-600 mb-4">Not verified yet. Submit your documents.</p><Button onClick={() => setShowVerificationForm(true)}>Start</Button></Card> : <div className="space-y-4">{verifications.map(v => (<Card key={v.verificationId} className="p-6"><div className="flex justify-between"><div><div className="flex items-center gap-3 mb-1"><h3 className="font-semibold">Request #{v.verificationId}</h3><Badge className={v.status === "Approved" ? "bg-green-100 text-green-700" : v.status === "Rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}>{v.status}</Badge></div><p className="text-sm text-neutral-600">Submitted: {new Date(v.submittedDate).toLocaleDateString()}</p></div>{v.status === "Approved" ? <CheckCircle className="w-8 h-8 text-green-600" /> : v.status === "Pending" ? <Clock className="w-8 h-8 text-amber-600" /> : <AlertCircle className="w-8 h-8 text-red-600" />}</div></Card>))}</div>}
            </div>)}

            {/* CAMPAIGNS (Browse & Apply to Business campaigns) */}
            {activeTab === "campaigns" && (<div>
              <div className="mb-6"><h1 className="text-2xl font-bold mb-2">Partnership Campaigns</h1><p className="text-neutral-600">Browse and apply to business partnership campaigns</p></div>
              <CampaignBrowser />
            </div>)}

            {/* REPORTS */}
            {activeTab === "reports" && (<div><NpoReportsPanel /></div>)}

          </motion.div>
        </main>
      </div>

      {/* ═══ MODALS ═══ */}

      {showCreatePost && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-lg max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"><div className="flex justify-between mb-6"><h3 className="font-semibold text-lg">Create Post</h3><button onClick={() => setShowCreatePost(false)}><X className="w-5 h-5" /></button></div><form className="space-y-4" onSubmit={handleCreatePost}><div><Label>Title</Label><Input name="title" required className="mt-1" /></div><div><Label>Content</Label><Textarea name="content" rows={5} required className="mt-1" /></div><input type="hidden" name="mediaUrl" value={postImageUrl || ""} /><ImageUploadField label="Image (optional)" value={postImageUrl} onChange={setPostImageUrl} /><div className="flex gap-3"><Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">Create</Button><Button type="button" variant="outline" onClick={() => setShowCreatePost(false)}>Cancel</Button></div></form></motion.div></div>)}

      {editingPost && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-lg max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"><div className="flex justify-between mb-6"><h3 className="font-semibold text-lg">Edit Post</h3><button onClick={() => setEditingPost(null)}><X className="w-5 h-5" /></button></div><form className="space-y-4" onSubmit={handleUpdatePost}><div><Label>Title</Label><Input name="title" defaultValue={editingPost.postTitle} required className="mt-1" /></div><div><Label>Content</Label><Textarea name="content" defaultValue={editingPost.content || ""} rows={5} required className="mt-1" /></div><input type="hidden" name="mediaUrl" value={postImageUrl || ""} /><ImageUploadField label="Image" value={postImageUrl} onChange={setPostImageUrl} /><div className="flex gap-3"><Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">Save</Button><Button type="button" variant="outline" onClick={() => setEditingPost(null)}>Cancel</Button></div></form></motion.div></div>)}

      {selectedPost && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-lg max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto"><div className="flex justify-between mb-6"><h3 className="font-semibold text-lg">Post Details</h3><button onClick={() => setSelectedPost(null)}><X className="w-5 h-5" /></button></div>{selectedPost.mediaUrl && <img src={resolveMediaUrl(selectedPost.mediaUrl)} alt="" className="w-full h-64 object-cover rounded-lg mb-6" />}<h2 className="text-xl font-bold mb-3">{selectedPost.postTitle}</h2><p className="text-neutral-600 whitespace-pre-wrap mb-6">{selectedPost.content}</p><div className="flex gap-6 text-sm mb-6 pb-6 border-b"><button onClick={() => handleLikePost(selectedPost.postId)} className={`flex items-center gap-2 ${likedPostIds.has(selectedPost.postId) ? "text-red-500" : "text-neutral-600"}`}><Heart className={`w-5 h-5 ${likedPostIds.has(selectedPost.postId) ? "fill-current" : ""}`} /> {selectedPost.likeCount}</button></div><h4 className="font-semibold mb-4">Comments</h4><div className="flex gap-2 mb-6"><Input placeholder="Write a comment..." value={newComment[selectedPost.postId] || ""} onChange={e => setNewComment(p => ({ ...p, [selectedPost.postId]: e.target.value }))} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); handleAddComment(selectedPost.postId); } }} /><Button onClick={() => handleAddComment(selectedPost.postId)} disabled={commentSubmitting} className="bg-orange-600 hover:bg-orange-700"><Send className="w-4 h-4" /></Button></div>{commentsLoading[selectedPost.postId] ? <Loader2 className="w-6 h-6 animate-spin mx-auto" /> : <div className="space-y-3">{(comments[selectedPost.postId] || []).length === 0 ? <p className="text-neutral-500 text-sm text-center">No comments yet.</p> : (comments[selectedPost.postId] || []).map(c => (<div key={c.commentId} className="flex gap-3 p-3 bg-neutral-50 rounded-lg"><div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0"><span className="text-xs font-bold">{c.authorName?.charAt(0)}</span></div><div className="flex-1"><div className="flex justify-between"><span className="text-sm font-semibold">{c.authorName}</span><div className="flex gap-2 items-center"><span className="text-xs text-neutral-400">{new Date(c.timestamp).toLocaleDateString()}</span>{c.userId === userId && <button onClick={() => handleDeleteComment(c.commentId, selectedPost.postId)} className="text-red-400 hover:text-red-600"><Trash2 className="w-3 h-3" /></button>}</div></div><p className="text-sm mt-1">{c.content}</p></div></div>))}</div>}</motion.div></div>)}

      {showCreateProject && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-lg max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"><div className="flex justify-between mb-6"><h3 className="font-semibold text-lg">Create Fundraiser</h3><button onClick={() => setShowCreateProject(false)}><X className="w-5 h-5" /></button></div><form className="space-y-4" onSubmit={handleCreateProject}><div><Label>Project/Initiative Name</Label><Input name="projectName" required className="mt-1" placeholder="e.g., Build Community Library" /></div><div><Label>Description</Label><Textarea name="projectDesc" rows={4} className="mt-1" placeholder="What is this fundraiser for?" /></div><div className="grid grid-cols-2 gap-4"><div><Label>Target Amount (R)</Label><Input name="targetAmount" type="number" min="1" required className="mt-1" placeholder="e.g., 100000" /></div><div><Label>Status</Label><select name="projectStatus" className="w-full mt-1 px-3 py-2 border rounded-md"><option value="Active">Active</option><option value="Planning">Planning</option></select></div></div><div><Label>Duration (days)</Label><Input name="durationDays" type="number" min="1" className="mt-1" placeholder="Optional — e.g., 30. Auto-closes when it ends." /><p className="text-xs text-neutral-500 mt-1">Leave blank for an open-ended fundraiser. It also auto-closes once the target is reached.</p></div><div><Label>Images (comma-separated URLs)</Label><Textarea name="images" rows={2} className="mt-1" placeholder="https://img1.jpg, https://img2.jpg, https://img3.jpg" /></div><div className="flex gap-3"><Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">Create Fundraiser</Button><Button type="button" variant="outline" onClick={() => setShowCreateProject(false)}>Cancel</Button></div></form></motion.div></div>)}

      {editingProject && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-lg max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"><div className="flex justify-between mb-6"><h3 className="font-semibold text-lg">Edit Fundraiser</h3><button onClick={() => setEditingProject(null)}><X className="w-5 h-5" /></button></div><form className="space-y-4" onSubmit={handleUpdateProject}><div><Label>Name</Label><Input name="projectName" defaultValue={editingProject.projectName} required className="mt-1" /></div><div><Label>Description</Label><Textarea name="projectDesc" defaultValue={editingProject.projectDesc || ""} rows={4} className="mt-1" /></div><div className="grid grid-cols-2 gap-4"><div><Label>Target Amount (R)</Label><Input name="targetAmount" type="number" defaultValue={editingProject.targetAmount} className="mt-1" /></div><div><Label>Status</Label><select name="projectStatus" defaultValue={editingProject.projectStatus} className="w-full mt-1 px-3 py-2 border rounded-md"><option value="Active">Active</option><option value="Planning">Planning</option><option value="Completed">Completed</option><option value="Suspended">Suspended</option></select></div></div><div><Label>End Date</Label><Input name="endDate" type="date" defaultValue={editingProject.endDate ? editingProject.endDate.slice(0, 10) : ""} className="mt-1" /><p className="text-xs text-neutral-500 mt-1">Auto-closes on this date. Leave blank for open-ended.</p></div><div><Label>Images (comma-separated URLs)</Label><Textarea name="images" defaultValue={editingProject.images || ""} rows={2} className="mt-1" /></div><div className="flex gap-3"><Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">Save</Button><Button type="button" variant="outline" onClick={() => setEditingProject(null)}>Cancel</Button></div></form></motion.div></div>)}

      {showCreateOpportunity && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-lg max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"><div className="flex justify-between mb-6"><h3 className="font-semibold text-lg">Create Volunteer Opportunity</h3><button onClick={() => setShowCreateOpportunity(false)}><X className="w-5 h-5" /></button></div><form className="space-y-4" onSubmit={handleCreateOpportunity}><div><Label>Role Title</Label><Input name="roleTitle" required className="mt-1" placeholder="e.g., Youth Mentor" /></div><div className="grid grid-cols-2 gap-4"><div><Label>Category</Label><Input name="category" className="mt-1" placeholder="e.g., Education" /></div><div><Label>Positions</Label><Input name="numOfPositions" type="number" min="1" defaultValue="1" className="mt-1" /></div></div><div><Label>Description</Label><Textarea name="description" rows={3} className="mt-1" /></div><div><Label>Skills Required</Label><Input name="skillsRequired" className="mt-1" /></div><div className="grid grid-cols-2 gap-4"><div><Label>Time Commitment</Label><Input name="timeCommitment" className="mt-1" placeholder="4 hours/week" /></div><div><Label>Duration</Label><Input name="duration" className="mt-1" placeholder="3 months" /></div></div><ImageUploadField label="Image (optional)" value={opportunityImageUrl} onChange={setOpportunityImageUrl} /><div className="flex gap-3"><Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">Create</Button><Button type="button" variant="outline" onClick={() => setShowCreateOpportunity(false)}>Cancel</Button></div></form></motion.div></div>)}

      {editingOpportunity && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-lg max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"><div className="flex justify-between mb-6"><h3 className="font-semibold text-lg">Edit Volunteer Opportunity</h3><button onClick={() => setEditingOpportunity(null)}><X className="w-5 h-5" /></button></div><form className="space-y-4" onSubmit={handleUpdateOpportunity}><div><Label>Role Title</Label><Input name="roleTitle" defaultValue={editingOpportunity.roleTitle} required className="mt-1" /></div><div className="grid grid-cols-2 gap-4"><div><Label>Category</Label><Input name="category" defaultValue={editingOpportunity.category || ""} className="mt-1" /></div><div><Label>Positions</Label><Input name="numOfPositions" type="number" min="1" defaultValue={editingOpportunity.numOfPositions} className="mt-1" /></div></div><div><Label>Description</Label><Textarea name="description" defaultValue={editingOpportunity.description || ""} rows={3} className="mt-1" /></div><div><Label>Skills Required</Label><Input name="skillsRequired" defaultValue={editingOpportunity.skillsRequired || ""} className="mt-1" /></div><div className="grid grid-cols-2 gap-4"><div><Label>Time Commitment</Label><Input name="timeCommitment" defaultValue={editingOpportunity.timeCommitment || ""} className="mt-1" /></div><div><Label>Duration</Label><Input name="duration" defaultValue={editingOpportunity.duration || ""} className="mt-1" /></div></div><div className="flex gap-3"><Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">Save Changes</Button><Button type="button" variant="outline" onClick={() => setEditingOpportunity(null)}>Cancel</Button></div></form></motion.div></div>)}

      {/* NPO Top-Up removed — NPOs receive funds via donations, not top-up */}

      {showWithdrawModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-lg max-w-md w-full p-8"><div className="flex justify-between mb-6"><h3 className="font-semibold text-lg">Withdraw Funds</h3><button onClick={() => setShowWithdrawModal(false)}><X className="w-5 h-5" /></button></div><form className="space-y-4" onSubmit={handleWithdraw}><div className="bg-neutral-50 p-4 rounded-lg text-center"><span className="text-neutral-600">Available: </span><span className="text-xl font-bold">R {walletBalance.toLocaleString()}</span></div><div><Label>Amount (R)</Label><Input type="number" min="1" max={walletBalance} value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} required className="mt-1" /></div><div className="flex gap-3"><Button type="submit" className="flex-1 bg-green-600 hover:bg-green-700" disabled={withdrawing}>{withdrawing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ArrowDownToLine className="w-4 h-4 mr-2" />}Withdraw</Button><Button type="button" variant="outline" onClick={() => setShowWithdrawModal(false)}>Cancel</Button></div></form></motion.div></div>)}

      {showVerificationForm && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-lg max-w-lg w-full p-8"><div className="flex justify-between mb-6"><h3 className="font-semibold text-lg">Submit Verification</h3><button onClick={() => setShowVerificationForm(false)}><X className="w-5 h-5" /></button></div><form className="space-y-4" onSubmit={handleSubmitVerification}><DocumentUploadField label="NPO Registration Certificate (PDF)" value={npoCertUrl} onChange={setNpoCertUrl} /><DocumentUploadField label="Tax Clearance Certificate (PDF)" value={npoTaxCertUrl} onChange={setNpoTaxCertUrl} /><p className="text-xs text-neutral-500">At least one required.</p><div className="flex gap-3"><Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">Submit</Button><Button type="button" variant="outline" onClick={() => setShowVerificationForm(false)}>Cancel</Button></div></form></motion.div></div>)}

      {selectedNpoDetail && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-lg max-w-lg w-full p-8"><div className="flex justify-between mb-6"><h3 className="font-semibold text-lg">{selectedNpoDetail.organizationName}</h3><button onClick={() => setSelectedNpoDetail(null)}><X className="w-5 h-5" /></button></div><div className="space-y-4"><div className="flex items-center gap-4"><div className="w-16 h-16 rounded-full bg-orange-100 flex items-center justify-center"><span className="text-2xl font-bold text-orange-600">{selectedNpoDetail.organizationName.charAt(0)}</span></div><div><h2 className="text-xl font-bold">{selectedNpoDetail.organizationName}</h2>{selectedNpoDetail.npofocusArea && <Badge variant="outline">{selectedNpoDetail.npofocusArea}</Badge>}</div></div>{selectedNpoDetail.npomission && <div><h4 className="font-semibold mb-1">Mission</h4><p className="text-neutral-600 text-sm">{selectedNpoDetail.npomission}</p></div>}<p className="text-sm text-neutral-500">Reg: {selectedNpoDetail.nporegNum}</p></div><div className="flex gap-3 mt-6"><Button className={`flex-1 ${followedNpoIds.has(selectedNpoDetail.npoId) ? "bg-orange-600 hover:bg-orange-700" : ""}`} variant={followedNpoIds.has(selectedNpoDetail.npoId) ? "default" : "outline"} onClick={() => handleFollowNpo(selectedNpoDetail.npoId)}><Heart className={`w-4 h-4 mr-2 ${followedNpoIds.has(selectedNpoDetail.npoId) ? "fill-current" : ""}`} />{followedNpoIds.has(selectedNpoDetail.npoId) ? "Following" : "Follow"}</Button><Button variant="outline" onClick={() => setSelectedNpoDetail(null)}>Close</Button></div></motion.div></div>)}

      <EmailVerificationBanner />
    </div>
  );
}

// ── Campaign Browser (NPO applies to Business campaigns) ──
function CampaignBrowser() {
  const [campaigns, setCampaigns] = useState<{ campaignId: number; businessId: number; title: string; description: string | null; category: string | null; requirements: string | null; budgetPerPartner: number | null; startDate: string; endDate: string | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const [appliedIds, setAppliedIds] = useState<Set<number>>(new Set());
  const [applyingId, setApplyingId] = useState<number | null>(null);
  const [motivation, setMotivation] = useState("");
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await npoService.browseCampaigns(); setCampaigns(r.data); }
    catch (e) { toast.error(getErrorMessage(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCampaignId) return;
    if (!motivation.trim()) { toast.error("Please provide a reason for applying."); return; }
    setApplyingId(selectedCampaignId);
    try {
      await npoService.applyToCampaign(selectedCampaignId, motivation.trim());
      setAppliedIds(p => new Set(p).add(selectedCampaignId));
      setShowApplyModal(false);
      setMotivation("");
      toast.success("Application submitted!");
    } catch (e) {
      const msg = getErrorMessage(e);
      if (msg.toLowerCase().includes("already applied")) {
        setAppliedIds(p => new Set(p).add(selectedCampaignId));
        toast.error("You've already applied to this campaign.");
      } else { toast.error(msg); }
    }
    finally { setApplyingId(null); }
  };

  return (
    <div>
      {loading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-orange-600" /></div> : campaigns.length === 0 ? <Card className="p-12 text-center"><Target className="w-12 h-12 text-neutral-400 mx-auto mb-3" /><p className="text-neutral-600">No campaigns available at the moment.</p></Card> : (
        <div className="grid md:grid-cols-2 gap-6">{campaigns.map(c => (
          <Card key={c.campaignId} className="p-6 hover:shadow-lg transition-shadow">
            <div className="mb-3"><h3 className="font-semibold text-lg">{c.title}</h3>{c.category && <Badge variant="outline" className="mt-1">{c.category}</Badge>}</div>
            {c.description && <p className="text-neutral-600 text-sm mb-3 line-clamp-3">{c.description}</p>}
            {c.requirements && <p className="text-sm text-neutral-500 mb-2"><span className="font-medium">Requirements:</span> {c.requirements}</p>}
            <div className="flex items-center gap-4 text-sm text-neutral-500 mb-4">
              {c.budgetPerPartner && <span>R {c.budgetPerPartner.toLocaleString()}/partner</span>}
              <span>{c.startDate}{c.endDate ? ` – ${c.endDate}` : ""}</span>
            </div>
            {appliedIds.has(c.campaignId) ? (
              <Badge className="bg-green-100 text-green-700"><CheckCircle className="w-3 h-3 mr-1" /> Applied</Badge>
            ) : (
              <Button className="bg-orange-600 hover:bg-orange-700" size="sm" onClick={() => { setSelectedCampaignId(c.campaignId); setMotivation(""); setShowApplyModal(true); }} disabled={applyingId === c.campaignId}>
                {applyingId === c.campaignId ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <UserPlus className="w-4 h-4 mr-1" />} Apply
              </Button>
            )}
          </Card>
        ))}</div>
      )}

      {/* Apply Modal */}
      {showApplyModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><Card className="w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold">Apply to Campaign</h2><Button variant="ghost" size="sm" onClick={() => setShowApplyModal(false)}><X className="w-4 h-4" /></Button></div>
        <form onSubmit={handleApply} className="space-y-4">
          <div><Label>Why should your NPO be selected? <span className="text-red-500">*</span></Label><Textarea value={motivation} onChange={e => setMotivation(e.target.value)} rows={4} required placeholder="Describe how your NPO aligns with this campaign..." className="mt-1" /></div>
          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700">Submit Application</Button>
        </form>
      </Card></div>)}
    </div>
  );
}
