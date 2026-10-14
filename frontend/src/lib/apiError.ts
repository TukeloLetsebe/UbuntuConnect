// Shared Axios error-message helper.
//
// Previously this exact function was duplicated in individualService,
// npoService, businessService and adminService. It is hoisted here so there is
// a single source of truth; each service re-exports it to keep existing import
// sites (`import { getErrorMessage } from "../services/..."`) working unchanged.

export function getErrorMessage(error: unknown): string {
  if (error && typeof error === "object" && "isAxiosError" in error) {
    const axiosError = error as {
      response?: { data?: { message?: string } | string; status?: number };
    };
    if (axiosError.response?.data) {
      if (typeof axiosError.response.data === "string") return axiosError.response.data;
      if (axiosError.response.data.message) return axiosError.response.data.message;
    }
    if (axiosError.response?.status === 404) return "Resource not found.";
    if (axiosError.response?.status === 403) return "You don't have permission for this action.";
    if (axiosError.response?.status === 400) return "Invalid request. Please check your input.";
    if (!axiosError.response) return "Unable to connect to server. Please check your connection.";
    return "Something went wrong. Please try again.";
  }
  return "An unexpected error occurred.";
}
