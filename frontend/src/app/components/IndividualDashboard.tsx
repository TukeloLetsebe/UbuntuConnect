import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import NotificationBell from "./NotificationBell";
import BrandMark from "./BrandMark";
import ProfileMenu from "./ProfileMenu";
import HeaderSearch from "./HeaderSearch";
import DashboardSidebar from "./DashboardSidebar";
import EmailVerificationBanner from "./EmailVerificationBanner";
import IdentityVerificationBanner from "./IdentityVerificationBanner";
import CardPaymentFields, { type CardDetails, emptyCard } from "./CardPaymentFields";
import PostDetailModal from "./PostDetailModal";
import ReportPostButton from "./ReportPostButton";
import LocationPicker, { composeLocation } from "./registration/LocationPicker";
import { useConfirm } from "./ConfirmDialog";
import { getNpoColor } from "../../lib/npoColor";
import { parseLocation, parseProvince, SA_PROVINCES, PROVINCE_OTHER, VOLUNTEER_SKILLS, INDIVIDUAL_CAUSES } from "../../lib/registrationOptions";
import { isValidPhone, validationMessages } from "../../lib/validators";
import { resolveMediaUrl } from "../../lib/api";
import { formatZar } from "../../lib/money";
import { individualService, getErrorMessage, type IndividualProfile, type NPOSummary, type NPODetail, type VolunteerOpportunity, type MyVolunteeringItem, type MyDonationsResponse, type MyImpact, type CommunityPost, type FollowedNPO, type MyTransactionsResponse, type Fundraiser } from "../../services/individualService";
import { kycService, type KycStatus } from "../../services/kycService";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { Carousel, CarouselContent, CarouselItem, CarouselPrevious, CarouselNext, type CarouselApi } from "./ui/carousel";
import { useCarouselAutoplay } from "./useCarouselAutoplay";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import {
  Heart,
  Search,
  MapPin,
  TrendingUp,
  LogOut,
  Settings,
  Bell,
  Banknote,
  HandCoins,
  Users,
  CheckCircle,
  X,
  Calendar,
  Briefcase,
  Clock,
  UserCheck,
  MessageSquare,
  Loader2,
  AlertCircle,
  RefreshCw,
  Wallet,
  Send,
  Trash2,
  Menu,
  ShieldCheck,
  BadgeCheck,
  LayoutDashboard,
  Target,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CreditCard,
  ArrowRight,
  ArrowLeft
} from "lucide-react";

// Common volunteer skills offered as quick checkboxes. Keeps applications
// consistent and fast to fill while still allowing a free-text "Other".
// Canonical skill list lives in registrationOptions so the NPO opportunity
// form and the individual application form stay in sync.
const SKILL_OPTIONS = VOLUNTEER_SKILLS;

const AVAILABILITY_DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const AVAILABILITY_TIMES = ["Morning", "Afternoon", "Evening"];

// Pre-tick skill checkboxes whose keyword appears in the opportunity's
// required-skills text (case-insensitive, best-effort match).
function matchSeedSkills(required: string): string[] {
  const text = required.toLowerCase();
  return SKILL_OPTIONS.filter((s) => {
    const key = s.split(/[\s/]+/)[0].toLowerCase(); // first word, e.g. "teaching"
    return key.length > 2 && text.includes(key);
  });
}

