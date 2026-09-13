import { useState, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { npoProfileService } from "../../services/npoProfileService";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { Input } from "./ui/input";
import { ArrowLeft, Loader2, Search, Users, Building2 } from "lucide-react";

interface NpoRow {
  npoId: number;
  organizationName: string;
  npofocusArea: string | null;
  npomission: string | null;
}

function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "isAxiosError" in error) {
    const e = error as { response?: { data?: { message?: string } | string } };
    if (e.response?.data) {
      if (typeof e.response.data === "string") return e.response.data;
      if (e.response.data.message) return e.response.data.message;
    }
    if (!e.response) return "Unable to connect to server.";
  }
  return "Something went wrong.";
}

export default function DiscoverNpos() {
  const { userType } = useAuth();
  const navigate = useNavigate();
  const [npos, setNpos] = useState<NpoRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await npoProfileService.listNpos();
      setNpos(r.data);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const dashboardPath =
    userType === "NPO" ? "/npo-dashboard"
      : userType === "Business" ? "/business-dashboard"
        : userType === "Admin" ? "/admin-dashboard"
          : "/individual-dashboard";

  const filtered = npos.filter(n =>
    !query ||
    n.organizationName.toLowerCase().includes(query.toLowerCase()) ||
    (n.npofocusArea || "").toLowerCase().includes(query.toLowerCase()) ||
    (n.npomission || "").toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-white border-b border-neutral-200 py-4 px-6 sticky top-0 z-40">
        <div className="container mx-auto max-w-6xl flex items-center justify-between">
          <Link to={dashboardPath} className="text-xl text-neutral-900 font-bold">UbuntuConnect</Link>
          <Button variant="outline" size="sm" onClick={() => navigate(dashboardPath)}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto max-w-6xl p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Discover NPOs</h1>
          <p className="text-neutral-600">Browse non-profit organisations, view their profiles, fundraisers and volunteer opportunities.</p>
        </div>

        <div className="relative max-w-md mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <Input placeholder="Search by name, focus area or mission..." value={query} onChange={e => setQuery(e.target.value)} className="pl-10" />
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-orange-600" /></div>
        ) : filtered.length === 0 ? (
          <Card className="p-12 text-center"><Building2 className="w-12 h-12 text-neutral-400 mx-auto mb-3" /><p className="text-neutral-600">No NPOs found.</p></Card>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map(n => (
              <Card key={n.npoId} className="p-6 hover:shadow-lg transition-shadow flex flex-col">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                    <span className="text-xl font-bold text-orange-600">{n.organizationName.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold truncate">{n.organizationName}</h3>
                    {n.npofocusArea && <p className="text-sm text-orange-600 truncate">{n.npofocusArea}</p>}
                  </div>
                </div>
                {n.npomission && <p className="text-sm text-neutral-600 line-clamp-3 mb-4">{n.npomission}</p>}
                <Button asChild variant="outline" className="mt-auto w-full">
                  <Link to={`/npo/${n.npoId}`}><Users className="w-4 h-4 mr-2" /> View Profile</Link>
                </Button>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
