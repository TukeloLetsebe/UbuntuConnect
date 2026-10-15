import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "./NotificationBell";
import BrandMark from "./BrandMark";
import ProfileMenu from "./ProfileMenu";
import HeaderSearch from "./HeaderSearch";
import DashboardSidebar from "./DashboardSidebar";
import { CardGridSkeleton } from "./LoadingSkeletons";
import EmailVerificationBanner from "./EmailVerificationBanner";
import ReportPostButton from "./ReportPostButton";
import CardPaymentFields, { type CardDetails, emptyCard } from "./CardPaymentFields";
import DocumentUploadField from "./DocumentUploadField";
import { useConfirm } from "./ConfirmDialog";
import { getNpoColor } from "../../lib/npoColor";
import type { BusinessVerificationItem } from "../../services/businessService";
import ImageCropField from "./ImageCropField";
import PostDetailModal from "./PostDetailModal";
import { parseProvince, SA_PROVINCES, PROVINCE_OTHER } from "../../lib/registrationOptions";
import BusinessReportsPanel from "./reports/BusinessReportsPanel";
import { resolveMediaUrl } from "../../lib/api";
import { formatZar } from "../../lib/money";
import { businessService, getErrorMessage, type BusinessProfile, type NPOSummary, type FollowedNPO, type Campaign, type CampaignApplication, type DonationsResponse, type BusinessImpact, type CommunityPost, type CommentItem, type Fundraiser, type NpoDocuments } from "../../services/businessService";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from "./ui/carousel";
import { useCarouselAutoplay } from "./useCarouselAutoplay";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import {
  Search, Heart, TrendingUp, LogOut, DollarSign, Users, Plus, X,
  Building2, Target, MessageSquare, Loader2, RefreshCw, Wallet,
  Calendar, FileText, CheckCircle, AlertCircle, Eye, UserCheck, Ban,
  ArrowUpFromLine, Send, Trash2, Edit, Menu, MapPin, Settings, Shield, Clock, Upload,
  LayoutDashboard, Megaphone, ChevronLeft, ChevronRight, ChevronDown,
  CreditCard, ArrowRight, ArrowLeft
} from "lucide-react";