export default function IndividualDashboard() {
  const { logout, email, userId, isEmailVerified } = useAuth();
  const confirm = useConfirm();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState("overview");
  // Tracks a pending deep-linked apply (from /individual-dashboard?opp=ID)
  const [pendingApplyOppId, setPendingApplyOppId] = useState<number | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const selectTab = (id: string) => {
    setSidebarOpen(false);
    // "Fundraisers" is a separate route, not a tab.
    if (id === "fundraisers") { navigate("/fundraisers"); return; }
    setActiveTab(id);
  };

  const [followedNpoIds, setFollowedNpoIds] = useState<Set<number>>(new Set());
  // Followed NPOs state (loaded from API on mount)
  const [followedNpos, setFollowedNpos] = useState<FollowedNPO[]>([]);
  const [followsLoading, setFollowsLoading] = useState(false);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showVolunteerModal, setShowVolunteerModal] = useState(false);
  const [selectedNPO, setSelectedNPO] = useState<number | null>(null);
  const [selectedOpportunity, setSelectedOpportunity] = useState<number | null>(null);
  const [appliedOpportunities, setAppliedOpportunities] = useState<number[]>([]);
  const [postSearchQuery, setPostSearchQuery] = useState("");

  // Liked posts state
  const [likedPostIds, setLikedPostIds] = useState<Set<number>>(new Set());

  // Wallet state
  const [topUpStep, setTopUpStep] = useState<1 | 2>(1);
  const [walletBalance, setWalletBalance] = useState<number>(0);
  const [walletLoading, setWalletLoading] = useState(false);
  const [txData, setTxData] = useState<MyTransactionsResponse | null>(null);
  const [txLoading, setTxLoading] = useState(false);

  // Donate state
  const [donateAmount, setDonateAmount] = useState<string>("");
  const [donating, setDonating] = useState(false);
  const [donateError, setDonateError] = useState<string | null>(null);

  // Top-up state
  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<string>("");
  const [toppingUp, setToppingUp] = useState(false);
  const [topUpError, setTopUpError] = useState<string | null>(null);
  const [topUpCard, setTopUpCard] = useState<CardDetails>(emptyCard);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedVerification, setSelectedVerification] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");

  // Discover NPOs state
  const [npos, setNpos] = useState<NPOSummary[]>([]);
  const [nposLoading, setNposLoading] = useState(false);
  const [nposError, setNposError] = useState<string | null>(null);
  const [nposLoaded, setNposLoaded] = useState(false);

  // NPO Detail modal state
  const [selectedNpoDetail, setSelectedNpoDetail] = useState<NPODetail | null>(null);
  const [npoDetailLoading, setNpoDetailLoading] = useState(false);
  const [npoDetailOpen, setNpoDetailOpen] = useState(false);

  // Profile Management state
  const [profile, setProfile] = useState<IndividualProfile | null>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileUpdating, setProfileUpdating] = useState(false);
  const [profileFirstName, setProfileFirstName] = useState("");
  const [profileLastName, setProfileLastName] = useState("");
  const [profileCauseOfCare, setProfileCauseOfCare] = useState("");
  const [profileContact, setProfileContact] = useState("");
  const [profileLocation, setProfileLocation] = useState("");
  // Structured location (province + city) backing the picker; composed back
  // into "City, Province" for profileLocation on submit.
  const [profileProvince, setProfileProvince] = useState("");
  const [profileCity, setProfileCity] = useState("");

  // Change Password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Deactivate Account state
  const [deactivatePassword, setDeactivatePassword] = useState("");
  const [deactivating, setDeactivating] = useState(false);

  // Identity verification (KYC) status — shown in Profile Settings
  const [kycStatus, setKycStatus] = useState<KycStatus | null>(null);
  const [kycLoading, setKycLoading] = useState(false);

  // Volunteer Opportunities state
  const [oppSearch, setOppSearch] = useState("");
  const [oppCategory, setOppCategory] = useState("All");
  const [detailOpp, setDetailOpp] = useState<VolunteerOpportunity | null>(null);
  const [opportunities, setOpportunities] = useState<VolunteerOpportunity[]>([]);
  const [oppsLoading, setOppsLoading] = useState(false);
  const [oppsError, setOppsError] = useState<string | null>(null);
  const [oppsLoaded, setOppsLoaded] = useState(false);

  // Volunteer application form state
  const [volFirstName, setVolFirstName] = useState("");
  const [volLastName, setVolLastName] = useState("");
  const [volEmail, setVolEmail] = useState("");
  const [volPhone, setVolPhone] = useState("");
  const [volSkills, setVolSkills] = useState("");
  // Structured skills (checkbox multi-select) + "other" free text
  const [volSkillSet, setVolSkillSet] = useState<string[]>([]);
  const [volSkillsOther, setVolSkillsOther] = useState("");
  // Structured availability: selected days + time-of-day blocks
  const [volAvailDays, setVolAvailDays] = useState<string[]>([]);
  const [volAvailTimes, setVolAvailTimes] = useState<string[]>([]);
  const [volAvailability, setVolAvailability] = useState("");
  const [volMotivation, setVolMotivation] = useState("");
  const [applying, setApplying] = useState(false);

  // My Volunteering state
  const [detailApp, setDetailApp] = useState<MyVolunteeringItem | null>(null);
  const [myVolunteering, setMyVolunteering] = useState<MyVolunteeringItem[]>([]);
  const [myVolLoading, setMyVolLoading] = useState(false);
  const [myVolError, setMyVolError] = useState<string | null>(null);
  const [myVolLoaded, setMyVolLoaded] = useState(false);
  const [cancelling, setCancelling] = useState<number | null>(null);

  // My Donations state
  const [myDonations, setMyDonations] = useState<MyDonationsResponse | null>(null);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const [donationsError, setDonationsError] = useState<string | null>(null);
  const [donationsLoaded, setDonationsLoaded] = useState(false);

  // Overview: platform fundraisers strip (auto-sliding carousel)
  const [overviewFundraisers, setOverviewFundraisers] = useState<Fundraiser[]>([]);
  const [overviewFundraisersLoading, setOverviewFundraisersLoading] = useState(false);
  const [overviewCarouselApi, setOverviewCarouselApi] = useState<CarouselApi | undefined>();
  useCarouselAutoplay(overviewCarouselApi, { delay: 4000 });
  const reduceMotion = useReducedMotion();

  // Profile Settings: which section is expanded (accordion). Profile open by default.
  const [openSetting, setOpenSetting] = useState<string | null>("profile-section");
  const toggleSetting = (key: string) => setOpenSetting(prev => prev === key ? null : key);

  // My Impact state
  const [myImpact, setMyImpact] = useState<MyImpact | null>(null);
  const [impactLoading, setImpactLoading] = useState(false);
  const [impactError, setImpactError] = useState<string | null>(null);
  const [impactLoaded, setImpactLoaded] = useState(false);

  // Community Updates state
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState<string | null>(null);
  const [postsLoaded, setPostsLoaded] = useState(false);

  // Comments state
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);
  const [comments, setComments] = useState<import("../../services/individualService").CommentItem[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentSubmitting, setCommentSubmitting] = useState(false);

  // Load wallet balance function
  const loadWalletBalance = useCallback(async () => {
    if (!userId) return;
    setWalletLoading(true);
    try {
      const response = await individualService.getWalletBalance(userId);
      setWalletBalance(response.data.balance);
    } catch (err) {
      // Silently fail — wallet balance is secondary info
      console.error("Failed to load wallet balance:", err);
    } finally {
      setWalletLoading(false);
    }
  }, [userId]);

  // Fetch wallet balance on mount when userId is available
  useEffect(() => {
    if (userId) {
      loadWalletBalance();
    }
  }, [userId, loadWalletBalance]);

  // Load full transaction history (top-ups, donations, withdrawals) + totals.
  const loadTransactions = useCallback(async () => {
    setTxLoading(true);
    try {
      const r = await individualService.getTransactions();
      setTxData(r.data);
    } catch { /* non-critical */ } finally {
      setTxLoading(false);
    }
  }, []);

  // Refresh wallet balance + transactions when wallet tab is activated
  useEffect(() => {
    if (activeTab === "wallet") {
      loadWalletBalance();
      loadTransactions();
    }
  }, [activeTab, loadWalletBalance, loadTransactions]);

  // Load my followed NPOs
  const loadMyFollows = useCallback(async () => {
    setFollowsLoading(true);
    try {
      const response = await individualService.getMyFollows();
      setFollowedNpos(response.data);
      // Initialize the followedNpoIds set from the API response
      const ids = new Set(response.data.map((npo: FollowedNPO) => npo.npoId));
      setFollowedNpoIds(ids);
    } catch (err) {
      console.error("Failed to load follows:", err);
    } finally {
      setFollowsLoading(false);
    }
  }, []);

  // Fetch followed NPOs on mount
  useEffect(() => {
    loadMyFollows();
  }, [loadMyFollows]);

  // Load profile function
  const loadProfile = useCallback(async () => {
    setProfileLoading(true);
    setProfileError(null);
    try {
      const response = await individualService.getProfile();
      const data = response.data;
      setProfile(data);
      setProfileFirstName(data.firstName || "");
      setProfileLastName(data.lastName || "");
      setProfileCauseOfCare(data.causeOfCare || "");
      setProfileContact(data.contact || "");
      setProfileLocation(data.location || "");
      {
        const parsed = parseLocation(data.location);
        setProfileProvince(parsed.province);
        setProfileCity(parsed.city);
      }
    } catch (err) {
      setProfileError(getErrorMessage(err));
    } finally {
      setProfileLoading(false);
    }
  }, []);

  // Fetch profile on mount (needed for header name) and when profile tab is activated
  useEffect(() => {
    if (!profile) {
      loadProfile();
    }
  }, [profile, loadProfile]);

  // Load identity-verification (KYC) status for the Profile Settings card
  const loadKyc = useCallback(async () => {
    setKycLoading(true);
    try {
      const r = await kycService.getStatus();
      setKycStatus(r.data);
    } catch {
      // Non-blocking — the card still renders a "verify now" action
    } finally {
      setKycLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === "profile" || activeTab === "overview") loadKyc();
  }, [activeTab, loadKyc]);

  // Deep-link: /individual-dashboard?opp={id} jumps to the Volunteer tab and
  // opens the apply modal for that opportunity (QA2-003). We record the id and
  // clear the query param here; the modal opens once opportunities have loaded.
  useEffect(() => {
    const opp = searchParams.get("opp");
    if (!opp) return;
    const oppId = Number(opp);
    if (!Number.isNaN(oppId)) {
      setActiveTab("volunteer");
      setPendingApplyOppId(oppId);
    }
    searchParams.delete("opp");
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams]);

  // Load NPOs function
  const loadNPOs = useCallback(async () => {
    setNposLoading(true);
    setNposError(null);
    try {
      const response = await individualService.discoverNPOs();
      setNpos(response.data);
      setNposLoaded(true);
    } catch (err) {
      setNposError(getErrorMessage(err));
    } finally {
      setNposLoading(false);
    }
  }, []);

  // Fetch NPOs when Discover tab is activated
  useEffect(() => {
    if (activeTab === "discover" && !nposLoaded) {
      loadNPOs();
    }
  }, [activeTab, nposLoaded, loadNPOs]);

  // Load volunteer opportunities
  const loadOpportunities = useCallback(async () => {
    setOppsLoading(true);
    setOppsError(null);
    try {
      const response = await individualService.getOpportunities();
      setOpportunities(response.data);
      setOppsLoaded(true);
    } catch (err) {
      setOppsError(getErrorMessage(err));
    } finally {
      setOppsLoading(false);
    }
  }, []);

  // Fetch opportunities when Volunteer tab is activated
  useEffect(() => {
    if (activeTab === "volunteer" && !oppsLoaded) {
      loadOpportunities();
    }
  }, [activeTab, oppsLoaded, loadOpportunities]);

  // Once opportunities are loaded, open the apply modal for a deep-linked
  // opportunity (QA2-003). Runs only when there's a pending id and a match.
  useEffect(() => {
    if (pendingApplyOppId == null || opportunities.length === 0) return;
    const match = opportunities.find((o) => o.opportunityId === pendingApplyOppId);
    if (match) {
      handleApplyVolunteer(pendingApplyOppId);
    }
    setPendingApplyOppId(null);
    // handleApplyVolunteer is stable within a render; intentionally excluded from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingApplyOppId, opportunities]);

  // Load my volunteering data
  const loadMyVolunteering = useCallback(async () => {
    setMyVolLoading(true);
    setMyVolError(null);
    try {
      const response = await individualService.getMyVolunteering();
      setMyVolunteering(response.data);
      setMyVolLoaded(true);
    } catch (err) {
      setMyVolError(getErrorMessage(err));
    } finally {
      setMyVolLoading(false);
    }
  }, []);

  // Fetch my volunteering when tab is activated
  useEffect(() => {
    if (activeTab === "myvolunteering" && !myVolLoaded) {
      loadMyVolunteering();
    }
  }, [activeTab, myVolLoaded, loadMyVolunteering]);

  // Load my donations
  const loadMyDonations = useCallback(async () => {
    setDonationsLoading(true);
    setDonationsError(null);
    try {
      const response = await individualService.getMyDonations();
      setMyDonations(response.data);
      setDonationsLoaded(true);
    } catch (err) {
      setDonationsError(getErrorMessage(err));
    } finally {
      setDonationsLoading(false);
    }
  }, []);

  // Fetch donations on mount AND when tab is activated
  useEffect(() => {
    if (!donationsLoaded) {
      loadMyDonations();
    }
  }, [donationsLoaded, loadMyDonations]);

  // Load platform fundraisers for the overview strip
  const loadOverviewFundraisers = useCallback(async () => {
    setOverviewFundraisersLoading(true);
    try { const r = await individualService.getFundraisers(); setOverviewFundraisers(r.data); }
    catch { /* non-critical */ }
    finally { setOverviewFundraisersLoading(false); }
  }, []);

  useEffect(() => {
    if (activeTab === "overview") loadOverviewFundraisers();
  }, [activeTab, loadOverviewFundraisers]);

  // Load my impact
  const loadMyImpact = useCallback(async () => {
    setImpactLoading(true);
    setImpactError(null);
    try {
      const response = await individualService.getMyImpact();
      setMyImpact(response.data);
      setImpactLoaded(true);
    } catch (err) {
      setImpactError(getErrorMessage(err));
    } finally {
      setImpactLoading(false);
    }
  }, []);

  // Fetch impact on mount AND when tab is activated
  useEffect(() => {
    if (!impactLoaded) {
      loadMyImpact();
    }
  }, [impactLoaded, loadMyImpact]);

  // Load community updates
  const loadCommunityUpdates = useCallback(async () => {
    setPostsLoading(true);
    setPostsError(null);
    try {
      const response = await individualService.getCommunityUpdates();
      setCommunityPosts(response.data);
      setPostsLoaded(true);
    } catch (err) {
      setPostsError(getErrorMessage(err));
    } finally {
      setPostsLoading(false);
    }
  }, []);

  // Fetch community updates when tab is activated
  useEffect(() => {
    if (activeTab === "community" && !postsLoaded) {
      loadCommunityUpdates();
    }
  }, [activeTab, postsLoaded, loadCommunityUpdates]);

  // Load my liked posts
  const loadMyLikes = useCallback(async () => {
    try {
      const response = await individualService.getMyLikes();
      setLikedPostIds(new Set(response.data));
    } catch (err) {
      console.error("Failed to load likes:", err);
    }
  }, []);

  useEffect(() => {
    loadMyLikes();
  }, [loadMyLikes]);

  // Handle like/unlike post
  // Comment handlers
  const handleOpenComments = async (post: CommunityPost) => {
    setSelectedPost(post);
    setComments([]);
    setNewComment("");
    setCommentsLoading(true);
    try {
      const r = await individualService.getComments(post.postId);
      setComments(r.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCommentsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!selectedPost) return;
    const content = newComment.trim();
    if (!content) return;
    setCommentSubmitting(true);
    try {
      const r = await individualService.createComment(selectedPost.postId, content);
      setComments(prev => [r.data, ...prev]);
      setNewComment("");
      toast.success("Comment added!");
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCommentSubmitting(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    try {
      await individualService.deleteComment(commentId);
      setComments(prev => prev.filter(c => c.commentId !== commentId));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleLikePost = async (postId: number) => {
    const isLiked = likedPostIds.has(postId);

    if (isLiked) {
      // Optimistic unlike
      setLikedPostIds(prev => {
        const next = new Set(prev);
        next.delete(postId);
        return next;
      });
      setCommunityPosts(prev => prev.map(p =>
        p.postId === postId ? { ...p, likeCount: Math.max(0, p.likeCount - 1) } : p
      ));
      try {
        await individualService.unlikePost(postId);
      } catch (err) {
        // Revert
        setLikedPostIds(prev => new Set(prev).add(postId));
        setCommunityPosts(prev => prev.map(p =>
          p.postId === postId ? { ...p, likeCount: p.likeCount + 1 } : p
        ));
        toast.error(getErrorMessage(err));
      }
    } else {
      // Optimistic like
      setLikedPostIds(prev => new Set(prev).add(postId));
      setCommunityPosts(prev => prev.map(p =>
        p.postId === postId ? { ...p, likeCount: p.likeCount + 1 } : p
      ));
      try {
        await individualService.likePost(postId);
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        if (errorMsg.toLowerCase().includes("already liked")) {
          // Keep it liked
        } else {
          // Revert
          setLikedPostIds(prev => {
            const next = new Set(prev);
            next.delete(postId);
            return next;
          });
          setCommunityPosts(prev => prev.map(p =>
            p.postId === postId ? { ...p, likeCount: Math.max(0, p.likeCount - 1) } : p
          ));
          toast.error(errorMsg);
        }
      }
    }
  };

  // Load NPO detail
  const handleViewNpoDetail = async (npoId: number) => {
    setNpoDetailOpen(true);
    setNpoDetailLoading(true);
    setSelectedNpoDetail(null);
    try {
      const response = await individualService.getNPODetail(npoId);
      setSelectedNpoDetail(response.data);
    } catch (err) {
      toast.error(getErrorMessage(err));
      setNpoDetailOpen(false);
    } finally {
      setNpoDetailLoading(false);
    }
  };

  // Handle profile update
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    // Phone is optional, but if provided it must be a valid SA number.
    if (profileContact.trim() && !isValidPhone(profileContact)) {
      toast.error(validationMessages.phone);
      return;
    }
    setProfileUpdating(true);
    // Compose the structured picker back into "City, Province". Falls back to
    // the existing value if nothing was selected.
    const composedLocation = composeLocation(profileProvince, profileCity) ?? null;
    try {
      await individualService.updateProfile({
        firstName: profileFirstName,
        lastName: profileLastName,
        causeOfCare: profileCauseOfCare || null,
        userContact: profileContact || null,
        location: composedLocation,
      });
      setProfileLocation(composedLocation ?? "");
      toast.success("Profile updated successfully.");
      setProfile((prev) =>
        prev
          ? {
              ...prev,
              firstName: profileFirstName,
              lastName: profileLastName,
              causeOfCare: profileCauseOfCare || null,
              contact: profileContact || null,
              location: composedLocation,
            }
          : prev
      );
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setProfileUpdating(false);
    }
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword.length < 8) {
      setPasswordError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    setPasswordChanging(true);
    try {
      await individualService.changePassword(currentPassword, newPassword);
      toast.success("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setPasswordError(null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setPasswordChanging(false);
    }
  };

  // Handle account deactivation
  const handleDeactivateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeactivating(true);
    try {
      await individualService.deactivateAccount(deactivatePassword);
      toast.success("Account deactivated.");
      logout();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setDeactivating(false);
    }
  };



  // handleFollow with optimistic UI
  const handleFollow = async (npoId: number) => {
    const isCurrentlyFollowed = followedNpoIds.has(npoId);

    if (isCurrentlyFollowed) {
      // Optimistic unfollow
      setFollowedNpoIds((prev) => {
        const next = new Set(prev);
        next.delete(npoId);
        return next;
      });
      try {
        await individualService.unfollowNPO(npoId);
        toast.success("You have unfollowed this NPO.");
        setFollowedNpos(prev => prev.filter(n => n.npoId !== npoId));
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        if (errorMsg.toLowerCase().includes("not following")) {
          // Already unfollowed — keep it removed from set
          toast("You were not following this NPO.");
        } else {
          // Actual error — revert
          setFollowedNpoIds((prev) => new Set(prev).add(npoId));
          toast.error(errorMsg);
        }
      }
    } else {
      // Optimistic follow
      setFollowedNpoIds((prev) => new Set(prev).add(npoId));
      try {
        await individualService.followNPO(npoId);
        toast.success("You are now following this NPO.");
        // Reload follows to get the full NPO data
        loadMyFollows();
      } catch (err) {
        const errorMsg = getErrorMessage(err);
        if (errorMsg.toLowerCase().includes("already follow")) {
          // Already following from a previous session — keep it in the set
          toast("You're already following this NPO.");
        } else {
          // Actual error — revert
          setFollowedNpoIds((prev) => {
            const next = new Set(prev);
            next.delete(npoId);
            return next;
          });
          toast.error(errorMsg);
        }
      }
    }
  };

  const handleDonate = (id: number) => {
    setSelectedNPO(id);
    setDonateAmount("");
    setDonateError(null);
    setShowTopUp(false);
    setTopUpAmount("");
    setTopUpError(null);
    setShowDonateModal(true);
  };

  // Handle volunteer apply button
  const handleApplyVolunteer = (opportunityId: number) => {
    setSelectedOpportunity(opportunityId);
    // Pre-populate form from the saved profile for a faster, friendlier apply flow.
    setVolFirstName(profile?.firstName || "");
    setVolLastName(profile?.lastName || "");
    setVolEmail(profile?.email || email || "");
    setVolPhone(profile?.contact || "");
    // Seed the skills checkboxes from the opportunity's required skills (so the
    // most relevant options are pre-ticked), and clear the structured availability.
    const opp = opportunities.find((o) => o.opportunityId === opportunityId);
    const seeded = matchSeedSkills(opp?.skillsRequired || "");
    setVolSkillSet(seeded);
    setVolSkillsOther("");
    setVolSkills("");
    setVolAvailDays([]);
    setVolAvailTimes([]);
    setVolAvailability("");
    setVolMotivation("");
    setShowVolunteerModal(true);
  };

  // Handle volunteer application form submission
  const handleVolunteerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOpportunity) return;

    // Serialize the structured skills (checkboxes + "other") and availability
    // (days + time blocks) into the plain strings the API expects.
    const skills = [...volSkillSet, volSkillsOther.trim()].filter(Boolean).join(", ");
    const availability =
      volAvailDays.length || volAvailTimes.length
        ? `${volAvailDays.join(", ")}${volAvailDays.length && volAvailTimes.length ? " — " : ""}${volAvailTimes.join(", ")}`
        : "";

    const appliedOpp = opportunities.find((o) => o.opportunityId === selectedOpportunity);
    const roleName = appliedOpp?.roleTitle ?? "this role";
    const orgName = appliedOpp?.npoName ?? "the organization";
    const ok = await confirm({
      title: `Submit your application for ${roleName}?`,
      description: `Your details will be sent to ${orgName}. They'll review your application and respond.`,
      confirmText: "Submit application",
    });
    if (!ok) return;

    setApplying(true);
    try {
      await individualService.applyVolunteer(selectedOpportunity, {
        firstName: volFirstName,
        lastName: volLastName,
        email: volEmail,
        phoneNum: volPhone || null,
        skills: skills || null,
        availability: availability || null,
        whyVolunteer: volMotivation || null,
      });
      toast.success("Application submitted successfully!");
      setAppliedOpportunities((prev) => [...prev, selectedOpportunity]);
      setShowVolunteerModal(false);
      // Reset form
      setVolFirstName("");
      setVolLastName("");
      setVolEmail("");
      setVolPhone("");
      setVolSkills("");
      setVolSkillSet([]);
      setVolSkillsOther("");
      setVolAvailDays([]);
      setVolAvailTimes([]);
      setVolAvailability("");
      setVolMotivation("");
      setSelectedOpportunity(null);
      // Refresh my volunteering data if already loaded
      if (myVolLoaded) {
        setMyVolLoaded(false);
      }
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      if (errorMsg.toLowerCase().includes("already applied")) {
        toast.error("You have already applied to this opportunity.");
        setAppliedOpportunities((prev) => [...prev, selectedOpportunity]);
        setShowVolunteerModal(false);
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setApplying(false);
    }
  };

  // Handle cancel/withdraw application
  const handleCancelApplication = async (applicationId: number) => {
    const ok = await confirm({
      title: "Withdraw this application?",
      description: "Your volunteer application will be removed and the organization notified. This cannot be undone.",
      confirmText: "Withdraw application",
      destructive: true,
    });
    if (!ok) return;
    setCancelling(applicationId);
    // Capture the opportunity this application belongs to so we can re-enable
    // its "Apply" button once the application is withdrawn.
    const withdrawn = myVolunteering.find((app) => app.applicationId === applicationId);
    try {
      await individualService.cancelApplication(applicationId);
      setMyVolunteering((prev) => prev.filter((app) => app.applicationId !== applicationId));
      if (withdrawn) {
        setAppliedOpportunities((prev) => prev.filter((id) => id !== withdrawn.opportunityId));
      }
      toast.success("Application withdrawn.");
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      if (errorMsg.toLowerCase().includes("accepted") || errorMsg.toLowerCase().includes("cannot cancel")) {
        toast.error("Cannot cancel an accepted application.");
      } else if (errorMsg.toLowerCase().includes("permission") || errorMsg.toLowerCase().includes("403")) {
        toast.error("You don't have permission to cancel this application.");
      } else {
        toast.error(errorMsg);
      }
    } finally {
      setCancelling(null);
    }
  };

  // Handle donate form submission
  const handleDonateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDonateError(null);

    const amount = parseFloat(donateAmount);
    if (!donateAmount || isNaN(amount) || amount <= 0) {
      setDonateError("Amount must be greater than 0");
      return;
    }

    if (!selectedNPO) return;

    const npoName =
      npos.find((n) => n.npoId === selectedNPO)?.organizationName ??
      followedNpos.find((n) => n.npoId === selectedNPO)?.organizationName ??
      "this NPO";
    const ok = await confirm({
      title: `Donate ${formatZar(amount)} to ${npoName}?`,
      description: `${formatZar(amount)} will be transferred from your wallet to ${npoName}. This cannot be undone.`,
      confirmText: `Donate ${formatZar(amount)}`,
    });
    if (!ok) return;

    setDonating(true);
    try {
      const response = await individualService.donate(selectedNPO, amount);
      const newBalance = response.data.newBalance;
      setWalletBalance(newBalance);
      toast.success(`Donation successful! New balance: ${formatZar(newBalance)}`);
      setShowDonateModal(false);
      setDonateAmount("");
      setDonateError(null);
    } catch (err) {
      const errorMsg = getErrorMessage(err);
      setDonateError(errorMsg);
      if (errorMsg.toLowerCase().includes("insufficient")) {
        // Show top-up option — handled in UI
      }
    } finally {
      setDonating(false);
    }
  };

  // Handle top-up form submission
  const handleTopUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTopUpError(null);

    const amount = parseFloat(topUpAmount);
    if (!topUpAmount || isNaN(amount) || amount <= 0) {
      setTopUpError("Amount must be greater than 0");
      return;
    }

    // Card fields are required. Point to the specific missing field so the user
    // knows exactly what to fix (the server also validates the card shape).
    if (!topUpCard.cardNumber) { setTopUpError("Please enter your card number."); return; }
    if (!topUpCard.cardExpiry) { setTopUpError("Please enter the card expiry date (MM/YY)."); return; }
    if (!topUpCard.cardCvv) { setTopUpError("Please enter the card CVV (the 3–4 digit code)."); return; }

    const ok = await confirm({
      title: `Top up ${formatZar(amount)}?`,
      description: `${formatZar(amount)} will be added to your wallet balance using the card ending ${topUpCard.cardNumber.replace(/\D/g, "").slice(-4) || "••••"}.`,
      confirmText: `Top up ${formatZar(amount)}`,
    });
    if (!ok) return;

    setToppingUp(true);
    try {
      const response = await individualService.topUp(amount, {
        cardNumber: topUpCard.cardNumber,
        cardExpiry: topUpCard.cardExpiry,
        cardCvv: topUpCard.cardCvv,
      });
      const newBalance = response.data.newBalance;
      setWalletBalance(newBalance);
      toast.success(`Wallet topped up! New balance: ${formatZar(newBalance)}`);
      setTopUpAmount("");
      setTopUpCard(emptyCard);
      setTopUpError(null);
      setShowTopUp(false);
      loadTransactions();
    } catch (err) {
      setTopUpError(getErrorMessage(err));
    } finally {
      setToppingUp(false);
    }
  };

  const handleLogout = () => {
    logout();
  };

  const totalDonated = myDonations?.totalDonated || 0;
  const nposSupported = myDonations ? new Set(myDonations.donations.map(d => d.receiverUserId)).size : 0;

  // Computed volunteer stats from real data
  const totalVolunteerHours = myVolunteering.reduce((sum, app) => sum + app.totalHoursLogged, 0);
  const activeVolunteerRoles = myVolunteering.filter(a => a.status === "Accepted").length;
  const pendingApplications = myVolunteering.filter(a => a.status === "Pending").length;

  // Provinces present in the loaded NPO list, derived from each location
  // string. Fixed-order (official SA provinces) + an "Other" bucket for
  // records whose province can't be determined.
  const npoProvinces = (() => {
    const present = new Set(npos.map((n) => parseProvince(n.location) ?? (n.location ? PROVINCE_OTHER : null)).filter((p): p is string => !!p));
    const ordered = SA_PROVINCES.filter((p) => present.has(p));
    if (present.has(PROVINCE_OTHER)) ordered.push(PROVINCE_OTHER);
    return ordered;
  })();

  // Client-side filtered NPOs
  const filteredNPOs = npos.filter((npo) => {
    const matchesSearch =
      searchQuery === "" ||
      npo.organizationName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (npo.location && npo.location.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (npo.focusArea && npo.focusArea.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (npo.mission && npo.mission.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory =
      selectedCategory === "All" ||
      (npo.focusArea && npo.focusArea.toLowerCase() === selectedCategory.toLowerCase());

    const matchesVerification =
      selectedVerification === "All" ||
      (selectedVerification === "Verified" && npo.isVerified) ||
      (selectedVerification === "Pending" && !npo.isVerified);

    const npoProvince = parseProvince(npo.location) ?? (npo.location ? PROVINCE_OTHER : null);
    const matchesLocation =
      selectedLocation === "All" || npoProvince === selectedLocation;

    return matchesSearch && matchesCategory && matchesVerification && matchesLocation;
  });

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 py-4 px-6 z-40 shrink-0">
        <div className="w-full flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-neutral-600">
              <Menu className="w-6 h-6" />
            </button>
            <BrandMark onClick={() => setActiveTab("overview")} />
          </div>
          <HeaderSearch
            placeholder="Search NPOs by name, cause, or location..."
            onSubmit={(q) => { setActiveTab("discover"); setSearchQuery(q); }}
          />
          <div className="flex items-center gap-3">
            <span className="hidden md:inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">Individual</span>
            <NotificationBell />
            <ProfileMenu
              name={profile ? `${profile.firstName} ${profile.lastName}` : email || "User"}
              subtitle={email || undefined}
              roleLabel="Individual"
              onProfile={() => setActiveTab("profile")}
              onLogout={handleLogout}
            />
          </div>
        </div>
      </header>

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />}
        <DashboardSidebar
          activeTab={activeTab}
          onSelect={selectTab}
          mobileOpen={sidebarOpen}
          onMobileClose={() => setSidebarOpen(false)}
          storageKey="individual-sidebar-collapsed"
          groups={[
            { heading: "Core", items: [
              { id: "overview", icon: LayoutDashboard, label: "Overview" },
              { id: "discover", icon: Search, label: "Discover NPOs" },
              { id: "following", icon: Heart, label: "Following", badge: followedNpos.length },
            ]},
            { heading: "Engagement", items: [
              { id: "volunteer", icon: Briefcase, label: "Volunteer Opportunities" },
              { id: "myvolunteering", icon: UserCheck, label: "My Volunteering" },
              { id: "community", icon: MessageSquare, label: "Community Updates" },
            ]},
            { heading: "Activity", items: [
              { id: "donations", icon: Banknote, label: "Donations" },
              { id: "wallet", icon: Wallet, label: "Wallet" },
              { id: "fundraisers", icon: Target, label: "Fundraisers" },
              { id: "impact", icon: TrendingUp, label: "My Impact" },
            ]},
          ]}
          bottomItems={[
            { id: "profile", icon: Settings, label: "Profile Settings" },
          ]}
        />

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-8 w-full min-w-0 overflow-y-auto main-scroll">
          <motion.div
            key={activeTab}
            initial={reduceMotion ? false : { opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.3 }}
          >
            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold mb-1">Overview</h1>
                  <p className="text-neutral-600">Welcome back{profile ? `, ${profile.firstName}` : ""}</p>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                  <Card className="p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("wallet")}>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-green-100 flex items-center justify-center shrink-0"><Wallet className="w-5 h-5 text-green-600" /></div>
                      <div className="min-w-0"><p className="text-xs text-neutral-500">Wallet Balance</p><p className="text-2xl font-bold leading-tight">{walletLoading ? "…" : formatZar(walletBalance)}</p></div>
                    </div>
                  </Card>
                  <Card className="p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("donations")}>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center shrink-0"><Banknote className="w-5 h-5 text-orange-600" /></div>
                      <div className="min-w-0"><p className="text-xs text-neutral-500">Total Donated</p><p className="text-2xl font-bold leading-tight">{formatZar(myImpact?.totalDonated || 0)}</p></div>
                    </div>
                  </Card>
                  <Card className="p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("following")}>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-pink-100 flex items-center justify-center shrink-0"><Heart className="w-5 h-5 text-pink-600" /></div>
                      <div className="min-w-0"><p className="text-xs text-neutral-500">Following</p><p className="text-2xl font-bold leading-tight">{myImpact?.npoFollowing ?? followedNpos.length}</p></div>
                    </div>
                  </Card>
                  <Card className="p-5 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("myvolunteering")}>
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-blue-100 flex items-center justify-center shrink-0"><Clock className="w-5 h-5 text-blue-600" /></div>
                      <div className="min-w-0"><p className="text-xs text-neutral-500">Hours Volunteered</p><p className="text-2xl font-bold leading-tight">{myImpact?.totalHoursVolunteered || 0}h</p></div>
                    </div>
                  </Card>
                </div>

                {/* Fundraisers across the platform — sliding discovery strip */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">Fundraisers to Support</h3>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => navigate("/fundraisers")}>View all</Button>
                      <Button variant="outline" size="icon" className="size-8 rounded-full" aria-label="Previous" onClick={() => overviewCarouselApi?.scrollPrev()}><ChevronLeft className="w-4 h-4" /></Button>
                      <Button variant="outline" size="icon" className="size-8 rounded-full" aria-label="Next" onClick={() => overviewCarouselApi?.scrollNext()}><ChevronRight className="w-4 h-4" /></Button>
                    </div>
                  </div>
                  {overviewFundraisersLoading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">{[1,2,3].map(i => <Card key={i} className="p-4"><Skeleton className="h-28 w-full mb-3" /><Skeleton className="h-4 w-2/3 mb-2" /><Skeleton className="h-2 w-full" /></Card>)}</div>
                  ) : overviewFundraisers.length === 0 ? (
                    <Card className="p-8 text-center"><p className="text-sm text-neutral-500">No fundraisers on the platform yet.</p></Card>
                  ) : (
                    <Carousel opts={{ align: "start", loop: true }} setApi={setOverviewCarouselApi} className="w-full">
                      <CarouselContent>
                        {[...overviewFundraisers]
                          .sort((a, b) => (b.projectStatus === "Active" ? 1 : 0) - (a.projectStatus === "Active" ? 1 : 0))
                          .map(p => {
                            const pct = p.targetAmount > 0 ? Math.min(100, Math.round((p.raisedAmount / p.targetAmount) * 100)) : 0;
                            return (
                              <CarouselItem key={p.projectId} className="basis-4/5 sm:basis-1/2 lg:basis-[30%]">
                                <Card className="overflow-hidden h-full cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate(`/fundraisers?project=${p.projectId}`)}>
                                  {p.images
                                    ? <img src={resolveMediaUrl(p.images.split(",")[0].trim())} alt={p.projectName} className="w-full h-28 object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                                    : <div className={`w-full h-28 bg-gradient-to-br ${getNpoColor(p.npoName || p.projectName)} flex items-center justify-center`}><Heart className="w-8 h-8 text-white/80" /></div>}
                                  <div className="p-4">
                                    <div className="flex items-center justify-between gap-2 mb-1">
                                      <h4 className="font-medium truncate">{p.projectName}</h4>
                                      <Badge variant="outline" className="shrink-0 text-xs">{p.projectStatus}</Badge>
                                    </div>
                                    <p className="text-xs text-neutral-500 truncate mb-2">{p.npoName || "NPO"}</p>
                                    <p className="text-xs text-neutral-500 mb-2">{formatZar(p.raisedAmount)} of {formatZar(p.targetAmount)}</p>
                                    <div className="h-2 w-full rounded-full bg-neutral-100 overflow-hidden"><div className="h-full rounded-full bg-orange-500" style={{ width: `${pct}%` }} /></div>
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
                  type Suggestion = { key: string; title: string; desc: string; cta: string; action: () => void; icon: typeof Heart; tint: string; iconColor: string };
                  const items: Suggestion[] = [];
                  if (kycStatus && kycStatus.status !== "Approved") items.push({ key: "verify", title: "Verify your identity", desc: "Confirm your identity to unlock full access.", cta: "Verify", action: () => navigate("/verify-identity"), icon: ShieldCheck, tint: "bg-amber-50 border-amber-100", iconColor: "bg-amber-100 text-amber-600" });
                  if ((myImpact?.npoFollowing ?? followedNpos.length) === 0) items.push({ key: "follow", title: "Follow an NPO", desc: "Discover organizations and follow causes you care about.", cta: "Discover", action: () => setActiveTab("discover"), icon: Heart, tint: "bg-pink-50 border-pink-100", iconColor: "bg-pink-100 text-pink-600" });
                  if ((myImpact?.totalDonated || 0) === 0) items.push({ key: "donate", title: "Make your first donation", desc: "Support a fundraiser and track your impact.", cta: "Browse", action: () => setActiveTab("discover"), icon: Banknote, tint: "bg-orange-50 border-orange-100", iconColor: "bg-orange-100 text-orange-600" });
                  if ((myImpact?.totalHoursVolunteered || 0) === 0) items.push({ key: "volunteer", title: "Start volunteering", desc: "Find opportunities that match your skills.", cta: "Explore", action: () => setActiveTab("volunteer"), icon: Briefcase, tint: "bg-blue-50 border-blue-100", iconColor: "bg-blue-100 text-blue-600" });
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
              </div>
            )}

            {/* Discover NPOs Tab */}
            {activeTab === "discover" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">Discover Organizations</h1>
                  <p className="text-neutral-600">Find NPOs making a difference in South Africa</p>
                </div>

                {/* Loading Skeleton */}
                {nposLoading && (
                  <div className="grid md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                      <Card key={i} className="p-6">
                        <Skeleton className="h-5 w-3/4 mb-3" />
                        <Skeleton className="h-4 w-1/2 mb-4" />
                        <Skeleton className="h-16 w-full mb-4" />
                        <div className="flex items-center gap-3 mb-4">
                          <Skeleton className="h-4 w-24" />
                          <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                        <div className="flex gap-2">
                          <Skeleton className="h-9 flex-1" />
                          <Skeleton className="h-9 flex-1" />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Error State */}
                {nposError && !nposLoading && (
                  <Card className="p-8">
                    <div className="flex flex-col items-center text-center py-8">
                      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                      <h3 className="text-lg font-medium text-neutral-900 mb-2">Failed to load organizations</h3>
                      <p className="text-neutral-600 mb-6">{nposError}</p>
                      <Button onClick={loadNPOs} variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Empty State */}
                {!nposLoading && !nposError && npos.length === 0 && (
                  <Card className="p-12 text-center">
                    <Search className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                    <h3 className="mb-2">No organizations found</h3>
                    <p className="text-neutral-600">There are no NPOs registered on the platform yet.</p>
                  </Card>
                )}

                {/* NPOs Loaded - Show Search/Filter + Grid */}
                {!nposLoading && !nposError && npos.length > 0 && (
                  <>
                    {/* Search and Filter */}
                    <div className="mb-8">
                      <div className="flex gap-4 mb-6">
                        <div className="flex-1 relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-neutral-400" />
                          <Input
                            placeholder="Search by name, location, or keyword..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-4 gap-4 mb-6">
                        <div>
                          <Label>Category</Label>
                          <select
                            className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-md"
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                          >
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
                          <select
                            className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-md"
                            value={selectedVerification}
                            onChange={(e) => setSelectedVerification(e.target.value)}
                          >
                            <option value="All">All NPOs</option>
                            <option value="Verified">Verified Only</option>
                            <option value="Pending">Pending Verification</option>
                          </select>
                        </div>
                        <div>
                          <Label>Province</Label>
                          <select
                            className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-md"
                            value={selectedLocation}
                            onChange={(e) => setSelectedLocation(e.target.value)}
                          >
                            <option value="All">All Provinces</option>
                            {npoProvinces.map((prov) => (
                              <option key={prov} value={prov}>{prov}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-end">
                          <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => {
                              setSearchQuery("");
                              setSelectedCategory("All");
                              setSelectedVerification("All");
                              setSelectedLocation("All");
                            }}
                          >
                            Clear Filters
                          </Button>
                        </div>
                      </div>

                      <p className="text-sm text-neutral-600 mb-6">
                        Showing {filteredNPOs.length} organization{filteredNPOs.length !== 1 ? "s" : ""}
                      </p>
                    </div>

                    {/* NPO Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {filteredNPOs.map((npo) => (
                        <Card
                          key={npo.npoId}
                          className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => navigate(`/npo/${npo.npoId}`)}
                        >
                          <div className={`h-40 bg-gradient-to-br ${getNpoColor(npo.organizationName)} flex items-center justify-center overflow-hidden`}>
                            {npo.profileImage
                              ? <img src={resolveMediaUrl(npo.profileImage)} alt={npo.organizationName} className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                              : <span className="text-5xl font-bold text-white/80">
                                  {npo.organizationName.charAt(0).toUpperCase()}
                                </span>}
                          </div>
                          <div className="p-6">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-lg font-semibold group-hover:text-orange-600">
                                    {npo.organizationName}
                                  </span>
                                  {npo.isVerified && <CheckCircle className="w-5 h-5 text-green-600" />}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-neutral-600">
                                  {npo.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-4 h-4" />
                                      {npo.location}
                                    </span>
                                  )}
                                  {npo.focusArea && <Badge variant="outline">{npo.focusArea}</Badge>}
                                </div>
                              </div>
                            </div>
                            {npo.mission && (
                              <p className="text-neutral-600 text-sm mb-4 line-clamp-2">{npo.mission}</p>
                            )}
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={(e) => { e.stopPropagation(); handleFollow(npo.npoId); }}
                              >
                                <Heart
                                  className={`w-4 h-4 mr-2 ${
                                    followedNpoIds.has(npo.npoId) ? "fill-red-500 text-red-500" : ""
                                  }`}
                                />
                                {followedNpoIds.has(npo.npoId) ? "Following" : "Follow"}
                              </Button>
                              <Button
                                className="flex-1 bg-orange-600 hover:bg-orange-700"
                                onClick={(e) => { e.stopPropagation(); handleDonate(npo.npoId); }}
                              >
                                Donate
                              </Button>
                            </div>
                            <p className="text-center text-sm text-orange-600 mt-3">View full profile →</p>
                          </div>
                        </Card>
                      ))}
                    </div>

                    {filteredNPOs.length === 0 && (
                      <Card className="p-12 text-center">
                        <Search className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                        <h3 className="mb-2">No organizations found</h3>
                        <p className="text-neutral-600 mb-4">Try adjusting your search or filters</p>
                        <Button
                          onClick={() => {
                            setSearchQuery("");
                            setSelectedCategory("All");
                            setSelectedVerification("All");
                            setSelectedLocation("All");
                          }}
                        >
                          Clear All Filters
                        </Button>
                      </Card>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Following Tab */}
            {activeTab === "following" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">Organizations You Follow</h1>
                  <p className="text-neutral-600">Stay updated with your favorite NPOs</p>
                </div>

                {followedNpos.length === 0 && !followsLoading ? (
                  <Card className="p-12 text-center">
                    <Heart className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                    <h3 className="mb-2">No organizations followed yet</h3>
                    <p className="text-neutral-600 mb-4">You haven't followed any organizations yet. Follow NPOs from the Discover tab to see them here.</p>
                    <Button onClick={() => setActiveTab("discover")}>Discover NPOs</Button>
                  </Card>
                ) : followsLoading ? (
                  <div className="grid md:grid-cols-2 gap-6">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="overflow-hidden">
                        <Skeleton className="h-16 w-full" />
                        <div className="p-6">
                          <Skeleton className="h-5 w-3/4 mb-2" />
                          <Skeleton className="h-4 w-1/2 mb-4" />
                          <Skeleton className="h-4 w-full mb-2" />
                          <Skeleton className="h-9 w-24" />
                        </div>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div>
                    <h2 className="mb-6">Your Followed Organizations</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {followedNpos.map((npo) => (
                        <Card
                          key={npo.npoId}
                          className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                          onClick={() => navigate(`/npo/${npo.npoId}`)}
                        >
                          <div className={`h-40 bg-gradient-to-br ${getNpoColor(npo.organizationName)} flex items-center justify-center overflow-hidden`}>
                            {npo.profileImage
                              ? <img src={resolveMediaUrl(npo.profileImage)} alt={npo.organizationName} className="w-full h-full object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                              : <span className="text-5xl font-bold text-white/80">
                                  {npo.organizationName.charAt(0).toUpperCase()}
                                </span>}
                          </div>
                          <div className="p-6">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-lg font-semibold group-hover:text-orange-600">
                                    {npo.organizationName}
                                  </span>
                                  {npo.isVerified && <CheckCircle className="w-5 h-5 text-green-600" />}
                                </div>
                                <div className="flex items-center gap-4 text-sm text-neutral-600">
                                  {npo.location && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-4 h-4" />
                                      {npo.location}
                                    </span>
                                  )}
                                  {npo.focusArea && <Badge variant="outline">{npo.focusArea}</Badge>}
                                </div>
                              </div>
                            </div>
                            {npo.mission && (
                              <p className="text-neutral-600 text-sm mb-4 line-clamp-2">{npo.mission}</p>
                            )}
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                className="flex-1"
                                onClick={(e) => { e.stopPropagation(); handleFollow(npo.npoId); }}
                              >
                                <Heart className="w-4 h-4 mr-2 fill-red-500 text-red-500" />
                                Following
                              </Button>
                              <Button
                                className="flex-1 bg-orange-600 hover:bg-orange-700"
                                onClick={(e) => { e.stopPropagation(); handleDonate(npo.npoId); }}
                              >
                                Donate
                              </Button>
                            </div>
                            <p className="text-center text-sm text-orange-600 mt-3">View full profile →</p>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Volunteer Opportunities Tab */}
            {activeTab === "volunteer" && (
              <div>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold mb-1">Volunteer Opportunities</h1>
                  <p className="text-neutral-600">Find volunteering roles that match your skills and schedule</p>
                </div>

                {/* Search + category filter */}
                {!oppsLoading && !oppsError && opportunities.length > 0 && (() => {
                  const cats = Array.from(new Set(opportunities.map(o => o.category).filter((c): c is string => !!c)));
                  return (
                    <div className="flex flex-col sm:flex-row gap-3 mb-6">
                      <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                        <Input placeholder="Search by role, organization, or skill..." className="pl-10" value={oppSearch} onChange={(e) => setOppSearch(e.target.value)} />
                      </div>
                      <select className="px-3 py-2 border border-neutral-300 rounded-md sm:w-56" value={oppCategory} onChange={(e) => setOppCategory(e.target.value)}>
                        <option value="All">All categories</option>
                        {cats.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      {(oppSearch || oppCategory !== "All") && (
                        <Button variant="outline" onClick={() => { setOppSearch(""); setOppCategory("All"); }}>Clear</Button>
                      )}
                    </div>
                  );
                })()}

                {/* Loading Skeleton */}
                {oppsLoading && (
                  <div className="grid md:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                      <Card key={i} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1">
                            <Skeleton className="h-5 w-3/4 mb-2" />
                            <Skeleton className="h-4 w-1/3" />
                          </div>
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                        <Skeleton className="h-12 w-full mb-4" />
                        <div className="space-y-2 mb-4">
                          <Skeleton className="h-4 w-2/3" />
                          <Skeleton className="h-4 w-1/2" />
                        </div>
                        <Skeleton className="h-10 w-full mb-3" />
                        <Skeleton className="h-9 w-full" />
                      </Card>
                    ))}
                  </div>
                )}

                {/* Error State */}
                {oppsError && !oppsLoading && (
                  <Card className="p-8">
                    <div className="flex flex-col items-center text-center py-8">
                      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                      <h3 className="text-lg font-medium text-neutral-900 mb-2">Failed to load opportunities</h3>
                      <p className="text-neutral-600 mb-6">{oppsError}</p>
                      <Button onClick={loadOpportunities} variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Empty State */}
                {!oppsLoading && !oppsError && opportunities.length === 0 && oppsLoaded && (
                  <Card className="p-12 text-center">
                    <Briefcase className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                    <h3 className="mb-2">No volunteer opportunities available right now</h3>
                    <p className="text-neutral-600">Check back later for new opportunities</p>
                  </Card>
                )}

                {/* Opportunities Grid */}
                {!oppsLoading && !oppsError && opportunities.length > 0 && (() => {
                  const q = oppSearch.trim().toLowerCase();
                  const filteredOpps = opportunities.filter((opp) => {
                    const matchesCategory = oppCategory === "All" || opp.category === oppCategory;
                    const matchesSearch = !q
                      || opp.roleTitle.toLowerCase().includes(q)
                      || (opp.npoName || "").toLowerCase().includes(q)
                      || (opp.description || "").toLowerCase().includes(q)
                      || (opp.skillsRequired || "").toLowerCase().includes(q);
                    return matchesCategory && matchesSearch;
                  });
                  if (filteredOpps.length === 0) {
                    return (
                      <Card className="p-12 text-center">
                        <Search className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                        <h3 className="mb-2">No matching opportunities</h3>
                        <p className="text-neutral-600 mb-4">Try a different search or clear the filters.</p>
                        <Button variant="outline" onClick={() => { setOppSearch(""); setOppCategory("All"); }}>Clear filters</Button>
                      </Card>
                    );
                  }
                  return (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {filteredOpps.map((opp) => (
                      <Card key={opp.opportunityId} className="p-5 flex flex-col cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDetailOpp(opp)}>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold truncate">{opp.roleTitle}</h3>
                            <button
                              onClick={(e) => { e.stopPropagation(); navigate(`/npo/${opp.npoId}`); }}
                              className="text-sm text-orange-600 hover:underline text-left truncate max-w-full"
                              title="View NPO profile"
                            >
                              {opp.npoName || `NPO #${opp.npoId}`}
                            </button>
                          </div>
                          {opp.category && <Badge className="bg-blue-100 text-blue-700 shrink-0">{opp.category}</Badge>}
                        </div>
                        {opp.description && (
                          <p className="text-neutral-600 text-sm mb-3 line-clamp-2">{opp.description}</p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-neutral-500 mb-4">
                          <span>{opp.numOfPositions} position{opp.numOfPositions !== 1 ? "s" : ""}</span>
                          {opp.timeCommitment && <span className="inline-flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {opp.timeCommitment}</span>}
                        </div>
                        <div className="mt-auto flex items-center gap-2">
                          <Button variant="outline" size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); setDetailOpp(opp); }}>Details</Button>
                          <Button
                            size="sm"
                            className={`flex-1 ${appliedOpportunities.includes(opp.opportunityId) ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"}`}
                            disabled={appliedOpportunities.includes(opp.opportunityId)}
                            onClick={(e) => { e.stopPropagation(); handleApplyVolunteer(opp.opportunityId); }}
                          >
                            {appliedOpportunities.includes(opp.opportunityId) ? <><CheckCircle className="w-4 h-4 mr-1" /> Applied</> : "Apply"}
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                  );
                })()}
              </div>
            )}

            {/* My Volunteering Tab */}
            {activeTab === "myvolunteering" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">My Volunteering</h1>
                  <p className="text-neutral-600">Track your volunteer activities and hours</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <Card className="p-6">
                    <div className="text-neutral-600 text-sm mb-2">Total Hours</div>
                    <div className="text-3xl mb-1">{totalVolunteerHours}h</div>
                    <div className="text-sm text-green-600">All time</div>
                  </Card>
                  <Card className="p-6">
                    <div className="text-neutral-600 text-sm mb-2">Active Roles</div>
                    <div className="text-3xl mb-1">{activeVolunteerRoles}</div>
                    <div className="text-sm text-neutral-600">Organizations</div>
                  </Card>
                  <Card className="p-6">
                    <div className="text-neutral-600 text-sm mb-2">Applications</div>
                    <div className="text-3xl mb-1">{pendingApplications}</div>
                    <div className="text-sm text-neutral-600">Pending</div>
                  </Card>
                </div>

                {/* Loading Skeleton */}
                {myVolLoading && (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="p-6">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <Skeleton className="h-5 w-1/3 mb-2" />
                            <Skeleton className="h-4 w-1/4 mb-2" />
                            <Skeleton className="h-4 w-1/5" />
                          </div>
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                      </Card>
                    ))}
                  </div>
                )}

                {/* Error State */}
                {myVolError && !myVolLoading && (
                  <Card className="p-8">
                    <div className="flex flex-col items-center text-center py-8">
                      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                      <h3 className="text-lg font-medium text-neutral-900 mb-2">Failed to load volunteering data</h3>
                      <p className="text-neutral-600 mb-6">{myVolError}</p>
                      <Button onClick={loadMyVolunteering} variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Empty State */}
                {!myVolLoading && !myVolError && myVolunteering.length === 0 && myVolLoaded && (
                  <Card className="p-12 text-center">
                    <Briefcase className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                    <h3 className="mb-2">No volunteering activity yet</h3>
                    <p className="text-neutral-600 mb-4">Apply to volunteer opportunities to get started</p>
                    <Button onClick={() => setActiveTab("volunteer")}>Browse Opportunities</Button>
                  </Card>
                )}

                {/* Applications List */}
                {!myVolLoading && !myVolError && myVolunteering.length > 0 && (
                  <div className="space-y-4">
                    {myVolunteering.map((app) => (
                      <Card key={app.applicationId} className="p-6 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setDetailApp(app)}>
                        <div className="flex items-center justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-neutral-900 mb-1 truncate">{app.roleTitle}</h3>
                            <p className="text-sm text-neutral-600 mb-2 truncate">{app.npoName}</p>
                            <div className="flex items-center gap-4 text-sm text-neutral-500">
                              <span>Applied: {new Date(app.applicationDate).toLocaleDateString()}</span>
                              <span>Hours: {app.totalHoursLogged}h</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <Badge
                              className={
                                app.status === "Pending"
                                  ? "bg-amber-100 text-amber-700"
                                  : app.status === "Accepted"
                                  ? "bg-green-100 text-green-700"
                                  : app.status === "Completed"
                                  ? "bg-blue-100 text-blue-700"
                                  : app.status === "Rejected"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-neutral-100 text-neutral-600"
                              }
                            >
                              {app.status}
                            </Badge>
                            {app.status === "Pending" && (
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                disabled={cancelling === app.applicationId}
                                onClick={(e) => { e.stopPropagation(); handleCancelApplication(app.applicationId); }}
                              >
                                {cancelling === app.applicationId ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  "Withdraw"
                                )}
                              </Button>
                            )}
                            <ChevronRight className="w-4 h-4 text-neutral-400" />
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* My Donations Tab */}
            {activeTab === "donations" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">My Donations</h1>
                  <p className="text-neutral-600">Your contribution history</p>
                </div>

                {/* Loading Skeleton */}
                {donationsLoading && (
                  <div>
                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="p-6">
                          <Skeleton className="h-4 w-24 mb-2" />
                          <Skeleton className="h-8 w-32 mb-1" />
                          <Skeleton className="h-3 w-16" />
                        </Card>
                      ))}
                    </div>
                    <div className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <Card key={i} className="p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <Skeleton className="h-5 w-32 mb-2" />
                              <Skeleton className="h-4 w-48" />
                            </div>
                            <Skeleton className="h-6 w-20 rounded-full" />
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error State */}
                {donationsError && !donationsLoading && (
                  <Card className="p-8">
                    <div className="flex flex-col items-center text-center py-8">
                      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                      <h3 className="text-lg font-medium text-neutral-900 mb-2">Failed to load donations</h3>
                      <p className="text-neutral-600 mb-6">{donationsError}</p>
                      <Button onClick={loadMyDonations} variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Loaded State */}
                {!donationsLoading && !donationsError && (
                  <>
                    {/* Summary Stats */}
                    <div className="grid md:grid-cols-3 gap-6 mb-8">
                      <Card className="p-6">
                        <div className="text-neutral-600 text-sm mb-2">Total Donated</div>
                        <div className="text-3xl mb-1">{formatZar(totalDonated)}</div>
                        <div className="text-sm text-green-600">All time</div>
                      </Card>
                      <Card className="p-6">
                        <div className="text-neutral-600 text-sm mb-2">NPOs Supported</div>
                        <div className="text-3xl mb-1">{nposSupported}</div>
                        <div className="text-sm text-neutral-600">Organizations</div>
                      </Card>
                      <Card className="p-6">
                        <div className="text-neutral-600 text-sm mb-2">Wallet Balance</div>
                        <div className="text-3xl mb-1">
                          {walletLoading ? "..." : formatZar(walletBalance)}
                        </div>
                        <div className="text-sm text-neutral-600">Available</div>
                      </Card>
                    </div>

                    {/* Donation History */}
                    {myDonations && myDonations.donations.length > 0 ? (
                      <div className="space-y-4">
                        <h2 className="text-lg font-medium mb-4">Donation History</h2>
                        {myDonations.donations.map((donation) => (
                          <Card key={donation.transactionId} className="p-6">
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="font-medium text-neutral-900 mb-1">
                                  {formatZar(donation.amount)}
                                </p>
                                <p className="text-sm text-neutral-600">
                                  {new Date(donation.timestamp).toLocaleDateString("en-ZA", {
                                    year: "numeric",
                                    month: "long",
                                    day: "numeric",
                                  })}
                                </p>
                              </div>
                              <Badge
                                className={
                                  donation.status === "Completed"
                                    ? "bg-green-100 text-green-700"
                                    : donation.status === "Failed"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-amber-100 text-amber-700"
                                }
                              >
                                {donation.status}
                              </Badge>
                            </div>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <Card className="p-12 text-center">
                        <Banknote className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                        <h3 className="mb-2">No donations yet</h3>
                        <p className="text-neutral-600 mb-4">Support NPOs by making your first donation</p>
                        <Button onClick={() => setActiveTab("discover")}>Discover NPOs</Button>
                      </Card>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Wallet Tab */}
            {activeTab === "wallet" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-2xl font-bold mb-1">My Wallet</h1>
                    <p className="text-neutral-600">Manage your wallet balance</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={loadTransactions}><RefreshCw className="w-4 h-4" /></Button>
                    <Button className="bg-orange-600 hover:bg-orange-700" onClick={() => { setTopUpError(null); setTopUpStep(1); setShowTopUp(true); }}><Wallet className="w-4 h-4 mr-2" /> Top Up</Button>
                  </div>
                </div>

                {/* Overview: prominent balance + lifetime totals */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <Card className="p-8 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center"><Wallet className="w-6 h-6" /></div>
                      <div>
                        <p className="text-white/80 text-sm">Available Balance</p>
                        <h2 className="text-3xl font-bold text-white">{walletLoading ? "…" : formatZar(walletBalance)}</h2>
                      </div>
                    </div>
                  </Card>
                  <Card className="p-6"><p className="text-neutral-600 text-sm mb-1">Total Topped Up</p><p className="text-2xl font-bold text-blue-600">{formatZar(txData?.summary.totalToppedUp ?? 0)}</p></Card>
                  <Card className="p-6"><p className="text-neutral-600 text-sm mb-1">Total Donated</p><p className="text-2xl font-bold text-green-600">{formatZar(txData?.summary.totalDonated ?? 0)}</p></Card>
                </div>

                {/* Transaction History */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3>Transaction History</h3>
                    <Button variant="outline" size="sm" onClick={loadTransactions}><RefreshCw className="w-4 h-4" /></Button>
                  </div>
                  {txLoading ? (
                    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-orange-600" /></div>
                  ) : !txData || txData.transactions.length === 0 ? (
                    <p className="text-neutral-600 text-sm py-4 text-center">No transactions yet. Top up your wallet to get started.</p>
                  ) : (
                    <div className="space-y-3">
                      {txData.transactions.map((tx) => (
                        <div key={tx.transactionId} className="flex items-center justify-between p-4 border rounded-lg">
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.type === "TopUp" ? "bg-blue-100" : tx.type === "Withdrawal" ? "bg-orange-100" : tx.direction === "in" ? "bg-green-100" : "bg-green-100"}`}>
                              {tx.type === "TopUp" ? <Wallet className="w-5 h-5 text-blue-600" /> : tx.type === "Withdrawal" ? <Banknote className="w-5 h-5 text-orange-600" /> : <HandCoins className="w-5 h-5 text-green-600" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium">{tx.type === "TopUp" ? "Wallet top-up" : tx.type === "Withdrawal" ? "Withdrawal" : tx.type === "CampaignContribution" ? "Campaign funding" : "Donation"}</p>
                              <p className="text-xs text-neutral-500">{tx.counterpartyName} · {new Date(tx.timestamp).toLocaleDateString("en-ZA", { year: "numeric", month: "short", day: "numeric" })}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-semibold ${tx.direction === "in" ? "text-green-600" : "text-neutral-900"}`}>{tx.direction === "in" ? "+" : "−"}{formatZar(tx.amount)}</p>
                            <Badge className={tx.status === "Completed" ? "bg-green-100 text-green-700" : tx.status === "Failed" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}>{tx.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* Community Updates Tab */}
            {activeTab === "community" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">Community Updates</h1>
                  <p className="text-neutral-600">See what's happening across all NPOs</p>
                </div>

                {/* Search */}
                <div className="mb-8">
                  <div className="md:w-1/2">
                    <Label>Search Posts</Label>
                    <Input
                      placeholder="Search by title, author, or keyword..."
                      className="mt-2"
                      value={postSearchQuery}
                      onChange={(e) => setPostSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Loading Skeleton */}
                {postsLoading && (
                  <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                      <Card key={i} className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <Skeleton className="w-10 h-10 rounded-full" />
                          <div>
                            <Skeleton className="h-4 w-32 mb-1" />
                            <Skeleton className="h-3 w-24" />
                          </div>
                        </div>
                        <Skeleton className="h-5 w-3/4 mb-2" />
                        <Skeleton className="h-4 w-full mb-1" />
                        <Skeleton className="h-4 w-2/3 mb-4" />
                        <Skeleton className="h-40 w-full rounded-lg mb-4" />
                        <Skeleton className="h-4 w-16" />
                      </Card>
                    ))}
                  </div>
                )}

                {/* Error State */}
                {postsError && !postsLoading && (
                  <Card className="p-8">
                    <div className="flex flex-col items-center text-center py-8">
                      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                      <h3 className="text-lg font-medium text-neutral-900 mb-2">Failed to load community updates</h3>
                      <p className="text-neutral-600 mb-6">{postsError}</p>
                      <Button onClick={loadCommunityUpdates} variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Loaded State */}
                {!postsLoading && !postsError && (
                  <>
                    {(() => {
                      const filteredPosts = communityPosts.filter((post) => {
                        if (!postSearchQuery) return true;
                        const query = postSearchQuery.toLowerCase();
                        return (
                          post.postTitle.toLowerCase().includes(query) ||
                          post.authorName.toLowerCase().includes(query) ||
                          (post.content && post.content.toLowerCase().includes(query))
                        );
                      });

                      if (filteredPosts.length === 0) {
                        return (
                          <Card className="p-12 text-center">
                            <MessageSquare className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                            <h3 className="mb-2">
                              {communityPosts.length === 0
                                ? "No community posts yet"
                                : "No posts match your search"}
                            </h3>
                            <p className="text-neutral-600">
                              {communityPosts.length === 0
                                ? "Posts from NPOs will appear here"
                                : "Try adjusting your search terms"}
                            </p>
                          </Card>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                          {filteredPosts.map((post) => (
                            <Card
                              key={post.postId}
                              className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                              onClick={() => handleOpenComments(post)}
                            >
                              {/* Image Area - full width at top */}
                              {post.mediaUrl && post.mediaUrl.trim() !== "" ? (
                                <div className="h-48">
                                  <img
                                    src={resolveMediaUrl(post.mediaUrl)}
                                    alt={post.postTitle}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                      (e.target as HTMLImageElement).style.display = "none";
                                    }}
                                  />
                                </div>
                              ) : (
                                <div className={`h-48 bg-gradient-to-br ${getNpoColor(post.authorName)} flex items-center justify-center`}>
                                  <span className="text-4xl font-bold text-white/80">
                                    {post.authorName.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}

                              <div className="p-6">
                                {/* Author row - avatar + name link to the NPO profile */}
                                <div className="flex items-center gap-3 mb-3">
                                  {post.authorNpoId ? (
                                    <button
                                      onClick={(e) => { e.stopPropagation(); navigate(`/npo/${post.authorNpoId}`); }}
                                      className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center hover:ring-2 hover:ring-orange-300"
                                      title={`View ${post.authorName}`}
                                    >
                                      <Heart className="w-5 h-5 text-orange-600" />
                                    </button>
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                                      <Heart className="w-5 h-5 text-orange-600" />
                                    </div>
                                  )}
                                  <div>
                                    {post.authorNpoId ? (
                                      <button
                                        onClick={(e) => { e.stopPropagation(); navigate(`/npo/${post.authorNpoId}`); }}
                                        className="font-medium text-neutral-900 text-sm hover:text-orange-600 hover:underline"
                                      >
                                        {post.authorName}
                                      </button>
                                    ) : (
                                      <p className="font-medium text-neutral-900 text-sm">{post.authorName}</p>
                                    )}
                                  </div>
                                </div>

                                {/* Title */}
                                <h3 className="font-semibold text-neutral-900 mb-2">{post.postTitle}</h3>

                                {/* Content */}
                                {post.content && (
                                  <p className="text-neutral-600 text-sm mb-4 line-clamp-3">{post.content}</p>
                                )}

                                {/* Bottom row: likes + comments + date */}
                                <div className="flex items-center justify-between text-sm">
                                  <div className="flex items-center gap-4">
                                    <button
                                      className="flex items-center gap-1 text-neutral-600 hover:text-red-500 transition-colors"
                                      onClick={(e) => { e.stopPropagation(); handleLikePost(post.postId); }}
                                    >
                                      <Heart className={`w-4 h-4 ${likedPostIds.has(post.postId) ? "fill-red-500 text-red-500" : ""}`} />
                                      {post.likeCount}
                                    </button>
                                    <button
                                      className="flex items-center gap-1 text-neutral-600 hover:text-orange-600 transition-colors"
                                      onClick={(e) => { e.stopPropagation(); handleOpenComments(post); }}
                                    >
                                      <MessageSquare className="w-4 h-4" />
                                      Comment
                                    </button>
                                    <span onClick={(e) => e.stopPropagation()}>
                                      <ReportPostButton postId={post.postId} />
                                    </span>
                                  </div>
                                  <span className="text-neutral-500">
                                    {new Date(post.timestamp).toLocaleDateString("en-ZA", {
                                      day: "numeric",
                                      month: "short",
                                      year: "numeric",
                                    })}
                                  </span>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      );
                    })()}
                  </>
                )}
              </div>
            )}

            {/* My Impact Tab */}
            {activeTab === "impact" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">My Impact</h1>
                  <p className="text-neutral-600">See the difference you're making through donations and volunteering</p>
                </div>

                {/* Loading Skeleton */}
                {impactLoading && (
                  <div>
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                      <Skeleton className="h-40 w-full rounded-lg" />
                      <Skeleton className="h-40 w-full rounded-lg" />
                    </div>
                    <div className="grid md:grid-cols-4 gap-6">
                      {[1, 2, 3, 4].map((i) => (
                        <Card key={i} className="p-6">
                          <Skeleton className="h-4 w-24 mb-2" />
                          <Skeleton className="h-8 w-16 mb-1" />
                          <Skeleton className="h-3 w-20" />
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Error State */}
                {impactError && !impactLoading && (
                  <Card className="p-8">
                    <div className="flex flex-col items-center text-center py-8">
                      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                      <h3 className="text-lg font-medium text-neutral-900 mb-2">Failed to load impact data</h3>
                      <p className="text-neutral-600 mb-6">{impactError}</p>
                      <Button onClick={loadMyImpact} variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  </Card>
                )}

                {/* Loaded State */}
                {!impactLoading && !impactError && (
                  <>
                    {/* Gradient Impact Cards */}
                    <div className="grid md:grid-cols-2 gap-6 mb-8">
                      <Card className="p-8 bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                        <div>
                          <p className="text-white/80 mb-2">Donations Impact</p>
                          <h2 className="text-white mb-2">{formatZar(myImpact?.totalDonated || 0)}</h2>
                          <p className="text-white/90">Supporting {nposSupported} organization{nposSupported !== 1 ? "s" : ""}</p>
                        </div>
                      </Card>

                      <Card className="p-8 bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                        <div>
                          <p className="text-white/80 mb-2">Volunteer Impact</p>
                          <h2 className="text-white mb-2">{myImpact?.totalHoursVolunteered || 0} hours</h2>
                          <p className="text-white/90">{myImpact?.volunteerRolesCompleted || 0} role{(myImpact?.volunteerRolesCompleted || 0) !== 1 ? "s" : ""} completed</p>
                        </div>
                      </Card>
                    </div>

                    {/* Detailed Stats */}
                    <div className="grid md:grid-cols-4 gap-6 mb-8">
                      <Card className="p-6">
                        <div className="text-neutral-600 text-sm mb-2">Total Donated</div>
                        <div className="text-2xl font-semibold mb-1">{formatZar(myImpact?.totalDonated || 0)}</div>
                        <div className="text-sm text-green-600">All time</div>
                      </Card>
                      <Card className="p-6">
                        <div className="text-neutral-600 text-sm mb-2">Hours Volunteered</div>
                        <div className="text-2xl font-semibold mb-1">{myImpact?.totalHoursVolunteered || 0}h</div>
                        <div className="text-sm text-blue-600">Total</div>
                      </Card>
                      <Card className="p-6">
                        <div className="text-neutral-600 text-sm mb-2">NPOs Following</div>
                        <div className="text-2xl font-semibold mb-1">{myImpact?.npoFollowing || 0}</div>
                        <div className="text-sm text-neutral-600">Organizations</div>
                      </Card>
                      <Card className="p-6">
                        <div className="text-neutral-600 text-sm mb-2">Roles Completed</div>
                        <div className="text-2xl font-semibold mb-1">{myImpact?.volunteerRolesCompleted || 0}</div>
                        <div className="text-sm text-neutral-600">Volunteer roles</div>
                      </Card>
                    </div>

                    {/* CTA if no impact */}
                    {(myImpact?.totalDonated || 0) === 0 && (myImpact?.totalHoursVolunteered || 0) === 0 && (
                      <Card className="p-12 text-center">
                        <TrendingUp className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                        <h3 className="mb-2">Start making an impact</h3>
                        <p className="text-neutral-600 mb-4">Donate to NPOs or volunteer to build your impact history</p>
                        <Button onClick={() => setActiveTab("discover")}>Discover NPOs</Button>
                      </Card>
                    )}
                  </>
                )}
              </div>
            )}

            {/* Profile Settings Tab */}
            {activeTab === "profile" && (
              <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                  <h1 className="text-2xl font-bold mb-1">Profile Settings</h1>
                  <p className="text-neutral-600">Manage your account information</p>
                </div>

                {/* Identity header: avatar + name + email */}
                {profile && (
                  <Card className="p-5 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center text-lg font-bold shrink-0">
                        {`${(profile.firstName || "").charAt(0)}${(profile.lastName || "").charAt(0)}`.toUpperCase() || (profile.email || "U").charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="text-lg font-semibold text-neutral-900 truncate">{profile.firstName} {profile.lastName}</p>
                        <p className="text-sm text-neutral-500 truncate">{profile.email || email}</p>
                      </div>
                    </div>
                  </Card>
                )}

                {/* Identity Verification (KYC) — always visible so the flow is reachable */}
                <Card className="p-8 mb-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="mb-1">Identity Verification</h3>
                        <p className="text-sm text-neutral-600 max-w-md">
                          Verify your identity (ID + selfie) to unlock donations, wallet top-ups and volunteering.
                        </p>
                        <div className="mt-2">
                          {kycLoading ? (
                            <span className="text-sm text-neutral-500 inline-flex items-center gap-2"><Loader2 className="w-4 h-4 animate-spin" /> Checking status…</span>
                          ) : kycStatus?.status === "Approved" ? (
                            <Badge className="bg-green-100 text-green-700 gap-1"><BadgeCheck className="w-3.5 h-3.5" /> Verified</Badge>
                          ) : kycStatus?.status === "Pending" ? (
                            <Badge className="bg-amber-100 text-amber-700">Under review</Badge>
                          ) : kycStatus?.status === "Rejected" ? (
                            <Badge className="bg-red-100 text-red-700">Rejected — please resubmit</Badge>
                          ) : (
                            <Badge className="bg-neutral-100 text-neutral-700">Not submitted</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    {kycStatus?.status !== "Approved" && (
                      <Button asChild className="bg-orange-600 hover:bg-orange-700">
                        <Link to="/verify-identity">
                          {kycStatus?.status === "Pending" ? "View submission" : kycStatus?.status === "Rejected" ? "Resubmit" : "Verify now"}
                        </Link>
                      </Button>
                    )}
                  </div>
                </Card>

                {profileLoading && (
                  <Card className="p-8 mb-6">
                    <Skeleton className="h-6 w-48 mb-6" />
                    <div className="space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <Skeleton className="h-4 w-24 mb-2" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                        <div>
                          <Skeleton className="h-4 w-24 mb-2" />
                          <Skeleton className="h-10 w-full" />
                        </div>
                      </div>
                      <div>
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                      <div>
                        <Skeleton className="h-4 w-28 mb-2" />
                        <Skeleton className="h-10 w-full" />
                      </div>
                      <Skeleton className="h-10 w-32" />
                    </div>
                  </Card>
                )}

                {profileError && !profileLoading && (
                  <Card className="p-8 mb-6">
                    <div className="flex flex-col items-center text-center py-8">
                      <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                      <h3 className="text-lg font-medium text-neutral-900 mb-2">Failed to load profile</h3>
                      <p className="text-neutral-600 mb-6">{profileError}</p>
                      <Button onClick={loadProfile} variant="outline">
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry
                      </Button>
                    </div>
                  </Card>
                )}

                {!profileLoading && !profileError && profile && (
                  <>
                    {/* Section: Profile — collapsible */}
                    <Card className="mb-4 overflow-hidden">
                      <button type="button" onClick={() => toggleSetting("profile-section")} className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-neutral-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center shrink-0"><Settings className="w-4 h-4" /></div>
                          <div>
                            <h3 className="font-semibold leading-tight">Profile</h3>
                            <p className="text-xs text-neutral-500">Your name and the causes you care about.</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-neutral-400 shrink-0 transition-transform ${openSetting === "profile-section" ? "rotate-180" : ""}`} />
                      </button>
                      {openSetting === "profile-section" && (
                        <form className="space-y-5 px-5 pb-5 border-t border-neutral-100 pt-5" onSubmit={handleProfileUpdate}>
                          <div className="grid md:grid-cols-2 gap-5">
                            <div>
                              <Label htmlFor="first-name">First Name</Label>
                              <Input id="first-name" value={profileFirstName} onChange={(e) => setProfileFirstName(e.target.value)} className="mt-2" required />
                            </div>
                            <div>
                              <Label htmlFor="last-name">Last Name</Label>
                              <Input id="last-name" value={profileLastName} onChange={(e) => setProfileLastName(e.target.value)} className="mt-2" required />
                            </div>
                          </div>
                          <div>
                            <Label>Causes of Care</Label>
                            <p className="text-xs text-neutral-500 mt-1 mb-2">Select the causes you're passionate about.</p>
                            {(() => {
                              const selected = profileCauseOfCare.split(",").map(s => s.trim()).filter(Boolean);
                              const toggle = (cause: string) => {
                                const set = new Set(selected);
                                if (set.has(cause)) set.delete(cause); else set.add(cause);
                                setProfileCauseOfCare(Array.from(set).join(", "));
                              };
                              return (
                                <div className="flex flex-wrap gap-2">
                                  {INDIVIDUAL_CAUSES.map(cause => {
                                    const active = selected.includes(cause);
                                    return (
                                      <button
                                        key={cause}
                                        type="button"
                                        onClick={() => toggle(cause)}
                                        aria-pressed={active}
                                        className={`px-3 py-1.5 rounded-full border text-sm transition-colors ${active ? "bg-orange-600 border-orange-600 text-white" : "bg-white border-neutral-200 text-neutral-700 hover:border-orange-300 hover:bg-orange-50"}`}
                                      >
                                        {cause}
                                      </button>
                                    );
                                  })}
                                </div>
                              );
                            })()}
                          </div>
                          <div className="flex justify-end">
                            <Button type="submit" className="bg-orange-600 hover:bg-orange-700" disabled={profileUpdating}>
                              {profileUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                              Save profile
                            </Button>
                          </div>
                        </form>
                      )}
                    </Card>

                    {/* Section: Contact — collapsible */}
                    <Card className="mb-4 overflow-hidden">
                      <button type="button" onClick={() => toggleSetting("contact-section")} className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-neutral-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center shrink-0"><MapPin className="w-4 h-4" /></div>
                          <div>
                            <h3 className="font-semibold leading-tight">Contact</h3>
                            <p className="text-xs text-neutral-500">How we and NPOs can reach you.</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-neutral-400 shrink-0 transition-transform ${openSetting === "contact-section" ? "rotate-180" : ""}`} />
                      </button>
                      {openSetting === "contact-section" && (
                        <form className="space-y-5 px-5 pb-5 border-t border-neutral-100 pt-5" onSubmit={handleProfileUpdate}>
                          <div>
                            <Label htmlFor="email">Email Address</Label>
                            <Input id="email" type="email" value={profile.email || email || ""} className="mt-2 bg-neutral-100" readOnly />
                            <p className="text-xs text-neutral-500 mt-1">Email cannot be changed</p>
                          </div>
                          <div>
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input id="phone" type="tel" value={profileContact} onChange={(e) => setProfileContact(e.target.value)} placeholder="+27 XX XXX XXXX" className="mt-2" aria-invalid={!!profileContact.trim() && !isValidPhone(profileContact)} />
                            {!!profileContact.trim() && !isValidPhone(profileContact) && (
                              <p className="text-xs text-red-500 mt-1">{validationMessages.phone}</p>
                            )}
                          </div>
                          <div>
                            <LocationPicker province={profileProvince} city={profileCity} onProvinceChange={setProfileProvince} onCityChange={setProfileCity} disabled={profileUpdating} required />
                          </div>
                          <div className="flex justify-end">
                            <Button type="submit" className="bg-orange-600 hover:bg-orange-700" disabled={profileUpdating}>
                              {profileUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                              Save contact
                            </Button>
                          </div>
                        </form>
                      )}
                    </Card>

                    {/* Section: Security — collapsible */}
                    <Card className="mb-4 overflow-hidden">
                      <button type="button" onClick={() => toggleSetting("security-section")} className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-neutral-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-neutral-200 text-neutral-700 flex items-center justify-center shrink-0"><ShieldCheck className="w-4 h-4" /></div>
                          <div>
                            <h3 className="font-semibold leading-tight">Security</h3>
                            <p className="text-xs text-neutral-500">Change your password.</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-neutral-400 shrink-0 transition-transform ${openSetting === "security-section" ? "rotate-180" : ""}`} />
                      </button>
                      {openSetting === "security-section" && (
                      <form className="space-y-5 px-5 pb-5 border-t border-neutral-100 pt-5" onSubmit={handlePasswordChange}>
                        <div>
                          <Label htmlFor="current-password">Current Password</Label>
                          <Input
                            id="current-password"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            className="mt-2"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="new-password">New Password</Label>
                          <Input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="mt-2"
                            required
                          />
                          <p className="text-xs text-neutral-500 mt-1">Must be at least 8 characters</p>
                        </div>
                        <div>
                          <Label htmlFor="confirm-password">Confirm New Password</Label>
                          <Input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="mt-2"
                            required
                          />
                        </div>
                        {passwordError && (
                          <p className="text-sm text-red-600">{passwordError}</p>
                        )}
                        <Button type="submit" variant="outline" disabled={passwordChanging}>
                          {passwordChanging && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Change Password
                        </Button>
                      </form>
                      )}
                    </Card>

                    {/* Section: Danger zone — collapsible */}
                    <Card className="mb-4 overflow-hidden border-red-200">
                      <button type="button" onClick={() => toggleSetting("danger-section")} className="w-full flex items-center justify-between gap-3 p-5 text-left hover:bg-red-50 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-red-100 text-red-600 flex items-center justify-center shrink-0"><AlertCircle className="w-4 h-4" /></div>
                          <div>
                            <h3 className="font-semibold leading-tight text-red-900">Deactivate Account</h3>
                            <p className="text-xs text-red-700/80">Disable login. Your data is preserved.</p>
                          </div>
                        </div>
                        <ChevronDown className={`w-5 h-5 text-red-400 shrink-0 transition-transform ${openSetting === "danger-section" ? "rotate-180" : ""}`} />
                      </button>
                      {openSetting === "danger-section" && (
                      <div className="px-5 pb-5 border-t border-red-200 pt-5 bg-red-50">
                      <p className="text-red-800 text-sm mb-6">
                        Deactivating your account will prevent you from logging in. Your data will be preserved but your account will be inactive. Contact support to reactivate.
                      </p>
                      <form className="space-y-4" onSubmit={handleDeactivateAccount}>
                        <div>
                          <Label htmlFor="deactivate-password" className="text-red-900">
                            Confirm your password to deactivate
                          </Label>
                          <Input
                            id="deactivate-password"
                            type="password"
                            value={deactivatePassword}
                            onChange={(e) => setDeactivatePassword(e.target.value)}
                            placeholder="Enter your password"
                            className="mt-2"
                            required
                          />
                        </div>
                        <Button
                          type="submit"
                          variant="outline"
                          className="text-red-600 border-red-600 hover:bg-red-100"
                          disabled={deactivating}
                        >
                          {deactivating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                          Deactivate My Account
                        </Button>
                      </form>
                      </div>
                      )}
                    </Card>
                  </>
                )}
              </div>
            )}

          </motion.div>
        </main>
      </div>

      {/* Top Up Wallet Modal — 2-step guided flow */}
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
            {/* Gradient header + step indicator */}
            <div className="relative bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6">
              <button onClick={() => setShowTopUp(false)} disabled={toppingUp} className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"><X className="w-5 h-5" /></button>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center shrink-0"><Wallet className="w-5 h-5" /></div>
                <div>
                  <h2 className="text-lg font-bold leading-tight">Top Up Wallet</h2>
                  <p className="text-white/80 text-sm">Balance: {formatZar(walletBalance)}</p>
                </div>
              </div>
              {/* Step progress */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-sm font-medium"><span className={`w-6 h-6 rounded-full grid place-items-center text-xs ${topUpStep >= 1 ? "bg-white text-orange-600" : "bg-white/30"}`}>1</span> Amount</div>
                <div className={`flex-1 h-0.5 rounded ${topUpStep === 2 ? "bg-white" : "bg-white/30"}`} />
                <div className="flex items-center gap-2 text-sm font-medium"><span className={`w-6 h-6 rounded-full grid place-items-center text-xs ${topUpStep >= 2 ? "bg-white text-orange-600" : "bg-white/30"}`}>2</span> Payment</div>
              </div>
            </div>

            <div className="p-6">
              {/* STEP 1 — Amount */}
              {topUpStep === 1 && (
                <motion.div initial={reduceMotion ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reduceMotion ? 0 : 0.18 }} className="space-y-5">
                  <div>
                    <Label htmlFor="wallet-topup">How much would you like to add?</Label>
                    <div className="relative mt-2">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-semibold">R</span>
                      <Input id="wallet-topup" type="number" placeholder="0.00" className="pl-8 h-12 text-xl font-semibold" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)} min="1" step="any" autoFocus />
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

              {/* STEP 2 — Payment */}
              {topUpStep === 2 && (
                <motion.div initial={reduceMotion ? false : { opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: reduceMotion ? 0 : 0.18 }}>
                  {/* Live card preview */}
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

                  <form className="space-y-4" onSubmit={handleTopUpSubmit}>
                    <p className="text-xs text-neutral-500 -mt-1">Simulated card — enter any numbers (no real charge).</p>
                    <div>
                      <Label htmlFor="card-number">Card Number</Label>
                      <Input id="card-number" inputMode="numeric" autoComplete="off" placeholder="4111 1111 1111 1111" className="mt-1" disabled={toppingUp}
                        value={topUpCard.cardNumber}
                        onChange={(e) => { const d = e.target.value.replace(/\D/g, "").slice(0, 16); setTopUpCard({ ...topUpCard, cardNumber: d.replace(/(.{4})/g, "$1 ").trim() }); }} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="card-expiry">Expiry (MM/YY)</Label>
                        <Input id="card-expiry" inputMode="numeric" autoComplete="off" placeholder="12/28" className="mt-1" disabled={toppingUp}
                          value={topUpCard.cardExpiry}
                          onChange={(e) => { const d = e.target.value.replace(/\D/g, "").slice(0, 4); setTopUpCard({ ...topUpCard, cardExpiry: d.length <= 2 ? d : `${d.slice(0,2)}/${d.slice(2)}` }); }} />
                      </div>
                      <div>
                        <Label htmlFor="card-cvv">CVV</Label>
                        <Input id="card-cvv" inputMode="numeric" autoComplete="off" placeholder="123" maxLength={4} className="mt-1" disabled={toppingUp}
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

      {/* My Application Detail Dialog */}
      <Dialog open={!!detailApp} onOpenChange={(o) => { if (!o) setDetailApp(null); }}>
        <DialogContent className="sm:max-w-md">
          {detailApp && (
            <>
              <DialogHeader>
                <DialogTitle>{detailApp.roleTitle}</DialogTitle>
                <DialogDescription>{detailApp.npoName}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">Status</span>
                  <Badge
                    className={
                      detailApp.status === "Pending" ? "bg-amber-100 text-amber-700"
                      : detailApp.status === "Accepted" ? "bg-green-100 text-green-700"
                      : detailApp.status === "Completed" ? "bg-blue-100 text-blue-700"
                      : detailApp.status === "Rejected" ? "bg-red-100 text-red-700"
                      : "bg-neutral-100 text-neutral-600"
                    }
                  >
                    {detailApp.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">Applied on</span>
                  <span className="text-sm font-medium">{new Date(detailApp.applicationDate).toLocaleDateString("en-ZA", { year: "numeric", month: "long", day: "numeric" })}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-neutral-500">Hours logged</span>
                  <span className="text-sm font-medium">{detailApp.totalHoursLogged}h</span>
                </div>

                {/* Status explainer */}
                <div className="rounded-lg bg-neutral-50 border border-neutral-100 p-3 text-sm text-neutral-600">
                  {detailApp.status === "Pending" && "Your application is awaiting review by the organization."}
                  {detailApp.status === "Accepted" && "You've been accepted! The organization may log your volunteer hours."}
                  {detailApp.status === "Completed" && "This volunteering has been completed. Your logged hours are kept on your impact."}
                  {detailApp.status === "Rejected" && "This application was not accepted. You can apply to other opportunities."}
                </div>

                {detailApp.status === "Pending" && (
                  <Button
                    variant="outline"
                    className="w-full text-red-600 border-red-200 hover:bg-red-50"
                    disabled={cancelling === detailApp.applicationId}
                    onClick={() => { const id = detailApp.applicationId; setDetailApp(null); handleCancelApplication(id); }}
                  >
                    {cancelling === detailApp.applicationId ? <Loader2 className="w-4 h-4 animate-spin" /> : "Withdraw application"}
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Volunteer Opportunity Detail Dialog */}
      <Dialog open={!!detailOpp} onOpenChange={(o) => { if (!o) setDetailOpp(null); }}>
        <DialogContent className="sm:max-w-lg">
          {detailOpp && (
            <>
              <DialogHeader>
                <DialogTitle>{detailOpp.roleTitle}</DialogTitle>
                <DialogDescription>
                  <button onClick={() => { navigate(`/npo/${detailOpp.npoId}`); setDetailOpp(null); }} className="text-orange-600 hover:underline">
                    {detailOpp.npoName || `NPO #${detailOpp.npoId}`}
                  </button>
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="flex flex-wrap items-center gap-2">
                  {detailOpp.category && <Badge className="bg-blue-100 text-blue-700">{detailOpp.category}</Badge>}
                  <Badge variant="outline">{detailOpp.numOfPositions} position{detailOpp.numOfPositions !== 1 ? "s" : ""}</Badge>
                </div>
                {detailOpp.description && <p className="text-sm text-neutral-700">{detailOpp.description}</p>}
                <div className="space-y-2 text-sm">
                  {detailOpp.timeCommitment && (
                    <div className="flex items-center gap-2"><Clock className="w-4 h-4 text-neutral-400" /><span>{detailOpp.timeCommitment}</span></div>
                  )}
                  {detailOpp.duration && (
                    <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-neutral-400" /><span>Duration: {detailOpp.duration}</span></div>
                  )}
                </div>
                {detailOpp.skillsRequired && (
                  <div className="p-3 bg-neutral-50 rounded-lg"><p className="text-xs text-neutral-600 mb-1">Skills Required:</p><p className="text-sm">{detailOpp.skillsRequired}</p></div>
                )}
                <Button
                  className={`w-full ${appliedOpportunities.includes(detailOpp.opportunityId) ? "bg-green-600 hover:bg-green-700" : "bg-orange-600 hover:bg-orange-700"}`}
                  disabled={appliedOpportunities.includes(detailOpp.opportunityId)}
                  onClick={() => { handleApplyVolunteer(detailOpp.opportunityId); setDetailOpp(null); }}
                >
                  {appliedOpportunities.includes(detailOpp.opportunityId) ? <><CheckCircle className="w-4 h-4 mr-2" /> Applied</> : "Apply Now"}
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* NPO Detail Dialog */}
      <Dialog open={npoDetailOpen} onOpenChange={setNpoDetailOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {npoDetailLoading ? "Loading..." : selectedNpoDetail?.organizationName || "NPO Detail"}
            </DialogTitle>
            <DialogDescription>
              Organization details and information
            </DialogDescription>
          </DialogHeader>
          {npoDetailLoading && (
            <div className="space-y-4 py-4">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          )}
          {selectedNpoDetail && !npoDetailLoading && (
            <div className="space-y-4 py-4">
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-semibold">{selectedNpoDetail.organizationName}</h3>
                {selectedNpoDetail.isVerified && <CheckCircle className="w-5 h-5 text-green-600" />}
              </div>
              {selectedNpoDetail.focusArea && (
                <Badge variant="outline">{selectedNpoDetail.focusArea}</Badge>
              )}
              {selectedNpoDetail.mission && (
                <p className="text-neutral-600 text-sm">{selectedNpoDetail.mission}</p>
              )}
              {selectedNpoDetail.location && (
                <div className="flex items-center gap-2 text-sm text-neutral-600">
                  <MapPin className="w-4 h-4" />
                  <span>{selectedNpoDetail.location}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-neutral-600">
                <Users className="w-4 h-4" />
                <span>{selectedNpoDetail.followerCount} followers</span>
              </div>
              <div className="flex gap-2 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => handleFollow(selectedNpoDetail.npoId)}
                >
                  <Heart
                    className={`w-4 h-4 mr-2 ${
                      followedNpoIds.has(selectedNpoDetail.npoId) ? "fill-red-500 text-red-500" : ""
                    }`}
                  />
                  {followedNpoIds.has(selectedNpoDetail.npoId) ? "Following" : "Follow"}
                </Button>
                <Button
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  onClick={() => {
                    handleDonate(selectedNpoDetail.npoId);
                    setNpoDetailOpen(false);
                  }}
                >
                  Donate
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Donate Modal */}
      {showDonateModal && selectedNPO && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-md w-full p-8"
          >
            <div className="flex items-center justify-between mb-4">
              <h3>{showTopUp ? "Top Up Wallet" : "Make a Donation"}</h3>
              <button onClick={() => setShowDonateModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Wallet Balance Display */}
            <div className="mb-6 p-3 bg-neutral-50 rounded-lg flex items-center justify-between">
              <span className="text-sm text-neutral-600">Your balance:</span>
              <span className="font-semibold text-neutral-900">
                {walletLoading ? "Loading..." : formatZar(walletBalance)}
              </span>
            </div>

            {/* Donate View */}
            {!showTopUp && (
              <form className="space-y-6" onSubmit={handleDonateSubmit}>
                <div>
                  <Label htmlFor="donate-amount">Donation Amount (R)</Label>
                  <Input
                    id="donate-amount"
                    type="number"
                    placeholder="500"
                    className="mt-2"
                    value={donateAmount}
                    onChange={(e) => setDonateAmount(e.target.value)}
                    min="1"
                    step="any"
                  />
                </div>
                <div>
                  <Label>Quick amounts</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setDonateAmount("100")}>R 100</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setDonateAmount("250")}>R 250</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setDonateAmount("500")}>R 500</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setDonateAmount("1000")}>R 1000</Button>
                  </div>
                </div>

                {/* Donate Error */}
                {donateError && (
                  <div className="space-y-2">
                    <p className="text-sm text-red-600">{donateError}</p>
                    {donateError.toLowerCase().includes("insufficient") && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="text-orange-600 border-orange-600 hover:bg-orange-50"
                        onClick={() => setShowTopUp(true)}
                      >
                        <HandCoins className="w-4 h-4 mr-1" />
                        Top Up Wallet
                      </Button>
                    )}
                  </div>
                )}

                <div className="flex gap-3">
                  <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700" disabled={donating}>
                    {donating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Donate Now
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowDonateModal(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            )}

            {/* Top-Up View */}
            {showTopUp && (
              <form className="space-y-6" onSubmit={handleTopUpSubmit}>
                <div>
                  <Label htmlFor="topup-amount">Top Up Amount (R)</Label>
                  <Input
                    id="topup-amount"
                    type="number"
                    placeholder="500"
                    className="mt-2"
                    value={topUpAmount}
                    onChange={(e) => setTopUpAmount(e.target.value)}
                    min="1"
                    step="any"
                  />
                </div>
                <div>
                  <Label>Quick amounts</Label>
                  <div className="grid grid-cols-4 gap-2 mt-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => setTopUpAmount("100")}>R 100</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setTopUpAmount("250")}>R 250</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setTopUpAmount("500")}>R 500</Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setTopUpAmount("1000")}>R 1000</Button>
                  </div>
                </div>

                <CardPaymentFields value={topUpCard} onChange={setTopUpCard} disabled={toppingUp} />

                {/* Top-Up Error */}
                {topUpError && (
                  <p className="text-sm text-red-600">{topUpError}</p>
                )}

                <div className="flex gap-3">
                  <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700" disabled={toppingUp}>
                    {toppingUp && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Top Up Wallet
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowTopUp(false)}>
                    Back to Donate
                  </Button>
                </div>
              </form>
            )}
          </motion.div>
        </div>
      )}

      {/* Volunteer Application Modal */}
      {showVolunteerModal && selectedOpportunity && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-md w-full p-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3>Apply for Volunteer Role</h3>
              <button onClick={() => setShowVolunteerModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <form className="space-y-6" onSubmit={handleVolunteerSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="vol-first-name">First Name</Label>
                  <Input
                    id="vol-first-name"
                    className="mt-2"
                    value={volFirstName}
                    onChange={(e) => setVolFirstName(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="vol-last-name">Last Name</Label>
                  <Input
                    id="vol-last-name"
                    className="mt-2"
                    value={volLastName}
                    onChange={(e) => setVolLastName(e.target.value)}
                    required
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="vol-email">Email</Label>
                <Input
                  id="vol-email"
                  type="email"
                  className="mt-2"
                  value={volEmail}
                  onChange={(e) => setVolEmail(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="vol-phone">Phone Number</Label>
                <Input
                  id="vol-phone"
                  type="tel"
                  placeholder="+27 XX XXX XXXX"
                  className="mt-2"
                  value={volPhone}
                  onChange={(e) => setVolPhone(e.target.value)}
                />
              </div>
              <div>
                <Label>Your Skills</Label>
                <p className="text-xs text-neutral-500 mt-1">Select all that apply.</p>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {SKILL_OPTIONS.map((skill) => {
                    const checked = volSkillSet.includes(skill);
                    return (
                      <label
                        key={skill}
                        className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer"
                      >
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) =>
                            setVolSkillSet((prev) =>
                              v === true ? [...prev, skill] : prev.filter((s) => s !== skill)
                            )
                          }
                        />
                        <span>{skill}</span>
                      </label>
                    );
                  })}
                </div>
                <Input
                  id="vol-skills-other"
                  placeholder="Other skills (optional)"
                  className="mt-3"
                  value={volSkillsOther}
                  onChange={(e) => setVolSkillsOther(e.target.value)}
                />
              </div>
              <div>
                <Label>Your Availability</Label>
                <p className="text-xs text-neutral-500 mt-1">Pick the days and times you're free.</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  {AVAILABILITY_DAYS.map((day) => {
                    const checked = volAvailDays.includes(day);
                    return (
                      <button
                        key={day}
                        type="button"
                        onClick={() =>
                          setVolAvailDays((prev) =>
                            prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
                          )
                        }
                        className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                          checked
                            ? "bg-orange-600 text-white border-orange-600"
                            : "bg-white text-neutral-700 border-neutral-300 hover:border-orange-400"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 flex flex-wrap gap-4">
                  {AVAILABILITY_TIMES.map((time) => {
                    const checked = volAvailTimes.includes(time);
                    return (
                      <label key={time} className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
                        <Checkbox
                          checked={checked}
                          onCheckedChange={(v) =>
                            setVolAvailTimes((prev) =>
                              v === true ? [...prev, time] : prev.filter((t) => t !== time)
                            )
                          }
                        />
                        <span>{time}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
              <div>
                <Label htmlFor="vol-motivation">Why do you want to volunteer?</Label>
                <Textarea
                  id="vol-motivation"
                  placeholder="Tell us about your motivation..."
                  className="mt-2"
                  rows={4}
                  value={volMotivation}
                  onChange={(e) => setVolMotivation(e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                  disabled={applying}
                >
                  {applying && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Submit Application
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowVolunteerModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

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
          canComment={isEmailVerified}
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
      <IdentityVerificationBanner />
    </div>
  );
}
