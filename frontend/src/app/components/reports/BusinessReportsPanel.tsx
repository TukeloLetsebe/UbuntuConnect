import { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { reportService, downloadCsvBlob, type BusinessReportSummary } from "../../../services/reportService";
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

export default function BusinessReportsPanel() {
  const [data, setData] = useState<BusinessReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try { const r = await reportService.businessSummary(); setData(r.data); }
    catch (e) { toast.error(err(e)); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const downloadCsv = async () => {
    setDownloading(true);
    try {
      const r = await reportService.myDonationsCsv();
      downloadCsvBlob(r.data as BlobPart, `business_donations_${new Date().toISOString().slice(0, 10)}.csv`);
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-5"><p className="text-sm text-neutral-500">Total Donated</p><p className="text-2xl font-bold text-green-600">{R(data.totalDonated)}</p></Card>
        <Card className="p-5"><p className="text-sm text-neutral-500">Donations</p><p className="text-2xl font-bold">{data.donationCount}</p></Card>
        <Card className="p-5"><p className="text-sm text-neutral-500">Campaigns</p><p className="text-2xl font-bold">{data.campaignCount}</p></Card>
        <Card className="p-5"><p className="text-sm text-neutral-500">NPOs Supported</p><p className="text-2xl font-bold">{data.nposSupported}</p></Card>
      </div>

      <Card className="p-5">
        <h3 className="font-semibold mb-4">Contributions (last 6 months)</h3>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data.monthlyDonated}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" fontSize={12} />
            <YAxis fontSize={12} />
            <Tooltip formatter={(v: number) => R(v)} />
            <Line type="monotone" dataKey="total" stroke="#ea580c" strokeWidth={2} name="Donated" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {data.campaignApplications.length > 0 && (
        <Card className="p-5">
          <h3 className="font-semibold mb-4">Campaign Applications</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.campaignApplications}>
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
