import api from "../lib/api";

export type KycRoute = "Admin" | "FaceScan";

export interface KycStatus {
  status: string; // NotSubmitted | Pending | Approved | Rejected
  route: KycRoute | null;
  submittedDate: string | null;
  reviewedDate: string | null;
  matchScore: number | null;
  faceEngineEnabled: boolean;
}

export interface SubmitKycResult {
  message: string;
  status: string;
  autoApproved: boolean;
}

export const kycService = {
  getStatus: () => api.get<KycStatus>("/api/individual/verify-identity/status"),

  submit: (data: { idNumber: string; idDocumentUrl: string; selfieUrl: string; route: KycRoute }) =>
    api.post<SubmitKycResult>("/api/individual/verify-identity", data),
};
