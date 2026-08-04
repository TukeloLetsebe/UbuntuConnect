import { useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  Heart,
  Search,
  MapPin,
  TrendingUp,
  LogOut,
  Settings,
  Bell,
  DollarSign,
  Users,
  CheckCircle,
  Filter,
  X,
  Calendar,
  FileText,
  Download,
  Building2,
  Target,
  MessageSquare,
  Image as ImageIcon,
  Edit,
  Trash2,
  Eye
} from "lucide-react";

export default function BusinessDashboard() {
  const [activeTab, setActiveTab] = useState("discover");
  const [followedNPOs, setFollowedNPOs] = useState([1, 3]);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [selectedNPO, setSelectedNPO] = useState<number | null>(null);
  const [showViewCampaign, setShowViewCampaign] = useState(false);
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | null>(null);
  const [editingCampaign, setEditingCampaign] = useState(false);

  // Search and Filter states
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedProvince, setSelectedProvince] = useState("All");
  const [selectedVerification, setSelectedVerification] = useState("All");
  const [sortBy, setSortBy] = useState("random");
  const [postSearchQuery, setPostSearchQuery] = useState("");
  const [postCategoryFilter, setPostCategoryFilter] = useState("All");

  // Business profile
  const businessProfile = {
    companyName: "TechCorp Solutions",
    location: "Johannesburg",
    province: "Gauteng",
    csrFocus: ["Education", "Youth Development", "Technology"],
    annualBudget: 500000,
    spentToDate: 145000
  };

  const allNPOs = [
    {
      id: 1,
      name: "Hope Foundation",
      location: "Soweto, Johannesburg",
      province: "Gauteng",
      category: "Education",
      description: "Empowering underprivileged youth through education and mentorship programs.",
      verified: true,
      followers: 248,
      impact: "1,247 students mentored",
      image: "https://images.unsplash.com/photo-1585847812247-4482e9f6f0cd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400"
    },
    {
      id: 2,
      name: "Green Earth Initiative",
      location: "Cape Town",
      province: "Western Cape",
      category: "Environment",
      description: "Community-driven environmental conservation and sustainability projects.",
      verified: true,
      followers: 512,
      impact: "5,000 trees planted",
      image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400"
    },
    {
      id: 3,
      name: "Ubuntu Health Clinic",
      location: "Durban",
      province: "KwaZulu-Natal",
      category: "Healthcare",
      description: "Providing free healthcare services to underserved communities.",
      verified: true,
      followers: 892,
      impact: "12,340 patients treated",
      image: "https://images.unsplash.com/photo-1584982751601-97dcc096659c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400"
    },
    {
      id: 4,
      name: "Tech Skills Academy",
      location: "Soweto, Johannesburg",
      province: "Gauteng",
      category: "Youth Development",
      description: "Teaching coding and digital skills to underprivileged youth.",
      verified: false,
      followers: 198,
      impact: "87 youth trained",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400"
    }
  ];

  const [myCampaigns, setMyCampaigns] = useState([
    {
      id: 1,
      title: "Technology Skills Partnership",
      category: "Youth Development",
      budget: 50000,
      positions: 3,
      requirements: "Must be verified, focus on technology/digital skills training for youth",
      deadline: "2026-05-30",
      status: "Active",
      applicants: 5
    },
    {
      id: 2,
      title: "Education Support Initiative",
      category: "Education",
      budget: 75000,
      positions: 2,
      requirements: "Verified NPOs working in Gauteng schools",
      deadline: "2026-06-15",
      status: "Active",
      applicants: 8
    }
  ]);

  const myDonations = [
    { id: 1, npo: "Hope Foundation", amount: 50000, date: "2026-03-15", project: "Youth Mentorship Program", hasReceipt: true },
    { id: 2, npo: "Ubuntu Health Clinic", amount: 25000, date: "2026-02-20", project: "Mobile Health Van", hasReceipt: true },
    { id: 3, npo: "Tech Skills Academy", amount: 70000, date: "2026-01-10", project: "Coding Bootcamp", hasReceipt: true }
  ];

  // All NPO posts (for community updates - everyone can see these)
  const allNPOPosts = [
    {
      id: 1,
      npoId: 1,
      npoName: "Hope Foundation",
      category: "Education",
      title: "Community Library Opening Success!",
      description: "We're thrilled to announce that our community library officially opened its doors last week! Over 200 community members attended the opening ceremony, and we've already registered 150 new library members. Thank you to all our supporters who made this dream a reality.",
      image: "https://images.unsplash.com/photo-1521587760476-6c12a4b040da?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
      date: "2026-04-15",
      likes: 45,
      comments: 12
    },
    {
      id: 2,
      npoId: 3,
      npoName: "Ubuntu Health Clinic",
      category: "Healthcare",
      title: "Mobile Health Clinic Serves 500 Patients",
      description: "This month, our mobile health clinic provided free healthcare services to over 500 patients in underserved areas. We're making healthcare accessible to those who need it most. Your donations are saving lives!",
      image: "https://images.unsplash.com/photo-1584982751601-97dcc096659c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
      date: "2026-04-10",
      likes: 89,
      comments: 24
    },
    {
      id: 3,
      npoId: 4,
      npoName: "Tech Skills Academy",
      category: "Youth Development",
      title: "100 Youth Trained in Coding Skills",
      description: "We've successfully trained 100 young people in coding and digital skills! Our graduates are now securing employment and building better futures.",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
      date: "2026-04-12",
      likes: 52,
      comments: 15
    },
    {
      id: 4,
      npoId: 2,
      npoName: "Green Earth Initiative",
      category: "Environment",
      title: "Tree Planting Drive Success!",
      description: "Our community came together to plant 1,000 trees this month! This brings our total to 5,000 trees planted. Together, we're making a real difference in combating climate change.",
      image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
      date: "2026-04-08",
      likes: 67,
      comments: 18
    }
  ];

  // Posts from followed NPOs only
  const npoPosts = allNPOPosts.filter(post => followedNPOs.includes(post.npoId));

  // Filter posts for community updates
  const filteredCommunityPosts = allNPOPosts.filter(post => {
    const matchesSearch = postSearchQuery === "" ||
      post.title.toLowerCase().includes(postSearchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(postSearchQuery.toLowerCase()) ||
      post.npoName.toLowerCase().includes(postSearchQuery.toLowerCase());

    const matchesCategory = postCategoryFilter === "All" || post.category === postCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  const handleFollow = (id: number) => {
    if (followedNPOs.includes(id)) {
      setFollowedNPOs(followedNPOs.filter(npoId => npoId !== id));
    } else {
      setFollowedNPOs([...followedNPOs, id]);
    }
  };

  const handleDonate = (id: number) => {
    setSelectedNPO(id);
    setShowDonateModal(true);
  };

  const handleLogout = () => {
    window.location.href = "/";
  };

  const totalDonated = myDonations.reduce((sum, donation) => sum + donation.amount, 0);
  const nposSupported = [...new Set(myDonations.map(d => d.npo))].length;
  const remainingBudget = businessProfile.annualBudget - businessProfile.spentToDate;

  // Shuffle array randomly
  const shuffleArray = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Filter and sort NPOs
  const filteredNPOs = allNPOs.filter(npo => {
    const matchesSearch = searchQuery === "" ||
      npo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      npo.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      npo.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      npo.category.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === "All" || npo.category === selectedCategory;
    const matchesProvince = selectedProvince === "All" || npo.province === selectedProvince;
    const matchesVerification =
      selectedVerification === "All" ||
      (selectedVerification === "Verified" && npo.verified) ||
      (selectedVerification === "Pending" && !npo.verified);

    return matchesSearch && matchesCategory && matchesProvince && matchesVerification;
  }).sort((a, b) => {
    if (sortBy === "random") return 0;
    if (sortBy === "newest") return 0;
    if (sortBy === "nearest") {
      if (a.province === businessProfile.province && b.province !== businessProfile.province) return -1;
      if (b.province === businessProfile.province && a.province !== businessProfile.province) return 1;
      return 0;
    }
    return 0;
  });

  const displayNPOs = sortBy === "random" ? shuffleArray(filteredNPOs) : filteredNPOs;

  const calculateDaysRemaining = (deadline: string) => {
    const days = Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 py-4 px-6">
        <div className="container mx-auto max-w-7xl flex items-center justify-between">
          <Link to="/" className="text-xl text-neutral-900">
            UbuntuConnect
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm">
              <Bell className="w-4 h-4" />
            </Button>
            <span className="text-neutral-600">{businessProfile.companyName}</span>
            <Button variant="outline" size="sm" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-neutral-200 min-h-[calc(100vh-73px)] p-6 sticky top-0 h-screen overflow-y-auto">
          <nav className="space-y-2">
            <button
              onClick={() => setActiveTab("discover")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "discover"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <Search className="w-5 h-5" />
              Discover NPOs
            </button>
            <button
              onClick={() => setActiveTab("following")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "following"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <Heart className="w-5 h-5" />
              Following ({followedNPOs.length})
            </button>
            <button
              onClick={() => setActiveTab("campaigns")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "campaigns"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <Target className="w-5 h-5" />
              My Campaigns
            </button>
            <button
              onClick={() => setActiveTab("donations")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "donations"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <DollarSign className="w-5 h-5" />
              My Donations
            </button>
            <button
              onClick={() => setActiveTab("reports")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "reports"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <FileText className="w-5 h-5" />
              Reports & Compliance
            </button>
            <button
              onClick={() => setActiveTab("community")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "community"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              Community Updates
            </button>
            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "profile"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <Settings className="w-5 h-5" />
              Company Profile
            </button>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Discover NPOs Tab */}
            {activeTab === "discover" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">Discover Organizations</h1>
                  <p className="text-neutral-600">Find verified NPOs for B-BBEE and CSR partnerships</p>
                </div>

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

                  <div className="grid md:grid-cols-5 gap-4 mb-6">
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
                      </select>
                    </div>
                    <div>
                      <Label>Province</Label>
                      <select
                        className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-md"
                        value={selectedProvince}
                        onChange={(e) => setSelectedProvince(e.target.value)}
                      >
                        <option value="All">All Provinces</option>
                        <option value="Gauteng">Gauteng</option>
                        <option value="Western Cape">Western Cape</option>
                        <option value="KwaZulu-Natal">KwaZulu-Natal</option>
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
                      <Label>Sort By</Label>
                      <select
                        className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-md"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                      >
                        <option value="random">Random (Fair)</option>
                        <option value="nearest">Nearest to Me</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setSearchQuery("");
                          setSelectedCategory("All");
                          setSelectedProvince("All");
                          setSelectedVerification("All");
                          setSortBy("random");
                        }}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </div>

                  <p className="text-sm text-neutral-600 mb-6">
                    Showing {displayNPOs.length} organization{displayNPOs.length !== 1 ? "s" : ""}
                  </p>
                </div>

                {/* NPOs Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {displayNPOs.map((npo) => (
                    <Card key={npo.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="relative h-48">
                        <ImageWithFallback
                          src={npo.image}
                          alt={npo.name}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <h3>{npo.name}</h3>
                              {npo.verified && <CheckCircle className="w-5 h-5 text-green-600" />}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-neutral-600">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-4 h-4" />
                                {npo.location}
                              </span>
                              <Badge variant="outline">{npo.category}</Badge>
                            </div>
                          </div>
                        </div>
                        <p className="text-neutral-600 text-sm mb-4">{npo.description}</p>
                        <div className="flex items-center justify-between text-sm mb-4">
                          <span className="text-neutral-600">
                            <Users className="w-4 h-4 inline mr-1" />
                            {npo.followers} followers
                          </span>
                          <span className="text-green-600">{npo.impact}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => handleFollow(npo.id)}
                          >
                            <Heart
                              className={`w-4 h-4 mr-2 ${
                                followedNPOs.includes(npo.id) ? "fill-red-500 text-red-500" : ""
                              }`}
                            />
                            {followedNPOs.includes(npo.id) ? "Following" : "Follow"}
                          </Button>
                          <Button
                            className="flex-1 bg-orange-600 hover:bg-orange-700"
                            onClick={() => handleDonate(npo.id)}
                          >
                            Partner & Donate
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Following Tab */}
            {activeTab === "following" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">Organizations You Follow</h1>
                  <p className="text-neutral-600">NPOs you're tracking for partnerships</p>
                </div>

                {followedNPOs.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Heart className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                    <h3 className="mb-2">No organizations followed yet</h3>
                    <p className="text-neutral-600 mb-4">Start following NPOs to track potential partners</p>
                    <Button onClick={() => setActiveTab("discover")}>Discover NPOs</Button>
                  </Card>
                ) : (
                  <>
                    {/* Recent Posts from Followed NPOs */}
                    {npoPosts.length > 0 && (
                      <div className="mb-12">
                        <h2 className="mb-6">Recent Updates from Partners</h2>
                        <div className="space-y-6">
                          {npoPosts.map((post) => (
                            <Card key={post.id} className="overflow-hidden">
                              <div className="p-6">
                                <div className="flex items-center gap-3 mb-4">
                                  <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                                    <Heart className="w-5 h-5 text-orange-600" />
                                  </div>
                                  <div>
                                    <h3 className="text-sm">{post.npoName}</h3>
                                    <p className="text-xs text-neutral-600">
                                      {new Date(post.date).toLocaleDateString("en-ZA", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric"
                                      })}
                                    </p>
                                  </div>
                                </div>

                                <h3 className="mb-2">{post.title}</h3>
                                <p className="text-neutral-600 mb-4">{post.description}</p>

                                {post.image && (
                                  <div className="mb-4">
                                    <img
                                      src={post.image}
                                      alt={post.title}
                                      className="w-full h-64 object-cover rounded-lg"
                                    />
                                  </div>
                                )}

                                <div className="flex items-center gap-6 text-sm text-neutral-600">
                                  <span className="flex items-center gap-1">
                                    <Heart className="w-4 h-4" />
                                    {post.likes} likes
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MessageSquare className="w-4 h-4" />
                                    {post.comments} comments
                                  </span>
                                </div>
                              </div>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Followed NPOs List */}
                    <div>
                      <h2 className="mb-6">Partner Organizations</h2>
                      <div className="space-y-6">
                        {allNPOs.filter(npo => followedNPOs.includes(npo.id)).map((npo) => (
                      <Card key={npo.id} className="p-6">
                        <div className="flex items-start gap-6">
                          <div className="w-32 h-32 rounded-lg overflow-hidden flex-shrink-0">
                            <ImageWithFallback
                              src={npo.image}
                              alt={npo.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-start justify-between mb-3">
                              <div>
                                <div className="flex items-center gap-2 mb-1">
                                  <h3>{npo.name}</h3>
                                  {npo.verified && <CheckCircle className="w-5 h-5 text-green-600" />}
                                </div>
                                <div className="flex items-center gap-3 text-sm text-neutral-600 mb-2">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {npo.location}
                                  </span>
                                  <Badge variant="outline">{npo.category}</Badge>
                                </div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleFollow(npo.id)}
                              >
                                Unfollow
                              </Button>
                            </div>
                            <p className="text-neutral-600 mb-4">{npo.description}</p>
                            <div className="flex items-center gap-6 mb-4">
                              <span className="text-sm text-neutral-600">
                                <Users className="w-4 h-4 inline mr-1" />
                                {npo.followers} followers
                              </span>
                              <span className="text-sm text-green-600">{npo.impact}</span>
                            </div>
                            <div className="pt-4 border-t border-neutral-200">
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-neutral-600">Ready to partner</p>
                                <Button size="sm" onClick={() => handleDonate(npo.id)}>
                                  Start Partnership
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* My Campaigns Tab */}
            {activeTab === "campaigns" && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className="mb-2">My Partnership Campaigns</h1>
                    <p className="text-neutral-600">Post opportunities for NPOs to apply</p>
                  </div>
                  <Button
                    className="bg-orange-600 hover:bg-orange-700"
                    onClick={() => setShowCampaignModal(true)}
                  >
                    <Target className="w-4 h-4 mr-2" />
                    Create Campaign
                  </Button>
                </div>

                <div className="space-y-6">
                  {myCampaigns.map((campaign) => {
                    return (
                      <Card key={campaign.id} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <div className="flex items-center gap-3 mb-2">
                              <h3>{campaign.title}</h3>
                              <Badge className="bg-green-100 text-green-700">{campaign.status}</Badge>
                            </div>
                            <div className="flex items-center gap-4 text-sm text-neutral-600 mb-3">
                              <span className="flex items-center gap-1">
                                <DollarSign className="w-4 h-4" />
                                R {campaign.budget.toLocaleString()} budget
                              </span>
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {campaign.positions} positions
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mb-4 p-4 bg-neutral-50 rounded-lg">
                          <p className="text-sm text-neutral-600 mb-1">Requirements:</p>
                          <p className="text-sm">{campaign.requirements}</p>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-sm text-neutral-600">{campaign.applicants} NPOs applied</span>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedCampaignId(campaign.id);
                                setEditingCampaign(false);
                                setShowViewCampaign(true);
                              }}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedCampaignId(campaign.id);
                                setEditingCampaign(true);
                                setShowViewCampaign(true);
                              }}
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="text-red-600 hover:bg-red-50"
                              onClick={() => {
                                if (confirm(`Are you sure you want to delete "${campaign.title}"? This action cannot be undone.`)) {
                                  setMyCampaigns(myCampaigns.filter(c => c.id !== campaign.id));
                                }
                              }}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {myCampaigns.length === 0 && (
                  <Card className="p-12 text-center">
                    <Target className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                    <h3 className="mb-2">No campaigns yet</h3>
                    <p className="text-neutral-600 mb-4">Create a campaign to attract the right NPO partners</p>
                    <Button onClick={() => setShowCampaignModal(true)}>Create Your First Campaign</Button>
                  </Card>
                )}
              </div>
            )}

            {/* My Donations Tab */}
            {activeTab === "donations" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">My Donations</h1>
                  <p className="text-neutral-600">Partnership contributions and impact</p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <Card className="p-6">
                    <div className="text-neutral-600 text-sm mb-2">Total Contributed</div>
                    <div className="text-3xl mb-1">R {totalDonated.toLocaleString()}</div>
                    <div className="text-sm text-green-600">This year</div>
                  </Card>
                  <Card className="p-6">
                    <div className="text-neutral-600 text-sm mb-2">NPO Partners</div>
                    <div className="text-3xl mb-1">{nposSupported}</div>
                    <div className="text-sm text-neutral-600">Organizations</div>
                  </Card>
                  <Card className="p-6">
                    <div className="text-neutral-600 text-sm mb-2">Budget Remaining</div>
                    <div className="text-3xl mb-1">R {remainingBudget.toLocaleString()}</div>
                    <div className="text-sm text-neutral-600">Available for partnerships</div>
                  </Card>
                </div>

                <Card className="p-6">
                  <h3 className="mb-4">Contribution History</h3>
                  <div className="space-y-4">
                    {myDonations.map((donation) => (
                      <div key={donation.id} className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg">
                        <div className="flex-1">
                          <p className="mb-1">{donation.npo}</p>
                          <p className="text-sm text-neutral-600">{donation.project} • {new Date(donation.date).toLocaleDateString("en-ZA")}</p>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-lg text-green-600">R {donation.amount.toLocaleString()}</p>
                            <Badge className="bg-green-100 text-green-700">Completed</Badge>
                          </div>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Receipt
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}

            {/* Reports & Compliance Tab */}
            {activeTab === "reports" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">Reports & Compliance</h1>
                  <p className="text-neutral-600">Download tax receipts and CSR reports for B-BBEE compliance</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <h3 className="mb-4">Tax Receipts (Section 18A)</h3>
                    <p className="text-neutral-600 text-sm mb-6">Download official tax-deductible donation receipts</p>
                    <div className="space-y-3 mb-6">
                      {myDonations.filter(d => d.hasReceipt).map((donation) => (
                        <div key={donation.id} className="flex items-center justify-between p-3 bg-neutral-50 rounded-lg">
                          <div>
                            <p className="text-sm">{donation.npo}</p>
                            <p className="text-xs text-neutral-600">{new Date(donation.date).toLocaleDateString("en-ZA")}</p>
                          </div>
                          <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Download
                          </Button>
                        </div>
                      ))}
                    </div>
                    <Button variant="outline" className="w-full">
                      Download All Receipts (PDF)
                    </Button>
                  </Card>

                  <Card className="p-6">
                    <h3 className="mb-4">CSR Impact Reports</h3>
                    <p className="text-neutral-600 text-sm mb-6">Generate reports for stakeholders and board</p>
                    <div className="space-y-3">
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="w-4 h-4 mr-2" />
                        Annual CSR Report 2026
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="w-4 h-4 mr-2" />
                        Quarterly Impact Summary Q1 2026
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="w-4 h-4 mr-2" />
                        B-BBEE Scorecard Contribution
                      </Button>
                      <Button variant="outline" className="w-full justify-start">
                        <FileText className="w-4 h-4 mr-2" />
                        Donation History Export (CSV)
                      </Button>
                    </div>
                  </Card>

                  <Card className="p-6 md:col-span-2">
                    <h3 className="mb-4">B-BBEE Compliance Summary</h3>
                    <div className="grid md:grid-cols-3 gap-6 mb-6">
                      <div>
                        <p className="text-neutral-600 text-sm mb-2">SED Points Target</p>
                        <p className="text-2xl">15 points</p>
                      </div>
                      <div>
                        <p className="text-neutral-600 text-sm mb-2">Current Points</p>
                        <p className="text-2xl text-green-600">12 points</p>
                      </div>
                      <div>
                        <p className="text-neutral-600 text-sm mb-2">Required Spending</p>
                        <p className="text-2xl">R 145,000</p>
                      </div>
                    </div>
                    <Button className="bg-orange-600 hover:bg-orange-700">
                      <Download className="w-4 h-4 mr-2" />
                      Download B-BBEE Report
                    </Button>
                  </Card>
                </div>
              </div>
            )}

            {/* Community Updates Tab */}
            {activeTab === "community" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">Community Updates</h1>
                  <p className="text-neutral-600">See what's happening across all NPOs</p>
                </div>

                {/* Search and Filter */}
                <div className="mb-8">
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <Label>Search Posts</Label>
                      <Input
                        placeholder="Search by title, NPO name, or keyword..."
                        className="mt-2"
                        value={postSearchQuery}
                        onChange={(e) => setPostSearchQuery(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Category</Label>
                      <select
                        className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-md"
                        value={postCategoryFilter}
                        onChange={(e) => setPostCategoryFilter(e.target.value)}
                      >
                        <option value="All">All Categories</option>
                        <option value="Education">Education</option>
                        <option value="Healthcare">Healthcare</option>
                        <option value="Environment">Environment</option>
                        <option value="Youth Development">Youth Development</option>
                        <option value="Food Security">Food Security</option>
                      </select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          setPostSearchQuery("");
                          setPostCategoryFilter("All");
                        }}
                      >
                        Clear Filters
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Posts Grid */}
                <div className="grid md:grid-cols-2 gap-6">
                  {filteredCommunityPosts.map((post) => (
                    <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      {post.image && (
                        <div className="relative h-48">
                          <ImageWithFallback
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
                            <Heart className="w-5 h-5 text-orange-600" />
                          </div>
                          <div>
                            <h3 className="text-sm">{post.npoName}</h3>
                            <Badge variant="outline" className="text-xs">{post.category}</Badge>
                          </div>
                        </div>
                        <h3 className="mb-2">{post.title}</h3>
                        <p className="text-neutral-600 text-sm mb-4 line-clamp-3">
                          {post.description}
                        </p>
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1 text-neutral-600">
                              <Heart className="w-4 h-4" />
                              {post.likes}
                            </span>
                            <span className="flex items-center gap-1 text-neutral-600">
                              <MessageSquare className="w-4 h-4" />
                              {post.comments}
                            </span>
                          </div>
                          <span className="text-neutral-600">
                            {new Date(post.date).toLocaleDateString("en-ZA", {
                              year: "numeric",
                              month: "short",
                              day: "numeric"
                            })}
                          </span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>

                {filteredCommunityPosts.length === 0 && (
                  <Card className="p-12 text-center">
                    <MessageSquare className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                    <h3 className="mb-2">No posts found</h3>
                    <p className="text-neutral-600">Try adjusting your search or filters</p>
                  </Card>
                )}
              </div>
            )}

            {/* Profile Settings Tab */}
            {activeTab === "profile" && (
              <div>
                <div className="mb-8">
                  <h1 className="mb-2">Company Profile</h1>
                  <p className="text-neutral-600">Manage your organization's information</p>
                </div>

                <Card className="p-8">
                  <form className="space-y-6">
                    <div>
                      <Label htmlFor="company-name">Company Name</Label>
                      <Input id="company-name" defaultValue="TechCorp Solutions" className="mt-2" />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="registration">Company Registration Number</Label>
                        <Input id="registration" defaultValue="2015/123456/07" className="mt-2" />
                      </div>
                      <div>
                        <Label htmlFor="industry">Industry</Label>
                        <Input id="industry" defaultValue="Technology & Software" className="mt-2" />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="contact-person">Contact Person</Label>
                        <Input id="contact-person" defaultValue="John Smith" className="mt-2" />
                      </div>
                      <div>
                        <Label htmlFor="job-title">Job Title</Label>
                        <Input id="job-title" defaultValue="CSR Manager" className="mt-2" />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" type="email" defaultValue="john.smith@techcorp.com" className="mt-2" />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" defaultValue="+27 11 234 5678" className="mt-2" />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Head Office Address</Label>
                      <Input id="address" defaultValue="123 Business Park, Sandton, Johannesburg" className="mt-2" />
                    </div>

                    <div>
                      <Label htmlFor="csr-budget">Annual CSR Budget (R)</Label>
                      <Input id="csr-budget" type="number" defaultValue="500000" className="mt-2" />
                    </div>

                    <div>
                      <Label htmlFor="csr-focus">CSR Focus Areas</Label>
                      <Input id="csr-focus" defaultValue="Education, Youth Development, Technology" className="mt-2" />
                    </div>

                    <div>
                      <Label htmlFor="csr-goals">CSR Goals & Objectives</Label>
                      <Textarea
                        id="csr-goals"
                        defaultValue="Support technology education for underprivileged youth. Meet B-BBEE SED targets. Build sustainable community partnerships."
                        className="mt-2"
                        rows={4}
                      />
                    </div>

                    <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                      Save Changes
                    </Button>
                  </form>
                </Card>

                <Card className="p-8 mt-8">
                  <h3 className="mb-6">Change Password</h3>
                  <form className="space-y-6">
                    <div>
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" className="mt-2" />
                    </div>
                    <div>
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" className="mt-2" />
                    </div>
                    <div>
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input id="confirm-password" type="password" className="mt-2" />
                    </div>
                    <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                      Update Password
                    </Button>
                  </form>
                </Card>

                <Card className="p-8 mt-8 border-red-200 bg-red-50">
                  <h3 className="mb-4 text-red-700">Delete Account</h3>
                  <p className="text-neutral-600 mb-6">
                    Once you delete your account, there is no going back. Please be certain. All your data, campaigns, and contributions will be permanently removed.
                  </p>
                  <Button
                    type="button"
                    className="bg-red-600 hover:bg-red-700"
                    onClick={() => {
                      if (confirm("Are you absolutely sure you want to delete your account? This action cannot be undone.")) {
                        alert("Account deletion functionality would be implemented here with proper authentication and data cleanup.");
                      }
                    }}
                  >
                    Delete My Account
                  </Button>
                </Card>
              </div>
            )}
          </motion.div>
        </main>
      </div>

      {/* Create Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3>Create Partnership Campaign</h3>
              <button onClick={() => setShowCampaignModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form className="space-y-6">
              <div>
                <Label htmlFor="campaign-title">Campaign Title</Label>
                <Input
                  id="campaign-title"
                  placeholder="e.g., Technology Skills Partnership"
                  className="mt-2"
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="category">Category</Label>
                  <select id="category" className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-md">
                    <option>Education</option>
                    <option>Youth Development</option>
                    <option>Healthcare</option>
                    <option>Environment</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="budget">Budget Per Partner (R)</Label>
                  <Input id="budget" type="number" placeholder="50000" className="mt-2" />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="positions">Number of Partners</Label>
                  <Input id="positions" type="number" placeholder="3" className="mt-2" />
                </div>
                <div>
                  <Label htmlFor="deadline">Application Deadline</Label>
                  <Input id="deadline" type="date" className="mt-2" />
                </div>
              </div>

              <div>
                <Label htmlFor="requirements">Partnership Requirements</Label>
                <Textarea
                  id="requirements"
                  placeholder="e.g., Must be verified, focus on technology/digital skills, based in Gauteng..."
                  className="mt-2"
                  rows={4}
                />
              </div>

              <div>
                <Label htmlFor="description">Campaign Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe what you're looking for in NPO partners and what the partnership will involve..."
                  className="mt-2"
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">
                  Create Campaign
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCampaignModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Donate Modal */}
      {showDonateModal && selectedNPO && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-md w-full p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3>Partnership Contribution</h3>
              <button onClick={() => setShowDonateModal(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form className="space-y-6">
              <div>
                <Label htmlFor="amount">Contribution Amount (R)</Label>
                <Input id="amount" type="number" placeholder="50000" className="mt-2" />
              </div>

              <div>
                <Label htmlFor="project">Support Project (Optional)</Label>
                <select id="project" className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-md">
                  <option value="">General Partnership</option>
                  <option value="1">Specific Project</option>
                </select>
              </div>

              <div>
                <Label htmlFor="payment">Payment Method</Label>
                <select id="payment" className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-md">
                  <option value="eft">EFT</option>
                  <option value="card">Corporate Card</option>
                </select>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">
                  Contribute Now
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowDonateModal(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* View/Edit Campaign Modal */}
      {showViewCampaign && selectedCampaignId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
          >
            {(() => {
              const campaign = myCampaigns.find(c => c.id === selectedCampaignId);
              if (!campaign) return null;

              return (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3>{editingCampaign ? "Edit Campaign" : "Campaign Details"}</h3>
                    <button onClick={() => { setShowViewCampaign(false); setSelectedCampaignId(null); setEditingCampaign(false); }}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {editingCampaign ? (
                    <form
                      className="space-y-6"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        setMyCampaigns(myCampaigns.map(c =>
                          c.id === campaign.id
                            ? {
                                ...c,
                                title: formData.get("title") as string,
                                category: formData.get("category") as string,
                                budget: parseFloat(formData.get("budget") as string),
                                positions: parseInt(formData.get("positions") as string),
                                requirements: formData.get("requirements") as string,
                                deadline: formData.get("deadline") as string,
                              }
                            : c
                        ));
                        setShowViewCampaign(false);
                        setSelectedCampaignId(null);
                        setEditingCampaign(false);
                      }}
                    >
                      <div>
                        <Label htmlFor="title">Campaign Title</Label>
                        <Input
                          id="title"
                          name="title"
                          defaultValue={campaign.title}
                          className="mt-2"
                          required
                        />
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="category">Category</Label>
                          <Input
                            id="category"
                            name="category"
                            defaultValue={campaign.category}
                            className="mt-2"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="budget">Budget (R)</Label>
                          <Input
                            id="budget"
                            name="budget"
                            type="number"
                            defaultValue={campaign.budget}
                            className="mt-2"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <Label htmlFor="positions">Number of Positions</Label>
                          <Input
                            id="positions"
                            name="positions"
                            type="number"
                            defaultValue={campaign.positions}
                            className="mt-2"
                            required
                          />
                        </div>
                        <div>
                          <Label htmlFor="deadline">Application Deadline</Label>
                          <Input
                            id="deadline"
                            name="deadline"
                            type="date"
                            defaultValue={campaign.deadline}
                            className="mt-2"
                            required
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="requirements">Requirements</Label>
                        <Textarea
                          id="requirements"
                          name="requirements"
                          defaultValue={campaign.requirements}
                          className="mt-2"
                          rows={4}
                          required
                        />
                      </div>

                      <div className="flex gap-3 pt-4 border-t">
                        <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">
                          Save Changes
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => { setShowViewCampaign(false); setSelectedCampaignId(null); setEditingCampaign(false); }}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <div className="space-y-6">
                      <div className="flex items-center gap-3">
                        <Badge className="bg-green-100 text-green-700">{campaign.status}</Badge>
                        <span className="text-sm text-neutral-600">{campaign.category}</span>
                      </div>

                      <div className="bg-neutral-50 p-6 rounded-lg space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <div className="text-sm text-neutral-600 mb-1">Budget</div>
                            <div className="text-lg font-semibold">R {campaign.budget.toLocaleString()}</div>
                          </div>
                          <div>
                            <div className="text-sm text-neutral-600 mb-1">Positions Available</div>
                            <div className="text-lg font-semibold">{campaign.positions}</div>
                          </div>
                          <div>
                            <div className="text-sm text-neutral-600 mb-1">Applications</div>
                            <div className="text-lg font-semibold">{campaign.applicants} NPOs</div>
                          </div>
                          <div>
                            <div className="text-sm text-neutral-600 mb-1">Deadline</div>
                            <div className="text-lg font-semibold">{new Date(campaign.deadline).toLocaleDateString()}</div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h4 className="mb-3">Requirements</h4>
                        <p className="text-neutral-600 whitespace-pre-wrap">{campaign.requirements}</p>
                      </div>

                      <div className="flex gap-3 pt-4 border-t">
                        <Button
                          className="flex-1 bg-orange-600 hover:bg-orange-700"
                          onClick={() => setEditingCampaign(true)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Campaign
                        </Button>
                        <Button
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => {
                            if (confirm(`Are you sure you want to delete "${campaign.title}"? This action cannot be undone.`)) {
                              setMyCampaigns(myCampaigns.filter(c => c.id !== campaign.id));
                              setShowViewCampaign(false);
                              setSelectedCampaignId(null);
                            }
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => { setShowViewCampaign(false); setSelectedCampaignId(null); setEditingCampaign(false); }}
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  )}
                </>
              );
            })()}
          </motion.div>
        </div>
      )}
    </div>
  );
}
