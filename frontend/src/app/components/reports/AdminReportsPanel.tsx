import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { reportService, downloadCsvBlob, type AdminReportSummary } from "../../../services/reportService";
import { Card } from "../ui/card";
import { Button } from "../ui/button";
import { Loader2, Download, RefreshCw } from "lucide-react";

function err(e: unknown): string {
  if (e && typeof e === "object" && "isAxiosError" in e) {
    const a = e as { response?: { data?: { message?: string } | string } };
    if (typeof a.response?.data === "string") return a.response.data;
    if (a.response?.data?.message) return a.response.data.message;
  }
  return "Failed to load report.";
}

const R = (n: number) => `R ${n.toLocaleString()}`;
const PIE_COLORS = ["#ea580c", "#16a34a", "#2563eb", "#9333ea", "#dc2626", "#ca8a04"];

export default function AdminReportsPanel() {
  const [data, setData] = useState<AdminReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await reportService.adminSummary(); setData(r.data); }
    catch (e) { toast.error(err(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const downloadCsv = async () => {
    setDownloading(true);
    try {
      const r = await reportService.donationsCsv(); // platform-wide (admin)
      downloadCsvBlob(r.data as BlobPart, `platform_donations_${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (e) { toast.error(err(e)); }
    finally { setDownloading(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-orange-600" /></div>;
  if (!data) return <Card className="p-8 text-center"><p className="text-neutral-600">No report data.</p></Card>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Platform Reports</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
          <Button size="sm" className="bg-orange-600 hover:bg-orange-700" onClick={downloadCsv} disabled={downloading}>
            {downloading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Download className="w-4 h-4 mr-1" />} Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4"><p className="text-xs text-neutral-500">Total Users</p><p className="text-xl font-bold">{data.totalUsers}</p></Card>
        <Card className="p-4"><p className="text-xs text-neutral-500">Verified</p><p className="text-xl font-bold">{data.verifiedUsers}</p></Card>
        <Card className="p-4"><p className="text-xs text-neutral-500">Active Fundraisers</p><p className="text-xl font-bold">{data.activeFundraisers}</p></Card>
        <Card className="p-4"><p className="text-xs text-neutral-500">Pending KYC/Docs</p><p className="text-xl font-bold">{data.pendingVerifications}</p></Card>
        <Card className="p-4"><p className="text-xs text-neutral-500">Total Donated</p><p className="text-xl font-bold text-green-600">{R(data.totalDonated)}</p></Card>
        <Card className="p-4"><p className="text-xs text-neutral-500">Donations</p><p className="text-xl font-bold">{data.donationCount}</p></Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Donations (last 6 months)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={data.monthlyDonations}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip formatter={(v: number) => R(v)} />
              <Line type="monotone" dataKey="total" stroke="#ea580c" strokeWidth={2} name="Donated" />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="font-semibold mb-4">Users by Type</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={data.usersByType} dataKey="count" nameKey="type" cx="50%" cy="50%" outerRadius={90} label>
                {data.usersByType.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>
    </div>
  );
}
