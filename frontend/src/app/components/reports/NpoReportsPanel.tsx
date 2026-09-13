import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend,
} from "recharts";
import { reportService, downloadCsvBlob, type NpoReportSummary } from "../../../services/reportService";
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

export default function NpoReportsPanel() {
  const [data, setData] = useState<NpoReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await reportService.npoSummary(); setData(r.data); }
    catch (e) { toast.error(err(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const downloadCsv = async () => {
    setDownloading(true);
    try {
      const r = await reportService.myDonationsCsv();
      downloadCsvBlob(r.data as BlobPart, `npo_donations_${new Date().toISOString().slice(0, 10)}.csv`);
    } catch (e) { toast.error(err(e)); }
    finally { setDownloading(false); }
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-orange-600" /></div>;
  if (!data) return <Card className="p-8 text-center"><p className="text-neutral-600">No report data.</p></Card>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Reports & Analytics</h2>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={load}><RefreshCw className="w-4 h-4" /></Button>
          <Button size="sm" className="bg-orange-600 hover:bg-orange-700" onClick={downloadCsv} disabled={downloading}>
            {downloading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Download className="w-4 h-4 mr-1" />} Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card className="p-5"><p className="text-sm text-neutral-500">Total Received</p><p className="text-2xl font-bold text-green-600">{R(data.totalReceived)}</p></Card>
        <Card className="p-5"><p className="text-sm text-neutral-500">Donations</p><p className="text-2xl font-bold">{data.donationCount}</p></Card>
        <Card className="p-5"><p className="text-sm text-neutral-500">Followers</p><p className="text-2xl font-bold">{data.followerCount}</p></Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-4">Donations Received (last 6 months)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data.monthlyReceived}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip formatter={(v: number) => R(v)} />
            <Line type="monotone" dataKey="total" stroke="#ea580c" strokeWidth={2} name="Received" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {data.fundraisers.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Fundraiser Performance</h3>
          <ResponsiveContainer width="100%" height={Math.max(200, data.fundraisers.length * 46)}>
            <BarChart data={data.fundraisers} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" fontSize={12} />
              <YAxis type="category" dataKey="name" width={140} fontSize={12} />
              <Tooltip formatter={(v: number) => R(v)} />
              <Legend />
              <Bar dataKey="raised" fill="#16a34a" name="Raised" />
              <Bar dataKey="target" fill="#d4d4d4" name="Target" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {data.volunteerApplications.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Volunteer Applications</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.volunteerApplications}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" fontSize={12} />
              <YAxis fontSize={12} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#ea580c" name="Applications" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}
