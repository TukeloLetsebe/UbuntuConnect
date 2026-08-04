import { useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import {
  Users,
  Heart,
  TrendingUp,
  FileText,
  CheckCircle,
  AlertCircle,
  Plus,
  Settings,
  LogOut,
  BarChart3,
  Upload,
  DollarSign,
  UserPlus,
  X,
  Check,
  Clock,
  Calendar,
  Wallet,
  ArrowDownToLine,
  ArrowUpRight,
  CreditCard,
  Edit,
  Trash2,
  MessageSquare,
  Image
} from "lucide-react";

export default function NPODashboard() {
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreateOpportunity, setShowCreateOpportunity] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [showViewPost, setShowViewPost] = useState(false);
  const [selectedPost, setSelectedPost] = useState<number | null>(null);
  const [editingPost, setEditingPost] = useState<number | null>(null);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [selectedNPO, setSelectedNPO] = useState<number | null>(null);
  const [followedNPOs, setFollowedNPOs] = useState<number[]>([2, 4]);
  const [postSearchQuery, setPostSearchQuery] = useState("");
  const [postCategoryFilter, setPostCategoryFilter] = useState("All");
  const [showCreateCampaign, setShowCreateCampaign] = useState(false);
  const [showViewCampaign, setShowViewCampaign] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<number | null>(null);
  const [campaignFormData, setCampaignFormData] = useState({
    name: "",
    targetAmount: "",
    deadline: "",
    purpose: "",
    budget: ""
  });
  const [myCampaigns, setMyCampaigns] = useState([
    {
      id: 1,
      name: "Community Library Construction",
      description: "Building a safe space for learning",
      targetAmount: 100000,
      raisedAmount: 45000,
      contributors: 23,
      daysRemaining: 45,
      status: "active" as const,
      purpose: "Build a modern library facility to serve 500+ community members",
      budget: "Construction: R60,000 | Books & Resources: R25,000 | Furniture: R15,000"
    }
  ]);
  const [walletBalance, setWalletBalance] = useState(45230);
  const [posts, setPosts] = useState([
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
      npoId: 1,
      npoName: "Hope Foundation",
      category: "Education",
      title: "Youth Mentorship Program Milestone",
      description: "Our youth mentorship program has reached an incredible milestone - 100 students successfully completed their first semester! We've seen remarkable improvements in academic performance and personal development. Special thanks to our dedicated volunteer mentors.",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
      date: "2026-04-10",
      likes: 67,
      comments: 18
    },
    {
      id: 3,
      npoId: 3,
      npoName: "Ubuntu Health Clinic",
      category: "Healthcare",
      title: "Mobile Health Clinic Serves 500 Patients",
      description: "This month, our mobile health clinic provided free healthcare services to over 500 patients in underserved areas. We're making healthcare accessible to those who need it most. Your donations are saving lives!",
      image: "https://images.unsplash.com/photo-1584982751601-97dcc096659c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
      date: "2026-04-05",
      likes: 89,
      comments: 24
    },
    {
      id: 4,
      npoId: 2,
      npoName: "Green Earth Initiative",
      category: "Environment",
      title: "Tree Planting Drive Success!",
      description: "Our community came together to plant 1,000 trees this month! This brings our total to 5,000 trees planted. Together, we're making a real difference in combating climate change.",
      image: "https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
      date: "2026-04-12",
      likes: 52,
      comments: 15
    }
  ]);

  // All NPOs for discovery
  const allNPOs = [
    {
      id: 2,
      name: "Green Earth Initiative",
      location: "Cape Town",
      category: "Environment",
      description: "Community-driven environmental conservation and sustainability projects.",
      verified: true,
      followers: 512,
      impact: "5,000 trees planted"
    },
    {
      id: 3,
      name: "Ubuntu Health Clinic",
      location: "Durban",
      category: "Healthcare",
      description: "Providing free healthcare services to underserved communities.",
      verified: true,
      followers: 892,
      impact: "12,340 patients treated"
    },
    {
      id: 4,
      name: "Feed the Future",
      location: "Pretoria",
      category: "Food Security",
      description: "Fighting hunger by providing meals to children and families in need.",
      verified: false,
      followers: 324,
      impact: "45,000 meals served"
    }
  ];
  const [volunteerApplications, setVolunteerApplications] = useState([
    { id: 1, name: "Themba Khumalo", email: "themba.k@email.com", phone: "+27 82 345 6789", opportunity: "Youth Mentorship", status: "pending", appliedDate: "2026-04-10", skills: "Teaching, Counseling", availability: "Weekends" },
    { id: 2, name: "Nokuthula Dlamini", email: "noku.d@email.com", phone: "+27 83 456 7890", opportunity: "After-School Care", status: "pending", appliedDate: "2026-04-11", skills: "Childcare, First Aid", availability: "Afternoons" },
    { id: 3, name: "Sipho Mokoena", email: "sipho.m@email.com", phone: "+27 84 567 8901", opportunity: "Community Library", status: "pending", appliedDate: "2026-04-12", skills: "Library Management", availability: "Flexible" },
  ]);
  const [activeVolunteers, setActiveVolunteers] = useState([
    { id: 4, name: "Zanele Sithole", email: "zanele.s@email.com", opportunity: "Youth Mentorship", joinedDate: "2026-02-15", hoursContributed: 45 },
    { id: 5, name: "Bongani Mthethwa", email: "bongani.m@email.com", opportunity: "Sports Development", joinedDate: "2026-01-20", hoursContributed: 62 },
    { id: 6, name: "Lerato Nkosi", email: "lerato.n@email.com", opportunity: "After-School Care", joinedDate: "2026-03-05", hoursContributed: 38 },
  ]);
  const [transactions, setTransactions] = useState([
    { id: 1, type: "donation", from: "Sarah Mthembu", amount: 500, date: "2026-04-13", status: "completed", method: "Card" },
    { id: 2, type: "donation", from: "TechCorp Solutions", amount: 5000, date: "2026-04-12", status: "completed", method: "EFT" },
    { id: 3, type: "withdrawal", to: "FNB Account ***4532", amount: -10000, date: "2026-04-10", status: "completed", method: "Bank Transfer" },
    { id: 4, type: "donation", from: "Thabo Ndlovu", amount: 250, date: "2026-04-09", status: "completed", method: "Card" },
    { id: 5, type: "donation", from: "Lindiwe Maseko", amount: 800, date: "2026-04-08", status: "completed", method: "Card" },
    { id: 6, type: "donation", from: "Anonymous", amount: 1500, date: "2026-04-07", status: "completed", method: "Card" },
    { id: 7, type: "withdrawal", to: "FNB Account ***4532", amount: -15000, date: "2026-04-05", status: "completed", method: "Bank Transfer" },
    { id: 8, type: "donation", from: "Business Partnership", amount: 20000, date: "2026-04-03", status: "completed", method: "EFT" },
  ]);

  const handleLogout = () => {
    window.location.href = "/";
  };

  const handleAcceptVolunteer = (id: number) => {
    const application = volunteerApplications.find(app => app.id === id);
    if (application) {
      setActiveVolunteers([...activeVolunteers, {
        id: application.id,
        name: application.name,
        email: application.email,
        opportunity: application.opportunity,
        joinedDate: new Date().toISOString().split('T')[0],
        hoursContributed: 0
      }]);
      setVolunteerApplications(volunteerApplications.filter(app => app.id !== id));
    }
  };

  const handleRejectVolunteer = (id: number) => {
    setVolunteerApplications(volunteerApplications.filter(app => app.id !== id));
  };

  const handleRemoveVolunteer = (id: number) => {
    setActiveVolunteers(activeVolunteers.filter(vol => vol.id !== id));
  };

  const handleDeletePost = (id: number) => {
    if (confirm("Are you sure you want to delete this post?")) {
      setPosts(posts.filter(post => post.id !== id));
    }
  };

  const handleViewPost = (id: number) => {
    setSelectedPost(id);
    setShowViewPost(true);
  };

  const handleFollowNPO = (id: number) => {
    if (followedNPOs.includes(id)) {
      setFollowedNPOs(followedNPOs.filter(npoId => npoId !== id));
    } else {
      setFollowedNPOs([...followedNPOs, id]);
    }
  };

  const handleDonateToNPO = (id: number) => {
    setSelectedNPO(id);
    setShowDonateModal(true);
  };

  // Filter posts for community updates
  const filteredPosts = posts.filter(post => {
    const matchesSearch = postSearchQuery === "" ||
      post.title.toLowerCase().includes(postSearchQuery.toLowerCase()) ||
      post.description.toLowerCase().includes(postSearchQuery.toLowerCase()) ||
      post.npoName.toLowerCase().includes(postSearchQuery.toLowerCase());

    const matchesCategory = postCategoryFilter === "All" || post.category === postCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Header */}
      <header className="bg-white border-b border-neutral-200 py-4 px-6">
        <div className="container mx-auto max-w-7xl flex items-center justify-between">
          <Link to="/" className="text-xl text-neutral-900">
            UbuntuConnect
          </Link>
          <div className="flex items-center gap-4">
            <span className="text-neutral-600">Hope Foundation</span>
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
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "overview"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <BarChart3 className="w-5 h-5" />
              Overview
            </button>
            <button
              onClick={() => setActiveTab("discover")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "discover"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <Users className="w-5 h-5" />
              Discover NPOs
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
              Organization Profile
            </button>
            <button
              onClick={() => setActiveTab("projects")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "projects"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <FileText className="w-5 h-5" />
              Projects & Initiatives
            </button>
            <button
              onClick={() => setActiveTab("impact")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "impact"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <TrendingUp className="w-5 h-5" />
              Impact Tracking
            </button>
            <button
              onClick={() => setActiveTab("supporters")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "supporters"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <Users className="w-5 h-5" />
              Supporters
            </button>
            <button
              onClick={() => setActiveTab("funding")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "funding"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <DollarSign className="w-5 h-5" />
              Funding Requests
            </button>
            <button
              onClick={() => setActiveTab("volunteers")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "volunteers"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <UserPlus className="w-5 h-5" />
              Volunteers
            </button>
            <button
              onClick={() => setActiveTab("finances")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "finances"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <Wallet className="w-5 h-5" />
              Finances & Wallet
            </button>
            <button
              onClick={() => setActiveTab("posts")}
              className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                activeTab === "posts"
                  ? "bg-orange-50 text-orange-600"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              Posts & Updates
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
                  <p className="text-neutral-600">Support other NPOs in your community (Ubuntu spirit!)</p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {allNPOs.map((npo) => (
                    <Card key={npo.id} className="p-6 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <h3>{npo.name}</h3>
                            {npo.verified && <CheckCircle className="w-5 h-5 text-green-600" />}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-neutral-600">
                            <span>{npo.location}</span>
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
                          onClick={() => handleFollowNPO(npo.id)}
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
                          onClick={() => handleDonateToNPO(npo.id)}
                        >
                          Donate
                        </Button>
                      </div>
                    </Card>
                  ))}
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
                  {filteredPosts.map((post) => (
                    <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      {post.image && (
                        <div className="relative h-48">
                          <img
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

                {filteredPosts.length === 0 && (
                  <Card className="p-12 text-center">
                    <MessageSquare className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                    <h3 className="mb-2">No posts found</h3>
                    <p className="text-neutral-600">Try adjusting your search or filters</p>
                  </Card>
                )}
              </div>
            )}

            {/* Overview Tab */}
            {activeTab === "overview" && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className="mb-2">Dashboard Overview</h1>
                    <p className="text-neutral-600">Welcome back to Hope Foundation</p>
                  </div>
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="w-4 h-4 mr-2" />
                    New Update
                  </Button>
                </div>

                {/* Stats Grid */}
                <div className="grid md:grid-cols-4 gap-6 mb-8">
                  <Card className="p-6 cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab("finances")}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-neutral-600 text-sm">Wallet Balance</span>
                      <Wallet className="w-5 h-5 text-neutral-400" />
                    </div>
                    <div className="text-3xl mb-1">R {walletBalance.toLocaleString()}</div>
                    <div className="text-sm text-green-600">Available to withdraw</div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-neutral-600 text-sm">Total Supporters</span>
                      <Users className="w-5 h-5 text-neutral-400" />
                    </div>
                    <div className="text-3xl mb-1">248</div>
                    <div className="text-sm text-green-600">+12 this month</div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-neutral-600 text-sm">Active Volunteers</span>
                      <UserPlus className="w-5 h-5 text-neutral-400" />
                    </div>
                    <div className="text-3xl mb-1">{activeVolunteers.length}</div>
                    <div className="text-sm text-amber-600">{volunteerApplications.length} pending</div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-neutral-600 text-sm">Active Projects</span>
                      <FileText className="w-5 h-5 text-neutral-400" />
                    </div>
                    <div className="text-3xl mb-1">6</div>
                    <div className="text-sm text-neutral-600">2 completed</div>
                  </Card>
                </div>

                {/* Recent Activity */}
                <Card className="p-6">
                  <h3 className="mb-4">Recent Activity</h3>
                  <div className="space-y-4">
                    <div className="flex items-start gap-4 pb-4 border-b border-neutral-200">
                      <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <UserPlus className="w-5 h-5 text-orange-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm mb-1">New volunteer application</p>
                        <p className="text-xs text-neutral-600">Themba K. applied for Youth Mentorship • 1 hour ago</p>
                      </div>
                      <Button size="sm" onClick={() => setActiveTab("volunteers")}>
                        Review
                      </Button>
                    </div>
                    <div className="flex items-start gap-4 pb-4 border-b border-neutral-200">
                      <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <Heart className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm mb-1">New donation received</p>
                        <p className="text-xs text-neutral-600">R 500 from Sarah M. • 2 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 pb-4 border-b border-neutral-200">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <Users className="w-5 h-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm mb-1">5 new followers</p>
                        <p className="text-xs text-neutral-600">Your profile is gaining traction • 5 hours ago</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <FileText className="w-5 h-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm mb-1">Project update published</p>
                        <p className="text-xs text-neutral-600">"Youth Mentorship Program" milestone reached • Yesterday</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            )}

            {/* Organization Profile Tab */}
            {activeTab === "profile" && (
              <div>
                <h1 className="mb-8">Organization Profile</h1>

                <Card className="p-8">
                  <form className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="org-name">Organization Name</Label>
                        <Input
                          id="org-name"
                          defaultValue="Hope Foundation"
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="registration">NPO Registration Number</Label>
                        <Input
                          id="registration"
                          defaultValue="123-456-NPO"
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="mission">Mission Statement</Label>
                      <Textarea
                        id="mission"
                        defaultValue="Empowering underprivileged youth through education and mentorship programs."
                        className="mt-2"
                        rows={4}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="email">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          defaultValue="contact@hopefoundation.org"
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone</Label>
                        <Input
                          id="phone"
                          defaultValue="+27 11 234 5678"
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="address">Physical Address</Label>
                      <Input
                        id="address"
                        defaultValue="123 Community Street, Soweto, Johannesburg"
                        className="mt-2"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="focus-area">Focus Area</Label>
                        <Input
                          id="focus-area"
                          defaultValue="Education, Youth Development"
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="founded">Year Founded</Label>
                        <Input
                          id="founded"
                          defaultValue="2018"
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="website">Website</Label>
                      <Input
                        id="website"
                        placeholder="https://yourwebsite.org"
                        className="mt-2"
                      />
                    </div>

                    <div>
                      <Label htmlFor="logo">Organization Logo</Label>
                      <div className="mt-2 border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center">
                        <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                        <p className="text-sm text-neutral-600 mb-2">Click to upload or drag and drop</p>
                        <p className="text-xs text-neutral-500">PNG, JPG up to 2MB</p>
                      </div>
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
                    Once you delete your account, there is no going back. Please be certain. All your data, campaigns, posts, and volunteer opportunities will be permanently removed.
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

            {/* Projects Tab */}
            {activeTab === "projects" && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h1>Projects & Initiatives</h1>
                  <Button className="bg-orange-600 hover:bg-orange-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Create Project
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="mb-1">Youth Mentorship Program</h3>
                        <p className="text-sm text-neutral-600">Supporting 50 high school students</p>
                      </div>
                      <Badge className="bg-green-100 text-green-700">Active</Badge>
                    </div>
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-neutral-600">Progress</span>
                        <span>75%</span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2">
                        <div className="bg-orange-600 h-2 rounded-full" style={{ width: "75%" }} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Post Update
                      </Button>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="mb-1">Community Library</h3>
                        <p className="text-sm text-neutral-600">Building a reading space for all ages</p>
                      </div>
                      <Badge className="bg-blue-100 text-blue-700">Fundraising</Badge>
                    </div>
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-neutral-600">Funding</span>
                        <span>R 45,000 / R 100,000</span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2">
                        <div className="bg-orange-600 h-2 rounded-full" style={{ width: "45%" }} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Post Update
                      </Button>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="mb-1">After-School Care</h3>
                        <p className="text-sm text-neutral-600">Safe space for 30 children daily</p>
                      </div>
                      <Badge className="bg-green-100 text-green-700">Active</Badge>
                    </div>
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-neutral-600">Progress</span>
                        <span>60%</span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2">
                        <div className="bg-orange-600 h-2 rounded-full" style={{ width: "60%" }} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        View Details
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Post Update
                      </Button>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="mb-1">Sports Development</h3>
                        <p className="text-sm text-neutral-600">Football training for youth</p>
                      </div>
                      <Badge className="bg-gray-100 text-gray-700">Completed</Badge>
                    </div>
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-sm mb-2">
                        <span className="text-neutral-600">Progress</span>
                        <span>100%</span>
                      </div>
                      <div className="w-full bg-neutral-200 rounded-full h-2">
                        <div className="bg-green-600 h-2 rounded-full" style={{ width: "100%" }} />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1">
                        View Report
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1">
                        Archive
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Impact Tracking Tab */}
            {activeTab === "impact" && (
              <div>
                <h1 className="mb-8">Impact Tracking</h1>

                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <Card className="p-6">
                    <div className="text-neutral-600 text-sm mb-2">People Reached</div>
                    <div className="text-4xl mb-1">1,247</div>
                    <div className="text-sm text-green-600">+156 this quarter</div>
                  </Card>

                  <Card className="p-6">
                    <div className="text-neutral-600 text-sm mb-2">Students Mentored</div>
                    <div className="text-4xl mb-1">340</div>
                    <div className="text-sm text-green-600">+45 this quarter</div>
                  </Card>

                  <Card className="p-6">
                    <div className="text-neutral-600 text-sm mb-2">Community Events</div>
                    <div className="text-4xl mb-1">18</div>
                    <div className="text-sm text-neutral-600">This year</div>
                  </Card>
                </div>

                <Card className="p-8">
                  <h3 className="mb-6">Record New Impact</h3>
                  <form className="space-y-6">
                    <div>
                      <Label htmlFor="metric">Impact Metric</Label>
                      <Input
                        id="metric"
                        placeholder="e.g., Students enrolled, Meals served, Books distributed"
                        className="mt-2"
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                      <div>
                        <Label htmlFor="value">Value</Label>
                        <Input
                          id="value"
                          type="number"
                          placeholder="e.g., 25"
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label htmlFor="period">Period</Label>
                        <Input
                          id="period"
                          placeholder="e.g., March 2026, Q1 2026"
                          className="mt-2"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Provide context about this impact..."
                        className="mt-2"
                        rows={4}
                      />
                    </div>

                    <Button className="bg-orange-600 hover:bg-orange-700">
                      Record Impact
                    </Button>
                  </form>
                </Card>
              </div>
            )}

            {/* Supporters Tab */}
            {activeTab === "supporters" && (
              <div>
                <h1 className="mb-8">Supporters & Donors</h1>

                <div className="grid gap-4">
                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
                          <span className="text-lg">SM</span>
                        </div>
                        <div>
                          <h3 className="mb-1">Sarah Mthembu</h3>
                          <p className="text-sm text-neutral-600">Individual Donor • Following since Jan 2026</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-neutral-600 mb-1">Total Contributed</div>
                        <div className="text-lg">R 2,500</div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
                          <span className="text-lg">TN</span>
                        </div>
                        <div>
                          <h3 className="mb-1">Thabo Ndlovu</h3>
                          <p className="text-sm text-neutral-600">Monthly Supporter • Following since Nov 2025</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-neutral-600 mb-1">Total Contributed</div>
                        <div className="text-lg">R 1,200</div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                          <span className="text-lg">TC</span>
                        </div>
                        <div>
                          <h3 className="mb-1">TechCorp Solutions</h3>
                          <p className="text-sm text-neutral-600">Business Partner • CSR Partnership since Oct 2025</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-neutral-600 mb-1">Total Contributed</div>
                        <div className="text-lg">R 25,000</div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
                          <span className="text-lg">LM</span>
                        </div>
                        <div>
                          <h3 className="mb-1">Lindiwe Maseko</h3>
                          <p className="text-sm text-neutral-600">Volunteer & Donor • Following since Feb 2026</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-neutral-600 mb-1">Total Contributed</div>
                        <div className="text-lg">R 800</div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Funding Requests Tab */}
            {activeTab === "funding" && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <h1>Funding Requests</h1>
                  <Button
                    className="bg-orange-600 hover:bg-orange-700"
                    onClick={() => setShowCreateCampaign(!showCreateCampaign)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    New Funding Request
                  </Button>
                </div>

                {/* Create Campaign Form */}
                {showCreateCampaign && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                  >
                    <Card className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h3>Create Funding Request</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCreateCampaign(false)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <form
                        className="space-y-6"
                        onSubmit={(e) => {
                          e.preventDefault();
                          const newCampaign = {
                            id: myCampaigns.length + 1,
                            name: campaignFormData.name,
                            description: campaignFormData.purpose.substring(0, 100) + "...",
                            targetAmount: parseFloat(campaignFormData.targetAmount),
                            raisedAmount: 0,
                            contributors: 0,
                            daysRemaining: Math.floor((new Date(campaignFormData.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
                            status: "active" as const,
                            purpose: campaignFormData.purpose,
                            budget: campaignFormData.budget
                          };
                          setMyCampaigns([...myCampaigns, newCampaign]);
                          setCampaignFormData({
                            name: "",
                            targetAmount: "",
                            deadline: "",
                            purpose: "",
                            budget: ""
                          });
                          setShowCreateCampaign(false);
                        }}
                      >
                        <div>
                          <Label htmlFor="campaign-name">Campaign Name</Label>
                          <Input
                            id="campaign-name"
                            placeholder="e.g., Build Community Library"
                            className="mt-2"
                            value={campaignFormData.name}
                            onChange={(e) => setCampaignFormData({...campaignFormData, name: e.target.value})}
                            required
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <Label htmlFor="target-amount">Target Amount (R)</Label>
                            <Input
                              id="target-amount"
                              type="number"
                              placeholder="100000"
                              className="mt-2"
                              value={campaignFormData.targetAmount}
                              onChange={(e) => setCampaignFormData({...campaignFormData, targetAmount: e.target.value})}
                              required
                            />
                          </div>
                          <div>
                            <Label htmlFor="deadline">Deadline</Label>
                            <Input
                              id="deadline"
                              type="date"
                              className="mt-2"
                              value={campaignFormData.deadline}
                              onChange={(e) => setCampaignFormData({...campaignFormData, deadline: e.target.value})}
                              required
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="purpose">Purpose & Goals</Label>
                          <Textarea
                            id="purpose"
                            placeholder="Explain what this funding will be used for and the impact it will create..."
                            className="mt-2"
                            rows={4}
                            value={campaignFormData.purpose}
                            onChange={(e) => setCampaignFormData({...campaignFormData, purpose: e.target.value})}
                            required
                          />
                        </div>

                        <div>
                          <Label htmlFor="budget">Budget Breakdown</Label>
                          <Textarea
                            id="budget"
                            placeholder="Provide a detailed breakdown of how funds will be allocated..."
                            className="mt-2"
                            rows={4}
                            value={campaignFormData.budget}
                            onChange={(e) => setCampaignFormData({...campaignFormData, budget: e.target.value})}
                            required
                          />
                        </div>

                        <div>
                          <Label>Campaign Images</Label>
                          <div className="mt-2 border-2 border-dashed border-neutral-300 rounded-lg p-8 text-center">
                            <Upload className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
                            <p className="text-sm text-neutral-600 mb-2">Upload images to showcase your campaign</p>
                            <p className="text-xs text-neutral-500">PNG, JPG up to 5MB each</p>
                          </div>
                        </div>

                        <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                          Create Campaign
                        </Button>
                      </form>
                    </Card>
                  </motion.div>
                )}

                <h2 className="mt-12 mb-6">Active Campaigns</h2>
                {myCampaigns.length === 0 ? (
                  <Card className="p-8 text-center">
                    <p className="text-neutral-600">No campaigns yet. Create your first funding request above!</p>
                  </Card>
                ) : (
                  <div className="space-y-6">
                    {myCampaigns.map((campaign) => (
                      <Card key={campaign.id} className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="mb-1">{campaign.name}</h3>
                            <p className="text-sm text-neutral-600">{campaign.description}</p>
                          </div>
                          <Badge className="bg-green-100 text-green-700">
                            {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                          </Badge>
                        </div>
                        <div className="mb-4">
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-neutral-600">Raised</span>
                            <span>
                              R {campaign.raisedAmount.toLocaleString()} of R {campaign.targetAmount.toLocaleString()} (
                              {Math.round((campaign.raisedAmount / campaign.targetAmount) * 100)}%)
                            </span>
                          </div>
                          <div className="w-full bg-neutral-200 rounded-full h-2">
                            <div
                              className="bg-orange-600 h-2 rounded-full"
                              style={{ width: `${(campaign.raisedAmount / campaign.targetAmount) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm mb-4">
                          <span className="text-neutral-600">{campaign.contributors} contributors</span>
                          <span className="text-neutral-600">{campaign.daysRemaining} days remaining</span>
                        </div>
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setSelectedCampaign(campaign.id);
                              setShowViewCampaign(true);
                            }}
                          >
                            View Details
                          </Button>
                          <Button
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete "${campaign.name}"? This action cannot be undone.`)) {
                                setMyCampaigns(myCampaigns.filter(c => c.id !== campaign.id));
                              }
                            }}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Volunteers Tab */}
            {activeTab === "volunteers" && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className="mb-2">Volunteer Management</h1>
                    <p className="text-neutral-600">Manage volunteer opportunities and applications</p>
                  </div>
                  <Button
                    className="bg-orange-600 hover:bg-orange-700"
                    onClick={() => setShowCreateOpportunity(!showCreateOpportunity)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Opportunity
                  </Button>
                </div>

                {/* Create Volunteer Opportunity Form */}
                {showCreateOpportunity && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                  >
                    <Card className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h3>Create Volunteer Opportunity</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowCreateOpportunity(false)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <form className="space-y-6">
                        <div>
                          <Label htmlFor="opportunity-title">Opportunity Title</Label>
                          <Input
                            id="opportunity-title"
                            placeholder="e.g., Youth Mentor, Library Assistant"
                            className="mt-2"
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <Label htmlFor="category">Category</Label>
                            <Input
                              id="category"
                              placeholder="e.g., Education, Community Service"
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label htmlFor="positions">Number of Positions</Label>
                            <Input
                              id="positions"
                              type="number"
                              placeholder="5"
                              className="mt-2"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="description">Description</Label>
                          <Textarea
                            id="description"
                            placeholder="Describe the volunteer role, responsibilities, and requirements..."
                            className="mt-2"
                            rows={4}
                          />
                        </div>

                        <div className="grid md:grid-cols-2 gap-6">
                          <div>
                            <Label htmlFor="time-commitment">Time Commitment</Label>
                            <Input
                              id="time-commitment"
                              placeholder="e.g., 4 hours/week, Weekends only"
                              className="mt-2"
                            />
                          </div>
                          <div>
                            <Label htmlFor="duration">Duration</Label>
                            <Input
                              id="duration"
                              placeholder="e.g., 3 months, Ongoing"
                              className="mt-2"
                            />
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="skills-required">Skills Required</Label>
                          <Input
                            id="skills-required"
                            placeholder="e.g., Teaching, First Aid, Computer Literacy"
                            className="mt-2"
                          />
                        </div>

                        <div className="flex gap-3">
                          <Button type="submit" className="bg-orange-600 hover:bg-orange-700">
                            Create Opportunity
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowCreateOpportunity(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </Card>
                  </motion.div>
                )}

                {/* Tabs for Applications and Active Volunteers */}
                <Tabs defaultValue="applications" className="w-full">
                  <TabsList className="mb-6">
                    <TabsTrigger value="applications" className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Pending Applications ({volunteerApplications.length})
                    </TabsTrigger>
                    <TabsTrigger value="active" className="flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      Active Volunteers ({activeVolunteers.length})
                    </TabsTrigger>
                    <TabsTrigger value="opportunities" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      All Opportunities
                    </TabsTrigger>
                  </TabsList>

                  {/* Pending Applications */}
                  <TabsContent value="applications">
                    <div className="space-y-4">
                      {volunteerApplications.length === 0 ? (
                        <Card className="p-12 text-center">
                          <UserPlus className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                          <p className="text-neutral-600">No pending applications</p>
                        </Card>
                      ) : (
                        volunteerApplications.map((application) => (
                          <Card key={application.id} className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-start gap-4">
                                  <div className="w-14 h-14 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                                    <span className="text-lg">
                                      {application.name.split(' ').map(n => n[0]).join('')}
                                    </span>
                                  </div>
                                  <div className="flex-1">
                                    <div className="flex items-start justify-between mb-2">
                                      <div>
                                        <h3 className="mb-1">{application.name}</h3>
                                        <p className="text-sm text-neutral-600">Applied for: {application.opportunity}</p>
                                      </div>
                                      <Badge className="bg-amber-100 text-amber-700">Pending</Badge>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4 text-sm mb-4">
                                      <div>
                                        <span className="text-neutral-600">Email:</span> {application.email}
                                      </div>
                                      <div>
                                        <span className="text-neutral-600">Phone:</span> {application.phone}
                                      </div>
                                      <div>
                                        <span className="text-neutral-600">Skills:</span> {application.skills}
                                      </div>
                                      <div>
                                        <span className="text-neutral-600">Availability:</span> {application.availability}
                                      </div>
                                      <div className="md:col-span-2">
                                        <span className="text-neutral-600">Applied:</span> {new Date(application.appliedDate).toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}
                                      </div>
                                    </div>
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => handleAcceptVolunteer(application.id)}
                                      >
                                        <Check className="w-4 h-4 mr-2" />
                                        Accept
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="text-red-600 hover:bg-red-50"
                                        onClick={() => handleRejectVolunteer(application.id)}
                                      >
                                        <X className="w-4 h-4 mr-2" />
                                        Reject
                                      </Button>
                                      <Button size="sm" variant="outline">
                                        View Full Application
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  {/* Active Volunteers */}
                  <TabsContent value="active">
                    <div className="space-y-4">
                      {activeVolunteers.length === 0 ? (
                        <Card className="p-12 text-center">
                          <Users className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                          <p className="text-neutral-600">No active volunteers yet</p>
                        </Card>
                      ) : (
                        activeVolunteers.map((volunteer) => (
                          <Card key={volunteer.id} className="p-6">
                            <div className="flex items-start justify-between">
                              <div className="flex items-start gap-4 flex-1">
                                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                                  <span className="text-lg">
                                    {volunteer.name.split(' ').map(n => n[0]).join('')}
                                  </span>
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-start justify-between mb-2">
                                    <div>
                                      <h3 className="mb-1">{volunteer.name}</h3>
                                      <p className="text-sm text-neutral-600">{volunteer.opportunity}</p>
                                    </div>
                                    <Badge className="bg-green-100 text-green-700">Active</Badge>
                                  </div>
                                  <div className="grid md:grid-cols-3 gap-4 text-sm mb-4">
                                    <div>
                                      <span className="text-neutral-600">Email:</span> {volunteer.email}
                                    </div>
                                    <div>
                                      <span className="text-neutral-600">Joined:</span> {new Date(volunteer.joinedDate).toLocaleDateString('en-ZA', { year: 'numeric', month: 'short' })}
                                    </div>
                                    <div>
                                      <span className="text-neutral-600">Hours:</span> {volunteer.hoursContributed}h
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button size="sm" variant="outline">
                                      <Calendar className="w-4 h-4 mr-2" />
                                      Schedule
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      Log Hours
                                    </Button>
                                    <Button size="sm" variant="outline">
                                      Send Message
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      className="text-red-600 hover:bg-red-50"
                                      onClick={() => handleRemoveVolunteer(volunteer.id)}
                                    >
                                      <X className="w-4 h-4 mr-2" />
                                      Remove
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Card>
                        ))
                      )}
                    </div>
                  </TabsContent>

                  {/* All Opportunities */}
                  <TabsContent value="opportunities">
                    <div className="grid md:grid-cols-2 gap-6">
                      <Card className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="mb-1">Youth Mentorship</h3>
                            <p className="text-sm text-neutral-600">Help guide young students</p>
                          </div>
                          <Badge className="bg-green-100 text-green-700">Active</Badge>
                        </div>
                        <div className="space-y-2 text-sm mb-4">
                          <div className="flex justify-between">
                            <span className="text-neutral-600">Positions:</span>
                            <span>5 available</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-600">Time:</span>
                            <span>4 hours/week</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-600">Applications:</span>
                            <span>8 pending</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 text-red-600 hover:bg-red-50">
                            Close
                          </Button>
                        </div>
                      </Card>

                      <Card className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="mb-1">After-School Care Assistant</h3>
                            <p className="text-sm text-neutral-600">Support children's activities</p>
                          </div>
                          <Badge className="bg-green-100 text-green-700">Active</Badge>
                        </div>
                        <div className="space-y-2 text-sm mb-4">
                          <div className="flex justify-between">
                            <span className="text-neutral-600">Positions:</span>
                            <span>3 available</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-600">Time:</span>
                            <span>Afternoons</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-600">Applications:</span>
                            <span>5 pending</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 text-red-600 hover:bg-red-50">
                            Close
                          </Button>
                        </div>
                      </Card>

                      <Card className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="mb-1">Community Library Helper</h3>
                            <p className="text-sm text-neutral-600">Organize books and assist visitors</p>
                          </div>
                          <Badge className="bg-green-100 text-green-700">Active</Badge>
                        </div>
                        <div className="space-y-2 text-sm mb-4">
                          <div className="flex justify-between">
                            <span className="text-neutral-600">Positions:</span>
                            <span>2 available</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-600">Time:</span>
                            <span>Flexible</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-600">Applications:</span>
                            <span>3 pending</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 text-red-600 hover:bg-red-50">
                            Close
                          </Button>
                        </div>
                      </Card>

                      <Card className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="mb-1">Sports Coach</h3>
                            <p className="text-sm text-neutral-600">Train youth football teams</p>
                          </div>
                          <Badge className="bg-gray-100 text-gray-700">Closed</Badge>
                        </div>
                        <div className="space-y-2 text-sm mb-4">
                          <div className="flex justify-between">
                            <span className="text-neutral-600">Positions:</span>
                            <span>0 available</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-600">Time:</span>
                            <span>Weekends</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-neutral-600">Applications:</span>
                            <span>0 pending</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            Reopen
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1 text-red-600 hover:bg-red-50">
                            Delete
                          </Button>
                        </div>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {/* Finances & Wallet Tab */}
            {activeTab === "finances" && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className="mb-2">Finances & Wallet</h1>
                    <p className="text-neutral-600">Manage your funds, transactions, and withdrawals</p>
                  </div>
                  <Button
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => setShowWithdrawModal(!showWithdrawModal)}
                  >
                    <ArrowDownToLine className="w-4 h-4 mr-2" />
                    Withdraw Funds
                  </Button>
                </div>

                {/* Wallet Balance Card */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                  <Card className="p-8 bg-gradient-to-br from-green-500 to-green-600 text-white">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                        <Wallet className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-white/80 text-sm">Available Balance</p>
                        <h2 className="text-white">R {walletBalance.toLocaleString()}</h2>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                      onClick={() => setShowWithdrawModal(true)}
                    >
                      Withdraw Now
                    </Button>
                  </Card>

                  <Card className="p-6">
                    <div className="text-neutral-600 text-sm mb-2">This Month</div>
                    <div className="text-3xl mb-1">R 8,550</div>
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <ArrowUpRight className="w-4 h-4" />
                      +18% from last month
                    </div>
                  </Card>

                  <Card className="p-6">
                    <div className="text-neutral-600 text-sm mb-2">Year to Date</div>
                    <div className="text-3xl mb-1">R 67,780</div>
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <ArrowUpRight className="w-4 h-4" />
                      Total received in 2026
                    </div>
                  </Card>
                </div>

                {/* Withdraw Funds Form */}
                {showWithdrawModal && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                  >
                    <Card className="p-8">
                      <div className="flex items-center justify-between mb-6">
                        <h3>Withdraw Funds</h3>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowWithdrawModal(false)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                      <form className="space-y-6">
                        <div className="bg-neutral-50 p-4 rounded-lg">
                          <div className="flex items-center justify-between">
                            <span className="text-neutral-600">Available Balance</span>
                            <span className="text-xl">R {walletBalance.toLocaleString()}</span>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor="withdraw-amount">Withdrawal Amount (R)</Label>
                          <Input
                            id="withdraw-amount"
                            type="number"
                            placeholder="Enter amount"
                            className="mt-2"
                            max={walletBalance}
                          />
                          <p className="text-xs text-neutral-500 mt-1">
                            Minimum withdrawal: R 100 | Maximum: R {walletBalance.toLocaleString()}
                          </p>
                        </div>

                        <div>
                          <Label htmlFor="bank-account">Bank Account</Label>
                          <select
                            id="bank-account"
                            className="w-full mt-2 px-3 py-2 border border-neutral-300 rounded-md"
                          >
                            <option value="">Select bank account</option>
                            <option value="1">FNB - Account ending in 4532</option>
                            <option value="2">Standard Bank - Account ending in 7821</option>
                            <option value="3">Add new bank account</option>
                          </select>
                        </div>

                        <div>
                          <Label htmlFor="withdrawal-reason">Purpose/Reason (Optional)</Label>
                          <Textarea
                            id="withdrawal-reason"
                            placeholder="e.g., Project expenses, Salaries, Equipment purchase"
                            className="mt-2"
                            rows={3}
                          />
                        </div>

                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <div className="flex gap-3">
                            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                            <div className="text-sm text-blue-900">
                              <p className="mb-1">Processing time: 1-3 business days</p>
                              <p>No withdrawal fees applied</p>
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-3">
                          <Button type="submit" className="bg-green-600 hover:bg-green-700">
                            <ArrowDownToLine className="w-4 h-4 mr-2" />
                            Request Withdrawal
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowWithdrawModal(false)}
                          >
                            Cancel
                          </Button>
                        </div>
                      </form>
                    </Card>
                  </motion.div>
                )}

                {/* Transaction History */}
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3>Transaction History</h3>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        Filter
                      </Button>
                      <Button variant="outline" size="sm">
                        Export
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {transactions.map((transaction) => (
                      <div
                        key={transaction.id}
                        className="flex items-center justify-between p-4 border border-neutral-200 rounded-lg hover:bg-neutral-50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              transaction.type === "donation"
                                ? "bg-green-100"
                                : "bg-orange-100"
                            }`}
                          >
                            {transaction.type === "donation" ? (
                              <Heart className="w-5 h-5 text-green-600" />
                            ) : (
                              <ArrowDownToLine className="w-5 h-5 text-orange-600" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm mb-1">
                              {transaction.type === "donation"
                                ? `Donation from ${transaction.from}`
                                : `Withdrawal to ${transaction.to}`}
                            </p>
                            <p className="text-xs text-neutral-600">
                              {new Date(transaction.date).toLocaleDateString("en-ZA", {
                                year: "numeric",
                                month: "long",
                                day: "numeric",
                              })}{" "}
                              • {transaction.method}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p
                            className={`text-lg mb-1 ${
                              transaction.amount > 0 ? "text-green-600" : "text-neutral-900"
                            }`}
                          >
                            {transaction.amount > 0 ? "+" : ""}R{" "}
                            {Math.abs(transaction.amount).toLocaleString()}
                          </p>
                          <Badge
                            className={`${
                              transaction.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : "bg-amber-100 text-amber-700"
                            }`}
                          >
                            {transaction.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 text-center">
                    <Button variant="outline">Load More Transactions</Button>
                  </div>
                </Card>

                {/* Financial Summary */}
                <div className="grid md:grid-cols-2 gap-6 mt-8">
                  <Card className="p-6">
                    <h3 className="mb-4">Income Breakdown (2026)</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-600">Individual Donations</span>
                        <span>R 32,500</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-600">Corporate Partnerships</span>
                        <span>R 25,000</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-600">Grants</span>
                        <span>R 10,280</span>
                      </div>
                      <div className="border-t pt-3 mt-3">
                        <div className="flex items-center justify-between">
                          <span>Total Income</span>
                          <span>R 67,780</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6">
                    <h3 className="mb-4">Withdrawal History (2026)</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-600">Total Withdrawn</span>
                        <span>R 25,000</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-600">Pending Withdrawals</span>
                        <span>R 0</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-neutral-600">Average Processing Time</span>
                        <span>2 days</span>
                      </div>
                      <div className="border-t pt-3 mt-3">
                        <div className="flex items-center justify-between">
                          <span>Available Balance</span>
                          <span className="text-green-600">R {walletBalance.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>
            )}

            {/* Posts & Updates Tab */}
            {activeTab === "posts" && (
              <div>
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <h1 className="mb-2">Posts & Updates</h1>
                    <p className="text-neutral-600">Share your impact and updates with supporters</p>
                  </div>
                  <Button
                    className="bg-orange-600 hover:bg-orange-700"
                    onClick={() => setShowCreatePost(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create Post
                  </Button>
                </div>

                {/* Posts Grid - Only show posts from this NPO (npoId: 1) */}
                <div className="grid md:grid-cols-2 gap-6">
                  {posts.filter(p => p.npoId === 1).map((post) => (
                    <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                      {post.image && (
                        <div className="relative h-48">
                          <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="flex-1">{post.title}</h3>
                          <div className="flex gap-2 ml-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewPost(post.id)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              onClick={() => handleDeletePost(post.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
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
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-4"
                          onClick={() => handleViewPost(post.id)}
                        >
                          View Details
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                {posts.filter(p => p.npoId === 1).length === 0 && (
                  <Card className="p-12 text-center">
                    <MessageSquare className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
                    <h3 className="mb-2">No posts yet</h3>
                    <p className="text-neutral-600 mb-4">Share your impact and updates with your supporters</p>
                    <Button onClick={() => setShowCreatePost(true)}>Create Your First Post</Button>
                  </Card>
                )}
              </div>
            )}

          </motion.div>
        </main>
      </div>

      {/* Create Post Modal */}
      {showCreatePost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-6">
              <h3>Create New Post</h3>
              <button onClick={() => setShowCreatePost(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const newPost = {
                  id: posts.length + 1,
                  npoId: 1, // Hope Foundation
                  npoName: "Hope Foundation",
                  category: "Education",
                  title: formData.get("title") as string,
                  description: formData.get("description") as string,
                  image: formData.get("image") as string || "",
                  date: new Date().toISOString().split("T")[0],
                  likes: 0,
                  comments: 0
                };
                setPosts([newPost, ...posts]);
                setShowCreatePost(false);
              }}
            >
              <div>
                <Label htmlFor="post-title">Post Title</Label>
                <Input
                  id="post-title"
                  name="title"
                  placeholder="e.g., Community Library Opening Success!"
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label htmlFor="post-description">Description</Label>
                <Textarea
                  id="post-description"
                  name="description"
                  placeholder="Share your impact, achievements, or updates with supporters..."
                  className="mt-2"
                  rows={6}
                  required
                />
              </div>

              <div>
                <Label htmlFor="post-image">Image URL (Optional)</Label>
                <Input
                  id="post-image"
                  name="image"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  className="mt-2"
                />
                <p className="text-xs text-neutral-500 mt-1">
                  Enter a URL to an image (JPG, PNG, etc.)
                </p>
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Post
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowCreatePost(false)}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* View/Edit Post Modal */}
      {showViewPost && selectedPost && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-3xl w-full p-8 max-h-[90vh] overflow-y-auto"
          >
            {(() => {
              const post = posts.find(p => p.id === selectedPost);
              if (!post) return null;

              return (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3>Post Details</h3>
                    <button onClick={() => { setShowViewPost(false); setSelectedPost(null); }}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {editingPost === selectedPost ? (
                    <form
                      className="space-y-6"
                      onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        setPosts(posts.map(p => p.id === selectedPost ? {
                          ...p,
                          title: formData.get("title") as string,
                          description: formData.get("description") as string,
                          image: formData.get("image") as string || p.image
                        } : p));
                        setEditingPost(null);
                        setShowViewPost(false);
                        setSelectedPost(null);
                      }}
                    >
                      <div>
                        <Label htmlFor="edit-title">Post Title</Label>
                        <Input
                          id="edit-title"
                          name="title"
                          defaultValue={post.title}
                          className="mt-2"
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit-description">Description</Label>
                        <Textarea
                          id="edit-description"
                          name="description"
                          defaultValue={post.description}
                          className="mt-2"
                          rows={8}
                          required
                        />
                      </div>

                      <div>
                        <Label htmlFor="edit-image">Image URL</Label>
                        <Input
                          id="edit-image"
                          name="image"
                          type="url"
                          defaultValue={post.image}
                          className="mt-2"
                        />
                      </div>

                      <div className="flex gap-3">
                        <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">
                          Save Changes
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setEditingPost(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      {post.image && (
                        <div className="mb-6">
                          <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-64 object-cover rounded-lg"
                          />
                        </div>
                      )}

                      <div className="mb-6">
                        <h2 className="mb-3">{post.title}</h2>
                        <p className="text-neutral-600 whitespace-pre-wrap">{post.description}</p>
                      </div>

                      <div className="flex items-center justify-between text-sm mb-6 pb-6 border-b">
                        <div className="flex items-center gap-6">
                          <span className="flex items-center gap-2 text-neutral-600">
                            <Heart className="w-5 h-5" />
                            {post.likes} likes
                          </span>
                          <span className="flex items-center gap-2 text-neutral-600">
                            <MessageSquare className="w-5 h-5" />
                            {post.comments} comments
                          </span>
                        </div>
                        <span className="text-neutral-600">
                          Posted on {new Date(post.date).toLocaleDateString("en-ZA", {
                            year: "numeric",
                            month: "long",
                            day: "numeric"
                          })}
                        </span>
                      </div>

                      <div className="flex gap-3">
                        <Button
                          variant="outline"
                          className="flex-1"
                          onClick={() => setEditingPost(selectedPost)}
                        >
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Post
                        </Button>
                        <Button
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                          onClick={() => {
                            handleDeletePost(selectedPost);
                            setShowViewPost(false);
                            setSelectedPost(null);
                          }}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </>
                  )}
                </>
              );
            })()}
          </motion.div>
        </div>
      )}

      {/* Donate to NPO Modal */}
      {showDonateModal && selectedNPO && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-md w-full p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <h3>Support Fellow NPO</h3>
              <button onClick={() => { setShowDonateModal(false); setSelectedNPO(null); }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              className="space-y-6"
              onSubmit={(e) => {
                e.preventDefault();
                setShowDonateModal(false);
                setSelectedNPO(null);
                alert("Thank you for supporting a fellow NPO! Ubuntu spirit in action!");
              }}
            >
              <div>
                <Label htmlFor="donate-amount">Donation Amount (R)</Label>
                <Input
                  id="donate-amount"
                  type="number"
                  placeholder="500"
                  className="mt-2"
                  required
                />
              </div>

              <div>
                <Label>Quick amounts</Label>
                <div className="grid grid-cols-4 gap-2 mt-2">
                  <Button type="button" variant="outline" size="sm">R 100</Button>
                  <Button type="button" variant="outline" size="sm">R 250</Button>
                  <Button type="button" variant="outline" size="sm">R 500</Button>
                  <Button type="button" variant="outline" size="sm">R 1000</Button>
                </div>
              </div>

              <div>
                <Label htmlFor="donate-message">Message (Optional)</Label>
                <Textarea
                  id="donate-message"
                  placeholder="Send words of encouragement..."
                  className="mt-2"
                  rows={3}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" className="flex-1 bg-orange-600 hover:bg-orange-700">
                  Donate Now
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => { setShowDonateModal(false); setSelectedNPO(null); }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* View Campaign Details Modal */}
      {showViewCampaign && selectedCampaign && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg max-w-2xl w-full p-8 max-h-[90vh] overflow-y-auto"
          >
            {(() => {
              const campaign = myCampaigns.find(c => c.id === selectedCampaign);
              if (!campaign) return null;

              return (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <h3>{campaign.name}</h3>
                    <button onClick={() => { setShowViewCampaign(false); setSelectedCampaign(null); }}>
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <Badge className="bg-green-100 text-green-700 mb-4">
                        {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                      </Badge>
                      <p className="text-neutral-600">{campaign.description}</p>
                    </div>

                    <div className="bg-neutral-50 p-6 rounded-lg">
                      <h4 className="mb-4">Funding Progress</h4>
                      <div className="space-y-4">
                        <div>
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-neutral-600">Raised</span>
                            <span className="font-semibold">
                              R {campaign.raisedAmount.toLocaleString()} of R {campaign.targetAmount.toLocaleString()}
                            </span>
                          </div>
                          <div className="w-full bg-neutral-200 rounded-full h-3">
                            <div
                              className="bg-orange-600 h-3 rounded-full transition-all"
                              style={{ width: `${(campaign.raisedAmount / campaign.targetAmount) * 100}%` }}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4 pt-2">
                          <div>
                            <div className="text-sm text-neutral-600">Progress</div>
                            <div className="text-lg font-semibold text-orange-600">
                              {Math.round((campaign.raisedAmount / campaign.targetAmount) * 100)}%
                            </div>
                          </div>
                          <div>
                            <div className="text-sm text-neutral-600">Contributors</div>
                            <div className="text-lg font-semibold">{campaign.contributors}</div>
                          </div>
                          <div>
                            <div className="text-sm text-neutral-600">Days Left</div>
                            <div className="text-lg font-semibold">{campaign.daysRemaining}</div>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="mb-3">Purpose & Goals</h4>
                      <p className="text-neutral-600 whitespace-pre-wrap">{campaign.purpose}</p>
                    </div>

                    <div>
                      <h4 className="mb-3">Budget Breakdown</h4>
                      <p className="text-neutral-600 whitespace-pre-wrap">{campaign.budget}</p>
                    </div>

                    <div className="flex gap-3 pt-4 border-t">
                      <Button
                        variant="outline"
                        className="flex-1"
                        onClick={() => { setShowViewCampaign(false); setSelectedCampaign(null); }}
                      >
                        Close
                      </Button>
                      <Button
                        className="flex-1 bg-red-600 hover:bg-red-700"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${campaign.name}"? This action cannot be undone.`)) {
                            setMyCampaigns(myCampaigns.filter(c => c.id !== campaign.id));
                            setShowViewCampaign(false);
                            setSelectedCampaign(null);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Delete Campaign
                      </Button>
                    </div>
                  </div>
                </>
              );
            })()}
          </motion.div>
        </div>
      )}
    </div>
  );
}
