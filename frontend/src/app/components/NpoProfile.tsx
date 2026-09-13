import { useState, useEffect, useCallback } from "react";
import { useParams, Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { resolveMediaUrl } from "../../lib/api";
import { npoProfileService, type PublicNpoProfile } from "../../services/npoProfileService";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs";
import {
  ArrowLeft, Loader2, MapPin, Users, BadgeCheck, Mail, Phone,
  Lock, Target, HandHeart, Heart,
} from "lucide-react";

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "isAxiosError" in error) {
    const e = error as { response?: { data?: { message?: string } | string; status?: number } };
    if (e.response?.data) {
      if (typeof e.response.data === "string") return e.response.data;
      if (e.response.data.message) return e.response.data.message;
    }
    if (e.response?.status === 404) return "This NPO profile could not be found.";
    if (!e.response) return "Unable to connect to server.";
  }
  return "Something went wrong.";
}

export default function NpoProfile() {
  const { npoId } = useParams<{ npoId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicNpoProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!npoId) return;
    setLoading(true);
    try {
      const r = await npoProfileService.getPublicProfile(parseInt(npoId, 10));
      setProfile(r.data);
    } catch (e) {
      toast.error(getErrorMessage(e));
      setProfile(null);
    } finally {
      setLoading(false);
    }
  }, [npoId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50">
        <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-neutral-50 gap-4">
        <p className="text-neutral-600">NPO profile not found.</p>
        <Button variant="outline" onClick={() => navigate(-1)}><ArrowLeft className="w-4 h-4 mr-2" /> Go back</Button>
      </div>
    );
  }

  const initial = profile.organizationName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-neutral-50 pb-12">
      {/* Cover */}
      <div className="relative h-48 md:h-64 bg-gradient-to-r from-orange-500 to-amber-500">
        <div className="absolute top-4 left-4">
          <Button variant="secondary" size="sm" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4">
        {/* Header card */}
        <Card className="-mt-16 relative p-6">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="w-28 h-28 rounded-2xl bg-white shadow-md border-4 border-white -mt-16 sm:-mt-20 flex items-center justify-center overflow-hidden shrink-0">
              {profile.profileImage
                ? <img src={resolveMediaUrl(profile.profileImage)} alt={profile.organizationName} className="w-full h-full object-cover" />
                : <span className="text-4xl font-bold text-orange-600">{initial}</span>}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold">{profile.organizationName}</h1>
                {profile.isVerified && (
                  <Badge className="bg-blue-100 text-blue-700 gap-1"><BadgeCheck className="w-3.5 h-3.5" /> Verified</Badge>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-neutral-600 mt-1 flex-wrap">
                {profile.npofocusArea && <span>{profile.npofocusArea}</span>}
                {profile.location && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {profile.location}</span>}
                <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {profile.followerCount} follower{profile.followerCount === 1 ? "" : "s"}</span>
              </div>
            </div>
          </div>

          {profile.bio && <p className="text-neutral-700 mt-4">{profile.bio}</p>}

          {/* Contact block — gated */}
          <div className="mt-4 border-t border-neutral-100 pt-4">
            {profile.contactVisible ? (
              <div className="flex flex-col sm:flex-row gap-3 text-sm">
                {profile.email && <a href={`mailto:${profile.email}`} className="flex items-center gap-2 text-orange-600 hover:underline"><Mail className="w-4 h-4" /> {profile.email}</a>}
                {profile.phone && <span className="flex items-center gap-2 text-neutral-700"><Phone className="w-4 h-4" /> {profile.phone}</span>}
                {!profile.email && !profile.phone && <span className="text-neutral-500">No contact details provided.</span>}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-neutral-500 bg-neutral-50 rounded-lg p-3">
                <Lock className="w-4 h-4" />
                <span>Contact details are visible to verified members. <Link to="/verify-identity" className="text-orange-600 hover:underline">Verify your account</Link> to view.</span>
              </div>
            )}
          </div>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="about" className="mt-6">
          <TabsList>
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="posts">Posts ({profile.posts.length})</TabsTrigger>
            <TabsTrigger value="fundraisers">Fundraisers ({profile.fundraisers.length})</TabsTrigger>
            <TabsTrigger value="volunteer">Volunteer ({profile.opportunities.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="about">
            <Card className="p-6 mt-4 space-y-4">
              <div>
                <h3 className="font-semibold mb-1">Mission</h3>
                <p className="text-neutral-700">{profile.npomission || "No mission statement provided yet."}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Focus Area</h3>
                <p className="text-neutral-700">{profile.npofocusArea || "Not specified."}</p>
              </div>
              <div>
                <h3 className="font-semibold mb-1">Registration Number</h3>
                <p className="text-neutral-700">{profile.nporegNum}</p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="posts">
            {profile.posts.length === 0 ? (
              <Card className="p-8 text-center mt-4"><p className="text-neutral-600">No posts yet.</p></Card>
            ) : (
              <div className="space-y-4 mt-4">
                {profile.posts.map(p => (
                  <Card key={p.postId} className="overflow-hidden">
                    {p.mediaUrl && <img src={resolveMediaUrl(p.mediaUrl)} alt={p.postTitle} className="w-full max-h-80 object-cover" />}
                    <div className="p-5">
                      <h3 className="font-semibold text-lg">{p.postTitle}</h3>
                      {p.content && <p className="text-neutral-700 mt-1 whitespace-pre-wrap">{p.content}</p>}
                      <div className="flex items-center gap-2 text-sm text-neutral-500 mt-3">
                        <Heart className="w-4 h-4" /> {p.likeCount}
                        <span className="ml-auto">{new Date(p.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="fundraisers">
            {profile.fundraisers.length === 0 ? (
              <Card className="p-8 text-center mt-4"><p className="text-neutral-600">No active fundraisers.</p></Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                {profile.fundraisers.map(f => (
                  <Card key={f.projectId} className="overflow-hidden">
                    {f.images && <img src={resolveMediaUrl(f.images.split(",")[0].trim())} alt={f.projectName} className="w-full h-40 object-cover" />}
                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2"><Target className="w-4 h-4 text-orange-600" /><h3 className="font-semibold">{f.projectName}</h3></div>
                      {f.projectDesc && <p className="text-sm text-neutral-600 line-clamp-2 mb-3">{f.projectDesc}</p>}
                      <Progress value={f.targetAmount > 0 ? Math.min(100, (f.raisedAmount / f.targetAmount) * 100) : 0} className="h-2" />
                      <p className="text-xs text-neutral-500 mt-1">R {f.raisedAmount.toLocaleString()} of R {f.targetAmount.toLocaleString()}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="volunteer">
            {profile.opportunities.length === 0 ? (
              <Card className="p-8 text-center mt-4"><p className="text-neutral-600">No volunteer opportunities.</p></Card>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4 mt-4">
                {profile.opportunities.map(o => (
                  <Card key={o.opportunityId} className="p-5">
                    <div className="flex items-center gap-2 mb-1"><HandHeart className="w-4 h-4 text-orange-600" /><h3 className="font-semibold">{o.roleTitle}</h3></div>
                    <div className="flex items-center gap-2 mb-2">
                      {o.category && <Badge variant="outline">{o.category}</Badge>}
                      <Badge className="bg-green-100 text-green-700">{o.numOfPositions} position{o.numOfPositions === 1 ? "" : "s"}</Badge>
                    </div>
                    {o.description && <p className="text-sm text-neutral-600 line-clamp-3">{o.description}</p>}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
