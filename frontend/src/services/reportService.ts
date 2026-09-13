import api from "../lib/api";

export interface MonthlyPoint { month: string; total: number }
export interface StatusCount { status: string; count: number }
export interface TypeCount { type: string; count: number }

export interface NpoReportSummary {
  totalReceived: number;
  donationCount: number;
  followerCount: number;
  monthlyReceived: MonthlyPoint[];
  fundraisers: { name: string; target: number; raised: number; status: string }[];
  volunteerApplications: StatusCount[];
}

export interface BusinessReportSummary {
  totalDonated: number;
  donationCount: number;
  campaignCount: number;
  nposSupported: number;
  monthlyDonated: MonthlyPoint[];
  campaignApplications: StatusCount[];
}

export interface AdminReportSummary {
  totalUsers: number;
  verifiedUsers: number;
  activeFundraisers: number;
  pendingVerifications: number;
  totalDonated: number;
  donationCount: number;
  usersByType: TypeCount[];
  monthlyDonations: MonthlyPoint[];
}

export const reportService = {
  npoSummary: () => api.get<NpoReportSummary>("/api/reports/npo-summary"),
  businessSummary: () => api.get<BusinessReportSummary>("/api/reports/business-summary"),
  adminSummary: () => api.get<AdminReportSummary>("/api/reports/admin-summary"),

  /** Download the caller's donations CSV (blob). */
  myDonationsCsv: (start?: string, end?: string) =>
    api.get("/api/reports/my-donations/csv", {
      params: { start: start || "2020-01-01", end: end || undefined },
      responseType: "blob" as const,
    }),

  /** NPO/Admin donation CSV (npoId optional; admin-only when omitted). */
  donationsCsv: (npoId?: number, start?: string, end?: string) =>
    api.get("/api/reports/donations/csv", {
      params: { npoId, start: start || "2020-01-01", end: end || undefined },
      responseType: "blob" as const,
    }),
};

/** Triggers a browser download of a CSV blob response. */
export function downloadCsvBlob(data: BlobPart, filename: string) {
  const url = window.URL.createObjectURL(new Blob([data], { type: "text/csv" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