export default function BusinessDashboard() {
  const { logout, userId, email } = useAuth();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [overviewCarouselApi, setOverviewCarouselApi] = useState<CarouselApi | undefined>();
  useCarouselAutoplay(overviewCarouselApi, { delay: 4000 });
  const reduceMotion = useReducedMotion();
  // Profile Settings accordion — which section is expanded (Branding open by default).
  const [openSetting, setOpenSetting] = useState<string | null>("branding");
  const toggleSetting = (key: string) => setOpenSetting(prev => prev === key ? null : key);
  const selectTab = (id: string) => {
    setSidebarOpen(false);
    // "Fundraisers" is a separate route, not a tab.
    if (id === "fundraisers") { navigate("/fundraisers"); return; }
    setActiveTab(id);
  };

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
  const [topUpStep, setTopUpStep] = useState<1 | 2>(1);
  const [topUpAmount, setTopUpAmount] = useState("");
  const [topUpCard, setTopUpCard] = useState<CardDetails>(emptyCard);
  const [toppingUp, setToppingUp] = useState(false);
  const [topUpError, setTopUpError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<{ transactionId: number; type: string; direction: string; amount: number; status: string; timestamp: string; counterpartyName: string }[]>([]);

  // Verification (CIPC + tax clearance)
  const [verifications, setVerifications] = useState<BusinessVerificationItem[]>([]);
  const [verificationLoading, setVerificationLoading] = useState(false);
  const [showVerificationForm, setShowVerificationForm] = useState(false);
  const [cipcUrl, setCipcUrl] = useState<string | null>(null);
  const [taxClearanceUrl, setTaxClearanceUrl] = useState<string | null>(null);

  // Account security
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [deactivatePassword, setDeactivatePassword] = useState("");
  const [deactivating, setDeactivating] = useState(false);
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
    try {
      const [b, t] = await Promise.all([
        businessService.getWalletBalance(userId),
        businessService.getTransactions(),
      ]);
      setWalletBalance(b.data.balance);
      setTransactions(t.data.transactions);
    } catch { /* non-critical */ } finally { setWalletLoading(false); }
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
      setAllFundraisers(f.data);
    } catch { /* non-critical slider */ }
  }, []);

  const loadVerification = useCallback(async () => {
    setVerificationLoading(true);
    try { const r = await businessService.getMyVerificationStatus(); setVerifications(r.data); }
    catch (e) { toast.error(getErrorMessage(e)); }
    finally { setVerificationLoading(false); }
  }, []);

  useEffect(() => { loadProfile(); loadWallet(); loadImpact(); }, [loadProfile, loadWallet, loadImpact]);
  useEffect(() => {
    if (activeTab === "overview") { loadOverviewSlider(); loadVerification(); }
    if (activeTab === "discover") loadNPOs();
    if (activeTab === "campaigns") loadCampaigns();
    if (activeTab === "donations") loadDonations();
    if (activeTab === "community") loadCommunity();
    if (activeTab === "verification") loadVerification();
    if (activeTab === "editprofile") seedEditProfile();
  }, [activeTab, loadOverviewSlider, loadNPOs, loadCampaigns, loadDonations, loadCommunity, loadVerification, seedEditProfile]);

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
    if (!amt || amt <= 0 || !donateNpoId) { toast.error("Enter a valid donation amount greater than R 0."); return; }
    if (amt > walletBalance) { toast.error(`Insufficient balance. Your wallet has R ${walletBalance.toLocaleString()}; top up to donate R ${amt.toLocaleString()}.`); return; }
    const npoName = npos.find(n => n.npoId === donateNpoId)?.organizationName ?? "this NPO";
    const ok = await confirm({
      title: `Donate R ${amt.toLocaleString()} to ${npoName}?`,
      description: `R ${amt.toLocaleString()} will be transferred from your wallet to ${npoName}. This cannot be undone.`,
      confirmText: `Donate R ${amt.toLocaleString()}`,
    });
    if (!ok) return;
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
    if (!amt || amt <= 0) { toast.error("Enter a valid top-up amount greater than R 0."); return; }
    // Card fields are required; the server validates the card shape (Luhn/expiry/CVV).
    if (!topUpCard.cardNumber) { setTopUpError("Please enter your card number."); return; }
    if (!topUpCard.cardExpiry) { setTopUpError("Please enter the card expiry date (MM/YY)."); return; }
    if (!topUpCard.cardCvv) { setTopUpError("Please enter the card CVV (the 3–4 digit code)."); return; }
    const ok = await confirm({
      title: `Top up R ${amt.toLocaleString()}?`,
      description: `R ${amt.toLocaleString()} will be added to your wallet using the card ending ${topUpCard.cardNumber.replace(/\D/g, "").slice(-4) || "••••"}.`,
      confirmText: `Top up R ${amt.toLocaleString()}`,
    });
    if (!ok) return;
    setToppingUp(true);
    setTopUpError(null);
    try {
      const r = await businessService.topUp(amt, {
        cardNumber: topUpCard.cardNumber,
        cardExpiry: topUpCard.cardExpiry,
        cardCvv: topUpCard.cardCvv,
      });
      setWalletBalance(r.data.newBalance);
      setShowTopUp(false); setTopUpAmount(""); setTopUpCard(emptyCard);
      toast.success(`R ${amt.toLocaleString()} added to wallet. New balance: R ${r.data.newBalance.toLocaleString()}.`);
    } catch (e) { const m = getErrorMessage(e); setTopUpError(m); toast.error(m); }
    finally { setToppingUp(false); }
  };

  const handleSubmitVerification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cipcUrl && !taxClearanceUrl) { toast.error("Please upload at least one document — your CIPC registration document or tax clearance certificate."); return; }
    try {
      await businessService.submitVerification({ cipcDocument: cipcUrl || undefined, taxClearance: taxClearanceUrl || undefined });
      setShowVerificationForm(false); setCipcUrl(null); setTaxClearanceUrl(null);
      loadVerification();
      toast.success("Documents submitted for verification. An admin will review them shortly.");
    } catch (e) { toast.error(getErrorMessage(e)); }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword.length < 8) { setPasswordError("New password must be at least 8 characters."); return; }
    if (newPassword !== confirmPassword) { setPasswordError("New password and confirmation do not match."); return; }
    setPasswordChanging(true);
    try {
      await businessService.changePassword(currentPassword, newPassword);
      toast.success("Password changed successfully.");
      setCurrentPassword(""); setNewPassword(""); setConfirmPassword(""); setPasswordError(null);
    } catch (e) { const m = getErrorMessage(e); setPasswordError(m); }
    finally { setPasswordChanging(false); }
  };

  const handleDeactivateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deactivatePassword) { toast.error("Enter your password to confirm deactivation."); return; }
    const ok = await confirm({
      title: "Deactivate your business account?",
      description: "You will be signed out and won't be able to log in until an admin reactivates the account. Your data is preserved.",
      confirmText: "Deactivate account",
      destructive: true,
    });
    if (!ok) return;
    setDeactivating(true);
    try {
      await businessService.deactivateAccount(deactivatePassword);
      toast.success("Your account has been deactivated.");
      logout();
    } catch (e) { toast.error(getErrorMessage(e)); }
    finally { setDeactivating(false); }
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
    const c = campaigns.find(x => x.campaignId === id);
    const ok = await confirm({ title: `Delete ${c ? `"${c.title}"` : "this campaign"}?`, description: "The campaign and its applications will be permanently removed. This cannot be undone.", confirmText: "Delete", destructive: true });
    if (!ok) return;
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
    const app = campaignApps.find(a => a.applicationId === id);
    const npoName = app?.organizationName ?? "this NPO";
    const budget = selectedCampaign?.budgetPerPartner;
    const ok = await confirm({
      title: `Approve ${npoName}'s application?`,
      description: budget && budget > 0
        ? `Approving pays R ${budget.toLocaleString()} from your wallet to ${npoName}, and accepts them as a campaign partner. This cannot be undone.`
        : `This accepts ${npoName} as a partner on "${selectedCampaign?.title ?? "this campaign"}". No budget is set, so no funds will move.`,
      confirmText: budget && budget > 0 ? `Approve & pay R ${budget.toLocaleString()}` : "Approve",
    });
    if (!ok) return;
    try { await businessService.approveApplication(id); setCampaignApps(p => p.map(a => a.applicationId === id ? { ...a, status: "Accepted" } : a)); toast.success(`${npoName} approved.`); }
    catch (e) { toast.error(getErrorMessage(e)); }
  };

  const handleRejectApp = async (id: number) => {
    const app = campaignApps.find(a => a.applicationId === id);
    const npoName = app?.organizationName ?? "this NPO";
    const ok = await confirm({
      title: `Reject ${npoName}'s application?`,
      description: `${npoName} will be notified that their application to "${selectedCampaign?.title ?? "this campaign"}" was not accepted.`,
      confirmText: "Reject application",
      destructive: true,
    });
    if (!ok) return;
    try { await businessService.rejectApplication(id); setCampaignApps(p => p.map(a => a.applicationId === id ? { ...a, status: "Rejected" } : a)); toast.success(`${npoName}'s application rejected.`); }
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
    <div className="h-screen w-full flex flex-col overflow-hidden bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 py-4 px-6 z-40 shrink-0"><div className="w-full flex items-center justify-between"><div className="flex items-center gap-3"><button onClick={() => setSidebarOpen(true)} className="lg:hidden text-neutral-600"><Menu className="w-6 h-6" /></button><BrandMark onClick={() => setActiveTab("overview")} /></div><HeaderSearch placeholder="Search NPOs by name, cause, or location..." onSubmit={(q) => { setActiveTab("discover"); setNpoSearchQuery(q); }} /><div className="flex items-center gap-3"><span className="hidden md:inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">Business</span><NotificationBell /><ProfileMenu name={profile?.contactPersonName || profile?.businessEmail || "Business"} subtitle={profile?.businessEmail || email || undefined} roleLabel="Business" onProfile={() => setActiveTab("editprofile")} onLogout={logout} /></div></div></header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        <DashboardSidebar
          activeTab={activeTab}
          onSelect={selectTab}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
          storageKey="business-sidebar-collapsed"
          groups={[
            { heading: "Core", items: [
              { id: "overview", icon: LayoutDashboard, label: "Overview" },
              { id: "discover", icon: Search, label: "Discover NPOs" },
              { id: "following", icon: Heart, label: "Following" },
            ]},
            { heading: "Engagement", items: [
              { id: "community", icon: MessageSquare, label: "Community Feed" },
            ]},
            { heading: "Activity", items: [
              { id: "donations", icon: DollarSign, label: "Donations" },
              { id: "wallet", icon: Wallet, label: "Wallet" },
              { id: "fundraisers", icon: Target, label: "Fundraisers" },
              { id: "campaigns", icon: Megaphone, label: "Campaigns" },
              { id: "reports", icon: FileText, label: "Reports" },
            ]},
          ]}
          bottomItems={[
            { id: "verification", icon: Shield, label: "Verification" },
            { id: "editprofile", icon: Settings, label: "Profile Settings" },
          ]}
        />

        <main className="flex-1 p-4 md:p-8 w-full min-w-0 overflow-y-auto main-scroll">
          <motion.div key={activeTab} initial={reduceMotion ? false : { opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: reduceMotion ? 0 : 0.3 }}>

            {/* OVERVIEW */}
            {activeTab === "overview" && (<div>
              <div className="mb-6"><h1 className="text-2xl font-bold mb-1">Overview</h1><p className="text-neutral-600">Welcome back, {profile?.contactPersonName || "Business"}</p></div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <Card className="p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("wallet")}><div className="flex items-center gap-3"><div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center shrink-0"><Wallet className="w-5 h-5 text-green-600" /></div><div className="min-w-0"><p className="text-xs text-neutral-500">Balance</p><p className="text-2xl font-bold leading-tight">{formatZar(walletBalance)}</p></div></div></Card>
                <Card className="p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("donations")}><div className="flex items-center gap-3"><div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center shrink-0"><DollarSign className="w-5 h-5 text-orange-600" /></div><div className="min-w-0"><p className="text-xs text-neutral-500">Total Donated</p><p className="text-2xl font-bold leading-tight">{formatZar(impact?.totalDonated || 0)}</p></div></div></Card>
                <Card className="p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("campaigns")}><div className="flex items-center gap-3"><div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center shrink-0"><Target className="w-5 h-5 text-blue-600" /></div><div className="min-w-0"><p className="text-xs text-neutral-500">Campaigns</p><p className="text-2xl font-bold leading-tight">{impact?.activeCampaigns || 0}</p></div></div></Card>
                <Card className="p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("discover")}><div className="flex items-center gap-3"><div className="w-11 h-11 rounded-full bg-purple-100 flex items-center justify-center shrink-0"><Users className="w-5 h-5 text-purple-600" /></div><div className="min-w-0"><p className="text-xs text-neutral-500">NPOs Supported</p><p className="text-2xl font-bold leading-tight">{impact?.nposSupported || 0}</p></div></div></Card>
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

              {/* Fundraisers across the platform — sliding discovery strip */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3"><h3 className="font-semibold">Fundraisers to Support</h3><div className="flex items-center gap-1"><Link to="/fundraisers" className="text-sm text-orange-600 hover:underline mr-1">See all</Link><Button variant="outline" size="icon" className="size-8 rounded-full" aria-label="Previous" onClick={() => overviewCarouselApi?.scrollPrev()}><ChevronLeft className="w-4 h-4" /></Button><Button variant="outline" size="icon" className="size-8 rounded-full" aria-label="Next" onClick={() => overviewCarouselApi?.scrollNext()}><ChevronRight className="w-4 h-4" /></Button></div></div>
                {allFundraisers.length === 0 ? (
                  <Card className="p-8 text-center"><p className="text-sm text-neutral-500">No fundraisers on the platform yet.</p></Card>
                ) : (
                  <Carousel opts={{ align: "start", loop: true }} setApi={setOverviewCarouselApi} className="w-full">
                    <CarouselContent>
                      {[...allFundraisers]
                        .sort((a, b) => (b.projectStatus === "Active" ? 1 : 0) - (a.projectStatus === "Active" ? 1 : 0))
                        .map(f => {
                          const pct = f.targetAmount > 0 ? Math.min(100, Math.round((f.raisedAmount / f.targetAmount) * 100)) : 0;
                          return (
                            <CarouselItem key={f.projectId} className="basis-4/5 sm:basis-1/2 lg:basis-[30%]">
                              <Card className="overflow-hidden h-full">
                                {f.images
                                  ? <img src={resolveMediaUrl(f.images.split(",")[0].trim())} alt={f.projectName} className="w-full h-28 object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                                  : <div className={`w-full h-28 bg-gradient-to-br ${getNpoColor(f.npoName || f.projectName)} flex items-center justify-center`}><Target className="w-8 h-8 text-white/80" /></div>}
                                <div className="p-4">
                                  <p className="text-xs text-orange-600 font-medium truncate">{f.npoName}</p>
                                  <div className="flex items-center justify-between gap-2"><h4 className="font-medium text-sm truncate">{f.projectName}</h4><Badge variant="outline" className="shrink-0 text-xs">{f.projectStatus}</Badge></div>
                                  <div className="w-full bg-neutral-100 rounded-full h-2 mt-2 overflow-hidden"><div className="bg-orange-500 h-2 rounded-full" style={{ width: `${pct}%` }} /></div>
                                  <p className="text-xs text-neutral-500 mt-1">{formatZar(f.raisedAmount)} of {formatZar(f.targetAmount)}</p>
                                  <div className="flex gap-2 mt-3"><Button size="sm" variant="outline" className="flex-1" onClick={() => handleViewDocs(f.npoId, f.npoName)}><FileText className="w-3.5 h-3.5 mr-1" /> Docs</Button><Button asChild size="sm" className="flex-1 bg-orange-600 hover:bg-orange-700"><Link to={`/npo/${f.npoId}`}>Profile</Link></Button></div>
                                </div>
                              </Card>
                            </CarouselItem>
                          );
                        })}
                    </CarouselContent>
                  </Carousel>
                )}
              </div>

              {/* Suggested for you */}
              {(() => {
                type Suggestion = { key: string; title: string; desc: string; cta: string; action: () => void; icon: typeof Target; tint: string; iconColor: string };
                const items: Suggestion[] = [];
                if (verifications.length === 0 || !verifications.some(v => v.status === "Approved")) items.push({ key: "verify", title: "Get verified", desc: "Verify your business to build trust with NPOs.", cta: "Verify", action: () => setActiveTab("verification"), icon: Shield, tint: "bg-amber-50 border-amber-100", iconColor: "bg-amber-100 text-amber-600" });
                if (campaigns.length === 0) items.push({ key: "campaign", title: "Launch a campaign", desc: "Invite NPOs to partner on a CSR campaign.", cta: "Create", action: () => setActiveTab("campaigns"), icon: Megaphone, tint: "bg-orange-50 border-orange-100", iconColor: "bg-orange-100 text-orange-600" });
                if ((impact?.totalDonated || 0) === 0) items.push({ key: "donate", title: "Make your first donation", desc: "Support an NPO fundraiser directly.", cta: "Discover", action: () => setActiveTab("discover"), icon: DollarSign, tint: "bg-green-50 border-green-100", iconColor: "bg-green-100 text-green-600" });
                if (walletBalance === 0) items.push({ key: "topup", title: "Top up your wallet", desc: "Add funds so you can donate and fund campaigns.", cta: "Top up", action: () => setActiveTab("wallet"), icon: Wallet, tint: "bg-blue-50 border-blue-100", iconColor: "bg-blue-100 text-blue-600" });
                if (items.length === 0) return null;
                return (
                  <div>
                    <h3 className="font-semibold mb-3">Suggested for you</h3>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {items.map(it => (
                        <button key={it.key} onClick={it.action} className={`text-left rounded-xl border ${it.tint} p-4 transition-all hover:shadow-md hover:-translate-y-0.5`}>
                          <div className={`w-10 h-10 rounded-full ${it.iconColor} flex items-center justify-center mb-3`}><it.icon className="w-5 h-5" /></div>
                          <p className="font-semibold text-neutral-800">{it.title}</p>
                          <p className="text-sm text-neutral-600 mt-0.5 mb-3">{it.desc}</p>
                          <span className="inline-flex items-center gap-1 text-sm font-medium text-orange-600">{it.cta} →</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}
            </div>)}

            {/* PROFILE SETTINGS */}
            {activeTab === "editprofile" && (<div className="max-w-4xl mx-auto">
              <div className="mb-6"><h1 className="text-2xl font-bold mb-1">Profile Settings</h1><p className="text-neutral-600">Manage how your business appears and your account security.</p></div>

              {/* Identity header: logo + name + verification */}
              <Card className="p-5 mb-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 flex items-center justify-center bg-orange-100 text-orange-700 text-lg font-bold">
                    {editProfileImage
                      ? <img src={resolveMediaUrl(editProfileImage)} alt="" className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                      : (profile?.contactPersonName || profile?.businessEmail || "B").charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-lg font-semibold text-neutral-900 truncate">{profile?.contactPersonName || "Business"}</p>
                      {verifications.some(v => v.status === "Approved") && <Badge className="bg-green-100 text-green-700 gap-1 shrink-0"><CheckCircle className="w-3.5 h-3.5" /> Verified</Badge>}
                    </div>
                    <p className="text-sm text-neutral-500 truncate">{profile?.businessEmail || email}</p>
                  </div>
                </div>
              </Card>

              <form onSubmit={handleSaveProfile}>
                {/* Section: Branding */}
                <Card className="mb-4 overflow-hidden">
                  <button type="button" onClick={() => toggleSetting("branding")} className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-neutral-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0"><Settings className="w-4 h-4" /></div>
                      <div><h3 className="font-semibold leading-tight">Branding</h3><p className="text-xs text-neutral-500">Your banner and logo.</p></div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-neutral-400 shrink-0 transition-transform ${openSetting === "branding" ? "rotate-180" : ""}`} />
                  </button>
                  {openSetting === "branding" && (
                    <div className="px-5 pb-5 border-t border-neutral-100 pt-5 space-y-5">
                      <ImageCropField label="Banner / Cover Image" value={editBackgroundImage} onChange={setEditBackgroundImage} aspect={16 / 5} rounded="lg" disabled={savingProfile} />
                      <ImageCropField label="Profile Picture / Logo" value={editProfileImage} onChange={setEditProfileImage} aspect={1} rounded="full" disabled={savingProfile} />
                    </div>
                  )}
                </Card>

                {/* Section: Business Details */}
                <Card className="mb-4 overflow-hidden">
                  <button type="button" onClick={() => toggleSetting("details")} className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-neutral-50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><Building2 className="w-4 h-4" /></div>
                      <div><h3 className="font-semibold leading-tight">Business Details</h3><p className="text-xs text-neutral-500">Bio, industry, CSR goal and contact person.</p></div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-neutral-400 shrink-0 transition-transform ${openSetting === "details" ? "rotate-180" : ""}`} />
                  </button>
                  {openSetting === "details" && (
                    <div className="px-5 pb-5 border-t border-neutral-100 pt-5 space-y-5">
                      <div><Label>Email Address</Label><Input type="email" value={profile?.email || ""} className="mt-1 bg-neutral-100" readOnly /><p className="text-xs text-neutral-500 mt-1">Email cannot be changed.</p></div>
                      <div><Label>Bio</Label><Textarea value={editBio} onChange={e => setEditBio(e.target.value)} rows={4} placeholder="Tell NPOs about your business..." className="mt-1" maxLength={1000} disabled={savingProfile} /></div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>Industry</Label><Input value={editIndustry} onChange={e => setEditIndustry(e.target.value)} className="mt-1" disabled={savingProfile} /></div>
                        <div><Label>CSR Goal</Label><Input value={editCsrGoal} onChange={e => setEditCsrGoal(e.target.value)} className="mt-1" disabled={savingProfile} /></div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div><Label>Contact Person</Label><Input value={editContactName} onChange={e => setEditContactName(e.target.value)} className="mt-1" disabled={savingProfile} /></div>
                        <div><Label>Contact Title</Label><Input value={editContactTitle} onChange={e => setEditContactTitle(e.target.value)} className="mt-1" disabled={savingProfile} /></div>
                      </div>
                    </div>
                  )}
                </Card>

                <div className="flex justify-end mb-6">
                  <Button type="submit" className="bg-orange-600 hover:bg-orange-700" disabled={savingProfile}>{savingProfile && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save Changes</Button>
                </div>
              </form>

              {/* Section: Security */}
              <Card className="mb-4 overflow-hidden">
                <button type="button" onClick={() => toggleSetting("security")} className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-neutral-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-neutral-200 text-neutral-700 flex items-center justify-center shrink-0"><Shield className="w-4 h-4" /></div>
                    <div><h3 className="font-semibold leading-tight">Security</h3><p className="text-xs text-neutral-500">Change your password.</p></div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-neutral-400 shrink-0 transition-transform ${openSetting === "security" ? "rotate-180" : ""}`} />
                </button>
                {openSetting === "security" && (
                  <form className="space-y-4 px-5 pb-5 border-t border-neutral-100 pt-5" onSubmit={handleChangePassword}>
                    <div><Label>Current Password</Label><Input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className="mt-1" required /></div>
                    <div><Label>New Password</Label><Input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="mt-1" required /><p className="text-xs text-neutral-500 mt-1">Must be at least 8 characters.</p></div>
                    <div><Label>Confirm New Password</Label><Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="mt-1" required /></div>
                    {passwordError && <p className="text-sm text-red-600">{passwordError}</p>}
                    <div className="flex justify-end"><Button type="submit" variant="outline" disabled={passwordChanging}>{passwordChanging && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Change Password</Button></div>
                  </form>
                )}
              </Card>

              {/* Section: Danger zone */}
              <Card className="mb-4 overflow-hidden border-red-200">
                <button type="button" onClick={() => toggleSetting("danger")} className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-red-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0"><AlertCircle className="w-4 h-4" /></div>
                    <div><h3 className="font-semibold leading-tight text-red-900">Deactivate Account</h3><p className="text-xs text-red-700/80">Disable login. Your data is preserved.</p></div>
                  </div>
                  <ChevronDown className={`w-5 h-5 text-red-400 shrink-0 transition-transform ${openSetting === "danger" ? "rotate-180" : ""}`} />
                </button>
                {openSetting === "danger" && (
                  <div className="px-5 pb-5 border-t border-red-200 pt-5 bg-red-50">
                    <p className="text-red-800 text-sm mb-4">Deactivating prevents you from logging in. Your data is preserved; contact support to reactivate.</p>
                    <form className="space-y-4" onSubmit={handleDeactivateAccount}>
                      <div><Label className="text-red-900">Confirm your password</Label><Input type="password" value={deactivatePassword} onChange={e => setDeactivatePassword(e.target.value)} placeholder="Enter your password" className="mt-1" required /></div>
                      <Button type="submit" variant="outline" className="text-red-600 border-red-600 hover:bg-red-100" disabled={deactivating}>{deactivating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Deactivate My Account</Button>
                    </form>
                  </div>
                )}
              </Card>
            </div>)}

            {/* VERIFICATION */}
            {activeTab === "verification" && (<div>
              <div className="flex items-center justify-between mb-8"><div><h1 className="text-2xl font-bold mb-2">Verification</h1><p className="text-neutral-600">Verify your business with your CIPC registration and tax clearance.</p></div><Button className="bg-orange-600 hover:bg-orange-700" onClick={() => setShowVerificationForm(true)}><Upload className="w-4 h-4 mr-2" /> Submit</Button></div>
              {verificationLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div> : verifications.length === 0 ? <Card className="p-12 text-center"><Shield className="w-12 h-12 text-neutral-400 mx-auto mb-3" /><p className="text-neutral-600 mb-4">Not verified yet. Submit your documents to get the verified badge and build trust with NPOs.</p><Button onClick={() => setShowVerificationForm(true)}>Start</Button></Card> : <div className="space-y-4">{verifications.map(v => (<Card key={v.verificationId} className="p-6"><div className="flex justify-between"><div><div className="flex items-center gap-3 mb-1"><h3 className="font-semibold">Request #{v.verificationId}</h3><Badge className={v.status === "Approved" ? "bg-green-100 text-green-700" : v.status === "Rejected" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}>{v.status}</Badge></div><p className="text-sm text-neutral-600">Submitted: {new Date(v.submittedDate).toLocaleDateString()}</p></div>{v.status === "Approved" ? <CheckCircle className="w-8 h-8 text-green-600" /> : v.status === "Pending" ? <Clock className="w-8 h-8 text-amber-600" /> : <AlertCircle className="w-8 h-8 text-red-600" />}</div></Card>))}</div>}
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
              {nposLoading ? <CardGridSkeleton /> : filteredNpos.length === 0 ? <Card className="p-12 text-center"><p className="text-neutral-600">No NPOs found.</p></Card> : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">{filteredNpos.map(npo => (
                  <Card key={npo.npoId} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/npo/${npo.npoId}`)}>
                    <div className={`h-40 bg-gradient-to-br ${getNpoColor(npo.organizationName)} flex items-center justify-center overflow-hidden`}>
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
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">{followedNpos.map(npo => (
                  <Card key={npo.npoId} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate(`/npo/${npo.npoId}`)}>
                    <div className={`h-40 bg-gradient-to-br ${getNpoColor(npo.organizationName)} flex items-center justify-center overflow-hidden`}>
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
                        <Button variant="default" className="flex-1 bg-orange-600 hover:bg-orange-700" onClick={(e) => { e.stopPropagation(); handleFollow(npo.npoId); }}><Heart className="w-4 h-4 mr-1 fill-current" /> Following</Button>
                        <Button className="flex-1 bg-orange-600 hover:bg-orange-700" onClick={(e) => { e.stopPropagation(); setDonateNpoId(npo.npoId); setDonateAmount(""); setShowDonateModal(true); }}>Donate</Button>
                      </div>
                      <p className="text-center text-sm text-orange-600 mt-3">View full profile →</p>
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
                      <div className="flex-1"><h3 className="font-semibold text-lg">{c.title}</h3>{c.category && <Badge variant="outline" className="mt-1">{c.category}</Badge>}{c.description && <p className="text-neutral-600 text-sm mt-2">{c.description}</p>}<div className="flex gap-4 mt-3 text-sm text-neutral-500">{c.budgetPerPartner && <span>{formatZar(c.budgetPerPartner)}/partner</span>}<span><Calendar className="w-4 h-4 inline mr-1" />{c.startDate}</span>{c.applicantCount !== undefined && <span>{c.applicantCount} applicant{c.applicantCount !== 1 ? "s" : ""}</span>}</div></div>
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
                    <Card key={app.applicationId} className="p-4"><div className="flex items-center justify-between gap-4"><div className="min-w-0"><div className="flex items-center gap-2"><button onClick={() => navigate(`/npo/${app.npoId}`)} className="font-medium text-orange-600 hover:underline truncate" title="View NPO profile">{app.organizationName || `NPO #${app.npoId}`}</button>{app.isVerified && <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />}{app.focusArea && <Badge variant="outline" className="shrink-0">{app.focusArea}</Badge>}</div>{app.motivation && <p className="text-sm text-neutral-600 mt-1">{app.motivation}</p>}<p className="text-xs text-neutral-500 mt-1">Applied {new Date(app.applicationDate).toLocaleDateString()}</p><Button variant="link" size="sm" className="h-auto p-0 mt-1 text-orange-600" onClick={() => navigate(`/npo/${app.npoId}`)}><Eye className="w-3.5 h-3.5 mr-1" /> View profile</Button></div><div className="flex items-center gap-2 shrink-0">{app.status === "Pending" ? (<><Button size="sm" className="bg-green-600 hover:bg-green-700" onClick={() => handleApproveApp(app.applicationId)}><CheckCircle className="w-4 h-4" /></Button><Button size="sm" variant="outline" className="text-red-600" onClick={() => handleRejectApp(app.applicationId)}><Ban className="w-4 h-4" /></Button></>) : <Badge className={app.status === "Accepted" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>{app.status}</Badge>}</div></div></Card>
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
              <div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-bold mb-2">Wallet</h1><p className="text-neutral-600">Top up to donate and fund partnership campaigns</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={loadWallet}><RefreshCw className="w-4 h-4" /></Button><Button className="bg-orange-600 hover:bg-orange-700" onClick={() => { setTopUpError(null); setTopUpStep(1); setShowTopUp(true); }}><ArrowUpFromLine className="w-4 h-4 mr-2" /> Top Up</Button></div></div>
              {walletLoading ? <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin" /></div> : (<>
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <Card className="p-8 bg-gradient-to-br from-orange-500 to-orange-600 text-white"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center"><Wallet className="w-6 h-6" /></div><div><p className="text-white/80 text-sm">Balance</p><h2 className="text-2xl font-bold">{formatZar(walletBalance)}</h2></div></div></Card>
                  <Card className="p-6"><p className="text-neutral-600 text-sm mb-1">Total Topped Up</p><p className="text-3xl font-bold text-blue-600">{formatZar(transactions.filter(t => t.type === "TopUp" && t.status === "Completed").reduce((s, t) => s + t.amount, 0))}</p></Card>
                  <Card className="p-6"><p className="text-neutral-600 text-sm mb-1">Total Given</p><p className="text-3xl font-bold text-green-600">{formatZar(transactions.filter(t => t.direction === "out" && t.status === "Completed").reduce((s, t) => s + t.amount, 0))}</p></Card>
                </div>
                <Card className="p-6"><h3 className="font-semibold mb-4">Transaction History</h3>{transactions.length === 0 ? <p className="text-neutral-600 text-sm">No transactions yet. Top up your wallet to get started.</p> : <div className="space-y-3">{transactions.map(tx => (<div key={tx.transactionId} className="flex items-center justify-between p-4 border rounded-lg"><div className="flex items-center gap-4"><div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === "TopUp" ? "bg-blue-100" : "bg-green-100"}`}>{tx.type === "TopUp" ? <ArrowUpFromLine className="w-5 h-5 text-blue-600" /> : <Heart className="w-5 h-5 text-green-600" />}</div><div><p className="text-sm font-medium">{tx.type === "TopUp" ? "Wallet top-up" : tx.type === "CampaignContribution" ? "Campaign funding" : "Donation"}</p><p className="text-xs text-neutral-500">{tx.counterpartyName} · {new Date(tx.timestamp).toLocaleDateString()}</p></div></div><div className="text-right"><p className={`font-semibold ${tx.direction === "in" ? "text-blue-600" : "text-green-600"}`}>{tx.direction === "in" ? "+" : "-"}{formatZar(tx.amount)}</p><Badge className={tx.status === "Completed" ? "bg-green-100 text-green-700" : tx.status === "Failed" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}>{tx.status}</Badge></div></div>))}</div>}</Card>
              </>)}
            </div>)}

            {/* COMMUNITY */}
            {activeTab === "community" && (<div>
              <div className="flex items-center justify-between mb-6"><h1 className="text-2xl font-bold">Community Feed</h1><Button variant="outline" size="sm" onClick={loadCommunity}><RefreshCw className="w-4 h-4 mr-2" /> Refresh</Button></div>
              {communityLoading ? <CardGridSkeleton /> : communityPosts.length === 0 ? <Card className="p-12 text-center"><p className="text-neutral-600">No posts yet.</p></Card> : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">{communityPosts.map(post => (
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
          <ImageCropField label="Campaign Image (optional)" value={campaignImageUrl} onChange={setCampaignImageUrl} aspect={16 / 9} rounded="lg" />
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
          <ImageCropField label="Campaign Image (optional)" value={editCampaignImageUrl} onChange={setEditCampaignImageUrl} aspect={16 / 9} rounded="lg" />
          <div className="flex gap-3"><Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">Save Changes</Button><Button type="button" variant="outline" onClick={() => setEditingCampaign(null)}>Cancel</Button></div>
        </form>
      </Card></div>)}

      {/* DONATE MODAL */}
      {showDonateModal && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><Card className="w-full max-w-sm p-6">
        <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold">Donate to NPO</h2><Button variant="ghost" size="sm" onClick={() => setShowDonateModal(false)}><X className="w-4 h-4" /></Button></div>
        <p className="text-sm text-neutral-600 mb-4">Balance: {formatZar(walletBalance)}</p>
        <form onSubmit={handleDonate} className="space-y-4">
          <div><Label>Amount (R)</Label><Input type="number" step="0.01" min="1" value={donateAmount} onChange={e => setDonateAmount(e.target.value)} required /></div>
          <Button type="submit" className="w-full bg-orange-600 hover:bg-orange-700" disabled={donating}>{donating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Donate"}</Button>
        </form>
      </Card></div>)}

      {/* TOP UP MODAL */}
      {showTopUp && (() => {
        const amtNum = parseFloat(topUpAmount);
        const amountValid = !!topUpAmount && !isNaN(amtNum) && amtNum > 0;
        const cardDigits = topUpCard.cardNumber.replace(/\D/g, "");
        return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={() => !toppingUp && setShowTopUp(false)}>
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.18 }}
            className="w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
          <Card className="overflow-hidden max-h-[90vh] overflow-y-auto main-scroll p-0">
            <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6">
              <button onClick={() => setShowTopUp(false)} disabled={toppingUp} className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0"><Wallet className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-lg font-bold leading-tight">Top Up Wallet</h2>
                  <p className="text-white/80 text-sm">Balance: {formatZar(walletBalance)}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-sm font-medium"><span className={`w-6 h-6 rounded-full grid place-items-center text-xs ${topUpStep >= 1 ? "bg-white text-orange-600" : "bg-white/30"}`}>1</span> Amount</div>
                <div className={`flex-1 h-0.5 rounded ${topUpStep === 2 ? "bg-white" : "bg-white/30"}`} />
                <div className="flex items-center gap-2 text-sm font-medium"><span className={`w-6 h-6 rounded-full grid place-items-center text-xs ${topUpStep >= 2 ? "bg-white text-orange-600" : "bg-white/30"}`}>2</span> Payment</div>
              </div>
            </div>

            <div className="p-6">
              {topUpStep === 1 && (
                <motion.div initial={reduceMotion ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reduceMotion ? 0 : 0.18 }} className="space-y-5">
                  <div>
                    <Label htmlFor="biz-topup">How much would you like to add?</Label>
                    <div className="relative mt-2">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-semibold">R</span>
                      <Input id="biz-topup" type="number" placeholder="0.00" className="pl-8 h-12 text-xl font-semibold" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} min="1" step="any" autoFocus />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {["100", "250", "500", "1000"].map((amt) => (
                      <button key={amt} type="button" onClick={() => setTopUpAmount(amt)} className={`py-2.5 rounded-xl border text-sm font-semibold transition-colors ${topUpAmount === amt ? "bg-orange-600 border-orange-600 text-white" : "bg-white border-neutral-200 text-neutral-700 hover:border-orange-300 hover:bg-orange-50"}`}>R {amt}</button>
                    ))}
                  </div>
                  <Button type="button" className="w-full bg-orange-600 hover:bg-orange-700" disabled={!amountValid} onClick={() => { setTopUpError(null); setTopUpStep(2); }}>
                    Continue <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </motion.div>
              )}

              {topUpStep === 2 && (
                <motion.div initial={reduceMotion ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reduceMotion ? 0 : 0.18 }}>
                  <div className="rounded-2xl p-5 mb-5 bg-gradient-to-br from-neutral-800 to-neutral-900 text-white shadow-md">
                    <div className="flex items-center justify-between mb-6">
                      <CreditCard className="w-7 h-7 text-white/70" />
                      <span className="text-xs text-white/60">Simulated</span>
                    </div>
                    <p className="font-mono tracking-widest text-lg">{(cardDigits.padEnd(16, "•").match(/.{1,4}/g) || []).join(" ").slice(0, 19)}</p>
                    <div className="flex items-center justify-between mt-4 text-xs text-white/70">
                      <span>{topUpCard.cardExpiry || "MM/YY"}</span>
                      <span>CVV {topUpCard.cardCvv ? "•".repeat(topUpCard.cardCvv.length) : "•••"}</span>
                    </div>
                  </div>

                  <form className="space-y-4" onSubmit={handleTopUp}>
                    <p className="text-xs text-neutral-500 -mt-1">Simulated card — enter any numbers (no real charge).</p>
                    <div>
                      <Label htmlFor="biz-card-number">Card Number</Label>
                      <Input id="biz-card-number" inputMode="numeric" autoComplete="off" placeholder="4111 1111 1111 1111" className="mt-1" disabled={toppingUp}
                        value={topUpCard.cardNumber}
                        onChange={(e) => { const d = e.target.value.replace(/\D/g, "").slice(0, 19); setTopUpCard({ ...topUpCard, cardNumber: d.replace(/(.{4})/g, "$1 ").trim() }); }} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="biz-card-expiry">Expiry (MM/YY)</Label>
                        <Input id="biz-card-expiry" inputMode="numeric" autoComplete="off" placeholder="12/28" className="mt-1" disabled={toppingUp}
                          value={topUpCard.cardExpiry}
                          onChange={(e) => { const d = e.target.value.replace(/\D/g, "").slice(0, 4); setTopUpCard({ ...topUpCard, cardExpiry: d.length <= 2 ? d : `${d.slice(0,2)}/${d.slice(2)}` }); }} />
                      </div>
                      <div>
                        <Label htmlFor="biz-card-cvv">CVV</Label>
                        <Input id="biz-card-cvv" inputMode="numeric" autoComplete="off" placeholder="123" maxLength={4} className="mt-1" disabled={toppingUp}
                          value={topUpCard.cardCvv}
                          onChange={(e) => setTopUpCard({ ...topUpCard, cardCvv: e.target.value.replace(/\D/g, "").slice(0, 4) })} />
                      </div>
                    </div>
                    {topUpError && <p className="text-sm text-red-600">{topUpError}</p>}
                    <div className="flex gap-3 pt-1">
                      <Button type="button" variant="outline" onClick={() => setTopUpStep(1)} disabled={toppingUp}><ArrowLeft className="w-4 h-4 mr-1" /> Back</Button>
                      <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700" disabled={toppingUp}>
                        {toppingUp && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Pay {amountValid ? formatZar(amtNum) : ""}
                      </Button>
                    </div>
                  </form>
                </motion.div>
              )}
            </div>
          </Card>
          </motion.div>
        </div>
        );
      })()}

      {/* VERIFICATION SUBMIT MODAL */}
      {showVerificationForm && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"><Card className="w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4"><h2 className="text-lg font-bold">Submit Verification</h2><Button variant="ghost" size="sm" onClick={() => setShowVerificationForm(false)}><X className="w-4 h-4" /></Button></div>
        <p className="text-sm text-neutral-600 mb-4">Upload your CIPC company registration document and/or tax clearance certificate (PDF). An admin will review and verify your business.</p>
        <form className="space-y-4" onSubmit={handleSubmitVerification}>
          <DocumentUploadField label="CIPC Registration Document (PDF)" value={cipcUrl} onChange={setCipcUrl} />
          <DocumentUploadField label="Tax Clearance Certificate (PDF)" value={taxClearanceUrl} onChange={setTaxClearanceUrl} />
          <div className="flex gap-3"><Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">Submit for Review</Button><Button type="button" variant="outline" onClick={() => setShowVerificationForm(false)}>Cancel</Button></div>
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
