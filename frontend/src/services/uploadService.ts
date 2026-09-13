import api from "../lib/api";

export interface UploadResult {
  url: string;
  fileName: string;
  sizeBytes: number;
  contentType: string;
}

// Uploads go as multipart/form-data. We override the default JSON content-type
// so the browser sets the correct multipart boundary.
export const uploadService = {
  uploadImage: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<UploadResult>("/api/upload/image", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },

  uploadDocument: (file: File) => {
    const form = new FormData();
    form.append("file", file);
    return api.post<UploadResult>("/api/upload/document", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};
